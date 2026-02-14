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
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
// Mock createObjectURL/revokeObjectURL as utils.js might use them (though not in loadLibrary)
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};

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

console.log("Running loadLibrary tests...");

async function testLoadLibrary() {
    // 1. Test: Library already exists (should resolve immediately without creating script)
    {
        console.log("Test 1: Library already exists");
        global.window.myLib = { version: '1.0' };

        let scriptCreated = false;
        // Spy on document.createElement
        const originalCreateElement = global.document.createElement;
        global.document.createElement = (tag) => {
            if (tag === 'script') scriptCreated = true;
            return originalCreateElement.call(global.document, tag);
        };

        await window.BookmarkletUtils.loadLibrary('myLib', 'http://example.com/lib.js');

        assert.strictEqual(scriptCreated, false, "Should not create script if library exists");
        global.document.createElement = originalCreateElement; // Restore
        delete global.window.myLib;
        console.log("✅ Passed");
    }

    // 2. Test: Library does not exist (should create script and resolve on load)
    {
        console.log("Test 2: Library load success");

        let appendedScript = null;
        // Mock document.head.appendChild
        const originalAppendChild = global.document.head.appendChild;
        global.document.head.appendChild = (el) => {
            appendedScript = el;
            // Simulate async load
            setTimeout(() => {
                if (el.onload) el.onload();
            }, 10);
            return el;
        };

        const loadPromise = window.BookmarkletUtils.loadLibrary('newLib', 'http://example.com/newLib.js', 'sha-123');

        assert.ok(appendedScript, "Script element should be appended");
        assert.strictEqual(appendedScript.src, 'http://example.com/newLib.js', "Src match");
        assert.strictEqual(appendedScript.integrity, 'sha-123', "Integrity match");
        assert.strictEqual(appendedScript.crossOrigin, 'anonymous', "CrossOrigin match");

        await loadPromise;

        global.document.head.appendChild = originalAppendChild; // Restore
        console.log("✅ Passed");
    }

    // 3. Test: Library load failure
    {
        console.log("Test 3: Library load failure");

        global.document.head.appendChild = (el) => {
            setTimeout(() => {
                if (el.onerror) el.onerror();
            }, 10);
            return el;
        };

        try {
            await window.BookmarkletUtils.loadLibrary('badLib', 'http://example.com/bad.js');
            assert.fail("Should have thrown error");
        } catch (e) {
            assert.strictEqual(e.message, 'Failed to load badLib');
        }

        console.log("✅ Passed");
    }
}

testLoadLibrary().then(() => {
    console.log("All loadLibrary tests passed!");
}).catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
