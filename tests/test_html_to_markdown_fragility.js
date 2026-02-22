const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.Node = dom.window.Node;
global.HTMLElement = dom.window.HTMLElement;

// Execute utils.js
try {
    eval(utilsCode);
} catch (e) {
    console.error('Error evaluating utils.js:', e);
    process.exit(1);
}

// Verify BookmarkletUtils exists
if (!window.BookmarkletUtils) {
    console.error('BookmarkletUtils not found on window');
    process.exit(1);
}

console.log('Running htmlToMarkdown fragility tests...');

try {
    // Test 1: Null Input (Fragility)
    console.log('Test 1: Null Input');
    try {
        const result = window.BookmarkletUtils.htmlToMarkdown(null);
        if (result === '') {
            console.log('✅ Null input handled gracefully');
        } else {
             console.error('❌ Null input returned unexpected result:', result);
             process.exit(1);
        }
    } catch (e) {
        console.error('❌ Null input caused crash:', e.message);
        process.exit(1); // Fail the test
    }

    // Test 2: Undefined Input (Fragility)
    console.log('Test 2: Undefined Input');
    try {
        const result = window.BookmarkletUtils.htmlToMarkdown(undefined);
        if (result === '') {
            console.log('✅ Undefined input handled gracefully');
        } else {
             console.error('❌ Undefined input returned unexpected result:', result);
             process.exit(1);
        }
    } catch (e) {
        console.error('❌ Undefined input caused crash:', e.message);
        process.exit(1); // Fail the test
    }

    // Test 3: Empty String (Edge Case)
    console.log('Test 3: Empty String');
    const resultEmpty = window.BookmarkletUtils.htmlToMarkdown('');
    assert.strictEqual(resultEmpty, '', 'Empty string should return empty string');
    console.log('✅ Empty string passed');

    // Test 4: Valid HTML (Happy Path)
    console.log('Test 4: Valid HTML');
    const html = '<h1>Title</h1><p>Body</p>';
    const md = window.BookmarkletUtils.htmlToMarkdown(html);
    assert.ok(md.includes('# Title'), 'Markdown should contain title');
    assert.ok(md.includes('Body'), 'Markdown should contain body');
    console.log('✅ Valid HTML passed');

    // Test 5: Non-string Input (Fragility)
    console.log('Test 5: Non-string Input');
    try {
        const result = window.BookmarkletUtils.htmlToMarkdown(12345);
        if (result === '') {
             console.log('✅ Non-string input handled gracefully');
        } else {
             console.error('❌ Non-string input returned unexpected result (expected empty string):', result);
             process.exit(1);
        }
    } catch (e) {
         console.error('❌ Non-string input caused crash:', e.message);
         process.exit(1);
    }

    console.log('All tests passed!');

} catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
}
