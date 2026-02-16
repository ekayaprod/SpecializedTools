const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { url: "http://localhost/" });

global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0); // Mock rAF

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

console.log("Running Toast & BuildElement tests...");

(async function() {
    try {
        // Test 1: buildElement
        {
            console.log("Test 1: buildElement");
            const el = window.BookmarkletUtils.buildElement('div', { color: 'red' }, 'Hello', document.body, { id: 'test-el', 'data-foo': 'bar' });

            assert.strictEqual(el.tagName, 'DIV', 'Tag name match');
            assert.strictEqual(el.style.color, 'red', 'Style match');
            assert.strictEqual(el.textContent, 'Hello', 'Content match');
            assert.strictEqual(el.id, 'test-el', 'ID match');
            assert.strictEqual(el.getAttribute('data-foo'), 'bar', 'Attribute match');
            assert.strictEqual(el.parentElement, document.body, 'Parent match');

            el.remove();
            console.log("✅ buildElement passed");
        }

        // Test 2: showToast
        {
            console.log("Test 2: showToast");
            window.BookmarkletUtils.showToast('Success!', 'success', 100);

            const container = document.getElementById('bm-toast-container');
            assert.ok(container, 'Toast container created');

            const toast = container.querySelector('[role="alert"]');
            assert.ok(toast, 'Toast element created');
            assert.strictEqual(toast.textContent, 'Success!', 'Toast message match');

            // Wait for dismiss
            await new Promise(r => setTimeout(r, 500));

            assert.strictEqual(toast.parentElement, null, 'Toast removed after timeout');
            console.log("✅ showToast passed");
        }

        console.log("All tests passed!");
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
})();
