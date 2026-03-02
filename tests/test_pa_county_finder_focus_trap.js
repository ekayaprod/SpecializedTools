const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body><button id="trigger">Trigger</button></body>`, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;
global.Text = dom.window.Text;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.MouseEvent = dom.window.MouseEvent;

// Load utils first
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);
global.BookmarkletUtils = window.BookmarkletUtils;

// Load script natively
const { initUI } = require('../bookmarklets/pa-county-finder.js');

async function runFocusTrapTest() {
    console.log('🚀 Starting Focus Trap test for PA County Finder...');
    let passed = true;

    try {
        // Mock getSelection
        global.window.getSelection = () => ({ toString: () => '' });

        // Run the script natively
        initUI();

        const overlay = document.querySelector('.pa-overlay');
        if (!overlay) throw new Error('Overlay (.pa-overlay) not created');

        const card = overlay.querySelector('.pa-card');
        if (!card) throw new Error('Card (.pa-card) not created');

        // Find focusable elements
        const focusable = card.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length < 2) {
             throw new Error('Not enough focusable elements to test focus trap');
        }

        const first = /** @type {HTMLElement} */ (focusable[0]);
        const last = /** @type {HTMLElement} */ (focusable[focusable.length - 1]);

        console.log(`Focusable elements: ${focusable.length}`);

        // --- Test 1: Tab from Last Element ---
        console.log('\n--- Test 1: Tab from Last Element ---');

        // Focus the last element
        last.focus();
        if (document.activeElement !== last) {
             throw new Error('Could not focus the last element');
        }

        // Simulate Tab key press
        const tabEvent = new global.window.KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
            shiftKey: false
        });

        document.dispatchEvent(tabEvent);

        // Verify focus moved to the first element
        if (document.activeElement !== first) {
            throw new Error('Focus did not cycle back to the first element');
        }
        console.log('✅ Focus cycled to first element successfully');

        // --- Test 2: Shift+Tab from First Element ---
        console.log('\n--- Test 2: Shift+Tab from First Element ---');

        // Focus the first element (it should already be focused, but let's be sure)
        first.focus();
        if (document.activeElement !== first) {
            throw new Error('Could not focus the first element');
        }

        // Simulate Shift+Tab key press
        const shiftTabEvent = new global.window.KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
            shiftKey: true
        });

        document.dispatchEvent(shiftTabEvent);

        // Verify focus moved to the last element
        if (document.activeElement !== last) {
            throw new Error('Focus did not cycle back to the last element');
        }
        console.log('✅ Focus cycled to last element successfully (Shift+Tab)');

        // --- Test 3: Normal Tab ---
        console.log('\n--- Test 3: Normal Tab inside ---');

        first.focus();
        const tabEvent2 = new global.window.KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
            shiftKey: false
        });
        document.dispatchEvent(tabEvent2);

        // Focus should not be intercepted if not on the boundary
        if (document.activeElement !== first) {
            throw new Error('Normal tab was intercepted incorrectly');
        }
        console.log('✅ Normal tab inside not intercepted');

        // Clean up
        overlay.remove();

    } catch (e) {
        console.error('❌ Test Failed:', e);
        passed = false;
        process.exit(1);
    }

    if (passed) console.log('\n✨ All Focus Trap tests passed!');
}

runFocusTrapTest();
