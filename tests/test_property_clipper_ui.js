const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create JSDOM
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <script id="__NEXT_DATA__" type="application/json">
    {
        "props": {
            "pageProps": {
                "initialReduxState": {
                    "propertyDetails": {
                        "location": {
                            "address": { "line": "123 Test St", "city": "TestCity", "state_code": "TS", "postal_code": "12345" }
                        },
                        "list_price": 500000,
                        "description": { "text": "Test Desc" },
                        "photos": [],
                        "augmented_gallery": [
                            {
                                "category": "Living Room",
                                "photos": [
                                    {"href": "http://example.com/lr1.jpg"},
                                    {"href": "http://example.com/lr2.jpg"}
                                ]
                            }
                        ]
                    }
                }
            }
        }
    }
    </script>
</body>
`, {
    url: "https://www.realtor.com/realestateandhomes-detail/123-Test-St_TestCity_TS_12345",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.FileReader = dom.window.FileReader;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.window.alert = console.log;

// Mock Utils
try {
    eval(utilsCode);
    global.BookmarkletUtils = window.BookmarkletUtils;
} catch (e) {
    console.error("Utils eval failed", e);
    process.exit(1);
}

// Mock Image
class MockImage {
    constructor() {
        this.onload = null;
        this.src = '';
        setTimeout(() => { if (this.onload) this.onload(); }, 1);
    }
}
global.window.Image = MockImage;

// Run Bookmarklet
try {
    eval(scriptCode);
} catch (e) {
    console.error("Bookmarklet eval failed", e);
    process.exit(1);
}

async function runTest() {
    console.log("Starting Property Clipper UI Test...");

    // 1. Open Modal
    const modal = document.getElementById('pc-pdf-modal');
    assert.ok(modal, "Modal should exist");

    // 2. Click any Persona (e.g. STR)
    const buttons = Array.from(modal.querySelectorAll('button'));
    const strBtn = buttons.find(b => b.textContent.includes('Short-Term Rental'));
    assert.ok(strBtn, "Short-Term Rental button should exist");
    strBtn.click();

    // Wait for Start Screen
    await new Promise(r => setTimeout(r, 100));

    // 3. Click 'Manual Selection'
    // Find the box that says "Manual Selection" and has pointer cursor (the wrapper)
    const divs = Array.from(modal.querySelectorAll('div'));
    const manualDiv = divs.find(d => d.textContent.includes('Manual Selection') && d.style.cursor === 'pointer');

    if (!manualDiv) {
        console.error("Could not find Manual Selection box with pointer cursor. Available divs:", divs.map(d => d.textContent));
    }
    assert.ok(manualDiv, "Manual Selection option should exist");

    console.log("Clicking Manual Selection...");
    manualDiv.click();

    // Wait for Step 1
    await new Promise(r => setTimeout(r, 100));

    // 4. Verify Checkbox Type
    const inputs = Array.from(modal.querySelectorAll('input'));
    const checkbox = inputs[0];
    assert.ok(checkbox, "Should have an input element");
    assert.strictEqual(checkbox.type, 'checkbox', "Input should be of type 'checkbox'");
    console.log("✅ Checkbox type is correct.");

    // 5. Test Select All
    const toolbarBtns = Array.from(modal.querySelectorAll('button'));
    const selectAllBtn = toolbarBtns.find(b => b.textContent === 'Select All');
    assert.ok(selectAllBtn, "Select All button should exist");

    try {
        selectAllBtn.click();
        console.log("✅ Select All clicked without error.");
    } catch (e) {
        assert.fail(`Select All threw error: ${e.message}`);
    }

    // Verify UI State after Select All
    assert.strictEqual(checkbox.checked, true, "Checkbox should be checked after Select All");

    // We can't easily access the image element here directly as it's not exposed,
    // but we can check if any img has the border style.
    const imgs = Array.from(modal.querySelectorAll('img'));
    const blueBorderImg = imgs.find(img => img.style.borderColor === 'rgb(37, 99, 235)' || img.style.borderColor === '#2563eb');
    assert.ok(blueBorderImg, "Image should have blue border after Select All");
    console.log("✅ Image border verified.");

    console.log("Property Clipper UI Test Passed!");
}

runTest().catch(e => {
    console.error("Test Failed:", e);
    process.exit(1);
});
