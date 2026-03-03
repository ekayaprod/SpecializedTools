const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><body></body>', {
    url: 'http://localhost/',
    runScripts: 'dangerously',
});

// Setup globals required by pa-county-finder.js
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock BookmarkletUtils
global.BookmarkletUtils = {
    escapeHtml: (str) => str,
};

const scriptPath = path.join(__dirname, '../bookmarklets/pa-county-finder.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

// If we just use runInThisContext via `vm`, c8 tracks it?
const vm = require('vm');

try {
    const sandbox = {
        window: global.window,
        document: global.document,
        navigator: global.navigator,
        HTMLElement: global.HTMLElement,
        BookmarkletUtils: global.BookmarkletUtils,
        setTimeout: global.setTimeout,
        console: global.console,
        // specifically omit module and exports
    };

    // Evaluate the code in the sandbox without module defined
    vm.runInNewContext(scriptContent, sandbox, { filename: scriptPath });

    // Check if initUI executed by looking for the overlay
    const overlay = sandbox.document.querySelector('.pa-overlay');
    assert(overlay !== null, "Overlay should be created by initUI() when module is not defined.");
    console.log('✅ initUI was successfully called in non-module environment.');
} catch (e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
}
