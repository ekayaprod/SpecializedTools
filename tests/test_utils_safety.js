const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
const htmPath = path.join(__dirname, '../bookmarklets/html-to-markdown.js');
const htmCode = fs.readFileSync(htmPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(
    `<!DOCTYPE html>
<body>
    <div id="root">
        <!-- Generic Element -->
        <div id="generic">Just a div</div>

        <!-- Image Element needing normalization -->
        <img id="img1" data-src="real.jpg" src="spacer.gif" loading="lazy" width="100" height="100">

        <!-- Picture Element needing fallback -->
        <picture id="pic1">
            <source srcset="large.jpg 1000w, medium.jpg 500w">
            <img src="spacer.gif" alt="Fallback">
        </picture>

        <!-- Nested Structure -->
        <div id="nested">
            <img id="img2" srcset="image-1x.jpg 1x, image-2x.jpg 2x" src="spacer.gif">
        </div>
    </div>
</body>
`,
    { url: 'http://localhost/' }
);

global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLImageElement = dom.window.HTMLImageElement;
global.HTMLPictureElement = dom.window.HTMLPictureElement;
global.HTMLCollection = dom.window.HTMLCollection; // Important for children access
global.DOMParser = dom.window.DOMParser;
global.performance = { now: () => Date.now() }; // Mock performance.now

// Execute utils.js
try {
    eval(utilsCode);
    eval(htmCode);
} catch (e) {
    console.error('Error evaluating scripts:', e);
    process.exit(1);
}

// Minimal Test Runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

async function it(name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.error(`  ❌ ${name}:`);
        console.error(`     ${e.message.replace(/\n/g, '\n     ')}`);
        process.exitCode = 1;
    }
}

describe('BookmarkletUtils Type Safety & Robustness', () => {

    it('should safely normalize mixed DOM content without type errors', async () => {
        const root = document.getElementById('root');

        // Execute normalization
        await window.BookmarkletUtils.normalizeImages(root);

        // Assert Image 1 (Basic img)
        const img1 = document.getElementById('img1');
        assert.ok(img1.src.endsWith('real.jpg'), 'Image 1 src should be resolved from data-src');
        assert.strictEqual(img1.hasAttribute('loading'), false, 'Image 1 loading attribute should be removed');
        assert.strictEqual(img1.hasAttribute('width'), false, 'Image 1 width attribute should be removed');
        assert.strictEqual(img1.style.maxWidth, '100%', 'Image 1 maxWidth style should be set');

        // Assert Picture 1 (Picture fallback)
        const pic1 = document.getElementById('pic1');
        const picImg = pic1.querySelector('img');
        // The logic picks the first source from srcset: "large.jpg"
        assert.ok(picImg.src.endsWith('large.jpg'), 'Picture fallback img src should be updated from source srcset');

        // Assert Image 2 (Nested img with srcset)
        const img2 = document.getElementById('img2');
        // The logic picks the LAST candidate from srcset: "image-2x.jpg"
        assert.ok(img2.src.endsWith('image-2x.jpg'), 'Image 2 src should be resolved from srcset (highest res)');
    });

    it('should handle traverse on diverse node types safely', () => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h1>Header</h1>
            <!-- Comment -->
            <p>Text</p>
            <script>console.log('ignored')</script>
            <img src="test.png" alt="Test">
        `;

        const markdown = window.BookmarkletUtils.htmlToMarkdown(div.innerHTML);

        assert.ok(markdown.includes('# Header'), 'Markdown should include header');
        assert.ok(markdown.includes('![Test](test.png)'), 'Markdown should include image');
        assert.ok(!markdown.includes('console.log'), 'Markdown should exclude script content');
    });
});
