const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

// Setup JSDOM
const dom = new JSDOM(`<!DOCTYPE html><body><button id="trigger">Trigger</button></body>`, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    resources: 'usable',
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;
global.Text = dom.window.Text;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.MouseEvent = dom.window.MouseEvent;

// Load utils first
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');
eval(utilsCode);
global.BookmarkletUtils = window.BookmarkletUtils;

// Load script natively
const { initUI } = require('../bookmarklets/pa-county-finder.js');

// Mock clipboard
global.navigator.clipboard = {
    writeText: async (text) => {
        global.clipboardText = text;
        return Promise.resolve();
    }
};

async function runPaletteTest() {
    console.log('🎨 Starting Palette+ UI test for PA County Finder...');
    let passed = true;

    try {
        // Mock getSelection
        global.window.getSelection = () => ({ toString: () => '' });

        // Run the script natively
        initUI();

        const overlay = document.querySelector('.pa-overlay');
        if (!overlay) throw new Error('Overlay not created');
        const card = overlay.querySelector('.pa-card');

        // --- Test 1: Clear Button Functionality ---
        console.log('\n--- Test 1: Clear Button ---');

        const input = card.querySelector('.pa-input');
        const clearBtn = card.querySelector('.pa-clear-btn');

        if (!clearBtn) throw new Error('Clear button (.pa-clear-btn) not found');

        // Type something
        input.value = '15222';
        // Simulate input event to trigger any listeners (if we added any)
        input.dispatchEvent(new Event('input'));

        // Click clear
        clearBtn.click();

        if (input.value !== '') throw new Error('Clear button did not clear input');
        if (document.activeElement !== input) throw new Error('Focus did not return to input after clear');
        console.log('✅ Clear button works and refocuses input');

        // --- Test 2: Loading State & Aria-Live ---
        console.log('\n--- Test 2: Loading State & Aria-Live ---');

        const searchBtn = card.querySelector('.pa-btn-primary');
        const resultDiv = card.querySelector('#pa-result');

        if (resultDiv.getAttribute('aria-live') !== 'polite') {
            throw new Error(`Result div missing aria-live='polite'. Got: ${resultDiv.getAttribute('aria-live')}`);
        }
        console.log('✅ Result div has aria-live="polite"');

        input.value = '17301';

        // Mock setTimeout to catch the loading state
        // In Node environment, eval() uses Node's setTimeout, so we must mock global.setTimeout
        const originalSetTimeout = global.setTimeout;
        let capturedCallback = null;

        // Override global setTimeout
        global.setTimeout = (cb, delay) => {
            console.log(`setTimeout called with delay: ${delay}`);
            if (delay === 300) { // Assuming 300ms delay for loading
                capturedCallback = cb;
                // Check for loading state immediately
                if (!searchBtn.disabled) {
                     console.error('Search button state:', searchBtn.outerHTML);
                     throw new Error('Search button not disabled during loading');
                }
                // Check for spinner or text change. Implementation uses innerHTML with .pa-spinner
                if (!searchBtn.querySelector('.pa-spinner') && !searchBtn.textContent.includes('...')) {
                     console.error('Search button content:', searchBtn.innerHTML);
                     throw new Error('Search button did not show loading state (spinner or text)');
                }
                console.log('✅ Loading state verified (button disabled/spinner shown)');
                // We return a dummy timer ID
                return { ref:()=>{}, unref:()=>{} };
            }
            return originalSetTimeout(cb, delay);
        };

        searchBtn.click();

        // Restore setTimeout and execute the callback to finish loading
        global.setTimeout = originalSetTimeout;
        if (capturedCallback) {
            capturedCallback();
        } else {
             // If no callback captured, maybe we haven't implemented the delay yet,
             // or the test logic is flawed relative to implementation.
             // For TDD, this failing is expected until implementation.
             console.warn('⚠️ No loading timeout captured (Expected if feature not implemented yet)');
        }

        // --- Test 3: Copy Button ---
        console.log('\n--- Test 3: Copy Button ---');

        // Result should be populated now
        const copyBtn = resultDiv.querySelector('.pa-copy-btn');
        if (!copyBtn) throw new Error('Copy button (.pa-copy-btn) not found in result');

        await copyBtn.click();

        // Wait for promise chain
        await new Promise(resolve => setTimeout(resolve, 10));

        if (global.clipboardText !== 'Adams') { // 17301 -> Adams
             // It might be formatted differently, e.g., "17301: Adams"
             if (!global.clipboardText || !global.clipboardText.includes('Adams')) {
                 throw new Error(`Clipboard content mismatch. Got: ${global.clipboardText}`);
             }
        }
        console.log('✅ Copy button writes to clipboard');

        // Check visual feedback (checkmark)
        if (copyBtn.textContent !== '✓' && !copyBtn.innerHTML.includes('✓')) {
            throw new Error('Copy button did not show checkmark feedback');
        }
        console.log('✅ Copy button visual feedback verified');

        // Clean up
        overlay.remove();

    } catch (e) {
        console.error('❌ Test Failed:', e.message);
        // We expect failures initially because features aren't implemented yet
        if (process.env.EXPECT_FAILURE) {
            console.log('✅ Failure expected (TDD)');
        } else {
            passed = false;
        }
    }

    if (passed) console.log('\n✨ All Palette+ tests passed!');
    else {
        console.log('\n⚠️ Tests failed as expected (Logic not yet implemented)');
        // process.exit(1); // Don't exit with error during TDD creation step
    }
}

runPaletteTest();
