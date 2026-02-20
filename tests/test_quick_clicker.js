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

// Mock Wake Lock API
global.navigator.wakeLock = {
    request: async () => {
        throw new Error("Wake Lock Denied");
    }
};

// Mock console.warn
const warns = [];
const originalWarn = console.warn;
console.warn = (...args) => {
    warns.push(args);
};

// Load script
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
const scriptPath = path.join(__dirname, '../bookmarklets/quick-clicker.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function runTest() {
    console.log("🚀 Starting reproduction test for Quick Clicker Wake Lock error handling...");

    try {
        // Load utils first
        eval(utilsContent);
        if (window.BookmarkletUtils) { global.BookmarkletUtils = window.BookmarkletUtils; }
        // Execute the bookmarklet code
        // It's an IIFE that assigns window.__dc_v27
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

    try {
        // Simulate start action
        // This triggers the async wakeLock request
        await app.start();
    } catch (e) {
        console.error("start() threw an error (should be caught internally):", e);
    }

    // Check if warning was logged
    const wakeLockWarning = warns.find(args => args[0] && args[0].toString().includes("Wake Lock failed"));

    if (wakeLockWarning) {
        console.log("✅ SUCCESS: Warning was logged:", wakeLockWarning[0]);
        // Cleanup interval if possible, or just force exit
        if (app.iv) clearInterval(app.iv);
        process.exit(0);
    } else {
        console.error("❌ FAILURE: No warning logged for Wake Lock failure.");
        process.exit(1);
    }
}

runTest();
