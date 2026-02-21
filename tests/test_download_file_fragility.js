const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { url: "http://localhost/" });

global.window = dom.window;
global.document = dom.window.document;
// Minimal Blob mock
global.Blob = class MockBlob {
    constructor(content, options) {
        this.content = content;
        this.options = options;
    }
};

global.Uint32Array = Uint32Array;
global.window.crypto = {
    getRandomValues: (arr) => arr
};

// Execute utils.js
try {
    eval(utilsCode);
} catch (e) {
    console.error("Error evaluating utils.js:", e);
    process.exit(1);
}

if (!window.BookmarkletUtils) {
    console.error("BookmarkletUtils not found on window");
    process.exit(1);
}

// Spy on console.error
const originalConsoleError = console.error;
let errorLogged = false;
console.error = (...args) => {
    if (args[0] === 'Download failed:') {
        errorLogged = true;
    }
};

// Mock showToast
let toastShown = false;
let toastMsg = '';
let toastType = '';

window.BookmarkletUtils.showToast = (msg, type) => {
    toastShown = true;
    toastMsg = msg;
    toastType = type;
};

// Helper to reset state
function resetState() {
    errorLogged = false;
    toastShown = false;
    toastMsg = '';
    toastType = '';
}

// Test Case 1: createObjectURL failure
try {
    console.log("Test 1: createObjectURL failure");
    resetState();

    // Mock URL with failure
    global.URL = {
        createObjectURL: (blob) => {
            throw new Error('Mock URL Creation Failed');
        },
        revokeObjectURL: (url) => {}
    };

    window.BookmarkletUtils.downloadFile('test.txt', 'content', 'text/plain');

    assert.ok(errorLogged, 'Error should be logged to console');
    assert.ok(toastShown, 'Toast should be shown');
    assert.strictEqual(toastMsg, 'Download failed: Mock URL Creation Failed');
    assert.strictEqual(toastType, 'error');

    console.log("✅ passed");
} catch (e) {
    console.error("❌ Test 1 failed:", e);
    process.exit(1);
}

// Test Case 2: click() failure
try {
    console.log("Test 2: click() failure");
    resetState();

    let revokedUrl = '';
    global.URL = {
        createObjectURL: (blob) => 'blob:mock-url',
        revokeObjectURL: (url) => { revokedUrl = url; }
    };

    let removedElement = null;
    const originalRemoveChild = document.body.removeChild;
    document.body.removeChild = (el) => {
        removedElement = el;
        return originalRemoveChild.call(document.body, el);
    };

    // Mock createElement to return an element that throws on click
    const originalCreateElement = document.createElement;
    document.createElement = (tagName) => {
        if (tagName === 'a') {
            const el = originalCreateElement.call(document, tagName);
            // We need to override click. In JSDOM, click() dispatches an event.
            // We can just throw manually or override the method.
            el.click = () => { throw new Error('Click Failed'); };
            return el;
        }
        return originalCreateElement.call(document, tagName);
    };

    window.BookmarkletUtils.downloadFile('test.txt', 'content', 'text/plain');

    assert.ok(errorLogged, 'Error should be logged (click failure)');
    assert.ok(toastShown, 'Toast should be shown (click failure)');
    assert.strictEqual(toastMsg, 'Download failed: Click Failed');

    // Check cleanup
    assert.ok(removedElement, 'Element should be removed from DOM');
    assert.strictEqual(removedElement.tagName, 'A');

    // Check URL revocation (async)
    setTimeout(() => {
        if (revokedUrl === 'blob:mock-url') {
             console.log("✅ passed (including async revocation)");
             console.error = originalConsoleError; // Restore
        } else {
             console.error("❌ Test 2 failed: URL not revoked");
             process.exit(1);
        }
    }, 200);

} catch (e) {
    console.error("❌ Test 2 failed:", e);
    process.exit(1);
} finally {
    // Restore mocks not restored inside async check if synchronous failure happened
}
