const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Mock JSZip
class MockJSZip {
    constructor() {
        this.files = {};
    }
    folder(name) { return this; }
    file(name, content) {
        this.files[name] = content;
        return this;
    }
    generateAsync(options) { return Promise.resolve(new Blob(['zipcontent'])); }
}
global.JSZip = MockJSZip;

// Create JSDOM
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <div id="__NEXT_DATA__">{"props":{"pageProps":{"initialReduxState":{"propertyDetails":{"location":{"address":{"line":"123 Main St","city":"Anytown","state_code":"CA","postal_code":"90210"}},"list_price":1000000,"description":{"text":"Great house"},"photos":[{"href":"http://example.com/photo1.jpg","category":"Kitchen"}]}}}}}</div>
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
// Mock URL methods
global.URL.createObjectURL = () => 'blob:mock-url';
global.URL.revokeObjectURL = () => {};

// Mock fetch
global.fetch = async (url) => {
    // console.log("Mock fetching:", url);
    if (url && url.includes('jszip')) return { ok: true };
    return {
        ok: true,
        blob: async () => new Blob(['image-content'], { type: 'image/jpeg' })
    };
};

// Mock document.createElement to intercept download link
let downloadLinkCreated = false;
let downloadUrl = '';
const originalCreateElement = dom.window.document.createElement.bind(dom.window.document);
dom.window.document.createElement = (tag) => {
    const el = originalCreateElement(tag);
    if (tag === 'a') {
        // Intercept click
        el.click = () => {
            downloadLinkCreated = true;
            downloadUrl = el.href;
            console.log("Download triggered for:", el.download);
        };
    }
    // Handle script tag for JSZip loading
    if (tag === 'script') {
        setTimeout(() => {
            if (el.onload) el.onload();
        }, 10);
    }
    return el;
};

// Execute script
try {
    console.log("Executing property-clipper.js...");
    // We need to make sure JSZip is available on window for the script to skip loading or load successfully
    dom.window.JSZip = MockJSZip;
    eval(scriptCode);
} catch (e) {
    console.error("Script evaluation failed", e);
    process.exit(1);
}

// Verification Steps
console.log("Verifying UI elements...");

// 1. Verify Modal Exists
const modal = dom.window.document.getElementById('pc-bookmarklet-modal');
assert.ok(modal, "Modal should exist");

// 2. Verify Buttons exist for each strategy
const buttons = modal.querySelectorAll('button');
console.log("Buttons found (innerText):", Array.from(buttons).map(b => b.innerText));
const strButton = Array.from(buttons).find(b => b.innerText.includes('Short-Term Rental'));
assert.ok(strButton, "STR Button should exist");
console.log("✅ STR Button found.");

// 3. Trigger extraction (Click STR)
console.log("Clicking STR button...");
strButton.click();

// Wait for async operations (fetching photos, zipping)
// Since we mocked fetch and JSZip, it should be relatively fast but still async.
setTimeout(() => {
    if (downloadLinkCreated) {
        console.log("✅ Download triggered successfully.");
        console.log(`   URL: ${downloadUrl}`);
        process.exit(0);
    } else {
        console.error("❌ Download not triggered within timeout.");
        process.exit(1);
    }
}, 1000);
