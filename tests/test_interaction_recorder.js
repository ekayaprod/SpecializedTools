const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body><div id="test-container"><button id="target-btn" class="test-class">Click Me</button></div></body>`, {
    url: "http://localhost/",
    pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;

// Mock URL.createObjectURL and revokeObjectURL
let lastBlob = null;
global.URL = {
    createObjectURL: (blob) => {
        lastBlob = blob;
        return "blob:http://localhost/12345";
    },
    revokeObjectURL: (url) => {
        // no-op
    }
};

// Mock Blob
global.Blob = class Blob {
    constructor(content, options) {
        this.content = content;
        this.options = options;
    }
};

// Mock alert
global.alert = (msg) => {
    console.log("Alert:", msg);
};

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/interaction-recorder.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

async function runTest() {
    console.log("🚀 Starting test for Interaction Recorder...");

    try {
        // Execute the bookmarklet code
        eval(scriptContent);
    } catch (e) {
        console.error("Script execution failed:", e);
        process.exit(1);
    }

    const app = global.window.__ir_v1;
    if (!app) {
        console.error("❌ App instance not found on window");
        process.exit(1);
    }
    console.log("✅ App initialized");

    // Verify UI exists
    const host = app.h;
    if (!host || !document.body.contains(host)) {
        console.error("❌ UI host not found in body");
        console.log("Body content:", document.body.innerHTML);
        process.exit(1);
    }
    if (!host.shadowRoot) {
        console.error("❌ ShadowRoot not found on host");
        process.exit(1);
    }
    console.log("✅ UI injected into DOM");

    const shadow = host.shadowRoot;
    const startBtn = shadow.querySelector('#btn');
    const status = shadow.querySelector('#st');

    if (!startBtn || !status) {
        console.error("❌ UI elements (button/status) not found in Shadow DOM");
        process.exit(1);
    }

    // Test Start Recording
    console.log("Testing Start Recording...");
    startBtn.click();

    if (!app.isRecording) {
        console.error("❌ Failed to start recording");
        process.exit(1);
    }
    if (startBtn.innerText !== 'Stop & Download') {
        console.error("❌ Button text did not update to 'Stop & Download'");
        process.exit(1);
    }
    console.log("✅ Recording started");

    // Test Interaction Logging
    console.log("Testing Click Capture...");
    const targetBtn = document.getElementById('target-btn');

    // Simulate click
    const clickEvent = new dom.window.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    targetBtn.dispatchEvent(clickEvent);

    if (app.log.length !== 1) {
        console.error(`❌ Log length mismatch. Expected 1, got ${app.log.length}`);
        process.exit(1);
    }

    const entry = app.log[0];
    if (entry.tagName !== 'BUTTON' || entry.id !== 'target-btn' || !entry.path.includes('#target-btn')) {
        console.error("❌ Log entry details mismatch:", entry);
        process.exit(1);
    }
    console.log("✅ Click captured correctly");

    // Test Stop & Download
    console.log("Testing Stop & Download...");
    startBtn.click();

    if (app.isRecording) {
        console.error("❌ Failed to stop recording");
        process.exit(1);
    }

    if (!lastBlob) {
        console.error("❌ No blob created for download");
        process.exit(1);
    }

    const blobContent = lastBlob.content[0];
    const parsedLog = JSON.parse(blobContent);

    if (parsedLog.length !== 1 || parsedLog[0].id !== 'target-btn') {
        console.error("❌ Downloaded log content mismatch");
        process.exit(1);
    }
    console.log("✅ Stop & Download verified");

    // Cleanup
    app.destroy();
    if (global.window.__ir_v1) {
        console.error("❌ Failed to destroy instance");
        process.exit(1);
    }
    if (document.body.contains(host)) {
        console.error("❌ Failed to remove UI host");
        process.exit(1);
    }
    console.log("✅ Cleanup verified");

    console.log("🎉 All tests passed!");
}

runTest();
