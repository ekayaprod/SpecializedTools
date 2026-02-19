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

// Load script
eval(scriptCode);

function getShadowRoot() {
    const host = document.querySelector('div[id^="dc-"]');
    if (!host) throw new Error("Delayed Clicker host element not found");
    return host.shadowRoot;
}

describe('Delayed Clicker UX & Logic', () => {

    it('should inject UI into shadow DOM', () => {
        const shadow = getShadowRoot();
        assert.ok(shadow.querySelector('#p1'), "Setup panel should exist");
        assert.ok(shadow.querySelector('#p2'), "Timer panel should exist");
        assert.ok(shadow.querySelector('#pick'), "Pick button should exist");
    });

    it('should allow element picking', () => {
        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pick');
        const targetBtn = document.getElementById('target-btn');
        const goBtn = shadow.querySelector('#go');

        assert.ok(goBtn.disabled, "Start button should be disabled initially");

        // Click pick
        pickBtn.click();
        
        // Simulate click on target
        targetBtn.click();

        assert.strictEqual(window.dc_running.el, targetBtn, "Target should be stored");
        assert.ok(!goBtn.disabled, "Start button should be enabled after picking");
        assert.ok(shadow.querySelector('#picked-label').innerText.includes('button'), "Label should update");
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

        // Wait for execution (buffer for animation + timer)
        await new Promise(resolve => setTimeout(resolve, 1500));

        assert.ok(clicked, "Target button should have been clicked");
        
        // Check for 'DONE' text (now inside a hidden span or part of success UI)
        const timerText = shadow.querySelector('#cd').innerText;
        assert.ok(timerText.includes('DONE') || timerText.includes('Action Executed') || shadow.querySelector('.success-icon'), 
            "Timer display should show success state");

        // Cleanup
        if (window.dc_running.tm) clearInterval(window.dc_running.tm);
        if (window.dc_running.h) window.dc_running.h.remove();
    });

});

// Run tests
runTests().catch(e => {
    console.error("Test Runner Failed:", e);
    process.exit(1);
});
