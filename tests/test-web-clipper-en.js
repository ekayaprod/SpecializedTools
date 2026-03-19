const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Path to the script under test
const scriptPath = path.join(__dirname, '../bookmarklets/i18n/web-clipper-en.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

console.log('Running Web Clipper English Translation Tests (No JSDOM)...');

let passed = 0;
let failed = 0;

function runTestCase(name, testFn) {
    try {
        console.log(`Running: ${name}`);
        testFn();
        console.log(`✅ Passed: ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ Failed: ${name}`);
        console.error(e);
        failed++;
    }
}

// Test Case 1: Initialization
runTestCase('Initialize WebClipperConstants on window mock', () => {
    const windowMock = {};

    // Execute script with windowMock as 'window'
    // The script is an IIFE that takes 'window' as argument: (function (w) { ... })(window);
    // We can wrap it to pass our mock.
    const wrappedScript = `(function (window) { ${scriptCode} })(windowMock);`;

    // Use Function constructor to provide windowMock in scope
    const fn = new Function('windowMock', wrappedScript);
    fn(windowMock);

    const constants = windowMock.WebClipperConstants;
    assert.ok(constants, 'WebClipperConstants should be created');
    assert.strictEqual(typeof constants, 'object', 'WebClipperConstants should be an object');
});

// Test Case 2: Verify all expected keys exist and are strings
runTestCase('Verify all expected keys and values', () => {
    const windowMock = {};
    const wrappedScript = `(function (window) { ${scriptCode} })(windowMock);`;
    const fn = new Function('windowMock', wrappedScript);
    fn(windowMock);

    const constants = windowMock.WebClipperConstants;
    const expectedKeys = [
        'MSG_CAPTURING',
        'MSG_PROCESSING',
        'MSG_PROCESSING_PREFIX',
        'MSG_PROCESSING_SUFFIX',
        'TITLE_HEADER',
        'LABEL_PREVIEW',
        'BTN_CANCEL',
        'BTN_RETRY',
        'BTN_DOWNLOAD',
        'BTN_COPY',
        'BTN_COPIED',
        'BTN_ERROR',
        'BTN_CREATING_IMAGE',
        'FORMAT_HTML',
        'FORMAT_MD',
        'FORMAT_TXT',
        'FORMAT_PNG',
        'FILENAME_DEFAULT',
        'ERR_HTML2CANVAS',
        'ERR_PNG_EXPORT',
        'ERR_EDITOR_OPEN',
    ];

    expectedKeys.forEach((key) => {
        assert.ok(key in constants, `Key '${key}' should exist in WebClipperConstants`);
        assert.strictEqual(typeof constants[key], 'string', `Value for '${key}' should be a string`);
        assert.ok(constants[key].length > 0, `Value for '${key}' should not be empty`);
    });
});

// Test Case 3: Verify specific values
runTestCase('Verify specific translation values', () => {
    const windowMock = {};
    const wrappedScript = `(function (window) { ${scriptCode} })(windowMock);`;
    const fn = new Function('windowMock', wrappedScript);
    fn(windowMock);

    const constants = windowMock.WebClipperConstants;

    assert.strictEqual(constants.TITLE_HEADER, 'Web Clipper');
    assert.strictEqual(constants.BTN_CANCEL, 'Cancel');
    assert.strictEqual(constants.FILENAME_DEFAULT, 'Clipped_Content');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
}
