const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/web-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
const constantsPath = path.join(__dirname, '../bookmarklets/i18n/web-clipper-en.js');
const constantsCode = fs.readFileSync(constantsPath, 'utf8');

// Create JSDOM
const dom = new JSDOM(
    `<!DOCTYPE html><body></body>`,
    {
        url: 'http://localhost/',
        runScripts: 'dangerously',
        resources: 'usable',
    }
);

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.ClipboardItem = class ClipboardItem {};

// Mock matchMedia
global.reduceMotion = false; // Default state

global.window.matchMedia = (query) => {
    if (query.includes('prefers-reduced-motion: no-preference')) {
        return { matches: !global.reduceMotion };
    }
    if (query.includes('prefers-reduced-motion: reduce')) {
        return { matches: global.reduceMotion };
    }
    return { matches: false };
};

// Mock BookmarkletUtils
global.window.BookmarkletUtils = {
    normalizeImages: async () => {},
    inlineStylesAsync: async () => {},
    sanitizeAttributes: () => {},
    sanitizeFilename: (s) => s,
    loadLibrary: async () => {},
    downloadFile: () => {},
    htmlToMarkdown: () => {},
    showToast: () => {},
};

async function runVerification() {
    console.log('🎨 Starting Virtuoso Verification...');

    // 1. Verify Constants (Wordsmith)
    eval(constantsCode);
    const C = window.WebClipperConstants;
    assert.strictEqual(C.BTN_CANCEL, 'Cancel', 'BTN_CANCEL should be "Cancel"');
    assert.strictEqual(C.BTN_CREATING_IMAGE, 'Rendering Image...', 'BTN_CREATING_IMAGE should be "Rendering Image..."');
    assert.strictEqual(C.ERR_HTML2CANVAS, 'Image library unavailable.', 'ERR_HTML2CANVAS check failed');
    assert.strictEqual(C.ERR_PNG_EXPORT, 'Export failed.', 'ERR_PNG_EXPORT check failed');
    console.log('✅ Wordsmith (Copy) Verified');

    // 2. Verify Palette+ (Transition) - Motion Enabled
    global.reduceMotion = false;
    eval(scriptCode); // Load Clipper

    const instance = window.__wc_instance;
    // We can call getOrCreateHighlightEl directly since it is a method
    const highlight = instance.getOrCreateHighlightEl('wc-bookmarklet-highlight', '1px solid red', 'blue', '100');

    assert.ok(highlight.style.transition.includes('all 0.15s ease-out'), 'Transition should be present when motion is preferred');
    console.log('✅ Palette+ (Motion) Verified');

    // 3. Verify Palette+ (Transition) - Reduced Motion
    // Reset instance and DOM
    if (instance) instance.destroy();
    document.body.innerHTML = '';
    global.reduceMotion = true;

    // Re-eval script to re-initiate
    eval(scriptCode);
    const instance2 = window.__wc_instance;
    const highlight2 = instance2.getOrCreateHighlightEl('wc-bookmarklet-highlight', '1px solid red', 'blue', '100');

    assert.strictEqual(highlight2.style.transition, '', 'Transition should NOT be present when reduced motion is requested');
    console.log('✅ Palette+ (Reduced Motion) Verified');

    // 4. Verify Curator (Assets) - Spinner
    global.reduceMotion = false;
    instance2.showLoadingOverlay('Test Loading');
    const overlay = document.getElementById('wc-loading');
    assert.ok(overlay, 'Overlay should exist');

    const svg = overlay.querySelector('svg');
    assert.ok(svg, 'SVG Spinner should exist');
    assert.strictEqual(svg.getAttribute('role'), 'status', 'SVG should have role="status"');
    assert.strictEqual(svg.getAttribute('aria-label'), 'Loading', 'SVG should have aria-label="Loading"');

    const animate = svg.querySelector('animateTransform');
    assert.ok(animate, 'Animation should be present (motion enabled)');
    console.log('✅ Curator (Spinner Asset) Verified');

    // 5. Verify Curator (Assets) - Spinner Reduced Motion
    instance2.hideLoadingOverlay();
    global.reduceMotion = true;
    instance2.showLoadingOverlay('Test Loading 2');
    const overlay2 = document.getElementById('wc-loading');
    const svg2 = overlay2.querySelector('svg');
    const animate2 = svg2.querySelector('animateTransform');

    // Check if animation is commented out or removed
    assert.strictEqual(animate2, null, 'Animation should be removed/commented out for reduced motion');
    // Ensure the path is still there
    assert.ok(svg2.querySelector('path'), 'Spinner path should still exist');
    console.log('✅ Curator (Spinner Reduced Motion) Verified');

    console.log('🎉 All Polish Verified!');
}

runVerification().catch(e => {
    console.error('Verification Failed:', e);
    process.exit(1);
});
