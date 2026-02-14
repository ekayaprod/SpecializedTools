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

console.log("Running BookmarkletUtils tests...");

// Test 1: inlineStyles
{
    console.log("Test 1: inlineStyles");
    const source = document.getElementById('source');
    const target = document.getElementById('target');

    window.BookmarkletUtils.inlineStyles(source, target);

    const targetStyle = target.style;
    // getComputedStyle converts colors to rgb
    assert.strictEqual(targetStyle.color, 'rgb(255, 0, 0)', 'Color should be copied');
    assert.strictEqual(targetStyle.width, '100px', 'Width should be copied');
    assert.strictEqual(targetStyle.position, 'absolute', 'Position should be copied');
    assert.strictEqual(targetStyle.top, '10px', 'Top should be copied');

    // Check child recursion
    const targetChild = document.getElementById('target-child');
    assert.strictEqual(targetChild.style.fontSize, '20px', 'Child font-size should be copied');

    console.log("✅ inlineStyles passed");
}

// Test 2: normalizeImages
{
    console.log("Test 2: normalizeImages");
    const container = document.getElementById('img-container');
    const img1 = document.getElementById('img1');
    const img2 = document.getElementById('img2');

    window.BookmarkletUtils.normalizeImages(container);

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
    // This is expected to crash until fixed
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

    window.BookmarkletUtils.normalizeImages(container);

    // Assertions
    // JSDOM resolves relative URLs, so check for inclusion
    assert.ok(img1.src.includes('source-large.jpg'), 'Picture 1: source should replace spacer img src');
    assert.ok(img2.src.includes('source-missing.jpg'), 'Picture 2: source should fill missing img src');

    document.body.removeChild(container);
    console.log("✅ normalizeImages <picture> passed");
}

console.log("All tests passed!");
