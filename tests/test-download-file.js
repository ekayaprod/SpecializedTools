const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { url: 'http://localhost/' });

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
    },
};

global.Uint32Array = Uint32Array;

// Mock crypto
global.window.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    },
};

// Execute utils.js
try {
    eval(utilsCode);
} catch (e) {
    console.error('Error evaluating utils.js:', e);
    process.exit(1);
}

// Verify BookmarkletUtils exists
if (!window.BookmarkletUtils) {
    console.error('BookmarkletUtils not found on window');
    process.exit(1);
}

console.log('Running downloadFile tests...');

// Test downloadFile
(async function() {
    let appendedElement = null;
    let clicked = false;
    let removedElement = null;
    let blobCreated = null;

    global.Blob = class MockBlob {
        constructor(content, options) {
            this.content = content;
            this.options = options;
            blobCreated = this;
        }
    };

    // Mock document methods
    const originalCreateElement = document.createElement;
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;

    document.createElement = (tagName) => {
        if (tagName === 'a') {
            return {
                href: '',
                download: '',
                click: () => {
                    clicked = true;
                },
                tagName: 'A',
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

    const resetState = () => {
        appendedElement = null;
        clicked = false;
        removedElement = null;
        createdUrl = '';
        revokedUrl = '';
        blobCreated = null;
    };

    // Test 1: Full arguments including custom MIME type
    resetState();
    window.BookmarkletUtils.downloadFile('test.txt', 'hello', 'text/plain');

    assert.ok(blobCreated, 'Blob should be created');
    assert.strictEqual(blobCreated.options.type, 'text/plain', 'Blob type should be set correctly');
    assert.strictEqual(createdUrl, 'blob:mock-url', 'URL should be created');
    assert.ok(appendedElement, 'Element should be appended');
    assert.strictEqual(appendedElement.tagName, 'A', 'Appended element should be an anchor');
    assert.strictEqual(appendedElement.href, 'blob:mock-url', 'Href should be set');
    assert.strictEqual(appendedElement.download, 'test.txt', 'Download attribute should be set');
    assert.ok(clicked, 'Element should be clicked');
    assert.strictEqual(removedElement, appendedElement, 'Element should be removed');

    await new Promise(resolve => setTimeout(resolve, 150));
    assert.strictEqual(revokedUrl, 'blob:mock-url', 'URL should be revoked');
    console.log('✅ downloadFile custom MIME type passed');

    // Test 2: Default MIME type fallback (when omitted)
    resetState();
    window.BookmarkletUtils.downloadFile('test.html', '<html></html>');

    assert.ok(blobCreated, 'Blob should be created');
    assert.strictEqual(blobCreated.options.type, 'text/html', 'Blob type should default to text/html');
    assert.strictEqual(createdUrl, 'blob:mock-url', 'URL should be created');
    assert.ok(appendedElement, 'Element should be appended');
    assert.strictEqual(appendedElement.download, 'test.html', 'Download attribute should be set');
    assert.ok(clicked, 'Element should be clicked');
    assert.strictEqual(removedElement, appendedElement, 'Element should be removed');

    await new Promise(resolve => setTimeout(resolve, 150));
    assert.strictEqual(revokedUrl, 'blob:mock-url', 'URL should be revoked');
    console.log('✅ downloadFile default MIME type passed');

    // Test 3: Empty string content
    resetState();
    window.BookmarkletUtils.downloadFile('empty.txt', '', 'text/plain');
    assert.ok(blobCreated, 'Blob should be created');
    assert.strictEqual(blobCreated.content[0], '', 'Blob content should be an empty string');
    assert.ok(clicked, 'Element should be clicked');

    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('✅ downloadFile empty content passed');

    // Restore mocks
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;

    console.log('✅ All downloadFile tests passed');
})();
