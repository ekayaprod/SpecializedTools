const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock a minimal DOM environment
global.window = { CSS: { escape: (s) => s.replace(/([:])/g, '\\$1') } };
global.document = {
    body: { appendChild: () => {} },
    documentElement: {},
    createElement: () => ({
        style: {},
        attachShadow: () => ({
            innerHTML: '',
            querySelector: () => ({ onclick: null })
        }),
        appendChild: () => {}
    })
};
global.Node = {};
global.HTMLElement = class {};

// Mock BookmarkletUtils
global.BookmarkletUtils = {
    log: () => {},
    makeDraggable: () => {}
};

// Load InteractionRecorder
const scriptPath = path.join(__dirname, '../bookmarklets/interaction-recorder.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
eval(scriptContent);

const recorder = window.__ir_v1;

// Simple element mock
function createMockElement(tagName, id = null, parent = null, className = '') {
    const el = {
        tagName: tagName.toUpperCase(),
        id: id,
        parentElement: parent,
        children: [],
        className: className,
        getAttribute: () => null
    };
    if (parent) {
        parent.children.push(el);
    }
    return el;
}

// Test 1: Simple element
console.log('Test 1: Simple element');
const body = createMockElement('body');
global.document.body = body;
const div = createMockElement('div', 'myid', body);
assert.strictEqual(recorder.getPath(div), 'div#myid');
console.log('✅ Passed');

// Test 2: Nested element without ID
console.log('Test 2: Nested element without ID');
const ul = createMockElement('ul', null, div);
const li = createMockElement('li', null, ul);
assert.strictEqual(recorder.getPath(li), 'div#myid > ul > li');
console.log('✅ Passed');

// Test 3: Multiple siblings (nth-of-type)
console.log('Test 3: Multiple siblings (nth-of-type)');
const li1 = createMockElement('li', null, ul);
const li2 = createMockElement('li', null, ul); // this is the 3rd li
assert.strictEqual(recorder.getPath(li2), 'div#myid > ul > li:nth-of-type(3)');
console.log('✅ Passed');

// Test 4: Mixed siblings
console.log('Test 4: Mixed siblings');
const span = createMockElement('span', null, ul);
assert.strictEqual(recorder.getPath(span), 'div#myid > ul > span'); // Only one span
const span2 = createMockElement('span', null, ul);
assert.strictEqual(recorder.getPath(span2), 'div#myid > ul > span:nth-of-type(2)');
console.log('✅ Passed');

// Test 5: Class name
console.log('Test 5: Class name');
const container = createMockElement('div', 'container', body);
const divWithClass = createMockElement('div', null, container, 'class1 class2');
assert.strictEqual(recorder.getPath(divWithClass), 'div#container > div.class1.class2');
console.log('✅ Passed');

// Benchmark
function setupBenchmark(siblingCount) {
    const parent = createMockElement('div', 'bench-parent');
    for (let i = 0; i < siblingCount; i++) {
        createMockElement('div', null, parent);
    }
    return parent.children[siblingCount - 1];
}

const siblingCount = 1000;
const iterations = 10000;
const target = setupBenchmark(siblingCount);

console.log(`Running benchmark with ${siblingCount} siblings and ${iterations} iterations...`);

const start = Date.now();
for (let i = 0; i < iterations; i++) {
    recorder.getPath(target);
}
const end = Date.now();

console.log(`Time taken: ${end - start}ms`);
const finalPath = recorder.getPath(target);
console.log(`Result path: ${finalPath}`);
assert.strictEqual(finalPath, 'div#bench-parent > div:nth-of-type(1000)');
console.log('✅ Benchmark path verified');

console.log('All functional tests and benchmark passed!');
