const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
const promptsPath = path.join(__dirname, '../bookmarklets/property-clipper-prompts.js');
const promptsCode = fs.readFileSync(promptsPath, 'utf8');
const corePath = path.join(__dirname, '../bookmarklets/property-clipper-core.js');
const coreCode = fs.readFileSync(corePath, 'utf8');
const pdfPath = path.join(__dirname, '../bookmarklets/property-clipper-pdf.js');
const pdfCode = fs.readFileSync(pdfPath, 'utf8');

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
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

// Mock Utils
try {
    eval(utilsCode);
    global.BookmarkletUtils = window.BookmarkletUtils;
} catch (e) {
    console.error("Utils eval failed", e);
    process.exit(1);
}

// Mock Prompts
try {
    // Manually resolve @include_text directives for testing if needed,
    // but for UI test we might not need prompts content, just the object.
    // However, prompts.js defines window.BookmarkletUtils.Prompts.
    // Let's do a simple eval. If it fails due to unresolved directives in comments,
    // we might need the complex loader.
    // property-clipper-prompts.js content is just an object assignment usually.
    // But it uses `/* @include_text ... */` inside backticks.
    // If we eval it raw, it might work if JS engine ignores comments inside backticks?
    // No, comments inside backticks are part of the string.
    // So `const x = `/* comment */`;` is valid string content.
    // So simple eval should work for loading the structure.
    eval(promptsCode);
} catch (e) {
    console.error("Prompts eval failed", e);
    // If simple eval fails, we might need the full loader, but let's try.
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
    eval(coreCode);
    eval(pdfCode);
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

    // 2. Click Generate PDF to open Wizard
    const buttons = Array.from(modal.querySelectorAll('button'));
    const pdfBtn = buttons.find(b => b.textContent.includes('Generate PDF'));
    assert.ok(pdfBtn, "Generate PDF button should exist");
    pdfBtn.click();

    // Wait for Start Screen
    await new Promise(r => setTimeout(r, 100));

    // 3. Click 'Manual Selection'
    // It is a button in current UI
    const wizardButtons = Array.from(modal.querySelectorAll('button'));
    const manualBtn = wizardButtons.find(b => b.textContent.includes('Manual Selection'));

    if (!manualBtn) {
        console.error("Could not find Manual Selection button. Available buttons:", wizardButtons.map(b => b.textContent));
    }
    assert.ok(manualBtn, "Manual Selection option should exist");

    console.log("Clicking Manual Selection...");
    manualBtn.click();

    // Wait for Step 1
    await new Promise(r => setTimeout(r, 100));

    // 4. Verify Checkbox Type & Accessibility
    const inputs = Array.from(modal.querySelectorAll('input'));
    console.log("Inputs found:", inputs.map(i => i.outerHTML));
    const checkbox = inputs[0];
    assert.ok(checkbox, "Should have an input element");
    assert.strictEqual(checkbox.type, 'checkbox', "Input should be of type 'checkbox'");

    // Check UX Requirement: ARIA Label
    const ariaLabel = checkbox.getAttribute('aria-label');
    assert.ok(ariaLabel && ariaLabel.includes("Living Room"), "Checkbox should have descriptive aria-label");
    console.log("✅ Checkbox type and aria-label are correct.");

    // 5. Verify Checkbox is checked by default
    assert.strictEqual(checkbox.checked, true, "Checkbox should be checked by default");

    // 6. Verify Image Optimization
    const images = Array.from(modal.querySelectorAll('img'));
    const thumbImg = images.find(img => img.src.includes('lr1.jpg'));
    assert.ok(thumbImg, "Thumbnail image should exist");
    assert.strictEqual(thumbImg.getAttribute('loading'), 'lazy', "Image should have loading='lazy'");
    console.log("✅ Image loading='lazy' attribute verified.");

    console.log("Property Clipper UI Test Passed!");
}

runTest().catch(e => {
    console.error("Test Failed:", e);
    process.exit(1);
});
