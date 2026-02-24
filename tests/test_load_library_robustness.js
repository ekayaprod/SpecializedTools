const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Mock JSDOM
const dom = new JSDOM('<!DOCTYPE html><body></body>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.console = console;

// Mock performance.now
global.performance = { now: () => Date.now() };

// Evaluated code puts BookmarkletUtils on window
try {
    eval(utilsCode);
} catch (e) {
    console.error('Error evaluating utils.js:', e);
    process.exit(1);
}

// Test Runner
async function runTests() {
    console.log('\nRunning loadLibrary Robustness Tests...');
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${name}: ${e.message}`);
            failed++;
        }
    }

    await test('loadLibrary should retry on failure and eventually succeed', async () => {
        const globalVar = 'MyLib';
        const url = 'http://example.com/lib.js';
        let attempts = 0;
        const maxRetries = 3;

        // Mock setTimeout
        const originalSetTimeout = global.setTimeout;
        const delays = [];
        global.setTimeout = (fn, delay) => {
            delays.push(delay);
            // Execute immediately for test speed
            fn();
            return 123; // Timer ID
        };

        // Mock document.createElement and appendChild
        const originalCreateElement = document.createElement;
        const originalAppendChild = document.head.appendChild;

        document.createElement = (tag) => {
            if (tag === 'script') {
                return {
                    src: '',
                    onload: null,
                    onerror: null,
                    remove: () => {},
                    setAttribute: () => {},
                };
            }
            return originalCreateElement.call(document, tag);
        };

        document.head.appendChild = (script) => {
            attempts++;
            // Fail first 2 attempts, succeed on 3rd (attempt index 2)
            if (attempts <= 2) {
                if (script.onerror) script.onerror();
            } else {
                // Simulate success
                window[globalVar] = { loaded: true };
                if (script.onload) script.onload();
            }
        };

        try {
            await window.BookmarkletUtils.loadLibrary(globalVar, url, null, maxRetries, 100);

            assert.strictEqual(attempts, 3, 'Should have attempted 3 times');
            assert.strictEqual(delays.length, 2, 'Should have waited 2 times');
            // Delays: 100 * 2^0 = 100, 100 * 2^1 = 200
            assert.strictEqual(delays[0], 100, 'First delay should be 100ms');
            assert.strictEqual(delays[1], 200, 'Second delay should be 200ms');
            assert.ok(window[globalVar], 'Library should be loaded');

        } finally {
            // Restore mocks
            global.setTimeout = originalSetTimeout;
            document.createElement = originalCreateElement;
            document.head.appendChild = originalAppendChild;
            delete window[globalVar];
        }
    });

    await test('loadLibrary should fail after max retries', async () => {
        const globalVar = 'FailLib';
        const url = 'http://example.com/fail.js';
        let attempts = 0;
        const maxRetries = 2;

        // Mock setTimeout
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = (fn, delay) => {
            fn();
            return 123;
        };

        // Mock document.createElement and appendChild
        const originalCreateElement = document.createElement;
        const originalAppendChild = document.head.appendChild;

        document.createElement = (tag) => {
            if (tag === 'script') {
                return {
                    src: '',
                    onload: null,
                    onerror: null,
                    remove: () => {},
                    setAttribute: () => {},
                };
            }
            return originalCreateElement.call(document, tag);
        };

        document.head.appendChild = (script) => {
            attempts++;
            // Always fail
            if (script.onerror) script.onerror();
        };

        try {
            await window.BookmarkletUtils.loadLibrary(globalVar, url, null, maxRetries, 100);
            throw new Error('Should have thrown an error');
        } catch (e) {
            assert.strictEqual(attempts, 3, 'Should have attempted 3 times (initial + 2 retries)');
            assert.ok(e.message.includes('Failed to load FailLib'), 'Error message should match');
        } finally {
            // Restore mocks
            global.setTimeout = originalSetTimeout;
            document.createElement = originalCreateElement;
            document.head.appendChild = originalAppendChild;
        }
    });

    if (failed > 0) {
        console.error(`\n${failed} tests failed.`);
        process.exit(1);
    } else {
        console.log(`\nAll ${passed} tests passed.`);
    }
}

runTests();
