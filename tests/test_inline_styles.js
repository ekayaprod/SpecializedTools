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

// Ensure BookmarkletUtils exists
if (!window.BookmarkletUtils) {
    console.error("BookmarkletUtils not found on window");
    process.exit(1);
}

// Helper to run async test
async function runTests() {
    console.log("Running inlineStylesAsync tests...");

    const testRoot = document.getElementById('test-root');

    // Test 1: Basic Style Copying & Filtering
    {
        console.log("Test 1: Basic Style Copying & Filtering");
        const source = document.createElement('div');
        source.style.color = 'rgb(255, 0, 0)'; // Safe (normalized by JSDOM)
        source.style.fontSize = '20px';       // Safe
        source.style.cursor = 'pointer';      // Unsafe (not in safelist)
        source.style.userSelect = 'none';     // Unsafe (not in safelist)
        testRoot.appendChild(source);

        const target = document.createElement('div');
        testRoot.appendChild(target);

        await window.BookmarkletUtils.inlineStylesAsync(source, target);

        const targetStyle = target.style;
        assert.strictEqual(targetStyle.color, 'rgb(255, 0, 0)', 'Color (safe) should be copied');
        assert.strictEqual(targetStyle.fontSize, '20px', 'FontSize (safe) should be copied');
        assert.strictEqual(targetStyle.cursor, '', 'Cursor (unsafe) should NOT be copied');

        // userSelect might be vendor prefixed or not supported in JSDOM depending on version,
        // but let's check standard property if possible, or skip if JSDOM doesn't support it fully.
        // JSDOM generally supports standard properties.
        assert.strictEqual(targetStyle.userSelect, '', 'UserSelect (unsafe) should NOT be copied');

        console.log("✅ Basic Style Copying & Filtering Passed");

        // Cleanup
        testRoot.removeChild(source);
        testRoot.removeChild(target);
    }

    // Test 2: Recursion / Nested Elements
    {
        console.log("Test 2: Recursion / Nested Elements");
        const source = document.createElement('div');
        source.style.display = 'flex';
        const child = document.createElement('span');
        child.style.fontWeight = 'bold';
        source.appendChild(child);
        testRoot.appendChild(source);

        const target = document.createElement('div');
        const targetChild = document.createElement('span');
        target.appendChild(targetChild);
        testRoot.appendChild(target);

        await window.BookmarkletUtils.inlineStylesAsync(source, target);

        assert.strictEqual(target.style.display, 'flex', 'Parent display should be copied');
        assert.strictEqual(targetChild.style.fontWeight, 'bold', 'Child fontWeight should be copied'); // '700' or 'bold'

        console.log("✅ Recursion Passed");

        // Cleanup
        testRoot.removeChild(source);
        testRoot.removeChild(target);
    }

    // Test 3: Chunking & Performance (Large Tree)
    {
        console.log("Test 3: Chunking Logic (Large Tree)");
        const source = document.createElement('div');
        const target = document.createElement('div');
        testRoot.appendChild(source);
        testRoot.appendChild(target);

        // Create 100 children (Chunk size is 50)
        const COUNT = 100;
        for (let i = 0; i < COUNT; i++) {
            const sChild = document.createElement('p');
            sChild.style.margin = '10px';
            source.appendChild(sChild);

            const tChild = document.createElement('p');
            target.appendChild(tChild);
        }

        let progressUpdates = 0;
        await window.BookmarkletUtils.inlineStylesAsync(source, target, (count) => {
            progressUpdates++;
        });

        // Verify last child has style
        const lastTargetChild = target.children[COUNT - 1];
        assert.strictEqual(lastTargetChild.style.margin, '10px', 'Last child should have style');

        // Verify progress callback was called at least once
        assert.ok(progressUpdates > 0, 'Progress callback should be called');

        console.log(`✅ Chunking Passed (Processed ${COUNT} elements with ${progressUpdates} updates)`);

        // Cleanup
        testRoot.removeChild(source);
        testRoot.removeChild(target);
    }

    console.log("All tests passed!");
}

runTests().catch(e => {
    console.error("Test Failed:", e);
    process.exit(1);
});
