const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runTest() {
    console.log('🚀 Starting test for Macro Builder...');

    // Setup JSDOM
    const dom = new JSDOM(
        `<!DOCTYPE html><body>
        <div id="test-container">
            <button id="target-btn">Click Me</button>
            <input id="input-field" type="text" />
            <button id="presence-btn" class="presence-available" aria-label="Available">Available</button>
        </div>
    </body>`,
        {
            url: 'http://localhost/',
            pretendToBeVisual: true,
        }
    );

    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
    global.Event = dom.window.Event;
    global.MouseEvent = dom.window.MouseEvent;
    global.KeyboardEvent = dom.window.KeyboardEvent;

    // Mocks
    global.alert = (msg) => {
        console.log('Alert:', msg);
    };

    // Smart Confirm Mock to handle the flow
    // 1. "Starting new sequence" -> True
    // 2. "Press Enter after typing?" -> True
    // 3. "Element added! Pick another...?" -> False (to finish sequence)
    // 4. "Is this sensitive data?" -> False (to allow testing value)
    global.confirm = (msg) => {
        // console.log("Confirm:", msg);
        if (msg.includes('Pick another')) return false;
        if (msg.includes('Sensitive?')) return false;
        return true;
    };

    global.prompt = (msg) => {
        // console.log("Prompt:", msg);
        return 'Test Input';
    };

    // Load and execute script
    const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const scriptPath = path.join(__dirname, '../bookmarklets/macro-builder.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    try {
        eval(utilsContent);
        if (window.BookmarkletUtils) {
            global.BookmarkletUtils = window.BookmarkletUtils;
        }
        eval(scriptContent);
    } catch (e) {
        console.error('Script execution failed:', e);
        process.exit(1);
    }

    const app = global.window.__mb_v22;
    if (!app) {
        console.error('❌ App instance not found on window');
        process.exit(1);
    }
    console.log('✅ App initialized');

    // Verify UI exists
    const host = app.h;
    if (!host || !document.body.contains(host)) {
        console.error('❌ UI host not found in body');
        process.exit(1);
    }
    const shadow = host.shadowRoot;
    const addBtn = shadow.querySelector('#add');
    const expBtn = shadow.querySelector('#exp');

    if (!addBtn || !expBtn) {
        console.error('❌ UI buttons (Add/Export) not found in Shadow DOM');
        process.exit(1);
    }

    // Test Selector Logic
    console.log('Testing Selector Logic...');
    const targetBtn = document.getElementById('target-btn');
    const sel1 = app.getSel(targetBtn);
    if (sel1 !== '#target-btn') {
        console.error(`❌ Selector mismatch for ID. Expected '#target-btn', got '${sel1}'`);
        process.exit(1);
    }
    console.log('✅ Selector logic verified');

    // Test Recording Flow
    console.log('Testing Recording Flow...');

    // Click "Add Click Sequence"
    addBtn.click();

    // Pick Element: Input Field
    const inputField = document.getElementById('input-field');

    // Mock getBoundingClientRect for target to ensure it passes checks
    inputField.getBoundingClientRect = () => ({
        top: 10,
        left: 10,
        width: 100,
        height: 20,
        bottom: 30,
        right: 110,
        x: 10,
        y: 10,
    });

    // Simulate click on input field to pick it
    // The bookmarklet adds a capturing click listener to document
    // We dispatch a click on the element, which bubbles up to document
    const clickEvent = new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: 15,
        clientY: 15,
    });

    // Dispatching on target. JSDOM capture phase support is good.
    inputField.dispatchEvent(clickEvent);

    // Verify Preview Dialog appears
    const preview = shadow.querySelector('#preview');
    if (preview.classList.contains('hidden')) {
        console.error('❌ Preview dialog did not appear after picking element');
        process.exit(1);
    }

    const prevTag = shadow.querySelector('#prev_tag').innerText;
    if (prevTag !== 'INPUT') {
        console.error(`❌ Preview tag mismatch. Expected 'INPUT', got '${prevTag}'`);
        process.exit(1);
    }
    console.log('✅ Element picked and preview shown');

    // Confirm Selection in Preview
    const confirmBtn = shadow.querySelector('#prev_yes');

    // This click triggers logic that calls prompt() then confirm()
    confirmBtn.click();

    // Wait for the async/setTimeout logic in macro-builder to process
    // The code uses setTimeout(..., 100)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify step was added
    if (app.steps.length !== 1) {
        console.error(`❌ Steps length mismatch. Expected 1, got ${app.steps.length}`);
        process.exit(1);
    }

    const step = app.steps[0];
    if (step.actions.length !== 1) {
        console.error(`❌ Actions length mismatch. Expected 1, got ${step.actions.length}`);
        process.exit(1);
    }

    const action = step.actions[0];
    if (action.val !== 'Test Input') {
        console.error(`❌ Action value mismatch. Expected 'Test Input', got '${action.val}'`);
        process.exit(1);
    }

    console.log('✅ Sequence recording verified');

    // Test Export
    console.log('Testing Export...');
    expBtn.click();

    const outArea = shadow.querySelector('#out');
    if (outArea.style.display === 'none') {
        console.error('❌ Export area not shown');
        process.exit(1);
    }

    const link = shadow.querySelector('#lnk');
    const href = link.href;

    if (!href.startsWith('javascript:')) {
        console.error("❌ Export link does not start with 'javascript:'");
        process.exit(1);
    }

    const decoded = decodeURIComponent(href);
    if (!decoded.includes('Test Input')) {
        console.error('❌ Exported code missing recorded input');
        process.exit(1);
    }

    // Check if generated code contains necessary parts
    if (!decoded.includes('class MacroRuntime')) {
        console.error('❌ Exported code missing MacroRuntime class');
        process.exit(1);
    }

    console.log('✅ Export function verified');

    // Cleanup
    app.destroy();
    if (global.window.__mb_v22) {
        console.error('❌ Failed to destroy instance');
        process.exit(1);
    }
    if (document.body.contains(host)) {
        console.error('❌ UI host still in body');
        process.exit(1);
    }
    console.log('✅ Cleanup verified');

    console.log('🎉 All tests passed!');
}

runTest();
