const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/delayed-clicker.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Minimal Async Test Runner
const tests = [];

function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    for (const test of tests) {
        try {
            await test.fn();
            console.log(`  ✅ ${test.name}`);
        } catch (e) {
            console.error(`  ❌ ${test.name}:`);
            console.error(`     ${e.message.replace(/\n/g, '\n     ')}`);
            process.exitCode = 1;
            // Stop on first failure? Or continue? Usually continue but for sequential state dependency, stop might be better.
            // Let's continue but mark failure.
        }
    }
}

// Create JSDOM
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <button id="target-btn">Click Me!</button>
</body>
`, { url: "http://localhost/" });

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;

// Spy on addEventListener
const originalAddEventListener = document.addEventListener;
let clickListener = null;

document.addEventListener = function(type, listener, options) {
    if (type === 'click' && options === true) { // capture
        clickListener = listener;
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// Evaluate script
try {
    eval(scriptCode);
} catch (e) {
    console.error("Error evaluating delayed-clicker.js:", e);
    process.exitCode = 1;
}

// Helper to access Shadow DOM internals
function getShadowRoot() {
    return window.dc_running.s;
}

describe('Delayed Clicker Bookmarklet', () => {

    it('should initialize correctly', async () => {
        const app = window.dc_running;
        assert.ok(app, "App instance should be created on window");
        assert.ok(app.h, "Container element should exist");
        assert.ok(app.s, "Shadow root should exist");
        assert.strictEqual(app.h.style.display, 'block', "UI should be visible initially");
    });

    it('should select a target element', async () => {
        const app = window.dc_running;
        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pk');

        // Click 'Pick Target'
        pickBtn.click();
        assert.strictEqual(app.h.style.display, 'none', "UI should hide during picking");

        const targetBtn = document.getElementById('target-btn');

        // Simulate capture click manually
        if (clickListener) {
            const mockEvent = {
                target: targetBtn,
                preventDefault: () => {},
                stopPropagation: () => {},
                stopImmediatePropagation: () => {}
            };
            clickListener(mockEvent);
        } else {
            throw new Error("Click listener not captured!");
        }

        // Verify target selection
        assert.strictEqual(app.el, targetBtn, "Target element should be stored");
        assert.strictEqual(app.h.style.display, 'block', "UI should reappear after selection");
        // Use innerText as verified in previous manual run
        assert.ok(pickBtn.innerText.includes('BUTTON'), "Button text should update with tag name");
    });

    it('should execute click after timer', async () => {
        const shadow = getShadowRoot();
        const startBtn = shadow.querySelector('#go');
        const delayInput = shadow.querySelector('#mn');
        const targetBtn = document.getElementById('target-btn');

        // Set very short delay (0.001 mins -> 60ms)
        delayInput.value = '0.001';

        let clicked = false;
        targetBtn.addEventListener('click', () => {
            clicked = true;
        });

        // Start Timer
        startBtn.click();

        // Verify UI updates
        const p1 = shadow.querySelector('#p1');
        const p2 = shadow.querySelector('#p2');
        assert.ok(p1.classList.contains('hd'), "Panel 1 should be hidden");
        assert.ok(!p2.classList.contains('hd'), "Panel 2 should be visible");

        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 1500));

        assert.ok(clicked, "Target button should have been clicked");
        assert.strictEqual(shadow.querySelector('#cd').innerText, 'DONE', "Timer display should show DONE");

        // Cleanup
        if (window.dc_running.tm) clearInterval(window.dc_running.tm);
        if (window.dc_running.h) window.dc_running.h.remove();
    });

});

// Run tests
runTests().catch(e => {
    console.error("Test runner failed:", e);
    process.exitCode = 1;
});
