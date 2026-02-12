const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Create a JSDOM instance with minimal required DOM
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <div id="app-content">
        <h1>Property Title</h1>
        <div class="main-content">
            <button data-testid="hero-view-more">View More</button>
            <img src="https://example.com/image.jpg" alt="Property Image">
        </div>
    </div>
    <script id="__NEXT_DATA__" type="application/json">
        {
            "props": {
                "pageProps": {
                    "propertyData": {
                        "location": { "address": { "line": "123 Main St", "city": "Anytown" } },
                        "price": 500000,
                        "description": { "beds": 3, "baths": 2, "sqft": 2000, "text": "Beautiful home." }
                    }
                }
            }
        }
    </script>
</body>
`, {
    url: "https://www.realtor.com/realestateandhomes-detail/123-Main-St_Anytown_PA_12345_M12345-67890",
    runScripts: "dangerously",
    resources: "usable"
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.Image = dom.window.Image;
global.DOMParser = dom.window.DOMParser; // Make sure DOMParser is available

// Mock BookmarkletUtils
const MockBookmarkletUtils = {
    sanitizeFilename: (s) => s.replace(/[^a-z0-9]/gi, '_'),
    downloadFile: (filename, content) => {
        console.log(`[Mock] Downloading ${filename}`);
        // console.log(`[Mock] Content length: ${content.length}`);
    },
    normalizeImages: (root) => {},
    sanitizeAttributes: (root) => {},
    inlineStyles: (source, target) => {},
    getRand: (m) => 0
};

global.window.BookmarkletUtils = MockBookmarkletUtils;
global.BookmarkletUtils = MockBookmarkletUtils;

// Mock clipboard
global.navigator.clipboard = {
    writeText: async (text) => {
        console.log(`[Mock] Copied to clipboard: ${text.substring(0, 50)}...`);
    }
};

// Execute the script
try {
    console.log("Executing property-clipper.js...");
    eval(scriptCode);
} catch (e) {
    console.error("Error evaluating script:", e);
    process.exit(1);
}

// Verification
console.log("Verifying UI elements...");

// 1. Check if overlay exists
const overlay = document.getElementById('pc-bookmarklet-overlay');
assert.ok(overlay, "Overlay should exist");

// 2. Check if modal exists
const modal = document.getElementById('pc-bookmarklet-modal');
assert.ok(modal, "Modal should exist");

// 3. Check for specific text from the NEW script version
// The new script has "Deep Research Protocol" as a label for one of the global options.
// The old script had "Deep Research (Web)".
const bodyText = modal.textContent || modal.innerText;
const hasNewFeature = bodyText.includes("Deep Research Protocol");
const hasOldFeature = bodyText.includes("Deep Research (Web)");

if (hasNewFeature) {
    console.log("✅ New script version detected (found 'Deep Research Protocol').");
} else if (hasOldFeature) {
    console.log("⚠️ Old script version detected (found 'Deep Research (Web)').");
    // This is expected if we haven't updated the file yet.
    // We want to assert true only for the new version in the final test run.
} else {
    console.warn("❓ Could not determine script version from UI text.");
}

// 4. Test interaction: Select a strategy
const select = modal.querySelector('select');
assert.ok(select, "Strategy selector should exist");

// Select 'str' strategy
select.value = 'str';
select.dispatchEvent(new dom.window.Event('change'));

// Check if STR specific sections are loaded
// In the new script, STR has a section "Phase 1: Geographic & Forensic Identification" which renders as "Geographic & Forensic Identification"
// In the old script, STR has "Infrastructure Forensics (Critical)" which renders as "Infrastructure Forensics"
const labels = Array.from(modal.querySelectorAll('label')).map(l => l.textContent);
const hasNewSTRSection = labels.some(l => l.includes("Geographic & Forensic Identification"));
// "Infrastructure Forensics" is present in both (as Phase 2 in new), so we rely on the new one for positive confirmation.

if (hasNewSTRSection) {
    console.log("✅ New STR strategy sections loaded.");
} else {
    console.log("⚠️ Old STR strategy sections loaded (or failed to detect new one).");
    console.log("Labels found:", labels);
}

// 5. Verify Prompt Content
const textarea = modal.querySelector('textarea');
const promptText = textarea.value;

const expectedPhrases = [
    "REQUIRED OUTPUT STRUCTURE:",
    "Risk Scoring",
    "Financial Analysis",
    "Comparison Tables",
    "Renovation Tiers",
    "Construction-Era Risk Checklist",
    "Assumptions & Data Gaps"
];

let allPhrasesFound = true;
expectedPhrases.forEach(phrase => {
    if (promptText.includes(phrase)) {
        console.log(`✅ Found phrase: "${phrase}"`);
    } else {
        console.error(`❌ Missing phrase: "${phrase}"`);
        allPhrasesFound = false;
    }
});

if (!allPhrasesFound) {
    console.error("❌ Some prompt requirements are missing.");
    process.exit(1);
}

// 6. Verify "Thinking" removal
const bodyTextAfter = modal.textContent || modal.innerText;
const hasThinking = bodyTextAfter.includes("Thinking Process Step");
if (!hasThinking) {
    console.log("✅ 'Thinking Process Step' option correctly removed.");
} else {
    console.error("❌ 'Thinking Process Step' option STILL PRESENT.");
    process.exit(1);
}

console.log("Test execution completed.");
