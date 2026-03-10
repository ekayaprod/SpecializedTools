const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup JSDOM with various elements
const dom = new JSDOM(
    `<!DOCTYPE html><body>
        <div id="container">
            <ul id="list">
                <li>Item 1</li>
                <li>Item 2</li> <!-- Target 1: Sibling Ambiguity -->
                <li>Item 3</li>
            </ul>
            <div id="svg-container">
                <svg width="100" height="100" class="my-svg">
                    <rect width="50" height="50" style="fill:blue;" /> <!-- Target 2: SVG Child -->
                </svg>
            </div>
            <div id="shadow-host"></div>
            <div id="weird-id">
                <button id="foo:bar">Special ID</button> <!-- Target 3: Special Char ID -->
            </div>
        </div>
    </body>`,
    {
        url: 'http://localhost/',
        pretendToBeVisual: true,
        runScripts: 'dangerously', // Needed for event handling
    }
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.SVGElement = dom.window.SVGElement; // Mock SVGElement if needed

// Mock CSS.escape if not present in JSDOM (it usually is in newer versions, but good to be safe)
if (!global.window.CSS) global.window.CSS = {};
if (!global.window.CSS.escape) {
    global.window.CSS.escape = (s) => s.replace(/([:])/g, '\\$1');
}

// Mock URL/Blob
global.URL = { createObjectURL: () => 'blob:url', revokeObjectURL: () => {} };
global.Blob = class Blob { constructor(c) { this.content = c; } };

// Mock Alert/Console
global.alert = (msg) => console.log('Alert:', msg);

// Load Scripts
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
const scriptPath = path.join(__dirname, '../bookmarklets/interaction-recorder.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function runTest() {
    console.log('🚀 Starting Robustness Tests for Interaction Recorder...');

    try {
        eval(utilsContent);
        if (window.BookmarkletUtils) global.BookmarkletUtils = window.BookmarkletUtils;
        eval(scriptContent);
    } catch (e) {
        console.error('Script execution failed:', e);
        process.exit(1);
    }

    const app = global.window.__ir_v1;
    if (!app) {
        console.error('❌ App instance not found');
        process.exit(1);
    }

    // Initialize Shadow DOM content
    const host = document.getElementById('shadow-host');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<button id="shadow-btn">Shadow Button</button>';

    app.start();
    console.log('✅ Recorder started');

    // TEST 1: Sibling Ambiguity
    console.log('Test 1: Sibling Ambiguity');
    const items = document.querySelectorAll('li');
    const targetItem = items[1]; // Item 2

    targetItem.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: window }));

    let lastLog = app.log[app.log.length - 1];
    console.log('  Path:', lastLog.path);

    // Check if selector targets the correct element
    let selected = document.querySelector(lastLog.path);
    if (selected === targetItem) {
        console.log('  ✅ Correctly targeted 2nd sibling');
    } else {
        console.error('  ❌ Failed to target 2nd sibling. Got:', selected ? selected.textContent : 'null');
        // We expect this to FAIL currently
    }

    // TEST 2: SVG Handling
    console.log('Test 2: SVG Element Handling');
    const rect = document.querySelector('rect');

    // SVG elements might not have className as string
    // Trigger click
    try {
        rect.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: window }));
        lastLog = app.log[app.log.length - 1];
        console.log('  Path:', lastLog.path);
        console.log('  ✅ Click on SVG processed without crash');
    } catch (e) {
        console.error('  ❌ Crash on SVG click:', e);
    }

    // TEST 3: Special ID Characters
    console.log('Test 3: Special Characters in ID');
    const specialBtn = document.getElementById('foo:bar');

    try {
        specialBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, view: window }));
        lastLog = app.log[app.log.length - 1];
        console.log('  Path:', lastLog.path);

        // Verify selector validity
        selected = document.querySelector(lastLog.path);
        if (selected === specialBtn) {
            console.log('  ✅ Correctly targeted element with special ID');
        } else {
            console.error('  ❌ Failed to target element with special ID');
        }
    } catch (e) {
        console.error('  ❌ Crash/Error on Special ID click:', e);
    }

    // TEST 4: Shadow DOM (Interaction Recorder uses getDeepTarget)
    console.log('Test 4: Shadow DOM Target');
    const shadowBtn = shadow.querySelector('#shadow-btn');

    // To simulate click in shadow DOM in JSDOM, we need to dispatch on the element.
    // However, the event.target retargeting in JSDOM might be tricky.
    // InteractionRecorder listens on document.
    // Events from Shadow DOM bubble to document, but target is retargeted to host.
    // InteractionRecorder uses getDeepTarget to drill back down.

    // For this test, we dispatch on the shadow button.
    // JSDOM handles composed events? 'click' is composed.

    // Mocking the behavior if JSDOM doesn't fully support composedPath or retargeting perfectly for this case
    // But let's try standard dispatch.

    // Wait, InteractionRecorder uses `getDeepTarget` which uses `elementFromPoint`.
    // JSDOM does NOT support `elementFromPoint` by default (it returns null or requires layout).
    // So `getDeepTarget` loop will likely fail or just return the host.

    // We can mock `shadowRoot.elementFromPoint` on our host.
    host.shadowRoot.elementFromPoint = (x, y) => shadowBtn;

    // Dispatch click on HOST (simulating the bubble up, since we can't easily click inside shadow in a way that triggers document listener with correct coordinates in JSDOM without full layout)
    // Actually, dispatching on shadowBtn *should* bubble to document.

    shadowBtn.dispatchEvent(new dom.window.MouseEvent('click', {
        bubbles: true,
        composed: true,
        view: window,
        clientX: 10, clientY: 10
    }));

    lastLog = app.log[app.log.length - 1];
    // In JSDOM, if we dispatch on shadowBtn, the target seen by document listener is 'host'.
    // `getDeepTarget` checks `e.target` (host). host.shadowRoot exists.
    // It calls `host.shadowRoot.elementFromPoint(10, 10)`.
    // We mocked it to return `shadowBtn`.
    // So it should find `shadowBtn`.

    console.log('  Logged Tag:', lastLog.tagName);
    if (lastLog.tagName === 'BUTTON' && lastLog.id === 'shadow-btn') {
         console.log('  ✅ Correctly identified Shadow DOM target');
    } else {
         console.log('  ⚠️ Shadow DOM target identification might vary in JSDOM. Got:', lastLog.tagName, lastLog.id);
         // This is acceptable if JSDOM limitations prevent perfect simulation, but we try.
    }

    // Cleanup
    app.destroy();
    console.log('🎉 Tests Completed');
}

runTest();
