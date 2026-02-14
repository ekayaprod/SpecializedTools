const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

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
                            "address": {
                                "line": "123 Main St",
                                "city": "Anytown",
                                "state_code": "CA",
                                "postal_code": "90210"
                            }
                        },
                        "list_price": 1000000,
                        "description": {
                            "text": "Great house with many features."
                        },
                        "photos": [
                            {"href": "http://example.com/photo1.jpg"},
                            {"href": "http://example.com/photo2.jpg"}
                        ],
                        "augmented_gallery": [
                            {
                                "category": "Kitchen",
                                "photos": [
                                    {"href": "http://example.com/kitchen1.jpg"},
                                    {"href": "http://example.com/kitchen2.jpg"}
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

// Mock URL methods
if (!global.URL.createObjectURL) {
    global.URL.createObjectURL = () => 'blob:mock-url';
    global.URL.revokeObjectURL = () => {};
}

// Mock Canvas methods
global.HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: () => {},
    fillRect: () => {},
});
global.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,mockdata';

// Mock Image
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

// Mock jsPDF
let pdfSaved = false;
let pdfContent = [];
const MockJsPDF = class {
    constructor(opts) {
        console.log("jsPDF instance created with opts:", opts);
        this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } };
    }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setFillColor() {}
    rect() {}
    text(txt) { pdfContent.push(txt); }
    splitTextToSize(txt) { return [txt]; }
    addImage(dataUrl) { console.log("Image added to PDF:", dataUrl.substring(0, 30) + "..."); }
    addPage() { console.log("New page added to PDF"); }
    save(filename) {
        console.log("PDF saved:", filename);
        pdfSaved = true;
    }
};

global.window.jspdf = { jsPDF: MockJsPDF };

// Mock fetch for random requests
global.fetch = async (url) => {
    return {
        ok: true,
        blob: async () => new Blob(['image-content'], { type: 'image/jpeg' })
    };
};

// Execute script
try {
    console.log("Executing property-clipper.js...");
    eval(scriptCode);
} catch (e) {
    console.error("Script evaluation failed", e);
    process.exit(1);
}

// Verification Steps
async function runTest() {
    console.log("Verifying UI elements...");

    // 1. Verify Modal Exists
    const modal = dom.window.document.getElementById('pc-pdf-modal');
    assert.ok(modal, "Modal 'pc-pdf-modal' should exist");
    console.log("✅ Modal found.");

    // 2. Find Persona Button (Short-Term Rental)
    const buttons = Array.from(modal.querySelectorAll('button'));
    const strButton = buttons.find(b => b.textContent.includes('Short-Term Rental'));
    assert.ok(strButton, "STR Button should exist");
    console.log("✅ STR Button found.");

    // 3. Click STR Button -> Opens Wizard
    console.log("Clicking STR button...");
    strButton.click();

    // Wait for Wizard to render
    await new Promise(r => setTimeout(r, 100));

    const wizardTitle = modal.querySelector('h3');
    assert.ok(wizardTitle && wizardTitle.textContent.includes('Select Photo Strategy'), "Wizard start screen should appear");
    console.log("✅ Wizard start screen verified.");

    // 4. Find 'Include All Photos' option
    // It's a div with text, but clicking it triggers action
    const options = Array.from(modal.querySelectorAll('div[style*="cursor: pointer"]'));
    const allPhotosOption = options.find(o => o.textContent.includes('Include All Photos'));
    assert.ok(allPhotosOption, "'Include All Photos' option should exist");
    console.log("✅ 'Include All Photos' option found.");

    // 5. Click 'Include All Photos' -> Triggers Generation
    console.log("Clicking 'Include All Photos'...");
    allPhotosOption.click();

    // Wait for generation
    console.log("Waiting for PDF generation...");
    await new Promise(r => setTimeout(r, 2000));

    if (pdfSaved) {
        console.log("✅ PDF Generation successful (save() called).");
    } else {
        console.error("❌ PDF Generation failed (save() NOT called).");
        process.exit(1);
    }

    // Check if modal closed or shows status?
    // The code says: .then(() => { closeModal(); })
    // So if successful, modal should be gone.
    const modalAfter = dom.window.document.getElementById('pc-pdf-modal');
    if (!modalAfter) {
        console.log("✅ Modal closed after generation.");
    } else {
        console.warn("⚠️ Modal still exists. It might not have closed properly or status is still showing.");
        // Check status text
        const status = modalAfter.querySelector('#pdf-status');
        if (status) console.log("Status text:", status.textContent);
    }
}

runTest().then(() => {
    console.log("Test execution finished.");
}).catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
