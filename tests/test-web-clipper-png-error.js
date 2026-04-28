const fs = require('fs');
const path = require('path');
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/web-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const constantsPath = path.join(__dirname, '../bookmarklets/i18n/web-clipper-en.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');

console.log('Running Web Clipper PNG Error Test (No JSDOM)...');

// Mock browser globals
const mockWindow = {
    location: { href: 'http://localhost/' },
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    WebClipperConstants: {},
};

const mockDocument = {
    body: {
        style: {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: (tag) => {
        return {
            tagName: tag.toUpperCase(),
            style: {},
            setAttribute: function (k, v) {
                this[k] = v;
            },
            getAttribute: function (k) {
                return this[k];
            },
            appendChild: () => {},
            click: () => {},
        };
    },
    getElementById: () => null,
};

mockWindow.document = mockDocument;

// Setup global environment for the script evaluation
global.window = mockWindow;
global.document = mockDocument;
global.navigator = { userAgent: 'node' };
global.html2canvas = () => Promise.reject(new Error('Simulated html2canvas failure'));

let showToastCalls = [];
global.BookmarkletUtils = {
    showToast: (msg, type) => {
        showToastCalls.push({ msg, type });
    },
};
mockWindow.BookmarkletUtils = global.BookmarkletUtils;

// Mock Console
const originalConsoleError = console.error;
let consoleErrorCalls = [];
console.error = (...args) => {
    consoleErrorCalls.push(args);
};

async function runTest() {
    try {
        // 1. Load Constants
        new Function('window', constantsCode)(mockWindow);

        // 2. Load Web Clipper Script
        eval(scriptCode);

        const instance = mockWindow.__wc_instance;
        assert.ok(instance, 'WebClipper instance should be created');

        const C = mockWindow.WebClipperConstants;

        // 3. Test Case 1: capturePng with a button
        console.log('Test Case 1: capturePng with a button');
        const element = { style: { backgroundColor: 'transparent' } };
        const btn = {
            textContent: 'Download',
            style: {},
            disabled: false,
        };
        const originalText = 'Download';

        await instance.capturePng(element, 'testfile', btn, originalText);

        // Verify Element BG was restored
        assert.strictEqual(element.style.backgroundColor, 'transparent', 'Element background should be restored');

        // Verify Button state
        assert.strictEqual(btn.textContent, C.BTN_ERROR, 'Button should show error text');
        assert.strictEqual(btn.style.background, '#dc3545', 'Button should have error color');
        assert.strictEqual(btn.style.color, 'white', 'Button should have white text');

        // Verify Error Logged
        const errorLog = consoleErrorCalls.find((args) => args[0] === 'PNG Capture failed:');
        assert.ok(errorLog, 'Error should be logged to console');
        assert.strictEqual(errorLog[1].error.message, 'Simulated html2canvas failure');
        assert.strictEqual(errorLog[1].url, 'http://localhost/', 'URL should be in error log');
        assert.ok(errorLog[1].timestamp, 'Timestamp should be in error log');

        // Wait for reset delay (2000ms + buffer)
        console.log('Waiting for button reset...');
        await new Promise((r) => setTimeout(r, 2100));

        assert.strictEqual(btn.textContent, originalText, 'Button text should reset');
        assert.strictEqual(btn.disabled, false, 'Button should be re-enabled');
        assert.strictEqual(btn.style.background, '', 'Button background style should reset');
        assert.strictEqual(btn.style.color, '', 'Button color style should reset');

        console.log('✅ Test Case 1 passed');

        // 4. Test Case 2: capturePng without a button (Toast fallback)
        console.log('Test Case 2: capturePng without a button');
        showToastCalls = [];
        const element2 = { style: { backgroundColor: 'white' } };

        await instance.capturePng(element2, 'testfile', null, null);

        assert.strictEqual(element2.style.backgroundColor, 'white', 'Element background should be restored');
        const toast = showToastCalls.find((t) => t.msg === C.ERR_PNG_EXPORT);
        assert.ok(toast, 'Toast should be shown when no button is provided');
        assert.strictEqual(toast.type, 'error');

        console.log('✅ Test Case 2 passed');

        console.log('ALL TESTS PASSED');
    } catch (err) {
        // Restore console.error before exiting
        console.error = originalConsoleError;
        console.error('Test failed:', err);
        process.exit(1);
    } finally {
        console.error = originalConsoleError;
    }
}

runTest();
