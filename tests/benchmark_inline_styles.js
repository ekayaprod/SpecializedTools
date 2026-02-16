
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
eval(utilsCode);

async function benchmark() {
    const root = document.getElementById('test-root');

    // Create a complex structure
    const DEPTH = 50;
    const BREADTH = 10;

    // Create source with inline styles that match safe properties
    const source = document.createElement('div');
    source.style.color = 'red';
    source.style.fontSize = '16px';
    source.style.display = 'block';

    let current = source;
    for (let i = 0; i < DEPTH; i++) {
        const child = document.createElement('div');
        child.style.margin = '5px';
        child.style.padding = '5px';
        child.style.backgroundColor = 'blue';
        current.appendChild(child);
        current = child;
    }

    root.appendChild(source);

    const target = source.cloneNode(true);
    // target is NOT attached, simulating web-clipper behavior (mostly)
    // verification: web-clipper passes clone (not attached)

    const start = performance.now();
    await window.BookmarkletUtils.inlineStylesAsync(source, target);
    const end = performance.now();

    console.log(`Time taken: ${end - start}ms`);

    // Measure redundancy
    // Count how many semicolons in cssText vs expected unique properties
    let redundancyCount = 0;
    function checkRedundancy(el) {
        const style = el.getAttribute('style') || '';
        // If style repeats properties, it's redundant.
        // e.g. "color: red; color: red;"
        const parts = style.split(';').map(s => s.trim()).filter(s => s);
        const props = parts.map(p => p.split(':')[0].trim());
        const unique = new Set(props);
        if (props.length > unique.size) {
            redundancyCount += (props.length - unique.size);
        }
        for (let i = 0; i < el.children.length; i++) {
            checkRedundancy(el.children[i]);
        }
    }

    checkRedundancy(target);
    console.log(`Redundant style declarations: ${redundancyCount}`);
}

benchmark().catch(console.error);
