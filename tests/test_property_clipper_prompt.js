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

    // Manually resolve @include_text directives for testing
    let resolvedPromptsCode = promptsCode;
    const includeRegex = /\/\*\s*@include_text\s+['"]?([^'"]+)['"]?\s*\*\//g;
    let match;
    const replacements = [];
    while ((match = includeRegex.exec(resolvedPromptsCode)) !== null) {
        replacements.push({ fullMatch: match[0], path: match[1].trim() });
    }
    for (const rep of replacements) {
        const incPath = path.join(__dirname, '../bookmarklets/' + rep.path);
        if (fs.existsSync(incPath)) {
            let incText = fs.readFileSync(incPath, 'utf8');
            // Escape backslashes first, then backticks, then template vars
            incText = incText.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
            resolvedPromptsCode = resolvedPromptsCode.replace(rep.fullMatch, incText);
        }
    }
    eval(resolvedPromptsCode);

    eval(coreCode);
    eval(pdfCode);
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
    select.dispatchEvent(new dom.window.Event('change')); // Trigger change event properly

    const promptText = textArea.value;
    console.log("Generated Prompt Length:", promptText.length);
    // console.log("Generated Prompt:\n", promptText);

    // 1. Check Role
    assert.ok(promptText.includes("**Role:** Real Estate Valuation Analyst."), "Role should be updated");

    // 2. Check Context
    assert.ok(promptText.includes("**Context:** Review the attached property PDF"), "Context should be updated");

    // 3. Check Task and Address Replacement (First instance)
    const expectedFilename = `Valuation_Exhibit_${MOCK_ADDRESS}.md`;
    assert.ok(promptText.includes(expectedFilename), `Should contain filename with address: ${expectedFilename}`);

    // 4. Check Output Structure Header and Address Replacement (Second instance)
    const expectedHeader = `# Technical Valuation Exhibit: ${MOCK_ADDRESS}`;
    assert.ok(promptText.includes(expectedHeader), `Should contain header with address: ${expectedHeader}`);

    // 5. Check Search Directive in Section 3
    assert.ok(promptText.includes("You must establish a highly accurate baseline"), "Search Directive should be present");

    // 6. Check Fair Value Clause
    assert.ok(promptText.includes('The "Fair Value" Clause'), "Fair Value Clause should be present");

    // 7. Check Strict Rule in Section 5
    assert.ok(promptText.includes("ONLY apply a financial deduction for a missing feature"), "Strict Rule in Section 5 should be present");

    // 8. Check Section 7 Calculation (NEW LOGIC)
    assert.ok(promptText.includes("**Standard Baseline Rate:** [Insert average Price/Sq. Ft. of ALL comps]"), "Section 7 calculation should reference ALL comps");
    assert.ok(promptText.includes("**Gross Baseline Value:** [Standard Baseline Rate] x [Subject Sq. Ft.] = [Total]"), "Section 7 calculation logic should be correct");

    console.log("✅ All Prompt Content Tests Passed");
}

try {
    runTest();
} catch (e) {
    console.error("❌ Test Failed:", e.message);
    process.exit(1);
}
