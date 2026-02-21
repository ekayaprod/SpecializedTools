const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/web-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

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
global.html2canvas = () => Promise.resolve({ toDataURL: () => 'data:image/png;base64,fake' }); // Mock html2canvas global

// Mock Alert
global.window.alert = (msg) => {
    console.log('ALERT:', msg);
};

// Mock Console
const originalConsoleError = console.error;
let consoleErrorCalls = [];
console.error = (...args) => {
    consoleErrorCalls.push(args);
    originalConsoleError(...args);
};

// Mock BookmarkletUtils
let showToastCalls = [];
global.window.BookmarkletUtils = {
    normalizeImages: async (el) => {},
    inlineStylesAsync: async (src, tgt, cb) => {
        if (src.getAttribute('style')) tgt.setAttribute('style', src.getAttribute('style'));
        if (cb) cb(1);
    },
    sanitizeAttributes: (el) => {},
    sanitizeFilename: (s) => (s || 'export').replace(/[^a-z0-9]/gi, '_'),
    loadLibrary: async (name) => {
        if (name === 'html2canvas') {
            return Promise.reject(new Error('Simulated html2canvas load failure'));
        }
        return Promise.resolve();
    },
    downloadFile: (name, content) => {},
    htmlToMarkdown: (html) => html,
    showToast: (msg, type) => {
        showToastCalls.push({ msg, type });
    },
};
global.BookmarkletUtils = global.window.BookmarkletUtils;

async function runTest() {
    console.log('Running Web Clipper Resilience Test...');

    // 1. Load the script
    try {
        eval(scriptCode);
        console.log('Script loaded and executed.');
    } catch (e) {
        console.error('Script evaluation failed:', e);
        process.exit(1);
    }

    // 2. Select Element
    const content = document.getElementById('content');
    content.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));
    content.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

    await new Promise((r) => setTimeout(r, 200)); // Wait for editor

    const modal = document.getElementById('wc-bookmarklet-modal');
    assert.ok(modal, 'Editor modal should exist');

    // 3. Select "Image (.png)" format
    const formatSelect = modal.querySelector('select');
    formatSelect.value = 'png';
    formatSelect.dispatchEvent(new Event('change', { bubbles: true })); // Just in case, though logic uses value on click

    // 4. Click "Save as File"
    const footer = modal.querySelector('.wc-footer');
    const buttons = footer.querySelectorAll('button');
    // Find button with text 'Save as File'
    const btnDownload = Array.from(buttons).find((b) => b.textContent === 'Save as File');
    assert.ok(btnDownload, 'Download button not found');

    btnDownload.click();

    // Wait for async promise rejection handling
    await new Promise((r) => setTimeout(r, 100));

    // 5. Assert Error Logged
    const errorLog = consoleErrorCalls.find((args) => args[0] === 'Failed to load html2canvas for PNG export:');
    assert.ok(errorLog, 'Error should be logged to console');
    assert.strictEqual(errorLog[1].message, 'Simulated html2canvas load failure');
    console.log('✅ Error logging verified.');

    // 6. Assert Toast Shown
    const toast = showToastCalls.find((c) => c.msg === 'Failed to load html2canvas for PNG export.');
    assert.ok(toast, 'Toast should be shown');
    assert.strictEqual(toast.type, 'error');
    console.log('✅ Toast verified.');

    console.log('ALL TESTS PASSED');
}

runTest().catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
});
