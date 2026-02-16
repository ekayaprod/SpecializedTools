const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Capture console.warn
const warnings = [];
const originalWarn = console.warn;
console.warn = (...args) => {
    warnings.push(args.join(' '));
    // originalWarn(...args); // Uncomment to see logs
};

// Create JSDOM with initial data
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <script id="__NEXT_DATA__" type="application/json">
    {
        "props": {
            "pageProps": {
                "initialReduxState": {
                    "propertyDetails": {
                        "location": { "address": { "line": "123 Main St" } },
                        "photos": [ {"href": "http://example.com/photo1.jpg"} ]
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
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.Image = dom.window.Image;

// Mock alert
global.window.alert = () => {};

// Mock Canvas to throw error on toDataURL
global.HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: () => {},
});
global.HTMLCanvasElement.prototype.toDataURL = () => {
    throw new Error("Simulated Canvas Error");
};

// Mock jsPDF
global.window.jspdf = {
    jsPDF: class {
        constructor() {
            this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
        }
        setFont() {}
        setFontSize() {}
        setTextColor() {}
        text() {}
        addImage() {}
        addPage() {}
        save() {}
        splitTextToSize() { return []; }
    }
};

// Mock URL methods
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};

// Mock Image loading (triggers onload automatically)
class MockImage {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        this.width = 100;
        this.height = 100;
        setTimeout(() => {
            if (this.onload) this.onload();
        }, 10);
    }
}
global.window.Image = MockImage;
global.Image = MockImage;

// Execute script
try {
    eval(scriptCode);
} catch (e) {
    console.error("Script evaluation failed", e);
}

async function runTest() {
    // 1. Open Wizard (click PDF button in modal)
    const modal = document.getElementById('pc-pdf-modal');
    if (!modal) throw new Error("Modal not found");

    const pdfBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Generate PDF'));
    if (!pdfBtn) throw new Error("PDF Button not found");

    pdfBtn.click();
    await new Promise(r => setTimeout(r, 100)); // Wait for wizard

    // 2. Select 'Include All Photos' to start generation
    const allPhotosBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Include All Photos'));
    if (!allPhotosBtn) throw new Error("All Photos button not found");

    allPhotosBtn.click();

    // 3. Wait for processing
    await new Promise(r => setTimeout(r, 500));

    // 4. Check warnings
    // With current code, warnings should be EMPTY because error is swallowed
    console.log("Captured Warnings:", warnings);

    // We expect this to contain nothing initially, and then contain the error after fix.
    if (warnings.some(w => w.includes('Image processing failed') || w.includes('Simulated Canvas Error'))) {
        console.log("✅ Warning found (Post-fix behavior)");
    } else {
        console.log("❌ No warning found (Pre-fix behavior - EXPECTED FOR NOW)");
    }
}

runTest();
