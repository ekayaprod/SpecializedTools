const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><body><div id="target-btn">Click Me</div></body>`, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.console.error = (msg) => {
    // Only fail on critical errors, not benign warnings
    if (msg.includes('Page has no body')) return;
    process.stderr.write(msg + '\n');
};

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/quick-clicker.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function testFocusManagement() {
    console.log("🚀 Starting Quick Clicker Focus Test...");

    try {
        eval(scriptContent);
    } catch (e) {
        console.error("Script execution failed:", e);
        process.exit(1);
    }

    const app = global.window.__dc_v27;
    const shadowRoot = app.s;

    // Wait for init
    await new Promise(r => setTimeout(r, 100));

    // Mock picking a target
    const target = document.getElementById('target-btn');
    app.state.t1 = target;
    const startBtn = shadowRoot.querySelector('#go');
    startBtn.disabled = false;

    // --- TEST 1: START FOCUS ---
    console.log("👉 [1/2] Clicking Start...");
    startBtn.click();

    // Wait for view switch (needs > 200ms for transition)
    await new Promise(r => setTimeout(r, 300));

    const activeEl = shadowRoot.activeElement;
    const stopBtn = shadowRoot.querySelector('#cn');

    if (activeEl === stopBtn) {
        console.log("✅ Focus moved to Stop button");
    } else {
        console.error(`❌ FOCUS FAIL (Start): Active element is <${activeEl ? activeEl.tagName : 'None'}> (Expected <BUTTON id="cn">)`);
        console.error(`   Active Element ID: ${activeEl ? activeEl.id : 'N/A'}`);
        process.exit(1);
    }

    // --- TEST 2: STOP FOCUS ---
    console.log("👉 [2/2] Clicking Stop...");
    stopBtn.click();

    // Wait for view switch (needs > 200ms for transition)
    await new Promise(r => setTimeout(r, 300));

    const newActiveEl = shadowRoot.activeElement;
    // Should focus back to Start or Pick button
    if (newActiveEl === startBtn || newActiveEl.id === 'pk') {
        console.log("✅ Focus returned to Start/Pick button");
    } else {
        console.error(`❌ FOCUS FAIL (Stop): Active element is <${newActiveEl ? newActiveEl.tagName : 'None'}> (Expected Start/Pick button)`);
        console.error(`   Active Element ID: ${newActiveEl ? newActiveEl.id : 'N/A'}`);
        process.exit(1);
    }

    console.log("🎉 All focus tests passed!");
    process.exit(0);
}

testFocusManagement().catch(e => {
    console.error("Test Crashed:", e);
    process.exit(1);
});
