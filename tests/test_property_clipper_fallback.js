const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
let scriptCode = fs.readFileSync(scriptPath, 'utf8');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
const promptsPath = path.join(__dirname, '../bookmarklets/prompts/loader.js');
const promptsCode = fs.readFileSync(promptsPath, 'utf8');

// Instrument script to expose internals
// Replace IIFE wrapper to return internals
// Original: (function () { ... })();
// New: global.ExposedClipper = (function () { ... return { PropertyExtractor, ImageProcessor }; })();

// Find start of IIFE
scriptCode = scriptCode.replace(/^\s*\(function\s*\(\)\s*\{/, 'global.ExposedClipper = (function () {');

// Find end of IIFE (lastline)
// It ends with })();
// We want to inject return statement before the closing brace.
const lastIndex = scriptCode.lastIndexOf('})();');
if (lastIndex !== -1) {
    const injection = '\nreturn { PropertyExtractor, ImageProcessor };\n';
    // scriptCode.slice(0, lastIndex) leaves everything BEFORE })();
    // So we just append injection then })();
    scriptCode = scriptCode.slice(0, lastIndex) + injection + '})();';
} else {
    throw new Error('Could not find IIFE end in property-clipper.js');
}

// Setup JSDOM
const dom = new JSDOM(
    `<!DOCTYPE html>
<body>
    <h1 id="address-header">123 Fallback St, Test City, TS 99999</h1>
    <div data-testid="ldp-list-price">$500,000</div>
    <ul data-testid="key-facts">
        <li>Beds: 3</li>
        <li>Baths: 2</li>
        <li>Sqft: 2000</li>
    </ul>
    <!-- Corrupt JSON Script -->
    <script id="__NEXT_DATA__" type="application/json">{ "invalid": "json", broken }</script>
</body>
`,
    {
        url: 'https://www.realtor.com/realestateandhomes-detail/123-Fallback-St_Test-City_TS_99999',
        runScripts: 'dangerously',
        resources: 'usable',
    }
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.FileReader = dom.window.FileReader;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.window.alert = console.log;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

// Polyfill innerText for JSDOM if needed (JSDOM's innerText can be flaky or require layout)
Object.defineProperty(global.HTMLElement.prototype, 'innerText', {
    get() {
        return this.textContent;
    },
    set(value) {
        this.textContent = value;
    },
});

// Mock Image
class MockImage {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        this.width = 100;
        this.height = 100;
        setTimeout(() => {
            if (this.src.includes('error')) {
                if (this.onerror) this.onerror(new Error('Mock Image Error'));
            } else {
                if (this.onload) this.onload();
            }
        }, 10);
    }
}
global.window.Image = MockImage;
global.Image = MockImage;

// Mock Canvas
global.HTMLCanvasElement.prototype.getContext = () => ({
    drawImage: () => {},
    fillRect: () => {},
});
global.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,mockdata';

// Execute Dependencies
try {
    console.log('Executing utils.js...');
    eval(utilsCode);
    global.BookmarkletUtils = window.BookmarkletUtils;

    console.log('Executing prompts/loader.js...');
    let resolvedPromptsCode = promptsCode;
    const includeRegex = /\/\*\s*@include_text\s+['"]?([^'"]+)['"]?\s*\*\//g;
    let match;
    const replacements = [];
    while ((match = includeRegex.exec(resolvedPromptsCode)) !== null) {
        replacements.push({ fullMatch: match[0], path: match[1].trim() });
    }
    for (const rep of replacements) {
        const incPath = path.join(__dirname, '../bookmarklets/' + rep.path);
        if (fs.existsSync(incPath)) {
            let incText = fs.readFileSync(incPath, 'utf8');
            incText = incText.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
            resolvedPromptsCode = resolvedPromptsCode.replace(rep.fullMatch, incText);
        }
    }
    eval(resolvedPromptsCode);

    console.log('Executing instrumented property-clipper.js...');
    eval(scriptCode);
} catch (e) {
    console.error('Script evaluation failed', e);
    process.exit(1);
}

async function runTests() {
    console.log('Starting Tests...');
    const { PropertyExtractor, ImageProcessor } = global.ExposedClipper;

    assert.ok(PropertyExtractor, 'PropertyExtractor should be exposed');
    assert.ok(ImageProcessor, 'ImageProcessor should be exposed');

    // TEST 1: DOM Fallback (with Corrupt JSON)
    console.log('\nTest 1: DOM Fallback extraction (Corrupt JSON present)');
    // The JSDOM is setup with corrupt JSON.
    // So JSON extraction should fail (logged to console), and it should fallback to DOM.

    // Spy on console.warn to verify JSON failure
    let warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args);

    const data = PropertyExtractor.getData();

    console.warn = originalWarn; // Restore

    // Verify Warning
    const jsonWarning = warnings.find((w) => w[0] && w[0].includes('JSON Parse Error'));
    if (jsonWarning) {
        console.log('✅ correctly warned about JSON failure.');
    } else {
        console.error('❌ Failed to warn about JSON failure.');
        process.exit(1);
    }

    // Verify Data Extraction from DOM
    assert.strictEqual(data.address, '123 Fallback St, Test City, TS 99999', 'Address should be extracted from H1');
    assert.strictEqual(data.price, '$500,000', 'Price should be extracted from div');

    // Verify Specs (Beds: 3, Baths: 2)
    // The DOM has "Beds: 3".
    assert.strictEqual(data.specs['Beds'], '3', 'Beds should be extracted');
    assert.strictEqual(data.specs['Baths'], '2', 'Baths should be extracted');

    console.log('✅ DOM Extraction successful.');

    // TEST 2: Image Processor Error Handling
    console.log('\nTest 2: Image Processor Error Handling');

    const errorUrl = 'http://example.com/error.jpg';
    const result = await ImageProcessor.process(errorUrl);

    assert.strictEqual(result, null, 'ImageProcessor should return null on error');
    console.log('✅ ImageProcessor handled error correctly.');

    // TEST 3: Image Processor Success
    console.log('\nTest 3: Image Processor Success');
    const successUrl = 'http://example.com/success.jpg';
    const successResult = await ImageProcessor.process(successUrl);

    assert.ok(successResult, 'ImageProcessor should return result on success');
    assert.ok(successResult.dataUrl, 'Result should have dataUrl');
    assert.strictEqual(successResult.width, 100, 'Width should be 100 (mock)');
    console.log('✅ ImageProcessor processed successfully.');
}

runTests()
    .then(() => {
        console.log('\nAll tests passed!');
    })
    .catch((e) => {
        console.error('\nTest failed:', e);
        process.exit(1);
    });
