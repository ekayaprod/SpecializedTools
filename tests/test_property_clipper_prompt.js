const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Mock Data
const MOCK_ADDRESS = "123 Main St, Anytown, CA 90210";
const MOCK_PRICE = "$1,000,000";

const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <script id="__NEXT_DATA__" type="application/json">
    {
        "props": {
            "pageProps": {
                "initialReduxState": {
                    "propertyDetails": {
                        "location": {
                            "address": {
                                "line": "123 Main St",
                                "city": "Anytown",
                                "state_code": "CA",
                                "postal_code": "90210"
                            }
                        },
                        "list_price": 1000000,
                        "description": { "text": "Desc" },
                        "photos": []
                    }
                }
            }
        }
    }
    </script>
</body>
`, {
    url: "https://www.realtor.com/realestateandhomes-detail/123-Main-St_Anytown_CA_90210",
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

// Mocks needed for script execution
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.HTMLCanvasElement.prototype.getContext = () => ({ drawImage: () => {} });
global.window.Image = class { constructor() { setTimeout(() => this.onload && this.onload(), 10); } };

// Execute scripts
try {
    eval(utilsCode);
    global.BookmarkletUtils = window.BookmarkletUtils;
    eval(scriptCode);
} catch (e) {
    console.error("Script evaluation failed", e);
    process.exit(1);
}

// Verification Logic
function runTest() {
    const modal = dom.window.document.getElementById('pc-pdf-modal');
    assert.ok(modal, "Modal should exist");

    const select = modal.querySelector('select');
    assert.ok(select, "Select dropdown should exist");

    const textArea = modal.querySelector('textarea');
    assert.ok(textArea, "Textarea should exist");

    // Select Appraisal
    select.value = 'appraisal';
    select.onchange();

    const promptText = textArea.value;
    console.log("Generated Prompt Length:", promptText.length);
    // console.log("Generated Prompt:\n", promptText);

    // 1. Check Role
    assert.ok(promptText.includes("**Role:** Real Estate Valuation Analyst."), "Role should be updated");

    // 2. Check Context
    assert.ok(promptText.includes("**Context:** Review the attached property PDF"), "Context should be updated");

    // 3. Check Task and Address Replacement (First instance)
    // The address mock is "123 Main St, Anytown, CA 90210"
    // The prompt template has `Valuation_Exhibit_[Insert Property Address].md`
    // Expected: `Valuation_Exhibit_123 Main St, Anytown, CA 90210.md`
    const expectedFilename = `Valuation_Exhibit_${MOCK_ADDRESS}.md`;
    assert.ok(promptText.includes(expectedFilename), `Should contain filename with address: ${expectedFilename}`);

    // 4. Check Output Structure Header and Address Replacement (Second instance)
    // The prompt template has `# Technical Valuation Exhibit: [Insert Property Address]`
    // Expected: `# Technical Valuation Exhibit: 123 Main St, Anytown, CA 90210`
    const expectedHeader = `# Technical Valuation Exhibit: ${MOCK_ADDRESS}`;
    assert.ok(promptText.includes(expectedHeader), `Should contain header with address: ${expectedHeader}`);

    // 5. Check Section 6 Calculation
    assert.ok(promptText.includes("**Gross Baseline Value:** [Standard Baseline Rate] x [Subject Sq. Ft.] = [Total]"), "Section 6 should be present");

    console.log("✅ All Prompt Content Tests Passed");
}

try {
    runTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
}
