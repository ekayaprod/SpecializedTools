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
global.Uint32Array = Uint32Array;

// Mock crypto
global.window.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    }
};

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
    getTextDimensions(txt) { return { w: 100, h: 10 }; }
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

// Execute scripts
try {
    console.log("Executing utils.js...");
    eval(utilsCode);

    // Propagate to global for the next script
    global.BookmarkletUtils = window.BookmarkletUtils;

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

    // 2. Find Persona Dropdown
    const select = modal.querySelector('select');
    assert.ok(select, "Persona Select Dropdown should exist");
    console.log("✅ Persona Dropdown found.");

    // 3. Select 'Appraisal' and Trigger Change
    select.value = 'appraisal';
    select.onchange(); // Trigger updateText directly since JSDOM might not fire it automatically on assignment
    console.log("✅ Selected 'Appraisal' persona.");

    // 4. Click 'Generate PDF' Button -> Opens Wizard
    const buttons = Array.from(modal.querySelectorAll('button'));
    console.log("Buttons found in modal:", buttons.map(b => b.textContent));
    const pdfButton = buttons.find(b => b.textContent.includes('Generate PDF'));
    assert.ok(pdfButton, "Generate PDF Button should exist");
    console.log("✅ Generate PDF Button found.");

    console.log("Clicking Generate PDF button...");
    pdfButton.click();

    // Wait for Wizard to render
    await new Promise(r => setTimeout(r, 100));

    const wizardTitle = modal.querySelector('h3');
    assert.ok(wizardTitle && wizardTitle.textContent.includes('Select Photo Strategy'), "Wizard start screen should appear");
    console.log("✅ Wizard start screen verified.");

    // 5. Find 'Include All Photos' option
    // It is a button now
    const wizardButtons = Array.from(modal.querySelectorAll('button'));
    const allPhotosOption = wizardButtons.find(o => o.textContent.includes('Include All Photos'));
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
        // Verify prompt content
        const flatContent = pdfContent.flat(Infinity).join(' ');
        // Check for Description (Prompt is no longer included in PDF, replaced by Hero Image)
        if (flatContent.includes('Great house with many features')) {
             console.log("✅ Found Description in PDF.");
             // Check address and price
             if (flatContent.includes('123 Main St') && flatContent.includes('$1,000,000')) {
                 console.log("✅ Placeholders interpolated correctly.");
             } else {
                 console.error("❌ Placeholders NOT interpolated correctly.");
                 process.exit(1);
             }
        } else {
            console.error("❌ Description NOT found in PDF content. Content was: " + flatContent.substring(0, 100) + "...");
            process.exit(1);
        }
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
