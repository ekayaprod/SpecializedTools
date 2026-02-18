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

const dom = new JSDOM(`<!DOCTYPE html><body><div id="root"></div></body>`, {
    url: "https://example.com",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.URL = dom.window.URL;
global.Blob = dom.window.Blob;

// Mock Utils
try {
    eval(utilsCode);
    global.BookmarkletUtils = window.BookmarkletUtils;
} catch (e) {
    console.error("Utils eval failed", e);
}

// Inject data element
const dataScript = document.createElement('script');
dataScript.id = '__NEXT_DATA__';
dataScript.type = 'application/json';
dataScript.textContent = JSON.stringify({
    props: { pageProps: { initialReduxState: { propertyDetails: {
        location: { address: { line: '123 Test', city: 'City', state_code: 'ST', postal_code: '00000' } },
        list_price: 100000,
        description: { text: 'Test Desc' }
    }}}}
});
document.body.appendChild(dataScript);

try {
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
    console.error("Script eval failed", e);
}

// Verify
const modal = document.getElementById('pc-pdf-modal');
if (!modal) {
    console.error("Modal not found");
    process.exit(1);
}

const select = modal.querySelector('select');
const textarea = modal.querySelector('textarea');

if (!select || !textarea) {
    console.error("UI elements not found");
    process.exit(1);
}

// Select 'ltr' role
select.value = 'ltr';
select.dispatchEvent(new dom.window.Event('change'));

const promptText = textarea.value;
console.log("Prompt Text (first 200 chars):", promptText.substring(0, 200) + "...");

let failed = false;

// 1. Role Check
if (promptText.includes("**Role:** Senior Buy-and-Hold Investment Analyst drafting a fast-paced investment brief")) {
    console.log("✅ Role found.");
} else {
    console.error("❌ Role NOT found.");
    failed = true;
}

// 2. Task Check
if (promptText.includes("**Task:** Perform a comparative investment analysis on the attached properties (single-family or multi-unit)")) {
    console.log("✅ Task found.");
} else {
    console.error("❌ Task NOT found.");
    failed = true;
}

// 3. Leaderboard Check
if (promptText.includes("THE LEADERBOARD (EXECUTIVE VERDICT):")) {
    console.log("✅ THE LEADERBOARD found.");
} else {
    console.error("❌ THE LEADERBOARD NOT found.");
    failed = true;
}

// 4. Comparative Revenue Check
if (promptText.includes("COMPARATIVE REVENUE & YIELD PROJECTION:")) {
    console.log("✅ COMPARATIVE REVENUE & YIELD PROJECTION found.");
} else {
    console.error("❌ COMPARATIVE REVENUE & YIELD PROJECTION NOT found.");
    failed = true;
}

// 5. Tenant Demand Matrix Check
if (promptText.includes("TENANT DEMAND MATRIX (PROXIMITY):")) {
    console.log("✅ TENANT DEMAND MATRIX found.");
} else {
    console.error("❌ TENANT DEMAND MATRIX NOT found.");
    failed = true;
}

// 6. LTR Durability Check
if (promptText.includes("LTR DURABILITY & CAPEX AUDIT:")) {
    console.log("✅ LTR DURABILITY & CAPEX AUDIT found.");
} else {
    console.error("❌ LTR DURABILITY & CAPEX AUDIT NOT found.");
    failed = true;
}

// 7. Landlord Tripwires Check
if (promptText.includes('LANDLORD & HOLDING COST "TRIPWIRES":')) {
    console.log("✅ LANDLORD & HOLDING COST TRIPWIRES found.");
} else {
    console.error("❌ LANDLORD & HOLDING COST TRIPWIRES NOT found.");
    failed = true;
}

// 8. Financial Reality Check
if (promptText.includes("FINANCIAL REALITY CHECK (TOP-RANKED ASSET ONLY):")) {
    console.log("✅ FINANCIAL REALITY CHECK found.");
} else {
    console.error("❌ FINANCIAL REALITY CHECK NOT found.");
    failed = true;
}

// 9. Deal Breaker Analysis
if (promptText.includes('THE "DEAL BREAKER" ANALYSIS:')) {
    console.log("✅ DEAL BREAKER ANALYSIS found.");
} else {
    console.error("❌ DEAL BREAKER ANALYSIS NOT found.");
    failed = true;
}

// 10. Standard Outputs Suppressed Check
if (!promptText.includes("EXPECTED DELIVERABLES:")) {
    console.log("✅ Standard output suppressed (as expected).");
} else {
    console.error("❌ Standard output found (should be suppressed).");
    failed = true;
}

if (failed) {
    console.error("Verification failed.");
    process.exit(1);
} else {
    console.log("Verification passed.");
}
