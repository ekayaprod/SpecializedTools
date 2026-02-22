const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

// Read source code
const scriptPath = path.join(__dirname, '../bookmarklets/delayed-clicker.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Test runner state
const tests = [];
let passed = 0;
let failed = 0;

function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function it(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    for (const test of tests) {
        // Reset DOM before each test
        setupDOM();
        try {
            await test.fn();
            console.log(`  ✅ ${test.name}`);
            passed++;
        } catch (e) {
            console.error(`  ❌ ${test.name}`);
            console.error(`     ${e.message}`);
            failed++;
        } finally {
            // Cleanup after each test
            cleanup();
        }
    }
    console.log(`\n🏁 Results: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

// Global DOM references
let dom;
let window;
let document;

function setupDOM() {
    dom = new JSDOM(
        `<!DOCTYPE html>
        <body>
            <button id="target-1">Target 1</button>
            <button id="target-2">Target 2</button>
            <input id="target-input" type="text" />
        </body>`,
        {
            url: 'http://localhost/',
            runScripts: 'dangerously',
            resources: 'usable',
            pretendToBeVisual: true,
        }
    );

    window = dom.window;
    document = window.document;

    // Polyfills and global exposure
    global.window = window;
    global.document = document;
    global.HTMLElement = window.HTMLElement;
    global.Node = window.Node;
    global.Event = window.Event;
    global.MouseEvent = window.MouseEvent;
    global.KeyboardEvent = window.KeyboardEvent;

    // Execute the bookmarklet code to initialize it
    // The bookmarklet attaches itself to window.dc_running
    eval(scriptCode);
}

function cleanup() {
    if (window.dc_running) {
        window.dc_running.destroy();
    }
}

function getShadowRoot() {
    const host = document.querySelector('div[id^="dc-"]');
    if (!host) throw new Error('Delayed Clicker host element not found');
    return host.shadowRoot;
}

// Define tests
describe('Delayed Clicker Edge Cases', () => {

    it('should validate invalid input (negative/zero) and prevent start', async () => {
        const shadow = getShadowRoot();
        const startBtn = shadow.querySelector('#go');
        const delayInput = shadow.querySelector('#mn');
        const pickBtn = shadow.querySelector('#pick');
        const target = document.getElementById('target-1');

        // Pick element first (prerequisite for start)
        pickBtn.click();
        target.click();
        assert.ok(!startBtn.disabled, 'Start button should be enabled after picking');

        // Test Negative Input
        delayInput.value = '-1';
        startBtn.click();
        assert.ok(!window.dc_running.tm, 'Timer should not start with negative input');

        // Test Zero Input
        delayInput.value = '0';
        startBtn.click();
        assert.ok(!window.dc_running.tm, 'Timer should not start with zero input');

        // Test Empty Input
        delayInput.value = '';
        startBtn.click();
        assert.ok(!window.dc_running.tm, 'Timer should not start with empty input');
    });

    it('should allow cancellation during countdown', async () => {
        const shadow = getShadowRoot();
        const startBtn = shadow.querySelector('#go');
        const delayInput = shadow.querySelector('#mn');
        const pickBtn = shadow.querySelector('#pick');
        const target = document.getElementById('target-1');

        // Setup
        pickBtn.click();
        target.click();
        delayInput.value = '0.1'; // 6 seconds

        // Start
        startBtn.click();
        assert.ok(window.dc_running.tm, 'Timer should be running');

        const p1 = shadow.querySelector('#p1');
        const p2 = shadow.querySelector('#p2');
        assert.ok(p1.classList.contains('hd'), 'Setup panel should be hidden');
        assert.ok(!p2.classList.contains('hd'), 'Countdown panel should be visible');

        // Cancel
        const cancelBtn = shadow.querySelector('#cancel');
        cancelBtn.click();

        assert.ok(!window.dc_running.tm, 'Timer should be cleared after cancel');
        assert.ok(!p1.classList.contains('hd'), 'Setup panel should be visible after cancel');
        assert.ok(p2.classList.contains('hd'), 'Countdown panel should be hidden after cancel');
    });

    it('should allow re-selecting a different element', async () => {
        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pick');
        const target1 = document.getElementById('target-1');
        const target2 = document.getElementById('target-2');
        const label = shadow.querySelector('#picked-label');

        // Pick Target 1
        pickBtn.click();
        target1.click();
        assert.strictEqual(window.dc_running.el, target1, 'Should pick target 1');
        assert.ok(label.innerText.includes('button#target-1'), 'Label should show target 1');

        // Pick Target 2 (Reselect)
        pickBtn.click();
        target2.click();
        assert.strictEqual(window.dc_running.el, target2, 'Should pick target 2');
        assert.ok(label.innerText.includes('button#target-2'), 'Label should show target 2');
    });

    it('should toggle UI visibility when invoked again', async () => {
        const host = document.querySelector('div[id^="dc-"]');
        // Initial style set via cssText includes 'display:block'
        assert.ok(host.style.display === 'block' || host.style.display === '', 'Should be visible initially');

        // Simulate re-invocation
        // The bookmarklet code checks window.dc_running and calls toggle()
        // We can call toggle directly on the instance
        window.dc_running.toggle();
        assert.strictEqual(host.style.display, 'none', 'Should be hidden after toggle');

        window.dc_running.toggle();
        assert.strictEqual(host.style.display, 'block', 'Should be visible after second toggle');
    });

    it('should handle "select" elements correctly (special logic)', async () => {
        // This tests the branch: if (this.el.tagName === 'SELECT')
        // But first we need a select element in our DOM
        const select = document.createElement('select');
        select.id = 'target-select';
        select.innerHTML = '<option value="1">One</option><option value="2">Two</option>';
        document.body.appendChild(select);

        const shadow = getShadowRoot();
        const pickBtn = shadow.querySelector('#pick');
        const startBtn = shadow.querySelector('#go');
        const delayInput = shadow.querySelector('#mn');

        // Pick Select Element
        pickBtn.click();
        select.click();
        assert.strictEqual(window.dc_running.el, select, 'Should pick select element');

        // Start Timer with short delay
        delayInput.value = '0.001'; // ~60ms

        // Listen for change/input events
        let inputEvent = false;
        let changeEvent = false;
        select.addEventListener('input', () => inputEvent = true);
        select.addEventListener('change', () => changeEvent = true);

        startBtn.click();

        // Wait for execution
        await new Promise(resolve => setTimeout(resolve, 1500));

        assert.ok(inputEvent, 'Input event should have fired on select');
        assert.ok(changeEvent, 'Change event should have fired on select');
    });
});

// Run
runTests();
