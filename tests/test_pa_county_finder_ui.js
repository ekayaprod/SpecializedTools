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

async function runUITest() {
    console.log('🚀 Starting UI test for PA County Finder...');
    let passed = true;

    try {
        // --- Test 1: Initialization & A11y Attributes ---
        console.log('\n--- Test 1: Initialization & A11y Attributes ---');

        // Mock getSelection
        global.window.getSelection = () => ({ toString: () => '' });

        // Set initial focus
        const trigger = document.getElementById('trigger');
        trigger.focus();

        // Mock focus on trigger to verify return
        let triggerFocused = false;
        trigger.focus = () => {
            triggerFocused = true;
        };

        // Run the script natively via initUI
        initUI();

        const overlay = document.querySelector('.pa-overlay');
        if (!overlay) throw new Error('Overlay (.pa-overlay) not created');

        // Check A11y
        if (overlay.getAttribute('role') !== 'dialog') throw new Error("Overlay missing role='dialog'");
        if (overlay.getAttribute('aria-modal') !== 'true') throw new Error("Overlay missing aria-modal='true'");
        console.log('✅ A11y attributes verified');

        const card = overlay.querySelector('.pa-card');
        if (!card) throw new Error('Card (.pa-card) not created');
        console.log('✅ Card created with correct class');

        // --- Test 2: Search Interaction (Visuals) ---
        console.log('\n--- Test 2: Search Interaction ---');

        const input = card.querySelector('.pa-input');
        if (input.getAttribute('aria-label') !== 'Enter ZIP code or City name') {
            throw new Error(`Input missing correct aria-label. Got: ${input.getAttribute('aria-label')}`);
        }
        console.log('✅ Input has correct aria-label');

        const searchBtn = card.querySelector('.pa-btn-primary');

        input.value = '17301';
        searchBtn.click();

        // Wait for loading delay (300ms)
        await new Promise(resolve => setTimeout(resolve, 350));

        const resultDiv = card.querySelector('#pa-result');
        if (!resultDiv) throw new Error('Result div not found');

        const resultText = resultDiv.textContent;
        if (!resultText.includes('Adams')) throw new Error(`Expected 'Adams' in result, got: ${resultText}`);

        // Check success class
        const successMsg = resultDiv.querySelector('.pa-result-card');
        if (!successMsg) throw new Error('Result missing .pa-result-card class');
        console.log('✅ Search result styled correctly');

        // --- Test 2b: Copy Button ---
        console.log('\n--- Test 2b: Copy Button ---');
        const copyBtn = resultDiv.querySelector('.pa-copy-btn');
        if (!copyBtn) throw new Error('Copy button not found');

        let clipboardText = '';
        global.navigator.clipboard = {
            writeText: async (text) => {
                clipboardText = text;
            }
        };

        copyBtn.click();

        // Wait for copy interaction
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!clipboardText.includes('Adams')) {
            throw new Error(`Expected 'Adams' in clipboard, got: ${clipboardText}`);
        }
        console.log('✅ Copy button writes to clipboard');

        // --- Test 3: Escape Key & Focus Return ---
        console.log('\n--- Test 3: Escape Key & Focus Return ---');

        const escapeEvent = new global.window.KeyboardEvent('keydown', {
            key: 'Escape',
            bubbles: true,
            cancelable: true,
        });

        document.dispatchEvent(escapeEvent);

        if (document.body.contains(overlay)) throw new Error('Overlay still in DOM after Escape');
        console.log('✅ Escape key closed overlay');

        if (!triggerFocused) throw new Error('Focus did not return to trigger element');
        console.log('✅ Focus returned to trigger element');

        // --- Test 4: With Selection & Close Button A11y ---
        console.log('\n--- Test 4: With Selection ---');

        // Mock selection
        global.window.getSelection = () => ({ toString: () => '15222' });

        // Run script again
        initUI();

        const overlay2 = document.querySelector('.pa-overlay');
        const closeBtn = overlay2.querySelector('button[aria-label="Close"]');

        if (!closeBtn) throw new Error("Close button missing aria-label='Close'");
        console.log('✅ Close button has aria-label');

        // Test clicking background overlay to close
        console.log('\n--- Test 4b: Click Background to Close ---');
        overlay2.click(); // Should close overlay
        if (document.body.contains(overlay2)) throw new Error('Clicking background overlay failed to close');
        console.log('✅ Clicking background overlay closed the dialog');


        // --- Test 5: XSS Prevention ---
        console.log('\n--- Test 5: XSS Prevention ---');

        // Mock selection to be empty so input appears
        global.window.getSelection = () => ({ toString: () => '' });

        // Run script again to get fresh instance
        initUI();

        const overlay3 = document.querySelector('.pa-overlay');
        const card3 = overlay3.querySelector('.pa-card');
        const input3 = card3.querySelector('.pa-input');
        const searchBtn3 = card3.querySelector('.pa-btn-primary');

        // Inject malicious payload that passes parseInt (starts with number)
        const xssInput = '15201<img src=x onerror=alert(1)>';
        input3.value = xssInput;
        searchBtn3.click();

        // Wait for loading delay (300ms)
        await new Promise(resolve => setTimeout(resolve, 350));

        const resultDiv3 = card3.querySelector('#pa-result');
        const resultHTML = resultDiv3.innerHTML;

        // Check that HTML tags are escaped
        if (resultHTML.includes('<img')) throw new Error('XSS vulnerability detected! Payload was not escaped.');
        if (!resultHTML.includes('&lt;img')) throw new Error('Expected escaped HTML entities.');
        console.log('✅ XSS payload escaped correctly');

        // --- Test 6: Clear Button & Empty Input ---
        console.log('\n--- Test 6: Clear Button & Empty Input ---');
        const clearBtn = card3.querySelector('.pa-clear-btn');
        if(!clearBtn) throw new Error('Clear button not found');

        input3.value = '15201';
        clearBtn.click();

        if (input3.value !== '') throw new Error('Clear button did not clear input');
        if (document.activeElement !== input3) throw new Error('Clear button did not focus input');
        console.log('✅ Clear button cleared and focused input');

        // Test empty submit
        input3.value = '';
        searchBtn3.click();

        // Should not trigger loading if empty
        if (searchBtn3.disabled) throw new Error('Search triggered on empty input');
        console.log('✅ Empty input ignores search');

        // Test Enter key
        input3.value = '15201';
        const enterEvent = new global.window.KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
        });
        input3.dispatchEvent(enterEvent);

        if (!searchBtn3.disabled) throw new Error('Enter key did not trigger search');
        console.log('✅ Enter key triggered search');

        // Clean up
        overlay3.remove();

        // --- Test 7: Error Result Update ---
        console.log('\n--- Test 7: Error Result Update ---');
        // Run script again to get fresh instance
        initUI();

        const overlay4 = document.querySelector('.pa-overlay');
        const card4 = overlay4.querySelector('.pa-card');
        const input4 = card4.querySelector('.pa-input');
        const searchBtn4 = card4.querySelector('.pa-btn-primary');

        input4.value = '99999';
        searchBtn4.click();

        // Wait for loading delay (300ms)
        await new Promise(resolve => setTimeout(resolve, 350));

        const resultDiv4 = card4.querySelector('#pa-result');
        if (!resultDiv4.querySelector('.pa-result-error')) {
            throw new Error('Error message not displayed for invalid query');
        }
        console.log('✅ Error message displayed correctly');

        overlay4.remove();

        // --- Test 8: Multiple clicks while loading ---
        console.log('\n--- Test 8: Multiple clicks while loading ---');
        initUI();
        const overlay5 = document.querySelector('.pa-overlay');
        const card5 = overlay5.querySelector('.pa-card');
        const input5 = card5.querySelector('.pa-input');
        const searchBtn5 = card5.querySelector('.pa-btn-primary');

        input5.value = '17301';
        searchBtn5.click();

        // btn should be disabled now
        if (!searchBtn5.disabled) throw new Error('Search button should be disabled after click');

        // Attempt a second click while disabled (should return early in performSearch)
        searchBtn5.click();

        // Attempt submit via Enter while disabled
        const enterEvent2 = new global.window.KeyboardEvent('keydown', {
            key: 'Enter',
            bubbles: true,
            cancelable: true,
        });
        input5.dispatchEvent(enterEvent2);

        await new Promise(resolve => setTimeout(resolve, 350));
        overlay5.remove();
        console.log('✅ Handled multiple clicks and enter gracefully');

    } catch (e) {
        console.error('❌ Test Failed:', e);
        passed = false;
        process.exit(1);
    }

    if (passed) console.log('\n✨ All UI tests passed!');
}

runUITest();
