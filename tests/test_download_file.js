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
global.Blob = class MockBlob {
    constructor(content, options) {
        this.content = content;
        this.options = options;
    }
};

let createdUrl = '';
let revokedUrl = '';

global.URL = {
    createObjectURL: (blob) => {
        createdUrl = 'blob:mock-url';
        return createdUrl;
    },
    revokeObjectURL: (url) => {
        revokedUrl = url;
    }
};

global.Uint32Array = Uint32Array;

// Mock crypto
global.window.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    }
};

// Execute utils.js
try {
    eval(utilsCode);
} catch (e) {
    console.error("Error evaluating utils.js:", e);
    process.exit(1);
}

// Verify BookmarkletUtils exists
if (!window.BookmarkletUtils) {
    console.error("BookmarkletUtils not found on window");
    process.exit(1);
}

console.log("Running downloadFile tests...");

// Test downloadFile
{
    let appendedElement = null;
    let clicked = false;
    let removedElement = null;

    // Mock document methods
    const originalCreateElement = document.createElement;
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;

    document.createElement = (tagName) => {
        if (tagName === 'a') {
            return {
                href: '',
                download: '',
                click: () => { clicked = true; },
                tagName: 'A'
            };
        }
        return originalCreateElement.call(document, tagName);
    };

    document.body.appendChild = (el) => {
        appendedElement = el;
        return el;
    };

    document.body.removeChild = (el) => {
        removedElement = el;
        return el;
    };

    const filename = 'test.html';
    const content = '<html>test</html>';
    const type = 'text/html';

    window.BookmarkletUtils.downloadFile(filename, content, type);

    // Verify Blob creation (implicit via execution flow)

    // Verify URL creation
    assert.strictEqual(createdUrl, 'blob:mock-url', 'URL should be created');

    // Verify Anchor element setup
    assert.ok(appendedElement, 'Element should be appended');
    assert.strictEqual(appendedElement.tagName, 'A', 'Appended element should be an anchor');
    assert.strictEqual(appendedElement.href, 'blob:mock-url', 'Href should be set');
    assert.strictEqual(appendedElement.download, filename, 'Download attribute should be set');

    // Verify click
    assert.ok(clicked, 'Element should be clicked');

    // Verify cleanup
    assert.strictEqual(removedElement, appendedElement, 'Element should be removed');

    // Verify URL revocation (wait for timeout)
    setTimeout(() => {
        assert.strictEqual(revokedUrl, 'blob:mock-url', 'URL should be revoked');
        console.log("✅ downloadFile passed");

        // Restore mocks
        document.createElement = originalCreateElement;
        document.body.appendChild = originalAppendChild;
        document.body.removeChild = originalRemoveChild;
    }, 200);
}
