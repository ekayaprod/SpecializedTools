const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body><div id="mn">1</div><div id="toast"></div></body>`, {
    url: "http://localhost/",
    pretendToBeVisual: true
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;

// Mock Wake Lock API
global.navigator.wakeLock = {
    request: async () => {
        throw new Error("Wake Lock Denied");
    }
};

// Mock console.warn
const warns = [];
console.warn = (...args) => {
    warns.push(args);
};

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/quick-clicker.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function runTest() {
    console.log("🚀 Starting verification test for Quick Clicker Wake Lock UI feedback...");

    try {
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

    // Spy on showToast
    let toastCalls = [];
    const originalShowToast = app.showToast;
    app.showToast = (msg, type) => {
        console.log(`Toast called: ${msg} (${type})`);
        toastCalls.push({msg, type});
    };

    // Simulate start action
    // Input setup
    const mn = app.q('#mn');
    if(mn) mn.value = "1"; // 1 min

    try {
        await app.start();
    } catch (e) {
        console.error("start() threw:", e);
    }

    // Check if error toast was shown
    const errorToast = toastCalls.find(t => t.type === 'error' && (t.msg.includes('Wake Lock') || t.msg.includes('No Sleep')));

    if (errorToast) {
        console.log("✅ SUCCESS: Error toast was shown:", errorToast.msg);
        if (app.iv) clearInterval(app.iv);
        process.exit(0);
    } else {
        console.error("❌ FAILURE: No error toast shown for Wake Lock failure.");
        console.log("Toast calls:", toastCalls);
        console.log("Console warns:", warns);
        if (app.iv) clearInterval(app.iv);
        process.exit(1);
    }
}

runTest();
