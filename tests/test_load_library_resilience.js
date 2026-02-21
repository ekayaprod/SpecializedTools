const fs = require('fs');
const assert = require('assert');

// Mock Browser Environment
const mockWindow = {
    document: {
        createElement: (tag) => ({ tagName: tag, style: {}, remove: () => {} }),
        head: { appendChild: () => {} },
        body: { appendChild: () => {} },
    },
    performance: { now: () => Date.now() },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Promise: Promise,
};
global.window = mockWindow;
global.document = mockWindow.document;

// Load utils.js
const utilsCode = fs.readFileSync('bookmarklets/utils.js', 'utf8');
try {
    eval(utilsCode);
} catch (e) {
    console.error('Error loading utils.js:', e);
    process.exit(1);
}

const utils = global.window.BookmarkletUtils;

async function testLoadLibraryResilience() {
    console.log('Running Load Library Resilience Tests...');

    // Test 1: Retry Logic - Success after 2 attempts
    {
        console.log('Test 1: Retry Logic - Success after 2 attempts');
        let attempts = 0;

        // Mock createElement & appendChild
        global.document.createElement = (tag) => {
            return {
                tagName: tag,
                remove: () => {}, // Mock remove
                set onload(cb) {
                    this._onload = cb;
                },
                set onerror(cb) {
                    this._onerror = cb;
                },
                triggerError: function () {
                    if (this._onerror) this._onerror();
                },
                triggerLoad: function () {
                    if (this._onload) this._onload();
                },
            };
        };

        global.document.head.appendChild = (el) => {
            attempts++;
            // Fail first 2 attempts, succeed on 3rd (index 2)
            setTimeout(() => {
                if (attempts < 3) {
                    el.triggerError();
                } else {
                    global.window.retryLib = {};
                    el.triggerLoad();
                }
            }, 10);
            return el;
        };

        const startTime = Date.now();
        // Use shorter delay for test speed
        await utils.loadLibrary('retryLib', 'http://example.com/retry.js', null, 3, 50);

        assert.strictEqual(attempts, 3, 'Should have attempted 3 times');
        console.log('✅ Passed');
    }

    // Test 2: Retry Logic - Failure after all retries
    {
        console.log('Test 2: Retry Logic - Failure after all retries');
        let attempts = 0;

        global.document.head.appendChild = (el) => {
            attempts++;
            setTimeout(() => {
                el.triggerError();
            }, 10);
            return el;
        };

        try {
            await utils.loadLibrary('failLib', 'http://example.com/fail.js', null, 2, 50);
            assert.fail('Should have thrown error after retries exhausted');
        } catch (e) {
            assert.ok(e.message.includes('Failed to load failLib'), 'Error message mismatch: ' + e.message);
            // Expected 1 initial attempt + 2 retries = 3 total
            // Or if retries means *retry attempts* (additional attempts), then 1 + 2 = 3.
            // If the implementation is: attempt 0, then retry 1, retry 2. Total 3 attempts.
            // Let's assume retries=2 means 2 EXTRA attempts.
            assert.strictEqual(attempts, 3, 'Should have attempted 3 times (1 initial + 2 retries)');
        }
        console.log('✅ Passed');
    }

    // Test 3: Existing Library (No load)
    {
        console.log('Test 3: Existing Library (No load)');
        global.window.existingLib = {};
        let attempts = 0;
        global.document.head.appendChild = (el) => {
            attempts++;
            return el;
        };

        await utils.loadLibrary('existingLib', 'http://example.com/exist.js');
        assert.strictEqual(attempts, 0, 'Should not attempt to load existing library');
        delete global.window.existingLib;
        console.log('✅ Passed');
    }

    // Test 4: Single Load with Attributes (Verification of src, integrity, crossOrigin)
    {
        console.log('Test 4: Single Load with Attributes');
        let scriptEl = null;
        global.document.head.appendChild = (el) => {
            scriptEl = el;
            setTimeout(() => {
                global.window.secureLib = {};
                if (el._onload) el._onload();
            }, 10);
            return el;
        };

        await utils.loadLibrary('secureLib', 'http://example.com/secure.js', 'sha-256');

        assert.ok(scriptEl, 'Script element should be created');
        assert.strictEqual(scriptEl.src, 'http://example.com/secure.js', 'Src mismatch');
        assert.strictEqual(scriptEl.integrity, 'sha-256', 'Integrity mismatch');
        assert.strictEqual(scriptEl.crossOrigin, 'anonymous', 'CrossOrigin mismatch');

        delete global.window.secureLib;
        console.log('✅ Passed');
    }
}

testLoadLibraryResilience()
    .then(() => {
        console.log('All Resilience Tests Passed!');
    })
    .catch((e) => {
        console.error('Test Failed:', e);
        process.exit(1);
    });
