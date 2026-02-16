const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body><button id="trigger">Trigger</button></body>`, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
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

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/pa-county-finder.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Strip module.exports check to force UI execution
scriptContent = scriptContent.replace(
    /if\s*\(\s*typeof\s*module\s*!==\s*'undefined'\s*&&\s*module\.exports\s*\)\s*\{[\s\S]*?return;\s*\}/,
    "if (false) {}"
);

async function runUITest() {
    console.log("🚀 Starting UI test for PA County Finder...");
    let passed = true;

    try {
        // --- Test 1: Initialization & A11y Attributes ---
        console.log("\n--- Test 1: Initialization & A11y Attributes ---");

        // Mock getSelection
        global.window.getSelection = () => ({ toString: () => "" });

        // Set initial focus
        const trigger = document.getElementById('trigger');
        trigger.focus();

        // Mock focus on trigger to verify return
        let triggerFocused = false;
        trigger.focus = () => { triggerFocused = true; };

        // Run the script
        eval(scriptContent);

        const overlay = document.querySelector('.pa-overlay');
        if (!overlay) throw new Error("Overlay (.pa-overlay) not created");

        // Check A11y
        if (overlay.getAttribute('role') !== 'dialog') throw new Error("Overlay missing role='dialog'");
        if (overlay.getAttribute('aria-modal') !== 'true') throw new Error("Overlay missing aria-modal='true'");
        console.log("✅ A11y attributes verified");

        const card = overlay.querySelector('.pa-card');
        if (!card) throw new Error("Card (.pa-card) not created");
        console.log("✅ Card created with correct class");

        // --- Test 2: Search Interaction (Visuals) ---
        console.log("\n--- Test 2: Search Interaction ---");

        const input = card.querySelector('.pa-input');
        const searchBtn = card.querySelector('.pa-btn-primary');

        input.value = "17301";
        searchBtn.click();

        const resultDiv = card.querySelector('#pa-result');
        if (!resultDiv) throw new Error("Result div not found");

        const resultText = resultDiv.textContent;
        if (!resultText.includes("Adams")) throw new Error(`Expected 'Adams' in result, got: ${resultText}`);

        // Check success class
        const successMsg = resultDiv.querySelector('.pa-result-success');
        if (!successMsg) throw new Error("Result missing .pa-result-success class");
        console.log("✅ Search result styled correctly");

        // --- Test 3: Escape Key & Focus Return ---
        console.log("\n--- Test 3: Escape Key & Focus Return ---");

        const escapeEvent = new global.window.KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(escapeEvent);

        if (document.body.contains(overlay)) throw new Error("Overlay still in DOM after Escape");
        console.log("✅ Escape key closed overlay");

        if (!triggerFocused) throw new Error("Focus did not return to trigger element");
        console.log("✅ Focus returned to trigger element");


        // --- Test 4: With Selection & Close Button A11y ---
        console.log("\n--- Test 4: With Selection ---");

        // Mock selection
        global.window.getSelection = () => ({ toString: () => "15222" });

        // Run script again
        eval(scriptContent);

        const overlay2 = document.querySelector('.pa-overlay');
        const closeBtn = overlay2.querySelector('button[aria-label="Close"]');

        if (!closeBtn) throw new Error("Close button missing aria-label='Close'");
        console.log("✅ Close button has aria-label");

        // Clean up
        closeBtn.click();
        if (document.body.contains(overlay2)) throw new Error("Close button failed to close");

    } catch (e) {
        console.error("❌ Test Failed:", e);
        passed = false;
        process.exit(1);
    }

    if (passed) console.log("\n✨ All UI tests passed!");
}

runUITest();
