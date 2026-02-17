const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Helper to setup a fresh environment for each test
function createEnvironment() {
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
    </body>`, {
        url: "https://example.com",
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
    global.FileReader = dom.window.FileReader;

    // Mock URL
    global.URL.createObjectURL = () => 'blob:mock-url';
    global.URL.revokeObjectURL = () => {};

    // Mock Canvas
    global.HTMLCanvasElement.prototype.getContext = () => ({
        drawImage: () => {},
    });
    global.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,mock';

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

    // Load Utils
    eval(utilsCode);
    global.BookmarkletUtils = window.BookmarkletUtils;

    // Spy on showToast
    const toasts = [];
    global.BookmarkletUtils.showToast = (msg, type) => {
        toasts.push({ msg, type });
        // console.log(`[Toast ${type}] ${msg}`);
    };

    return { dom, toasts };
}

async function runTests() {
    let passed = 0;
    let failed = 0;

    console.log("Running Property Clipper Error Handling Tests...");

    // --- Test 1: Library Load Failure ---
    try {
        console.log("\nTest 1: Library Load Failure");
        const { dom, toasts } = createEnvironment();

        // Mock loadLibrary to FAIL
        global.BookmarkletUtils.loadLibrary = async () => {
            throw new Error("Network Error: Failed to load jsPDF");
        };

        // Load Script (Creates UI)
        eval(scriptCode);

        // Click Generate PDF
        const modal = dom.window.document.getElementById('pc-pdf-modal');
        if (!modal) throw new Error("Modal not found");

        // Find PDF Button
        const pdfBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Generate PDF'));
        if (!pdfBtn) throw new Error("PDF Button not found");
        pdfBtn.click();

        // Wait for Wizard (it's immediate usually)
        await new Promise(r => setTimeout(r, 50));

        // Click "Include All Photos" (Triggers generation)
        const allPhotosBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Include All Photos'));
        if (!allPhotosBtn) throw new Error("'Include All Photos' button not found");
        allPhotosBtn.click();

        // Wait for Async Process
        await new Promise(r => setTimeout(r, 100));

        // Verify Toast
        const errorToast = toasts.find(t => t.type === 'error' && t.msg.includes('Network Error'));
        if (errorToast) {
            console.log("✅ Caught expected error: " + errorToast.msg);
            passed++;
        } else {
            console.error("❌ Failed to catch error. Toasts:", toasts);
            failed++;
        }

    } catch (e) {
        console.error("❌ Test 1 Exception:", e);
        failed++;
    }

    // --- Test 2: PDF Generation Failure ---
    try {
        console.log("\nTest 2: PDF Generation Failure (jsPDF throws)");
        const { dom, toasts } = createEnvironment();

        // Mock loadLibrary to SUCCESS
        global.BookmarkletUtils.loadLibrary = async () => {};

        // Mock jsPDF to THROW
        global.window.jspdf = {
            jsPDF: class {
                constructor() {
                    throw new Error("jsPDF Init Failed");
                }
            }
        };

        // Load Script
        eval(scriptCode);

        // Click Generate PDF
        const modal = dom.window.document.getElementById('pc-pdf-modal');
        const pdfBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Generate PDF'));
        pdfBtn.click();
        await new Promise(r => setTimeout(r, 50));

        // Click "Include All Photos"
        const allPhotosBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Include All Photos'));
        allPhotosBtn.click();
        await new Promise(r => setTimeout(r, 100));

        // Verify Toast
        const errorToast = toasts.find(t => t.type === 'error' && t.msg.includes('jsPDF Init Failed'));
        if (errorToast) {
            console.log("✅ Caught expected error: " + errorToast.msg);
            passed++;
        } else {
            console.error("❌ Failed to catch error. Toasts:", toasts);
            failed++;
        }

    } catch (e) {
        console.error("❌ Test 2 Exception:", e);
        failed++;
    }

    // --- Test 3: Image Processing Graceful Failure ---
    try {
        console.log("\nTest 3: Image Processing Graceful Failure");
        const { dom, toasts } = createEnvironment();

        // Capture console.warn
        const warnings = [];
        const originalWarn = console.warn;
        console.warn = (...args) => warnings.push(args.join(' '));

        // Mock loadLibrary to SUCCESS
        global.BookmarkletUtils.loadLibrary = async () => {};

        // Mock jsPDF to SUCCESS
        global.window.jspdf = {
            jsPDF: class {
                constructor() { this.internal = { pageSize: { getWidth: () => 210, getHeight: () => 297 } }; }
                setFont() {} setFontSize() {} setTextColor() {} text() {} addImage() {} addPage() {}
                roundedRect() {} setDrawColor() {} setFillColor() {}
                splitTextToSize() { return []; }
                save() {}
            }
        };

        // Mock Canvas to THROW on toDataURL
        global.HTMLCanvasElement.prototype.toDataURL = () => {
            throw new Error("Canvas Security Error");
        };

        // Mock Data with Hero Image (to trigger processing)
        // Note: The script scrapes data on init. We can manipulate `Wizard.state.data` but simpler to just mock the data extraction?
        // Actually, Wizard.init(data, fmt) is called.
        // We can just rely on defaults or inject data if we could reach Wizard.
        // But Wizard is private scope.
        // We can rely on scrape getting 'Unknown Address' etc, but we need a valid image to trigger processing.
        // The script scrapes `og:image`. Let's add that to DOM.
        const meta = dom.window.document.createElement('meta');
        meta.setAttribute('property', 'og:image');
        meta.content = 'http://example.com/hero.jpg';
        dom.window.document.head.appendChild(meta);

        // Load Script
        eval(scriptCode);

        // Click Generate PDF
        const modal = dom.window.document.getElementById('pc-pdf-modal');
        const pdfBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Generate PDF'));
        pdfBtn.click();
        await new Promise(r => setTimeout(r, 50));

        // Click "Include All Photos"
        const allPhotosBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Include All Photos'));
        allPhotosBtn.click();
        await new Promise(r => setTimeout(r, 200));

        // Verify Warning
        const warning = warnings.find(w => w.includes('Image processing failed') && w.includes('Canvas Security Error'));
        if (warning) {
            console.log("✅ Caught expected warning: " + warning);
            passed++;
        } else {
            console.error("❌ Failed to catch warning. Warnings:", warnings);
            failed++;
        }

        // Verify NO Error Toast (process continued)
        const errorToast = toasts.find(t => t.type === 'error');
        if (!errorToast) {
            console.log("✅ No error toast shown (process continued gracefully).");
            passed++;
        } else {
            console.error("❌ Unexpected error toast:", errorToast);
            failed++;
        }

        // Restore console.warn
        console.warn = originalWarn;

    } catch (e) {
        console.error("❌ Test 3 Exception:", e);
        failed++;
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
