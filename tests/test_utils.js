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

console.log("All tests passed!");
