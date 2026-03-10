const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/web-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const constantsPath = path.join(__dirname, '../bookmarklets/i18n/web-clipper-en.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');

// Create JSDOM
const dom = new JSDOM(
    `<!DOCTYPE html>
<body>
    <div id="content" style="width:100px; height:100px; padding:10px;">
        <h1>Test Title</h1>
        <p>Test Paragraph</p>
    </div>
</body>
`,
    {
        url: 'http://localhost/',
        runScripts: 'dangerously',
        resources: 'usable',
    }
);

// Setup Globals
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.ClipboardItem = class ClipboardItem {};

// Mock Alert
global.window.alert = (msg) => {
    console.log('ALERT:', msg);
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock matchMedia
global.window.matchMedia = (query) => {
    return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
    };
};

// Mock BookmarkletUtils
global.window.BookmarkletUtils = {
    normalizeImages: async (el) => {
        console.log('Mock: normalizeImages');
    },
    inlineStylesAsync: async (src, tgt, cb) => {
        console.log('Mock: inlineStylesAsync');
        // Simple copy of style attribute just to mimic behavior
        if (src.getAttribute('style')) tgt.setAttribute('style', src.getAttribute('style'));
        if (cb) cb(1);
    },
    sanitizeAttributes: (el) => {
        console.log('Mock: sanitizeAttributes');
    },
    sanitizeFilename: (s) => (s || 'export').replace(/[^a-z0-9]/gi, '_'),
    generateFilename: (s) => (s || 'export').replace(/[^a-z0-9]/gi, '_') + '_20230101-0000',
    loadLibrary: async (name) => {
        console.log('Mock: loadLibrary', name);
    },
    downloadFile: (name, content) => {
        console.log('Mock: downloadFile', name);
    },
    htmlToMarkdown: (html) => html,
    showToast: (msg) => console.log('Mock Toast:', msg),
};
// Make BookmarkletUtils available in global scope for the script execution if needed
// The script runs inside the JSDOM window context usually, but since we eval in Node context
// accessing window properties, we need to ensure window.BookmarkletUtils is set.
// Also, if the script uses `BookmarkletUtils` directly (not window.BookmarkletUtils),
// we need it in global.
global.BookmarkletUtils = global.window.BookmarkletUtils;

async function runTest() {
    console.log('Running Web Clipper Test...');

    // 1. Load the script
    try {
        // We wrap in a try-catch because the script executes immediately
        eval(constantsCode);
        eval(scriptCode);
        console.log('Script loaded and executed.');
    } catch (e) {
        console.error('Script evaluation failed:', e);
        process.exit(1);
    }

    // 2. Simulate User Interaction: MouseOver to highlight
    const content = document.getElementById('content');
    const mouseOver = new MouseEvent('mouseover', {
        bubbles: true,
        cancelable: true,
        view: window,
    });
    content.dispatchEvent(mouseOver);

    // Wait for requestAnimationFrame
    await new Promise((r) => setTimeout(r, 10));

    // Verify Highlight
    const highlight = document.getElementById('wc-bookmarklet-highlight');
    assert.ok(highlight, 'Highlight element should exist after mouseover');
    assert.strictEqual(highlight.style.display, 'block', 'Highlight should be visible');
    console.log('✅ Highlight verified.');

    // 3. Simulate User Interaction: Click to open Editor
    const click = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
    });
    content.dispatchEvent(click);

    // Wait for async editor opening (script has setTimeout 50ms)
    await new Promise((r) => setTimeout(r, 200));

    // Verify Modal
    const modal = document.getElementById('wc-bookmarklet-modal');
    assert.ok(modal, 'Editor modal should exist after click');
    console.log('✅ Editor Modal verified.');

    // Verify Content inside Editor
    // The editor clones the element.
    const contentArea = modal.querySelector('.wc-content');
    assert.ok(contentArea, 'Content area should exist');
    assert.ok(contentArea.innerHTML.includes('Test Title'), 'Content should be cloned into editor');
    console.log('✅ Content verified.');

    // 4. Close the Editor
    const closeBtn = document.getElementById('wc-close-icon');
    if (closeBtn) {
        closeBtn.click();
    } else {
        // Fallback to Cancel button if icon not found (though script adds icon)
        const buttons = Array.from(modal.querySelectorAll('button'));
        const cancelBtn = buttons.find((b) => b.textContent === window.WebClipperConstants.BTN_CANCEL);
        if (cancelBtn) cancelBtn.click();
    }

    // Verify Closed
    const overlay = document.getElementById('wc-bookmarklet-overlay');
    assert.strictEqual(overlay, null, 'Overlay should be removed after closing');
    console.log('✅ Editor Closed verified.');

    console.log('ALL TESTS PASSED');
}

runTest().catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
});
