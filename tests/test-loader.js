const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Path to the script under test
const scriptPath = path.join(__dirname, '../bookmarklets/prompts/loader.js');
let scriptCode = fs.readFileSync(scriptPath, 'utf8');

console.log('Running Prompt Loader Tests...');

let passed = 0;
let failed = 0;

function runTestCase(name, testFn) {
    try {
        console.log(`Running: ${name}`);
        // Create a fresh mock window for each test case
        const mockWindow = {};
        testFn(mockWindow);
        console.log(`✅ Passed: ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ Failed: ${name}`);
        console.error(e);
        failed++;
    }
}

// Strip the IIFE and run inside a Function to mock window
// The file is (function (w) { ... })(window);
// We can just evaluate the scriptCode as it is, but replace window with our mock Window
// Or even better: just evaluate the source with new Function('window', scriptCode)(mockWindow) will fail because the script is `(function(w) {})(window)`. Wait, it will try to access the global `window`.
// Let's strip the IIFE wrapper or execute it by providing window in scope.

// Since the script code has `})(window);` at the end, it references `window`.
// If we evaluate:
// `new Function('window', scriptCode)(mockWindow)`
// Inside the function, the `window` identifier points to `mockWindow`, so `})(window);` passes `mockWindow` as `w`.

// Test Case 1: Initialize from scratch
runTestCase('Initialize BookmarkletUtils and Prompts when undefined', (mockWindow) => {
    assert.strictEqual(mockWindow.BookmarkletUtils, undefined, 'Start with undefined utils');

    // Execute script
    new Function('window', scriptCode)(mockWindow);

    const utils = mockWindow.BookmarkletUtils;
    assert.ok(utils, 'BookmarkletUtils should be created');
    assert.ok(utils.Prompts, 'Prompts object should be attached');
    assert.ok(utils.Prompts.PROMPT_DATA, 'PROMPT_DATA should exist');
    assert.ok(utils.Prompts.STANDARD_OUTPUTS, 'STANDARD_OUTPUTS should exist');
});

// Test Case 2: Preserve existing utils
runTestCase('Preserve existing BookmarkletUtils properties', (mockWindow) => {
    // Setup existing utils
    mockWindow.BookmarkletUtils = { existingProp: 'test' };

    // Execute script
    new Function('window', scriptCode)(mockWindow);

    const utils = mockWindow.BookmarkletUtils;
    assert.strictEqual(utils.existingProp, 'test', 'Existing property should be preserved');
    assert.ok(utils.Prompts, 'Prompts should be added');
});

// Test Case 3: Verify PROMPT_DATA structure
runTestCase('Verify PROMPT_DATA keys and structure', (mockWindow) => {
    new Function('window', scriptCode)(mockWindow);

    const data = mockWindow.BookmarkletUtils.Prompts.PROMPT_DATA;
    const expectedKeys = ['str', 'ltr', 'flip', 'househack', 'appraisal'];

    expectedKeys.forEach(key => {
        assert.ok(data[key], `Key '${key}' should exist in PROMPT_DATA`);
        assert.ok(data[key].label, `Key '${key}' should have a label`);
        assert.ok(data[key].role, `Key '${key}' should have a role`);
        assert.ok(data[key].objective, `Key '${key}' should have an objective`);
    });
});

// Test Case 4: Verify specific data integrity
runTestCase('Verify specific prompt data integrity', (mockWindow) => {
    new Function('window', scriptCode)(mockWindow);

    const data = mockWindow.BookmarkletUtils.Prompts.PROMPT_DATA;

    // Check STR
    assert.strictEqual(data.str.label, 'Short-Term Rental (STR)');
    assert.ok(data.str.role.includes('Senior STR Investment Analyst'));
    assert.strictEqual(data.str.noStandardOutput, true, 'STR should have noStandardOutput: true');

    // Check Flip (should allow standard output)
    assert.strictEqual(data.flip.label, 'Fix & Flip');
    assert.strictEqual(data.flip.noStandardOutput, undefined, 'Flip should not have noStandardOutput set (defaults to falsey)');

    // Check placeholders (since we are in test env, @include_text is literal)
    // The script contains literal strings like `/* @include_text prompts/str-objective.md */`
    // We confirm this structure to ensure the build system has something to replace.
    assert.ok(data.str.objective.includes('@include_text prompts/str-objective.md'), 'Objective should contain include directive');
});

console.log(`\nSummary: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
}
