const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runTest() {
    console.log("🚀 Starting runtime verification for Macro Builder...");

    // Setup JSDOM
    const dom = new JSDOM(`<!DOCTYPE html><body>
        <div id="test-container">
            <button id="target-btn">Click Me</button>
            <input id="input-field" type="text" />
            <button id="presence-btn" class="presence-available" aria-label="Available">Available</button>
            <div id="shadow-host"></div>
        </div>
    </body>`, {
        url: "http://localhost/",
        pretendToBeVisual: true,
        runScripts: "dangerously",
        resources: "usable"
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
    global.Event = dom.window.Event;
    global.MouseEvent = dom.window.MouseEvent;
    global.KeyboardEvent = dom.window.KeyboardEvent;

    // Mock Wake Lock
    global.navigator.wakeLock = {
        request: async () => ({ release: async () => {} })
    };

    // Mock alert/confirm/prompt
    global.alert = (msg) => { console.log("Alert:", msg); };
    global.confirm = () => true;
    global.prompt = () => "Test Input";

    // Track interactions
    let clickCount = 0;
    let inputValue = "";

    const btn = document.getElementById('target-btn');
    btn.addEventListener('click', () => {
        clickCount++;
        console.log("Button clicked!");
    });

    const input = document.getElementById('input-field');
    input.addEventListener('input', (e) => {
        inputValue = e.target.value;
        console.log("Input changed:", inputValue);
    });

    // Load Utils Script
    const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    try {
        eval(utilsContent);
    } catch (e) {
        console.error("Utils script execution failed:", e);
        process.exit(1);
    }
    // Ensure BookmarkletUtils is available globally for the builder script
    global.BookmarkletUtils = global.window.BookmarkletUtils;

    // Load Builder Script
    const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const scriptPath = path.join(__dirname, '../bookmarklets/macro-builder.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Execute Builder to get the App instance
    try {
        eval(utilsContent);
        if (window.BookmarkletUtils) { global.BookmarkletUtils = window.BookmarkletUtils; }
        eval(scriptContent);
    } catch (e) {
        console.error("Builder script execution failed:", e);
        process.exit(1);
    }

    const app = global.window.__mb_v22;
    if (!app) {
        console.error("❌ App instance not found");
        process.exit(1);
    }

    // Programmatically add steps
    // Step 1: Click Button
    app.steps.push({
        actions: [{ sel: '#target-btn', txt: 'Click Me', val: null }],
        delay: 0.1 // minimal delay for test speed
    });

    // Step 2: Type in Input
    app.steps.push({
        actions: [{ sel: '#input-field', txt: '', val: "Hello World" }],
        delay: 0.1
    });

    // Generate Runtime Code
    console.log("Compiling macro...");
    app.compile();

    // Extract code from export link
    const link = app.s.querySelector('#lnk');
    const href = link.href;
    let code = decodeURIComponent(href.replace('javascript:', ''));

    // PATCH 1: Accelerate time for testing
    const originalWait = /const wait\s*=\s*ms\s*=>\s*new\s*Promise\s*\(\s*r\s*=>\s*setTimeout\s*\(\s*r\s*,\s*ms\s*\)\s*\);/;
    code = code.replace(
        originalWait,
        'const wait = ms => new Promise(r => setTimeout(r, 10));'
    );

    // PATCH 2: Remove offsetParent check (JSDOM doesn't support layout, so offsetParent is always null)
    // Original: if(el && el.isConnected && el.offsetParent !== null) return el;
    // We replace it to just check isConnected
    code = code.replace(
        '&& el.offsetParent !== null',
        ''
    );

    // PATCH 3: Ensure ensureTopLevel doesn't block (it has hardcoded waits)
    // It calls wait(1000). Our wait patch handles this.

    console.log("✅ Code patched for test environment");

    // Clean up Builder before running Runtime (simulating new bookmarklet launch)
    app.destroy();

    // Execute Generated Runtime Code
    console.log("🚀 Executing generated runtime code...");

    // We need to wait for the async runtime to complete.
    // The runtime is an IIFE: (async function(){ ... })();
    // However, eval returns the result of the expression.
    // Since it's an IIFE that returns a Promise (async function), eval should return that Promise.

    try {
        await eval(code);

        // The runtime code finishes when it destroys itself.
        // We can wait a bit to ensure all async operations completed.
        // With patched wait, it should be very fast.
        await new Promise(r => setTimeout(r, 500));

    } catch (e) {
        console.error("Runtime execution failed:", e);
        process.exit(1);
    }

    // Verification
    console.log("Verifying results...");

    if (clickCount !== 1) {
        console.error(`❌ Click count mismatch. Expected 1, got ${clickCount}`);
        process.exit(1);
    }

    if (inputValue !== "Hello World") {
        console.error(`❌ Input value mismatch. Expected 'Hello World', got '${inputValue}'`);
        process.exit(1);
    }

    console.log("✅ Runtime behavior verified");
    console.log("🎉 All tests passed!");
}

runTest();
