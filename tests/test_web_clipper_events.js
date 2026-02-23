const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock DOM Environment
const mockDocument = {
    body: {
        style: { cursor: '' },
        appendChild: () => {},
        removeChild: (el) => {},
    },
    addEventListener: (type, listener, options) => {
        mockDocument.listeners[type] = listener;
    },
    removeEventListener: (type, listener, options) => {
        if (mockDocument.listeners[type] === listener) {
            delete mockDocument.listeners[type];
        }
    },
    getElementById: (id) => {
        if (mockDocument.elements[id]) return mockDocument.elements[id];
        return null;
    },
    createElement: (tag) => {
        const el = {
            tagName: tag.toUpperCase(),
            style: {},
            id: '',
            appendChild: () => {},
            remove: function () {
                if (mockDocument.elements[this.id]) {
                    delete mockDocument.elements[this.id];
                }
            },
            classList: {
                add: () => {},
                remove: () => {},
            },
            setAttribute: () => {},
            getAttribute: () => null,
            getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0 }),
            closest: () => null,
        };
        return el;
    },
    listeners: {},
    elements: {},
    dispatchEvent: (event) => {
        if (mockDocument.listeners[event.type]) {
            mockDocument.listeners[event.type](event);
        }
    },
};

const mockWindow = {
    document: mockDocument,
    navigator: { clipboard: {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    HTMLElement: class {},
    NodeList: class {},
    MouseEvent: class {},
    KeyboardEvent: class {},
    BookmarkletUtils: {
        showToast: () => {},
        sanitizeAttributes: () => {},
        normalizeImages: async () => {},
        inlineStylesAsync: async () => {},
        loadLibrary: async () => {},
        downloadFile: () => {},
        htmlToMarkdown: (h) => h,
        sanitizeFilename: (s) => s,
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    setInterval: (fn, ms) => setInterval(fn, ms),
    clearInterval: (id) => clearInterval(id),
};

// Setup global context for the script
global.window = mockWindow;
global.document = mockDocument;
global.BookmarkletUtils = mockWindow.BookmarkletUtils;
global.navigator = mockWindow.navigator;
global.HTMLElement = mockWindow.HTMLElement;

// 2. Load the Web Clipper script
const scriptPath = path.join(__dirname, '../bookmarklets/web-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const constantsPath = path.join(__dirname, '../bookmarklets/i18n/web-clipper-en.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');

console.log('Running Web Clipper Event Tests...');

try {
    eval(constantsCode);
    eval(scriptCode);
} catch (e) {
    console.error('Failed to evaluate web-clipper.js:', e);
    process.exit(1);
}

const clipper = window.__wc_instance;
assert.ok(clipper, 'WebClipper instance should be created');

// Test 1: Initial state
console.log('Test 1: Initial state');
assert.strictEqual(document.body.style.cursor, 'crosshair', 'Initial cursor should be crosshair');
assert.ok(mockDocument.listeners['keydown'], 'Keydown listener should be registered');
console.log('✅ Initial state verified');

// Test 2: Non-Escape key should not stop finder
console.log('Test 2: Enter key should not stop finder');
const enterEvent = { key: 'Enter', type: 'keydown' };
mockDocument.dispatchEvent(enterEvent);
assert.strictEqual(document.body.style.cursor, 'crosshair', 'Cursor should still be crosshair after Enter');
assert.ok(mockDocument.listeners['keydown'], 'Keydown listener should still be registered');
console.log('✅ Enter key ignored correctly');

// Test 3: Escape key should stop finder
console.log('Test 3: Escape key should stop finder');
const escapeEvent = { key: 'Escape', type: 'keydown' };
mockDocument.dispatchEvent(escapeEvent);

assert.strictEqual(document.body.style.cursor, 'default', 'Cursor should be reset to default after Escape');
assert.strictEqual(mockDocument.listeners['keydown'], undefined, 'Keydown listener should be removed after Escape');
console.log('✅ Escape key stops finder correctly');

console.log('\nALL EVENT TESTS PASSED');
