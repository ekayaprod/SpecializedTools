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

// Find the option for "Valuation Analyst"
let optionValue;
for (const opt of select.options) {
    if (opt.text.includes('Valuation Analyst')) {
        optionValue = opt.value;
        break;
    }
}

if (!optionValue) {
    console.error("Could not find Valuation Analyst option");
    process.exit(1);
}

console.log(`Found option '${optionValue}' for Valuation Analyst`);

select.value = optionValue;
select.dispatchEvent(new dom.window.Event('change'));

const promptText = textarea.value;
console.log("Prompt Text (first 200 chars):", promptText.substring(0, 200) + "...");

let failed = false;

if (promptText.includes("Act as an Expert Real Estate Valuation Analyst")) {
    console.log("✅ Role found.");
} else {
    console.error("❌ Role NOT found.");
    failed = true;
}

if (promptText.includes("SUBJECT PROPERTY BASELINE")) {
    console.log("✅ New objective content found.");
} else {
    console.error("❌ New objective content NOT found.");
    failed = true;
}

if (!promptText.includes("Investment Grade (Strong Buy")) {
    console.log("✅ STANDARD_OUTPUTS suppressed.");
} else {
    console.error("❌ STANDARD_OUTPUTS NOT suppressed.");
    failed = true;
}

if (failed) {
    console.error("Verification failed.");
    process.exit(1);
} else {
    console.log("Verification passed.");
}
