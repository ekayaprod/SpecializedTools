const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

// Path to the script under test
const scriptPath = path.join(__dirname, '../bookmarklets/prompts/loader.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

/**
 * Helper to create a fresh JSDOM environment for each test case.
 */
function createEnv() {
    const dom = new JSDOM('<!DOCTYPE html><body></body>', {
        url: 'http://localhost/',
        runScripts: 'dangerously',
        resources: 'usable',
    });
    // Expose window globally so eval works
    global.window = dom.window;
    global.document = dom.window.document;

    // Clear BookmarkletUtils if it leaked from previous runs (though new JSDOM should prevent this on window, global pollution is possible)
    delete global.window.BookmarkletUtils;

    return dom;
}

console.log('Running Prompt Loader Tests...');

let passed = 0;
let failed = 0;

function runTestCase(name, testFn) {
    try {
        console.log(`Running: ${name}`);
        const dom = createEnv();
        testFn(dom);
        console.log(`✅ Passed: ${name}`);
        passed++;
    } catch (e) {
        console.error(`❌ Failed: ${name}`);
        console.error(e);
        failed++;
    } finally {
        // Cleanup globals to avoid pollution between tests
        delete global.window;
        delete global.document;
    }
}

// Test Case 1: Initialize from scratch
runTestCase('Initialize BookmarkletUtils and Prompts when undefined', (dom) => {
    assert.strictEqual(global.window.BookmarkletUtils, undefined, 'Start with undefined utils');

    // Execute script
    eval(scriptCode);

    const utils = global.window.BookmarkletUtils;
    assert.ok(utils, 'BookmarkletUtils should be created');
    assert.ok(utils.Prompts, 'Prompts object should be attached');
    assert.ok(utils.Prompts.PROMPT_DATA, 'PROMPT_DATA should exist');
    assert.ok(utils.Prompts.STANDARD_OUTPUTS, 'STANDARD_OUTPUTS should exist');
});

// Test Case 2: Preserve existing utils
runTestCase('Preserve existing BookmarkletUtils properties', (dom) => {
    // Setup existing utils
    global.window.BookmarkletUtils = { existingProp: 'test' };

    // Execute script
    eval(scriptCode);

    const utils = global.window.BookmarkletUtils;
    assert.strictEqual(utils.existingProp, 'test', 'Existing property should be preserved');
    assert.ok(utils.Prompts, 'Prompts should be added');
});

// Test Case 3: Verify PROMPT_DATA structure
runTestCase('Verify PROMPT_DATA keys and structure', (dom) => {
    eval(scriptCode);

    const data = global.window.BookmarkletUtils.Prompts.PROMPT_DATA;
    const expectedKeys = ['str', 'ltr', 'flip', 'househack', 'appraisal'];

    expectedKeys.forEach(key => {
        assert.ok(data[key], `Key '${key}' should exist in PROMPT_DATA`);
        assert.ok(data[key].label, `Key '${key}' should have a label`);
        assert.ok(data[key].role, `Key '${key}' should have a role`);
        assert.ok(data[key].objective, `Key '${key}' should have an objective`);
    });
});

// Test Case 4: Verify specific data integrity
runTestCase('Verify specific prompt data integrity', (dom) => {
    eval(scriptCode);

    const data = global.window.BookmarkletUtils.Prompts.PROMPT_DATA;

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
