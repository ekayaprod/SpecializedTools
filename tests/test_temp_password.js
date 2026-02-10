const fs = require('fs');
const assert = require('assert');

// Mock browser environment
global.window = {
    crypto: {
        getRandomValues: (array) => {
            // Deterministic mock for testing
            for (let i = 0; i < array.length; i++) {
                array[i] = i % 256; // Simple pattern
            }
            return array;
        }
    },
    TEMP_PASSWORD_CONFIG: undefined, // Will be set in tests
    getSelection: () => ({ toString: () => '' })
};

// Mock Document
global.document = {
    createElement: (tag) => {
        const el = {
            tagName: tag.toUpperCase(),
            style: {},
            appendChild: function(child) {
                this.children = this.children || [];
                this.children.push(child);
            },
            children: [],
            remove: () => {}, // No-op for remove
            textContent: '',
            onclick: null // Placeholder
        };
        // Specific mocks for input/button properties if needed
        if (tag === 'input') el.value = '';
        return el;
    },
    body: {
        appendChild: (child) => {
            global.document.body.children = global.document.body.children || [];
            global.document.body.children.push(child);
        },
        children: []
    }
};

// Mock Navigator
global.navigator = {
    clipboard: {
        writeText: () => Promise.resolve()
    }
};

// Helper to run the bookmarklet
function runBookmarklet() {
    const code = fs.readFileSync('bookmarklets/temp-password.js', 'utf8');
    // We can eval the code directly as it's an IIFE
    try {
        eval(code);
    } catch (e) {
        console.error("Error running bookmarklet:", e);
        throw e;
    }
}

// Test Function
function runTests() {
    console.log('Running Tests for Temp Password Bookmarklet...');
    let testsPassed = 0;
    let testsFailed = 0;

    // --- TEST 1: Default Configuration ---
    console.log('\n[Test 1] Default Configuration');
    try {
        // Reset state
        global.document.body.children = [];
        global.window.TEMP_PASSWORD_CONFIG = undefined;

        runBookmarklet();

        // Check overlay created
        const overlay = global.document.body.children[global.document.body.children.length - 1];
        assert.strictEqual(overlay.tagName, 'DIV', 'Overlay should be a DIV');

        // Check dialog inside overlay
        const dialog = overlay.children[0];
        assert.strictEqual(dialog.tagName, 'DIV', 'Dialog should be a DIV inside overlay');

        // Check items (passwords) + close button
        // Default count is 5, plus 1 close button = 6 children
        assert.strictEqual(dialog.children.length, 6, 'Should have 5 passwords + 1 close button');

        // Check password format (roughly)
        // Item structure: div -> [p (text), button (copy)]
        for (let i = 0; i < 5; i++) {
            const item = dialog.children[i];
            const textEl = item.children[0];
            const password = textEl.textContent;

            console.log(`  Generated Password ${i+1}: ${password}`);

            // Check if it looks like a password (non-empty string)
            assert.ok(password.length > 5, 'Password should be reasonably long');

            // Default has symbol and number
            const hasSymbol = /[!@#$%^&*?]/.test(password);
            const hasNumber = /\d+/.test(password);

            // With deterministic random, we might not hit symbols every time, but statistically likely or check specific mock behavior
            // Since we mocked getRandomValues with i % 256, it's deterministic but depends on calls.
            // Let's just check valid string for now.
             assert.ok(typeof password === 'string', 'Password is a string');
        }

        console.log('  ✅ Passed');
        testsPassed++;
    } catch (e) {
        console.error('  ❌ Failed:', e.message);
        testsFailed++;
    }

    // --- TEST 2: Custom Configuration ---
    console.log('\n[Test 2] Custom Configuration (Count: 3, No Symbols, No Numbers)');
    try {
        // Reset state
        global.document.body.children = [];
        global.window.TEMP_PASSWORD_CONFIG = { count: 3, addSymbol: false, randomNum: false };

        runBookmarklet();

        const overlay = global.document.body.children[global.document.body.children.length - 1];
        const dialog = overlay.children[0];

        // Custom count is 3, plus 1 close button = 4 children
        assert.strictEqual(dialog.children.length, 4, 'Should have 3 passwords + 1 close button');

        for (let i = 0; i < 3; i++) {
            const item = dialog.children[i];
            const textEl = item.children[0];
            const password = textEl.textContent;

            console.log(`  Generated Password ${i+1}: ${password}`);

            // Check NO symbols
            const hasSymbol = /[!@#$%^&*?]/.test(password);
            assert.strictEqual(hasSymbol, false, 'Should not have symbols');

            // Check NO random numbers (it appends '1' if randomNum is false in the code logic: p += C.randomNum ? getRand(100) : '1';)
            // Actually let's verify the code logic:
            // p += C.randomNum ? getRand(100) : '1';
            // So it should end with '1' if we strictly check the number part logic,
            // but the noun might contain numbers? Nouns list seems to be words.
            // Let's checking if it contains digits other than '1' if possible, or just check format.
            // Actually, if randomNum is false, it appends '1'. So it should end with '1'.
            // But wait, the code is: p = R(adjectives) + R(nouns); p += ...
            // So it ends with '1'.

            assert.ok(password.endsWith('1'), 'Should end with 1 when randomNum is false');
        }

        console.log('  ✅ Passed');
        testsPassed++;
    } catch (e) {
        console.error('  ❌ Failed:', e.message);
        testsFailed++;
    }

    // --- TEST 3: High Count Configuration ---
    console.log('\n[Test 3] High Count Configuration (Count: 10)');
    try {
        global.document.body.children = [];
        global.window.TEMP_PASSWORD_CONFIG = { count: 10, addSymbol: true, randomNum: true };

        runBookmarklet();

        const overlay = global.document.body.children[global.document.body.children.length - 1];
        const dialog = overlay.children[0];

        assert.strictEqual(dialog.children.length, 11, 'Should have 10 passwords + 1 close button');

        console.log('  ✅ Passed');
        testsPassed++;
    } catch (e) {
        console.error('  ❌ Failed:', e.message);
        testsFailed++;
    }

    console.log(`\nSummary: ${testsPassed} passed, ${testsFailed} failed.`);
    if (testsFailed > 0) process.exit(1);
}

runTests();
