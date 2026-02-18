const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create JSDOM with initial data
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <script id="__NEXT_DATA__" type="application/json">
    {
        "props": {
            "pageProps": {
                "initialReduxState": {
                    "propertyDetails": {
                        "location": { "address": { "line": "123 Test", "city": "City", "state_code": "ST", "postal_code": "12345" } },
                        "list_price": 500000,
                        "photos": [
                            { "href": "http://img1.jpg" },
                            { "href": "http://img2.jpg" }
                        ]
                    }
                }
            }
        }
    }
    </script>
</body>`, {
    url: "https://example.com",
    runScripts: "dangerously",
    resources: "usable"
});

// Mock Globals
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.window.alert = console.log;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0); // Mock rAF

// Mock URL methods
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};

// Mock Canvas
global.HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: () => {},
});
global.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,mock';

// Mock Image - Simulating Landscape (4:3)
class MockImage {
    constructor() {
        this.onload = null;
        this.src = '';
        this.width = 800;  // Landscape
        this.height = 600; // 4:3
        setTimeout(() => { if (this.onload) this.onload(); }, 10);
    }
}
global.window.Image = MockImage;
global.Image = MockImage;

// Mock jsPDF to track page additions and image placements
let pageCount = 1;
let imagesOnPage = { 1: 0 };

const MockJsPDF = class {
    constructor(opts) {
        pageCount = 1;
        imagesOnPage = { 1: 0 };
    }
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setFillColor() {}
    roundedRect() {}
    setDrawColor() {}
    text() {}
    splitTextToSize() { return []; }
    addImage(dataUrl, format, x, y, w, h) {
        imagesOnPage[pageCount] = (imagesOnPage[pageCount] || 0) + 1;
    }
    addPage() {
        pageCount++;
        imagesOnPage[pageCount] = 0;
    }
    save() {}
};
global.window.jspdf = { jsPDF: MockJsPDF };

// Run Test
(async () => {
    try {
        console.log("Running Regression Test for PDF Layout...");

        // Exec Utils
        eval(utilsCode);
        global.BookmarkletUtils = window.BookmarkletUtils;

        // Exec Property Clipper
        eval(scriptCode);

        // Trigger Flow
        const modal = document.getElementById('pc-pdf-modal');
        if (!modal) throw new Error("Modal not found");

        const pdfBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent === 'PDF');
        pdfBtn.click();

        await new Promise(r => setTimeout(r, 100)); // Wait for Wizard init

        const allPhotosBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('All Photos'));
        allPhotosBtn.click();

        await new Promise(r => setTimeout(r, 1000)); // Wait for generation

        console.log("Images per Page:", JSON.stringify(imagesOnPage));

        // Assertions
        if (imagesOnPage[1] !== 1) throw new Error(`Page 1 should have 1 image (Hero), found ${imagesOnPage[1]}`);
        if (imagesOnPage[2] !== 2) throw new Error(`Page 2 should have 2 images (Photos), found ${imagesOnPage[2]}`);

        console.log("✅ Regression Test Passed: 2 images found on Page 2.");

    } catch (e) {
        console.error("❌ Test Failed:", e);
        process.exit(1);
    }
})();
