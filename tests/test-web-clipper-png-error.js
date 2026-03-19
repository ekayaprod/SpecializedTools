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
global.html2canvas = () => Promise.reject(new Error('Simulated html2canvas failure')); // Mock html2canvas global to fail

// Mock matchMedia
global.window.matchMedia =
    global.window.matchMedia ||
    function () {
        return {
            matches: false,
            addListener: function () {},
            removeListener: function () {},
        };
    };

// Mock Alert
global.window.alert = (msg) => {
    console.log('ALERT:', msg);
};

global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock Console
const originalConsoleError = console.error;
let consoleErrorCalls = [];
console.error = (...args) => {
    consoleErrorCalls.push(args);
    // Suppress expected errors during test to avoid clutter
    if (args[0] && args[0].includes('PNG Capture failed:')) return;
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
    generateFilename: (s) => (s || 'export').replace(/[^a-z0-9]/gi, '_') + '_20230101-0000',
    loadLibrary: async (name) => {
        return Promise.resolve(); // Simulate successful load, actual rendering fails
    },
    downloadFile: (name, content) => {},
    htmlToMarkdown: (html) => html,
    showToast: (msg, type) => {
        showToastCalls.push({ msg, type });
    },
};
global.BookmarkletUtils = global.window.BookmarkletUtils;

async function runTest() {
    console.log('Running Web Clipper PNG Error Test...');

    // 1. Load the script
    try {
        eval(constantsCode);
        eval(scriptCode);
        console.log('Script loaded and executed.');
    } catch (e) {
        console.error('Script evaluation failed:', e);
        process.exit(1);
    }

    // 2. Select Element
    const content = document.getElementById('content');
    content.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }));

    // Wait for RAF to set activeElement
    await new Promise((r) => setTimeout(r, 10));

    content.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

    await new Promise((r) => setTimeout(r, 200)); // Wait for editor

    const modal = document.getElementById('wc-bookmarklet-modal');
    assert.ok(modal, 'Editor modal should exist');

    // 3. Select "Image (.png)" format
    const formatSelect = modal.querySelector('select');
    formatSelect.value = 'png';
    formatSelect.dispatchEvent(new Event('change', { bubbles: true }));

    // 4. Click "Save as File"
    const footer = modal.querySelector('.wc-footer');
    const buttons = footer.querySelectorAll('button');
    const btnDownload = Array.from(buttons).find((b) => b.textContent === window.WebClipperConstants.BTN_DOWNLOAD);
    assert.ok(btnDownload, 'Download button not found');

    btnDownload.click();

    // Wait for async promise rejection handling (html2canvas)
    await new Promise((r) => setTimeout(r, 100));

    // 5. Assert Error Logged
    const errorLog = consoleErrorCalls.find((args) => args[0] === 'PNG Capture failed:');
    assert.ok(errorLog, 'PNG Capture failed error should be logged to console');
    assert.strictEqual(errorLog[1].error.message, 'Simulated html2canvas failure');
    console.log('✅ Error logging verified.');

    // 6. Check UI State (button error state)
    assert.strictEqual(btnDownload.textContent, window.WebClipperConstants.BTN_ERROR, 'Button should show error text');
    assert.strictEqual(btnDownload.style.background, 'rgb(220, 53, 69)', 'Button should have error background color');
    assert.strictEqual(btnDownload.style.color, 'white', 'Button should have white text');

    // Check that originalBg is restored
    assert.ok(content.style.backgroundColor !== '#ffffff', 'Element background color should be restored');

    // Wait for reset delay
    await new Promise((r) => setTimeout(r, 2100));

    assert.strictEqual(btnDownload.textContent, window.WebClipperConstants.BTN_DOWNLOAD, 'Button text should reset');
    assert.strictEqual(btnDownload.disabled, false, 'Button should not be disabled');
    assert.strictEqual(btnDownload.style.background, '', 'Button background should reset');
    assert.strictEqual(btnDownload.style.color, '', 'Button color should reset');

    console.log('✅ Button error state reset verified.');

    // 7. Test without button to hit the Toast fallback
    console.log('Testing without button (toast fallback)...');
    showToastCalls = []; // reset toast calls

    // Get the instance and test capturePng directly without btn
    const instance = global.window.__wc_instance;
    await instance.capturePng(content, 'testfile', null, null);

    const toastLog = showToastCalls.find((c) => c.msg === window.WebClipperConstants.ERR_PNG_EXPORT);
    assert.ok(toastLog, 'Toast should be shown when no button is provided');
    assert.strictEqual(toastLog.type, 'error');
    console.log('✅ Toast fallback verified.');

    console.log('ALL TESTS PASSED');
}

runTest().catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
});
