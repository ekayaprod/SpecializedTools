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
global.window.crypto = { getRandomValues: () => {} };

// Evaluate utils
try {
    eval(utilsCode);
} catch (e) {
    console.error("Error evaluating utils.js:", e);
    process.exit(1);
}

// Test sanitizeAttributes
console.log("Testing sanitizeAttributes...");

const container = document.createElement('div');
container.innerHTML = `
    <div id="clean">Clean</div>
    <div id="onclick" onclick="alert(1)">Onclick</div>
    <a id="js-href" href="javascript:alert(1)">JS Link</a>
    <a id="vb-href" href="vbscript:alert(1)">VB Link</a>
    <img id="js-src" src="javascript:alert(1)">
    <iframe id="data-iframe" src="data:text/html,<script>alert(1)</script>"></iframe>
    <img id="valid-img" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==">
    <form id="action-js" action="javascript:void(0)"></form>

    <!-- New Test Cases -->
    <iframe id="srcdoc-iframe" srcdoc="<script>alert(1)</script>"></iframe>
    <button id="formaction-btn" formaction="javascript:alert(1)">Submit</button>
    <video id="poster-video" poster="javascript:alert(1)"></video>
    <svg><a id="xlink-href" xlink:href="javascript:alert(1)">Link</a></svg>
    <div id="style-div" style="background-image: url(javascript:alert(1))">Style</div>
    <div id="style-safe" style="color: red">Safe Style</div>
`;
document.body.appendChild(container);

window.BookmarkletUtils.sanitizeAttributes(container);

// Assertions
assert.ok(!document.getElementById('onclick').hasAttribute('onclick'), 'onclick should be removed');
assert.ok(!document.getElementById('js-href').hasAttribute('href'), 'javascript: href should be removed');
assert.ok(!document.getElementById('vb-href').hasAttribute('href'), 'vbscript: href should be removed');
assert.ok(!document.getElementById('js-src').hasAttribute('src'), 'javascript: src should be removed');
assert.ok(!document.getElementById('data-iframe').hasAttribute('src'), 'data: src (non-image) should be removed');
assert.ok(document.getElementById('valid-img').hasAttribute('src'), 'data:image src should be preserved');
assert.ok(!document.getElementById('action-js').hasAttribute('action'), 'javascript: action should be removed');
assert.ok(document.getElementById('clean').textContent === 'Clean', 'Clean content should remain');

// Assertions for new cases
assert.ok(!document.getElementById('srcdoc-iframe').hasAttribute('srcdoc'), 'srcdoc should be removed');
assert.ok(!document.getElementById('formaction-btn').hasAttribute('formaction'), 'javascript: formaction should be removed');
assert.ok(!document.getElementById('poster-video').hasAttribute('poster'), 'javascript: poster should be removed');

const xlinkEl = document.getElementById('xlink-href');
// Depending on JSDOM parsing, check both namespaced and non-namespaced if possible, or just the attribute name
assert.ok(!xlinkEl.hasAttribute('xlink:href'), 'javascript: xlink:href should be removed');

const styleDiv = document.getElementById('style-div');
const styleVal = styleDiv.getAttribute('style');
assert.ok(!styleVal || !styleVal.includes('javascript:'), 'javascript: in style should be removed');

const styleSafe = document.getElementById('style-safe');
assert.ok(styleSafe.getAttribute('style').includes('color: red'), 'Safe style should be preserved');

console.log("✅ sanitizeAttributes passed");
