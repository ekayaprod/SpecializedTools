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
global.Uint32Array = Uint32Array;
global.window.crypto = {
    getRandomValues: (arr) => {
        for(let i=0; i<arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    }
};

// Evaluate utils code to inject BookmarkletUtils into global.window
try {
    // We need to run it in the context of our JSDOM window
    // But since it uses `(function(w){...})(window)`, and we set global.window = dom.window,
    // eval should work if `window` is in scope.
    eval(utilsCode);
} catch (e) {
    console.error("Error evaluating utils.js:", e);
    process.exit(1);
}

// Check if inlineStylesAsync exists
if (typeof window.BookmarkletUtils.inlineStylesAsync !== 'function') {
    console.error("❌ inlineStylesAsync is not defined!");
    process.exit(1);
}

async function runTest() {
    console.log("Testing inlineStylesAsync...");

    // Create a deep tree to test recursion/stack
    const root = document.createElement('div');
    root.id = 'root';
    root.style.color = 'red';
    root.style.fontSize = '20px';

    const child1 = document.createElement('div');
    child1.id = 'c1';
    child1.style.backgroundColor = 'blue';
    root.appendChild(child1);

    const child2 = document.createElement('span');
    child2.id = 'c2';
    child2.style.fontWeight = 'bold';
    root.appendChild(child2);

    const grandchild = document.createElement('p');
    grandchild.id = 'gc';
    grandchild.style.margin = '10px';
    child1.appendChild(grandchild);

    document.body.appendChild(root);

    // Create a clone (target)
    const clone = root.cloneNode(true);

    // Ensure clone has no inline styles initially (cloneNode(true) copies attributes including style!)
    // Wait, cloneNode(true) COPIES the inline style attribute.
    // So if I set root.style.color='red', the clone WILL have style='color: red'.
    // BUT `inlineStyles` is about COMPUTED styles being inlined.
    // In a real browser, stylesheet rules are not copied by cloneNode.
    // But here I'm setting inline styles on the source.
    // To properly test, I should clear the clone's styles to verify they are re-applied
    // OR rely on the fact that getComputedStyle might return resolved values (e.g. rgb for color).
    // Let's clear the clone's styles to be sure we are testing the function.

    function clearStyles(node) {
        node.removeAttribute('style');
        for(let i=0; i<node.children.length; i++) clearStyles(node.children[i]);
    }
    clearStyles(clone);

    // Verify clone is clean
    assert.strictEqual(clone.style.color, '');
    assert.strictEqual(clone.querySelector('#c1').style.backgroundColor, '');

    // Track progress
    let progressCalls = 0;
    let lastCount = 0;

    const onProgress = (count) => {
        progressCalls++;
        lastCount = count;
        // console.log(`Progress: ${count}`);
    };

    // Run async function
    await window.BookmarkletUtils.inlineStylesAsync(root, clone, onProgress);

    // Assertions
    console.log("Verifying styles...");

    // JSDOM's getComputedStyle returns the inline style if no stylesheets are present.
    // So if root has inline color: red, getComputedStyle(root).color is 'red'.
    // inlineStylesAsync should read that and set clone.style.cssText.

    // Check color (accepting named or rgb)
    assert.ok(clone.style.color === 'red' || clone.style.color === 'rgb(255, 0, 0)', 'Color mismatch');
    assert.strictEqual(clone.style.fontSize, '20px');

    const c1Clone = clone.querySelector('#c1');
    assert.ok(c1Clone.style.backgroundColor === 'blue' || c1Clone.style.backgroundColor === 'rgb(0, 0, 255)', 'Background color mismatch');

    const c2Clone = clone.querySelector('#c2');
    const fw = c2Clone.style.fontWeight;
    assert.ok(fw === 'bold' || fw === '700', 'Font weight mismatch');

    const gcClone = clone.querySelector('#gc');
    assert.strictEqual(gcClone.style.margin, '10px');

    console.log("Verifying progress...");
    // We processed 4 elements (root, c1, c2, gc)
    assert.strictEqual(lastCount, 4);
    assert.ok(progressCalls >= 1, "Progress callback should be called at least once");

    console.log("✅ inlineStylesAsync passed");
}

runTest().catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
