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
                        ],
                        "days_on_market": 15,
                        "neighborhood": {
                            "median_listing_price": 950000,
                            "median_sold_price": 920000,
                            "median_price_per_sqft": 450
                        },
                        "property_history": [
                            { "date": "2023-01-01", "event_name": "Sold", "price": 900000 },
                            { "date": "2022-06-01", "event_name": "Listed", "price": 850000 }
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

// Mock Meta og:image
const meta = dom.window.document.createElement('meta');
meta.setAttribute('property', 'og:image');
meta.content = 'http://example.com/hero-og.jpg';
dom.window.document.head.appendChild(meta);

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
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

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
const blobs = new Map();
global.URL.createObjectURL = (blob) => {
    const id = `blob:${blobs.size}`;
    blobs.set(id, blob);
    return id;
};
global.URL.revokeObjectURL = (id) => blobs.delete(id);

const savedFiles = [];
// Mock HTMLAnchorElement click for download
global.window.HTMLAnchorElement.prototype.click = function() {
    if (this.download && this.href) {
        const blob = blobs.get(this.href);
        if (blob) {
            savedFiles.push({ filename: this.download, blob });
        }
    }
};

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
let pdfSavedFilename = '';
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
    roundedRect() {} // Added for new grid layout
    setDrawColor() {}
    setLineWidth() {}
    line() {}
    rect() {}
    text(txt) { pdfContent.push(txt); }
    splitTextToSize(txt) { return [txt]; }
    getTextDimensions(txt) { return { w: 100, h: 10 }; }
    addImage(dataUrl) {
        // We can't easily verify the source URL here because ImageProcessor converts it to dataUrl.
        // But we can check if ImageProcessor was called with the correct URL if we spy on it.
        // For now, just log.
        console.log("Image added to PDF:", dataUrl.substring(0, 30) + "...");
    }
    addPage() { console.log("New page added to PDF"); }
    save(filename) {
        console.log("PDF saved:", filename);
        pdfSaved = true;
        pdfSavedFilename = filename;
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
    assert.strictEqual(select.getAttribute('aria-label'), 'Select Persona / Analysis Type', "Persona Select should have correct aria-label");
    console.log("✅ Persona Dropdown found and has aria-label.");

    // 3. Select 'Appraisal' and Trigger Change
    select.value = 'appraisal';
    select.onchange(); // Trigger updateText directly since JSDOM might not fire it automatically on assignment
    console.log("✅ Selected 'Appraisal' persona.");

    // 4. Click 'Generate PDF' Button -> Opens Wizard
    const buttons = Array.from(modal.querySelectorAll('button'));
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
        // Verify Filename (regex: FirstLine_YYYYMMDD-HHmm.pdf)
        // Mock date logic might make it hard to predict exact time, but we can regex structure.
        // Address: "123 Main St, Anytown, CA 90210" -> "123_Main_St"
        // Pattern: /^123_Main_St_\d{8}-\d{4}\.pdf$/
        // But since we can't easily access the saved filename from `runTest` scope unless we hook the MockJsPDF.save,
        // let's rely on the console log from the Mock.
        // Or update MockJsPDF to store the last saved filename.

        // Verify filename structure
        const filenameRegex = /^123_Main_St_\d{8}-\d{4}\.pdf$/;
        if (filenameRegex.test(pdfSavedFilename)) {
            console.log(`✅ Filename format correct: ${pdfSavedFilename}`);
        } else {
            console.error(`❌ Filename format INCORRECT: ${pdfSavedFilename}`);
            process.exit(1);
        }

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

        if (flatContent.includes('Primary Property Specs')) {
            console.log("✅ Found 'Primary Property Specs' section.");
        } else {
             console.error("❌ 'Primary Property Specs' section MISSING.");
        }

        if (flatContent.includes('Market Context & Medians')) {
            console.log("✅ Found 'Market Context & Medians' section.");
        } else {
             console.error("❌ 'Market Context & Medians' section MISSING.");
        }

        if (flatContent.includes('Seller/Listing Agent Description')) {
            console.log("✅ Found 'Seller/Listing Agent Description' section.");
        } else {
             console.error("❌ 'Seller/Listing Agent Description' section MISSING.");
        }

        if (flatContent.includes('Property History')) {
            console.log("✅ Found 'Property History' section.");
            // Verify content
            if (flatContent.includes('2023-01-01 - Sold - $900,000')) {
                 console.log("✅ Property History content verified.");
            } else {
                 console.error("❌ Property History content incorrect.");
            }
        } else {
             console.error("❌ 'Property History' section MISSING.");
        }

        if (flatContent.includes('RAW PROPERTY DATA (For AI Context)')) {
            console.log("✅ Found 'RAW PROPERTY DATA' section.");
            // Verify minification (rough check)
            // The mock PDF puts text in array. We joined with space.
            // Minified JSON shouldn't have newlines in the string itself except for splitTextToSize chunks.
            // But we can check if the content contains the raw JSON string.
            // We can check if "median_listing_price" is present.
            if (flatContent.includes('median_listing_price')) {
                 console.log("✅ Raw JSON content verified.");
            }
        } else {
             console.error("❌ 'RAW PROPERTY DATA' section MISSING.");
        }

    } else {
        console.error("❌ PDF Generation failed (save() NOT called).");
        process.exit(1);
    }

    // 6. Test HTML Generation
    console.log("\nTesting HTML Generation...");

    // Re-eval script to re-open modal (since it was closed)
    console.log("Re-opening Property Clipper...");
    eval(scriptCode);

    const modal2 = dom.window.document.getElementById('pc-pdf-modal');
    assert.ok(modal2, "Modal should reopen");

    const htmlButton = Array.from(modal2.querySelectorAll('button')).find(b => b.textContent.includes('Generate HTML'));
    assert.ok(htmlButton, "Generate HTML Button should exist");

    console.log("Clicking Generate HTML button...");
    htmlButton.click();
    await new Promise(r => setTimeout(r, 100)); // Wait for Wizard

    // Select All Photos
    const allPhotosOption2 = Array.from(modal2.querySelectorAll('button')).find(o => o.textContent.includes('Include All Photos'));
    assert.ok(allPhotosOption2, "'Include All Photos' option should exist for HTML");

    allPhotosOption2.click();

    await new Promise(r => setTimeout(r, 500)); // Wait for generation

    // Verify saved file
    const htmlFile = savedFiles.find(f => f.filename.endsWith('.html'));
    if (htmlFile) {
        console.log(`✅ HTML file generated: ${htmlFile.filename}`);

        // Use FileReader to read blob (jsdom Blob doesn't support .text())
        const content = await new Promise((resolve, reject) => {
            const reader = new dom.window.FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(htmlFile.blob);
        });

        // Verify Alt Tag
        // We expect: alt="Primary view of 123 Main St, Anytown, CA 90210"
        if (content.includes('alt="Primary view of 123 Main St, Anytown, CA 90210"')) {
             console.log("✅ HTML content verification passed: Dynamic Alt tag present.");
        } else {
             console.error("❌ HTML content verification FAILED: Alt tag missing or incorrect.");
             // Extract substring around hero image if possible
             const match = content.match(/<img[^>]*alt="([^"]*)"/);
             if (match) {
                 console.log(`Found alt tag: ${match[1]}`);
             } else {
                 console.log("No img tag with alt found.");
             }
             process.exit(1);
        }
    } else {
        console.error("❌ HTML file NOT generated.");
        process.exit(1);
    }

    // 7. Test Wizard UI Accessibility
    console.log("\nTesting Wizard UI Accessibility...");

    // Re-eval script to re-open modal
    console.log("Re-opening Property Clipper for Wizard Access Test...");
    eval(scriptCode);

    const modal3 = dom.window.document.getElementById('pc-pdf-modal');
    assert.ok(modal3, "Modal should reopen");

    const pdfBtn3 = Array.from(modal3.querySelectorAll('button')).find(b => b.textContent.includes('Generate PDF'));
    pdfBtn3.click();
    await new Promise(r => setTimeout(r, 100)); // Wait for Wizard

    // Click Manual Selection
    const manualBtn = Array.from(modal3.querySelectorAll('button')).find(b => b.textContent.includes('Manual Selection'));
    assert.ok(manualBtn, "Manual Selection button should exist");
    manualBtn.click();

    await new Promise(r => setTimeout(r, 100)); // Wait for renderStep

    // Check images in the grid
    const imgs = modal3.querySelectorAll('img');
    assert.ok(imgs.length > 0, "Images should be rendered in Manual Selection");

    // Check alt attribute
    // Based on mock data: augmented_gallery[0].category = "Kitchen"
    // So p.label should be "Kitchen".
    const firstImg = imgs[0];
    const altText = firstImg.getAttribute('alt');
    assert.strictEqual(altText, 'Kitchen', `Image alt text should be 'Kitchen', got '${altText}'`);
    console.log("✅ Wizard images have correct alt attributes.");
}

runTest().then(() => {
    console.log("Test execution finished.");
}).catch(e => {
    console.error("Test failed:", e);
    process.exit(1);
});
