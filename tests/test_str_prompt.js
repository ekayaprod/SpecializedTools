const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

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

// Select 'str' role
select.value = 'str';
select.dispatchEvent(new dom.window.Event('change'));

const promptText = textarea.value;
console.log("Prompt Text (first 200 chars):", promptText.substring(0, 200) + "...");

let failed = false;

// 1. Role Check
if (promptText.includes("**Role:** Senior STR Investment Analyst.")) {
    console.log("✅ Role found.");
} else {
    console.error("❌ Role NOT found. Expected '**Role:** Senior STR Investment Analyst.'");
    failed = true;
}

// 2. Task Check
if (promptText.includes("**Task:** Perform a comparative investment analysis")) {
    console.log("✅ Task found.");
} else {
    console.error("❌ Task NOT found.");
    failed = true;
}

// 3. Leaderboard Check
if (promptText.includes("THE LEADERBOARD (EXECUTIVE VERDICT)")) {
    console.log("✅ THE LEADERBOARD found.");
} else {
    console.error("❌ THE LEADERBOARD NOT found.");
    failed = true;
}

// 4. Comparative Revenue Projection Check
if (promptText.includes("COMPARATIVE REVENUE PROJECTION")) {
    console.log("✅ COMPARATIVE REVENUE PROJECTION found.");
} else {
    console.error("❌ COMPARATIVE REVENUE PROJECTION NOT found.");
    failed = true;
}

// 5. Guest Experience Audit Check
if (promptText.includes('THE "GUEST EXPERIENCE" AUDIT')) {
    console.log("✅ GUEST EXPERIENCE AUDIT found.");
} else {
    console.error("❌ GUEST EXPERIENCE AUDIT NOT found.");
    failed = true;
}

// 6. Regulatory & Silent Cost Check
if (promptText.includes('REGULATORY & SILENT COST "TRIPWIRES"')) {
    console.log("✅ REGULATORY & SILENT COST TRIPWIRES found.");
} else {
    console.error("❌ REGULATORY & SILENT COST TRIPWIRES NOT found.");
    failed = true;
}

// 7. Financial Reality Check
if (promptText.includes('FINANCIAL REALITY CHECK (THE MATH)')) {
    console.log("✅ FINANCIAL REALITY CHECK found.");
} else {
    console.error("❌ FINANCIAL REALITY CHECK NOT found.");
    failed = true;
}

// 8. Deal Breaker Analysis
if (promptText.includes('THE "DEAL BREAKER" ANALYSIS')) {
    console.log("✅ DEAL BREAKER ANALYSIS found.");
} else {
    console.error("❌ DEAL BREAKER ANALYSIS NOT found.");
    failed = true;
}

// 9. Standard Outputs Suppressed Check
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
