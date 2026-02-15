const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <div id="source" style="color: red; width: 100px; height: 100px; position: absolute; top: 10px;">
        <span id="child" style="font-size: 20px;">Text</span>
    </div>
    <div id="target">
        <span id="target-child"></span>
    </div>
    <div id="img-container">
        <img id="img1" data-src="real.jpg" src="placeholder.jpg">
        <img id="img2" srcset="small.jpg 100w, big.jpg 200w" src="spacer.gif">
    </div>
</body>
`, { url: "http://localhost/" }); // Set URL for relative paths

global.window = dom.window;
global.document = dom.window.document;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.Uint32Array = Uint32Array;
// Mock performance for async chunks
global.performance = { now: () => Date.now() };

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

console.log("Running BookmarkletUtils tests...");

(async function() {
    try {
        // Test 2: normalizeImages
        {
            console.log("Test 2: normalizeImages");
            const container = document.getElementById('img-container');
            const img1 = document.getElementById('img1');
            const img2 = document.getElementById('img2');

            // Will become async
            await window.BookmarkletUtils.normalizeImages(container);

            // JSDOM resolves src to absolute URL
            assert.ok(img1.src.includes('real.jpg'), 'data-src should replace src');
            assert.ok(img2.src.includes('big.jpg'), 'srcset should be used (last item)');

            assert.strictEqual(img1.style.maxWidth, '100%', 'maxWidth should be 100%');
            assert.strictEqual(img1.style.display, 'block', 'display should be block');

            console.log("✅ normalizeImages passed");
        }

        // Test 3: sanitizeFilename
        {
            console.log("Test 3: sanitizeFilename");

            // 1. Basic happy path
            const safe = window.BookmarkletUtils.sanitizeFilename('My File Name!');
            assert.strictEqual(safe, 'My_File_Name_', 'Basic sanitization failed');

            // 2. Empty/Null
            assert.strictEqual(window.BookmarkletUtils.sanitizeFilename(''), 'export', 'Empty string should return export');
            assert.strictEqual(window.BookmarkletUtils.sanitizeFilename(null), 'export', 'Null should return export');
            assert.strictEqual(window.BookmarkletUtils.sanitizeFilename(undefined), 'export', 'Undefined should return export');

            // 3. Length check
            const long = 'a'.repeat(100);
            assert.strictEqual(window.BookmarkletUtils.sanitizeFilename(long).length, 50, 'Should truncate to 50 chars');

            // 4. Non-string input (Regression Test)
            try {
                const numResult = window.BookmarkletUtils.sanitizeFilename(12345);
                assert.strictEqual(numResult, '12345', 'Number should be converted to string');
            } catch (e) {
                console.error("❌ sanitizeFilename crashed on number input: " + e.message);
                throw e; // Rethrow to fail the test suite
            }

            console.log("✅ sanitizeFilename passed");
        }

        // Test 4: normalizeImages with <picture> (New Robust Test)
        {
            console.log("Test 4: normalizeImages <picture> support");
            const container = document.createElement('div');
            container.innerHTML = `
                <picture id="pic-1">
                    <source srcset="source-large.jpg">
                    <img id="pic-img-1" src="spacer.gif" alt="Picture 1">
                </picture>
                <picture id="pic-2">
                    <source srcset="source-missing.jpg">
                    <img id="pic-img-2" alt="Picture 2">
                </picture>
            `;
            document.body.appendChild(container);

            const img1 = document.getElementById('pic-img-1');
            const img2 = document.getElementById('pic-img-2');

            // Will become async
            await window.BookmarkletUtils.normalizeImages(container);

            // Assertions
            // JSDOM resolves relative URLs, so check for inclusion
            assert.ok(img1.src.includes('source-large.jpg'), 'Picture 1: source should replace spacer img src');
            assert.ok(img2.src.includes('source-missing.jpg'), 'Picture 2: source should fill missing img src');

            document.body.removeChild(container);
            console.log("✅ normalizeImages <picture> passed");
        }

        // Test 5: buildElement
        {
            console.log("Test 5: buildElement");
            const parent = document.createElement('div');
            document.body.appendChild(parent);

            // 1. Basic Creation
            const el = window.BookmarkletUtils.buildElement('div', { color: 'red' }, 'Hello', parent, { id: 'my-el' });

            assert.strictEqual(el.tagName, 'DIV', 'Tag name match');
            assert.strictEqual(el.style.color, 'red', 'Style match');
            assert.strictEqual(el.textContent, 'Hello', 'Text content match');
            assert.strictEqual(el.parentElement, parent, 'Parent append match');
            assert.strictEqual(el.id, 'my-el', 'Props match');

            // 2. Nested Creation
            const child = window.BookmarkletUtils.buildElement('span', {}, 'Child', el);
            assert.strictEqual(child.parentElement, el, 'Child appended correctly');
            assert.strictEqual(child.textContent, 'Child', 'Child text match');

            document.body.removeChild(parent);
            console.log("✅ buildElement passed");
        }

        console.log("All tests passed!");
    } catch (err) {
        console.error("Test failed:", err);
        process.exit(1);
    }
})();
