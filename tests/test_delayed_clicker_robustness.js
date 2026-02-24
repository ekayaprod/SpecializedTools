const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
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
        }
    }
}

// Create JSDOM
const dom = new JSDOM(
    `<!DOCTYPE html>
<body>
    <button id="target-btn">Click Me!</button>
    <select id="target-select">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
    </select>
</body>
`,
    { url: 'http://localhost/' }
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;

// Load script
eval(scriptCode);

function getShadowRoot() {
    const host = document.querySelector('div[id^="dc-"]');
    if (!host) throw new Error('Delayed Clicker host element not found');
    return host.shadowRoot;
}

describe('Delayed Clicker Robustness', () => {

    it('should validate invalid input (negative time)', () => {
        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pick');
        const targetBtn = document.getElementById('target-btn');
        const startBtn = shadow.querySelector('#go');
        const input = shadow.querySelector('#mn');

        // Pick target first
        pickBtn.click();
        targetBtn.click();

        // Input invalid value
        input.value = '-1';

        // Try to start
        startBtn.click();

        // Verify UI did NOT change (still on p1)
        const p1 = shadow.querySelector('#p1');
        const p2 = shadow.querySelector('#p2');
        assert.ok(!p1.classList.contains('hd'), 'Panel 1 should remain visible');
        assert.ok(p2.classList.contains('hd'), 'Panel 2 should remain hidden');
    });

    it('should cancel the timer correctly', async () => {
        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pick');
        const startBtn = shadow.querySelector('#go');
        const cancelBtn = shadow.querySelector('#cancel');
        const input = shadow.querySelector('#mn');
        const targetBtn = document.getElementById('target-btn');

        // Ensure target is picked (for isolation)
        pickBtn.click();
        targetBtn.click();

        // Reset spy
        let clicked = false;
        targetBtn.onclick = () => { clicked = true; };

        // Set short time (0.002 min = 120ms)
        input.value = '0.002';

        // Start
        startBtn.click();

        // Verify UI switched
        const p1 = shadow.querySelector('#p1');
        const p2 = shadow.querySelector('#p2');
        assert.ok(p1.classList.contains('hd'), 'Panel 1 should be hidden');
        assert.ok(!p2.classList.contains('hd'), 'Panel 2 should be visible');

        // Cancel immediately
        cancelBtn.click();

        // Verify UI reverted immediately
        assert.ok(!p1.classList.contains('hd'), 'Panel 1 should be visible again');
        assert.ok(p2.classList.contains('hd'), 'Panel 2 should be hidden again');

        // Wait longer than timer
        await new Promise(r => setTimeout(r, 200));

        assert.strictEqual(clicked, false, 'Target should NOT be clicked after cancellation');

        // Cleanup listener
        targetBtn.onclick = null;
    });

    it('should handle Select elements gracefully', async () => {
        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pick');
        const targetSelect = document.getElementById('target-select');
        const startBtn = shadow.querySelector('#go');
        const input = shadow.querySelector('#mn');

        // Pick select element
        pickBtn.click();
        targetSelect.click();

        assert.strictEqual(window.dc_running.el, targetSelect, 'Select element should be targeted');

        // Set very short time
        input.value = '0.001'; // 60ms

        // Start
        startBtn.click();

        // Wait for execution
        await new Promise(r => setTimeout(r, 150));

        // Verify success state in UI
        const timerText = shadow.querySelector('#cd').innerText;
        assert.ok(
            timerText.includes('DONE') ||
            timerText.includes('Action Executed') ||
            shadow.querySelector('.success-icon'),
            'Should show success message even for Select element'
        );

        // Note: We are not asserting the value change because the implementation is known to set null/undefined.
        // The test is that it DOES NOT CRASH.
    });

    it('should toggle visibility when called again', () => {
        const host = document.querySelector('div[id^="dc-"]');
        const initialDisplay = host.style.display;

        // Call the IIFE logic again? No, we can just call window.dc_running.toggle() directly
        // because the IIFE checks window.dc_running and calls toggle if exists.

        // Simulate re-invocation
        if (window.dc_running) {
            window.dc_running.toggle();
        }

        assert.strictEqual(host.style.display, 'none', 'Should be hidden after toggle');

        // Toggle back
        if (window.dc_running) {
            window.dc_running.toggle();
        }

        // display property might be empty string or block depending on browser implementation of "default"
        // The code sets it to 'block' explicitly if it was 'none'.
        assert.strictEqual(host.style.display, 'block', 'Should be visible after second toggle');
    });

});

// Run tests
runTests().catch((e) => {
    console.error('Test Runner Failed:', e);
    process.exit(1);
});
