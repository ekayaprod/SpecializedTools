const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a JSDOM instance
const dom = new JSDOM(
    `<!DOCTYPE html>
<body>
    <div id="source" style="color: red; width: 100px; height: 100px; position: absolute; top: 10px;">
        <span id="child" style="font-size: 20px;">Text</span>
    </div>
    <div id="target">
        <span id="target-child"></span>
    </div>
    <div id="img-container">
        <img id="img1" data-src="real.jpg" src="placeholder.jpg">
        <img id="img2" srcset="small.jpg 100w, big.jpg 200w" src="spacer.gif">
    </div>
</body>
`,
    { url: 'http://localhost/' }
); // Set URL for relative paths

global.window = dom.window;
global.document = dom.window.document;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
global.Uint32Array = Uint32Array;
// Mock performance for async chunks
global.performance = { now: () => Date.now() };

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

console.log('Running BookmarkletUtils tests...');

(async function () {
    try {
        // Test 1: escapeHtml
        {
            console.log('Test 1: escapeHtml');
            const input = '<div class="foo">&\'bar\'</div>';
            const expected = '&lt;div class=&quot;foo&quot;&gt;&amp;&#039;bar&#039;&lt;/div&gt;';
            const result = window.BookmarkletUtils.escapeHtml(input);
            assert.strictEqual(result, expected, 'HTML escaping failed');

            // Edge cases
            assert.strictEqual(window.BookmarkletUtils.escapeHtml(''), '', 'Empty string failed');
            assert.strictEqual(window.BookmarkletUtils.escapeHtml(null), '', 'Null input failed');
            assert.strictEqual(window.BookmarkletUtils.escapeHtml(undefined), '', 'Undefined input failed');
            assert.strictEqual(window.BookmarkletUtils.escapeHtml(0), '0', 'Number 0 failed');

            console.log('✅ escapeHtml passed');
        }

        // Test 2: normalizeImages
        {
            console.log('Test 2: normalizeImages');
            const container = document.getElementById('img-container');
            const img1 = document.getElementById('img1');
            const img2 = document.getElementById('img2');

            // Will become async
            await window.BookmarkletUtils.normalizeImages(container);

            // JSDOM resolves src to absolute URL
            assert.ok(img1.src.includes('real.jpg'), 'data-src should replace src');
            assert.ok(img2.src.includes('big.jpg'), 'srcset should be used (last item)');

            assert.strictEqual(img1.style.maxWidth, '100%', 'maxWidth should be 100%');
            assert.strictEqual(img1.style.display, 'block', 'display should be block');

            console.log('✅ normalizeImages passed');
        }

        // Test 3: sanitizeFilename
        {
            console.log('Test 3: sanitizeFilename');

            // 1. Basic happy path
            const safe = window.BookmarkletUtils.sanitizeFilename('My File Name!');
            assert.strictEqual(safe, 'My_File_Name_', 'Basic sanitization failed');

            // 2. Empty/Null
            assert.strictEqual(
                window.BookmarkletUtils.sanitizeFilename(''),
                'export',
                'Empty string should return export'
            );
            assert.strictEqual(window.BookmarkletUtils.sanitizeFilename(null), 'export', 'Null should return export');
            assert.strictEqual(
                window.BookmarkletUtils.sanitizeFilename(undefined),
                'export',
                'Undefined should return export'
            );

            // 3. Length check
            const long = 'a'.repeat(100);
            assert.strictEqual(
                window.BookmarkletUtils.sanitizeFilename(long).length,
                50,
                'Should truncate to 50 chars'
            );

            // 4. Non-string input (Regression Test)
            try {
                const numResult = window.BookmarkletUtils.sanitizeFilename(12345);
                assert.strictEqual(numResult, '12345', 'Number should be converted to string');
            } catch (e) {
                console.error('❌ sanitizeFilename crashed on number input: ' + e.message);
                throw e; // Rethrow to fail the test suite
            }

            // 5. Zero handling (Fragility Fix)
            const zeroResult = window.BookmarkletUtils.sanitizeFilename(0);
            assert.strictEqual(zeroResult, '0', 'Zero should be preserved as string "0"');

            console.log('✅ sanitizeFilename passed');
        }

        // Test 4: normalizeImages with <picture> (New Robust Test)
        {
            console.log('Test 4: normalizeImages <picture> support');
            const container = document.createElement('div');
            container.innerHTML = `
                <picture id="pic-1">
                    <source srcset="source-large.jpg">
                    <img id="pic-img-1" src="spacer.gif" alt="Picture 1">
                </picture>
                <picture id="pic-2">
                    <source srcset="source-missing.jpg">
                    <img id="pic-img-2" alt="Picture 2">
                </picture>
            `;
            document.body.appendChild(container);

            const img1 = document.getElementById('pic-img-1');
            const img2 = document.getElementById('pic-img-2');

            // Will become async
            await window.BookmarkletUtils.normalizeImages(container);

            // Assertions
            // JSDOM resolves relative URLs, so check for inclusion
            assert.ok(img1.src.includes('source-large.jpg'), 'Picture 1: source should replace spacer img src');
            assert.ok(img2.src.includes('source-missing.jpg'), 'Picture 2: source should fill missing img src');

            document.body.removeChild(container);
            console.log('✅ normalizeImages <picture> passed');
        }

        // Test 5: inlineStylesAsync Fragility (Async Crash Handling)
        {
            console.log('Test 5: inlineStylesAsync Fragility (Async Crash Handling)');
            // Create a deep structure to force yielding
            const deepContainer = document.createElement('div');
            const deepTarget = document.createElement('div');
            for (let i = 0; i < 60; i++) {
                deepContainer.appendChild(document.createElement('span'));
                deepTarget.appendChild(document.createElement('span'));
            }

            let callCount = 0;
            const originalGetComputedStyle = window.getComputedStyle;

            // Mock getComputedStyle to crash asynchronously (after yielding)
            window.getComputedStyle = (el) => {
                callCount++;
                if (callCount === 55) {
                    throw new Error('Simulated Async Crash');
                }
                return originalGetComputedStyle(el);
            };

            try {
                // If fix works, this should reject
                await window.BookmarkletUtils.inlineStylesAsync(deepContainer, deepTarget);
                throw new Error('Should have rejected but resolved');
            } catch (e) {
                if (e.message === 'Simulated Async Crash') {
                    console.log('✅ Correctly caught async crash');
                } else {
                    throw e;
                }
            } finally {
                window.getComputedStyle = originalGetComputedStyle;
            }
        }

        // Test 6: log (Structured Logging and PII Redaction)
        {
            console.log('Test 6: log (Structured Logging and PII Redaction)');
            let capturedLog = null;
            let capturedArgs = null;
            const originalLog = console.log;
            const originalInfo = console.info;

            // Mock console.log and console.info
            const mockLog = (msg, context) => {
                capturedLog = msg;
                capturedArgs = context;
            };
            console.log = mockLog;
            console.info = mockLog;

            try {
                // 1. Basic format
                window.BookmarkletUtils.log('TestComponent', 'Hello World', { count: 1 });
                assert.strictEqual(capturedLog, '[TestComponent] Hello World', 'Log format incorrect');
                assert.deepStrictEqual(capturedArgs, { count: 1 }, 'Context not preserved');

                // 2. PII Redaction
                const sensitiveData = {
                    userId: 123,
                    userEmail: 'test@example.com',
                    authToken: 'secret-token-123',
                    password: 'password123',
                    apiKey: 'key-abc',
                    phone: '555-0199',
                };

                window.BookmarkletUtils.log('SecurityTest', 'User logged in', sensitiveData);
                assert.strictEqual(capturedLog, '[SecurityTest] User logged in');

                // Check redactions
                assert.strictEqual(capturedArgs.userId, 123, 'Non-sensitive data should remain');
                assert.strictEqual(capturedArgs.userEmail, '***REDACTED***', 'Email not redacted');
                assert.strictEqual(capturedArgs.authToken, '***REDACTED***', 'Token not redacted');
                assert.strictEqual(capturedArgs.password, '***REDACTED***', 'Password not redacted');
                assert.strictEqual(capturedArgs.apiKey, '***REDACTED***', 'Key not redacted');
                assert.strictEqual(capturedArgs.phone, '***REDACTED***', 'Phone not redacted');

            } finally {
                console.log = originalLog;
                console.info = originalInfo;
            }
            console.log('✅ log passed');
        }

        // Test 7: createShadowRoot
        {
            console.log('Test 7: createShadowRoot');
            const id = 'shadow-host';
            const cssText = 'color: red;';
            const { h, s } = window.BookmarkletUtils.createShadowRoot(id, cssText);

            assert.strictEqual(h.id, id, 'Host ID mismatch');
            assert.strictEqual(h.style.color, 'red', 'Host style mismatch');
            // JSDOM ShadowRoot check
            assert.ok(s.mode === 'open', 'Shadow root mode should be open');
            assert.strictEqual(h.parentNode, document.body, 'Host not appended to body by default');

            // Cleanup
            h.remove();

            // Test with custom parent
            const parent = document.createElement('div');
            const { h: h2 } = window.BookmarkletUtils.createShadowRoot('host2', '', parent);
            assert.strictEqual(h2.parentNode, parent, 'Host not appended to custom parent');

            console.log('✅ createShadowRoot passed');
        }

        // Test 8: generateFilename
        {
            console.log('Test 8: generateFilename');

            // 1. Basic format test using regex
            const result1 = window.BookmarkletUtils.generateFilename('My Report');
            // Should start with My_Report_ and end with YYYYMMDD-HHmm (8 digits - 4 digits)
            assert.ok(/^My_Report_\d{8}-\d{4}$/.test(result1), `Filename format incorrect: ${result1}`);

            // 2. Mock Date to test zero-padding logic precisely
            const OriginalDate = global.Date;
            try {
                // Mock a specific date: 2023-05-04 08:09 (May 4th, 2023, 08:09 AM)
                // Note: Months are 0-indexed in JS Date constructor
                const fixedDate = new OriginalDate(2023, 4, 4, 8, 9);
                global.Date = class extends OriginalDate {
                    constructor() {
                        super();
                        return fixedDate;
                    }
                };

                const result2 = window.BookmarkletUtils.generateFilename('ZeroPadTest');
                assert.strictEqual(result2, 'ZeroPadTest_20230504-0809', 'Zero padding logic failed');

                // Test an edge case where input needs sanitization
                const result3 = window.BookmarkletUtils.generateFilename('Invalid/Chars:Here');
                assert.strictEqual(result3, 'Invalid_Chars_Here_20230504-0809', 'Sanitization within generateFilename failed');

                // Test empty input
                const result4 = window.BookmarkletUtils.generateFilename('');
                assert.strictEqual(result4, 'export_20230504-0809', 'Empty input handling failed');

            } finally {
                // Restore original Date
                global.Date = OriginalDate;
            }

            console.log('✅ generateFilename passed');
        }

        console.log('All tests passed!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
})();
