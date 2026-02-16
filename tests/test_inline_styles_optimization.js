const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// JSDOM Setup
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <div id="test-root"></div>
</body>
`, { url: "http://localhost/" });

global.window = dom.window;
global.document = dom.window.document;
global.getComputedStyle = dom.window.getComputedStyle;
global.Uint32Array = Uint32Array;
global.performance = { now: () => Date.now() };

// Mock crypto
global.window.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    }
};

// Evaluate Utils
try {
    eval(utilsCode);
} catch (e) {
    console.error("Error evaluating utils.js:", e);
    process.exit(1);
}

async function runTest() {
    console.log("Running inlineStylesAsync Optimization Tests...");

    const testRoot = document.getElementById('test-root');

    // Test 1: Redundant styles (already in target) should NOT be appended (Performance Optimization)
    {
        console.log("Test 1: Redundant styles");
        const source = document.createElement('div');
        source.style.color = 'rgb(255, 0, 0)';
        testRoot.appendChild(source);

        const target = source.cloneNode(true);
        // target has style="color: rgb(255, 0, 0);"

        await window.BookmarkletUtils.inlineStylesAsync(source, target);

        const cssText = target.style.cssText;
        console.log("Result cssText (Test 1):", cssText);

        // Since target already has 'color: rgb(255, 0, 0)', it should NOT be re-appended/duplicated in processing logic.
        // JSDOM normalizes cssText so we can't see duplicates easily, but we can infer optimization by benchmark.
        // However, we can assert correctness: target still has the style.
        assert.ok(cssText.includes('color: rgb(255, 0, 0)'), 'Color should be present');

        testRoot.removeChild(source);
    }

    // Test 2: Default values (0px, auto, transparent) should be PRESERVED for correctness (Safety)
    {
        console.log("Test 2: Default values preserved");
        const source = document.createElement('div');
        source.style.margin = '0px';
        source.style.width = 'auto';
        source.style.backgroundColor = 'transparent';
        testRoot.appendChild(source);

        const target = document.createElement('div'); // Clean target

        await window.BookmarkletUtils.inlineStylesAsync(source, target);

        const cssText = target.style.cssText;
        console.log("Result cssText (Test 2):", cssText);

        // Assertions updated: we expect these to be PRESENT to override potential UA styles
        assert.ok(cssText.includes('margin: 0px') || cssText.includes('margin-top'), 'Margin 0px should be preserved');
        // width: auto might be normalized away or present depending on browser, but here we expect no regression in applying styles.
        // background-color: transparent (rgba(0,0,0,0)) should be present if computed style has it.
        assert.ok(cssText.includes('background-color'), 'Transparent background should be preserved');

        testRoot.removeChild(source);
    }

    // Test 3: Non-defaults should be applied
    {
        console.log("Test 3: Non-defaults");
        const source = document.createElement('div');
        source.style.margin = '10px';
        source.style.backgroundColor = 'red';
        testRoot.appendChild(source);

        const target = document.createElement('div');

        await window.BookmarkletUtils.inlineStylesAsync(source, target);

        const cssText = target.style.cssText;
        console.log("Result cssText (Test 3):", cssText);

        assert.ok(cssText.includes('margin: 10px'), 'Margin 10px should be applied');
        assert.ok(cssText.includes('rgb(255, 0, 0)') || cssText.includes('red'), 'Background red should be applied');

        testRoot.removeChild(source);
    }

    console.log("✅ Optimization Tests Passed");
}

runTest().catch(e => {
    console.error("Test Failed:", e);
    process.exit(1);
});
