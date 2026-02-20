const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
    url: "http://localhost/",
    pretendToBeVisual: true
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock Wake Lock API to fail
global.navigator.wakeLock = {
    request: async () => {
        throw new Error("Wake Lock Denied by System");
    }
};

// Mock console.warn to suppress noise (optional, but good practice)
console.warn = () => {};

// Load script
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
const scriptPath = path.join(__dirname, '../bookmarklets/quick-clicker.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function runTest() {
    console.log("🚀 Starting verification test for Quick Clicker Wake Lock Error Toast...");

    try {
        eval(utilsContent);
        if (window.BookmarkletUtils) { global.BookmarkletUtils = window.BookmarkletUtils; }
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

    // Start logic
    try {
        // We need to set a valid time first so it proceeds to wake lock request
        // Default is 30 mins, so it should be fine.
        // Also need to enable the 'Start' button or just call start() directly.
        // start() checks inputs.

        // Let's ensure inputs are present and valid in the DOM (Shadow DOM)
        // The constructor creates the UI.

        await app.start();

        // Since start() is async and handles the error internally, we await it.
        // After await, the toast should have been updated.

    } catch (e) {
        console.error("start() threw an unexpected error:", e);
        process.exit(1);
    }

    // Verify Toast in Shadow DOM
    const toast = app.s.querySelector('#toast');
    if (!toast) {
        console.error("❌ Toast element not found in Shadow DOM");
        process.exit(1);
    }

    const text = toast.innerText;
    const classes = toast.className;

    console.log(`Toast Text: "${text}"`);
    console.log(`Toast Classes: "${classes}"`);

    const hasErrorClass = classes.includes('error');
    const isVisible = classes.includes('visible');
    const hasCorrectText = text.includes('Wake Lock Failed');

    if (hasErrorClass && isVisible && hasCorrectText) {
        console.log("✅ SUCCESS: Error toast displayed correctly.");

        // Cleanup
        if (app.iv) clearInterval(app.iv);
        app.destroy();
        process.exit(0);
    } else {
        console.error("❌ FAILURE: Toast state incorrect.");
        if (!hasErrorClass) console.error("   - Missing 'error' class");
        if (!isVisible) console.error("   - Missing 'visible' class");
        if (!hasCorrectText) console.error("   - Incorrect text");
        process.exit(1);
    }
}

runTest();
