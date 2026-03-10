const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/job-clipper.js');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
const utilsContent = fs.readFileSync(utilsPath, 'utf-8');

const regexToReplace = /}\)\(\);\s*$/;

// We need to extract UI methods to test it
const testableScript = `
    ${utilsContent}
    window.BookmarkletUtils = window.BookmarkletUtils || {};
    window.requestAnimationFrame = window.requestAnimationFrame || function(cb) { return setTimeout(cb, 0); };

    // Strip IIFE to execute in our dom
    ${scriptContent.replace('(function () {', '').replace(regexToReplace, '')}

    window.createJobModal = createJobModal;
    window.closeModal = closeModal;
`;

function createDOM(html) {
    const dom = new JSDOM(html, { runScripts: 'dangerously' });

    // Polyfill for clipboard
    dom.window.navigator.clipboard = {
        writeText: async (text) => {
            dom.window._clipboardText = text;
        }
    };

    const el = dom.window.document.createElement('script');
    el.textContent = testableScript;
    dom.window.document.body.appendChild(el);
    return dom.window;
}

function runTests() {
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${name}`);
            console.error(e.message);
            failed++;
        }
    }

    // --- TEST SUITE --- //

    (async function runAll() {
        await test('UI - creates modal and overlay', () => {
            const win = createDOM(`<body></body>`);
            assert.ok(win.document.getElementById('jc-job-overlay'));
            assert.ok(win.document.getElementById('jc-job-modal'));
            assert.ok(win.document.querySelector('.jc-textarea'));
        });

        await test('UI - close button removes modal and overlay', () => {
            const win = createDOM(`<body></body>`);
            assert.ok(win.document.getElementById('jc-job-overlay'));

            const closeBtn = win.document.querySelector('.jc-btn-ghost');
            assert.ok(closeBtn, "Close button not found");
            closeBtn.click();

            assert.strictEqual(win.document.getElementById('jc-job-overlay'), null);
            assert.strictEqual(win.document.getElementById('jc-job-modal'), null);
        });

        await test('UI - copy button copies text and updates UI', async () => {
            const win = createDOM(`<body></body>`);

            const copyBtn = win.document.querySelector('.jc-btn-primary');
            const txtArea = win.document.querySelector('.jc-textarea');
            assert.ok(copyBtn, "Copy button not found");
            assert.ok(txtArea, "Text area not found");

            txtArea.value = 'Mock Resume Prompt';

            copyBtn.click();

            // Wait for microtask queue to process async clipboard API
            await new Promise(resolve => setTimeout(resolve, 10));

            assert.strictEqual(win._clipboardText, 'Mock Resume Prompt');
            assert.ok(copyBtn.innerHTML.includes('Copied!'));
            assert.ok(copyBtn.classList.contains('jc-btn-success'));
        });

        await test('UI - creates modal only once', () => {
            const win = createDOM(`<body></body>`);
            const overlaysBefore = win.document.querySelectorAll('.jc-overlay').length;
            assert.strictEqual(overlaysBefore, 1);

            win.createJobModal(); // Call again

            const overlaysAfter = win.document.querySelectorAll('.jc-overlay').length;
            assert.strictEqual(overlaysAfter, 1);
        });

        // Summary
        console.log(`\nTests: ${passed} passed, ${failed} failed`);
        if (failed > 0) process.exit(1);
    })();
}

runTests();
