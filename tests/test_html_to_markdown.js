const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <div id="test-content"></div>
</body>
`, { url: "http://localhost/" });

global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.Uint32Array = Uint32Array;

// Mock crypto
global.window.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
            arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
    }
};

// Execute utils.js
try {
    eval(utilsCode);
} catch (e) {
    console.error("Error evaluating utils.js:", e);
    process.exit(1);
}

// Verify BookmarkletUtils exists
if (!window.BookmarkletUtils) {
    console.error("BookmarkletUtils not found on window");
    process.exit(1);
}

// Minimal Test Runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.error(`  ❌ ${name}:`);
        console.error(`     ${e.message.replace(/\n/g, '\n     ')}`);
        process.exitCode = 1;
    }
}

// Tests
describe('BookmarkletUtils.htmlToMarkdown', () => {

    // 1. Basic Text
    it('should convert basic paragraphs to text', () => {
        const input = '<p>Hello World</p>';
        const expected = 'Hello World';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 2. Headings
    it('should convert headings (h1-h3) to Markdown headers', () => {
        const input = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
        const expected = '# Title\n\n## Subtitle\n\n### Section';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 3. Bold & Italic
    it('should convert strong/b to bold and em/i to italic', () => {
        const input = '<p>This is <strong>bold</strong> and this is <em>italic</em>.</p>';
        const expected = 'This is **bold** and this is *italic*.';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 4. Links
    it('should convert anchors to Markdown links', () => {
        const input = '<a href="https://example.com">Example</a>';
        const expected = '[Example](https://example.com)';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 5. Images
    it('should convert images to Markdown images', () => {
        const input = '<img src="image.jpg" alt="Description">';
        const expected = '![Description](image.jpg)';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 6. Lists (Unordered)
    it('should convert unordered lists to hyphenated lists', () => {
        const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        const expected = '- Item 1\n- Item 2';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 7. Lists (Ordered)
    it('should convert ordered lists to numbered lists', () => {
        const input = '<ol><li>First</li><li>Second</li></ol>';
        const expected = '1. First\n2. Second';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 8. Nested Lists
    it('should handle nested lists flatly (current implementation)', () => {
        const input = '<ul><li>Parent<ul><li>Child</li></ul></li></ul>';
        const expected = '- Parent\n- Child';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 9. Table
    it('should convert tables to pipe syntax', () => {
        const input = '<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>';
        const expected = '| Header|\n| Cell|';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });

    // 10. Complex Mixed Content
    it('should handle mixed content with proper spacing', () => {
        const input = '<h1>My Page</h1><p>Start with a <strong>bold</strong> statement.</p><ul><li>Point 1</li><li>Point 2</li></ul>';
        // Correct expectation after fixing `p` tag spacing
        const expected = '# My Page\n\nStart with a **bold** statement.\n\n- Point 1\n- Point 2';
        const result = window.BookmarkletUtils.htmlToMarkdown(input);
        assert.strictEqual(result.trim(), expected);
    });
});
