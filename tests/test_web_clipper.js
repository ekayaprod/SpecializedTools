const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const clipperPath = path.join(__dirname, '../bookmarklets/web-clipper.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
const clipperCode = fs.readFileSync(clipperPath, 'utf8');

// Test Runner
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function run() {
    console.log('Running Web Clipper Tests...');
    let passed = 0;
    let failed = 0;

    for (const t of tests) {
        try {
            await t.fn();
            console.log(`✅ ${t.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${t.name}`);
            console.error(e);
            failed++;
        }
    }
    console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

// Helper to setup environment
function setup() {
    const dom = new JSDOM('<!DOCTYPE html><body><div id="target" style="width:100px;height:100px;">Target</div><div id="other">Other</div></body>', {
        url: "http://localhost/",
        runScripts: "dangerously",
        resources: "usable"
    });

    const window = dom.window;
    const document = window.document;

    // Mock globals
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;
    global.NodeList = window.NodeList;
    global.MouseEvent = window.MouseEvent;
    global.KeyboardEvent = window.KeyboardEvent;
    global.Blob = window.Blob;
    global.ClipboardItem = class {};
    global.navigator = { clipboard: { write: async () => {} } };

    // Performance Mock: Use Node's native performance or simple fallback
    // avoiding circular dependency with JSDOM's implementation
    if (!global.performance) {
        global.performance = { now: () => Date.now() };
    }

    // Mock alert globally (default no-op)
    window.alert = () => {};
    global.alert = (msg) => window.alert(msg);

    // Mock getBoundingClientRect
    window.HTMLElement.prototype.getBoundingClientRect = function() {
        return { top: 10, left: 10, width: 100, height: 100, bottom: 110, right: 110 };
    };

    // Mock window.getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(el) {
        return originalGetComputedStyle(el);
    };

    // Load Utils
    try {
        eval(utilsCode);
        // Expose to global scope for the clipper script which uses it directly
        global.BookmarkletUtils = window.BookmarkletUtils;
    } catch (e) {
        console.error("Error loading utils:", e);
    }

    return { window, document };
}

// Tests

test('Finder: Should highlight element on mouseover', async () => {
    const { window, document } = setup();

    // Load Clipper
    eval(clipperCode);

    // Check cursor
    assert.strictEqual(document.body.style.cursor, 'crosshair', 'Cursor should be crosshair');

    // Hover
    const target = document.getElementById('target');
    const event = new window.MouseEvent('mouseover', {
        view: window,
        bubbles: true,
        cancelable: true
    });
    target.dispatchEvent(event);

    // Check highlight
    const highlight = document.getElementById('wc-bookmarklet-highlight');
    assert.ok(highlight, 'Highlight element should exist');
    assert.strictEqual(highlight.style.display, 'block', 'Highlight should be visible');
    assert.strictEqual(highlight.style.width, '100px');
});

test('Finder: Should ignore body/html tags', async () => {
    const { window, document } = setup();
    eval(clipperCode);

    const body = document.body;
    body.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));

    const highlight = document.getElementById('wc-bookmarklet-highlight');
    // It might exist if previously created (though here fresh env), but if fresh it shouldn't exist.
    // If it exists, it should be hidden? No, getOrCreateHighlightEl creates it on demand.
    // The code returns early if ignored tag. So it shouldn't be created.
    assert.strictEqual(document.getElementById('wc-bookmarklet-highlight'), null, 'Should not highlight ignored tags');
});

test('Editor: Should open on click', async () => {
    const { window, document } = setup();

    // Mock inlineStylesAsync to be fast
    // We need to overwrite it on the window instance AND global if needed
    window.BookmarkletUtils.inlineStylesAsync = async (src, tgt, cb) => {
        if (cb) cb(1);
        return;
    };
    // Sync global mock
    global.BookmarkletUtils = window.BookmarkletUtils;

    eval(clipperCode);

    const target = document.getElementById('target');
    // Trigger mouseover to set activeElement
    target.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));

    // Click
    target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    // Check loading
    const loading = document.getElementById('wc-loading');
    assert.ok(loading, 'Loading overlay should appear');

    // Wait for timeout in code (50ms)
    await new Promise(r => setTimeout(r, 100));

    // Check editor
    const overlay = document.getElementById('wc-bookmarklet-overlay');
    assert.ok(overlay, 'Editor overlay should be present');

    // Check cursor reset
    assert.strictEqual(document.body.style.cursor, 'default', 'Cursor should reset');
});

test('Editor: Should handle errors gracefully', async () => {
    const { window, document } = setup();

    // Mock inlineStylesAsync to fail
    window.BookmarkletUtils.inlineStylesAsync = async () => {
        throw new Error('Mock Error');
    };
    global.BookmarkletUtils = window.BookmarkletUtils;

    // Mock alert
    let alertMsg = '';
    window.alert = (msg) => { alertMsg = msg; };

    // Spy on console.error
    let errorLogged = false;
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] === 'Web Clipper editor open failed') {
            errorLogged = true;
        }
    };

    eval(clipperCode);

    const target = document.getElementById('target');
    target.dispatchEvent(new window.MouseEvent('mouseover', { bubbles: true }));
    target.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    await new Promise(r => setTimeout(r, 100));

    assert.ok(errorLogged, 'Should log error to console');
    assert.strictEqual(document.getElementById('wc-loading'), null, 'Loading overlay should be removed');
    assert.ok(alertMsg.includes('Mock Error'), 'Should alert user with error message');

    // Cleanup
    console.error = originalConsoleError;
});

run();
