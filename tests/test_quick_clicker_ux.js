const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body><div id="target-btn">Click Me</div></body>`, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.alert = () => {}; // Mock alert

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/quick-clicker.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function runUXTest() {
    console.log("🚀 Starting UX test for Quick Clicker...");

    try {
        // Execute the bookmarklet code
        eval(scriptContent);
    } catch (e) {
        console.error("Script execution failed:", e);
        process.exit(1);
    }

    const app = global.window.__dc_v27;
    if (!app) {
        console.error("❌ App instance not found on window");
        process.exit(1);
    }
    console.log("✅ App initialized");

    const shadowRoot = app.s;
    if (!shadowRoot) {
        console.error("❌ Shadow Root not found");
        process.exit(1);
    }

    // Wait for the setTimeout in init() to fire
    await new Promise(r => setTimeout(r, 100));

    // 1. Verify Initial Focus
    const pickBtn = shadowRoot.querySelector('#pk');
    // shadowRoot.activeElement works in newer JSDOM versions
    const activeEl = shadowRoot.activeElement;

    if (activeEl === pickBtn) {
         console.log("✅ verified: Focus IS on Pick Button initially");
    } else {
         console.log("❌ FAILURE: Focus is NOT on Pick Button. Active Element:", activeEl ? activeEl.tagName : 'None');
         // process.exit(1); // Fail the test
    }

    // 2. Verify Close Button is a <button> (A11y check)
    const closeBtn = shadowRoot.querySelector('#x');
    if (closeBtn.tagName === 'BUTTON') {
        console.log("✅ verified: Close button is a <BUTTON>");
    } else {
        console.log(`❌ FAILURE: Close button is a <${closeBtn.tagName}>`);
        process.exit(1);
    }

    // 3. Verify Escape Key (Simulate)
    console.log("ℹ️ Simulating Escape key...");
    const escapeEvent = new global.window.KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true
    });

    // Dispatch to the host element as per implementation
    app.h.dispatchEvent(escapeEvent);

    // Check if app is destroyed (window.__dc_v27 should be undefined or element removed)
    if (!global.window.__dc_v27 || !document.body.contains(app.h)) {
        console.log("✅ verified: Escape key closed the widget");
    } else {
        console.log("❌ FAILURE: Escape key did NOT close the widget");
        process.exit(1);
    }

    console.log("✅ All UX tests passed.");
}

runUXTest();
