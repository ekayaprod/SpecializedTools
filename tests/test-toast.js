const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

const dom = new JSDOM(`<!DOCTYPE html><body></body>`, { url: 'http://localhost/' });

global.window = dom.window;
global.document = dom.window.document;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0); // Mock rAF

try {
    eval(utilsCode);
} catch (e) {
    console.error('Error evaluating utils.js:', e);
    process.exit(1);
}

if (!window.BookmarkletUtils) {
    console.error('BookmarkletUtils not found on window');
    process.exit(1);
}

console.log('Running Toast & BuildElement tests...');

(async function () {
    try {
        // Test 1: buildElement
        {
            console.log('Test 1: buildElement');
            const el = window.BookmarkletUtils.buildElement('div', { color: 'red' }, 'Hello', document.body, {
                id: 'test-el',
                'data-foo': 'bar',
            });

            assert.strictEqual(el.tagName, 'DIV', 'Tag name match');
            assert.strictEqual(el.style.color, 'red', 'Style match');
            assert.strictEqual(el.textContent, 'Hello', 'Content match');
            assert.strictEqual(el.id, 'test-el', 'ID match');
            assert.strictEqual(el.getAttribute('data-foo'), 'bar', 'Attribute match');
            assert.strictEqual(el.parentElement, document.body, 'Parent match');

            el.remove();
            console.log('✅ buildElement passed');
        }

        // Test 1b: buildElement (Null Props Handling)
        {
            console.log('Test 1b: buildElement (Null Props Handling)');
            const el = window.BookmarkletUtils.buildElement('div', {}, '', null, {
                bad: null,
                missing: undefined,
                good: 'ok',
            });

            assert.ok(!el.hasAttribute('bad'), 'Should not have "bad" attribute');
            assert.ok(!el.hasAttribute('missing'), 'Should not have "missing" attribute');
            assert.strictEqual(el.getAttribute('good'), 'ok', 'Should have "good" attribute');

            console.log('✅ buildElement null/undefined props passed');
        }

        // Test 2: showToast - Default parameters
        {
            console.log('Test 2: showToast - Default parameters');
            window.BookmarkletUtils.showToast('Info message');

            const container = document.getElementById('bm-toast-container');
            assert.ok(container, 'Toast container created');

            const toast = container.querySelector('[role="alert"]');
            assert.ok(toast, 'Toast element created');
            assert.strictEqual(toast.textContent, 'Info message', 'Toast message match');
            // 'info' color is #2563eb but JSDOM might return rgb(37, 99, 235) or similar
            // It should be applied to background
            assert.ok(toast.style.background.includes('2563eb') || toast.style.background.includes('rgb(37, 99, 235)'), 'Default background should be info color');

            // Clean up manually for next tests
            toast.remove();
            console.log('✅ showToast default parameters passed');
        }

        // Test 3: showToast - Explicit type and auto-dismiss
        {
            console.log('Test 3: showToast - Explicit type and auto-dismiss');
            window.BookmarkletUtils.showToast('Error!', 'error', 100);

            const container = document.getElementById('bm-toast-container');
            const toast = container.lastElementChild;
            assert.strictEqual(toast.textContent, 'Error!', 'Toast message match');
            assert.ok(toast.style.background.includes('ef4444') || toast.style.background.includes('rgb(239, 68, 68)'), 'Error background applied');

            // Wait for auto-dismiss
            await new Promise((r) => setTimeout(r, 500));
            assert.strictEqual(toast.parentElement, null, 'Toast removed after timeout');
            console.log('✅ showToast explicit type and auto-dismiss passed');
        }

        // Test 4: showToast - Multiple toasts reuse container
        {
            console.log('Test 4: showToast - Multiple toasts reuse container');
            window.BookmarkletUtils.showToast('First', 'success', 5000);
            window.BookmarkletUtils.showToast('Second', 'info', 5000);

            const containers = document.querySelectorAll('#bm-toast-container');
            assert.strictEqual(containers.length, 1, 'Should only create one container');

            const toasts = containers[0].querySelectorAll('[role="alert"]');
            assert.strictEqual(toasts.length, 2, 'Should have two toasts in the container');

            // Clean up
            toasts.forEach(t => t.remove());
            console.log('✅ showToast container reuse passed');
        }

        // Test 5: showToast - Manual dismiss via click
        {
            console.log('Test 5: showToast - Manual dismiss via click');
            window.BookmarkletUtils.showToast('Click me', 'info', 5000);

            const container = document.getElementById('bm-toast-container');
            const toast = container.lastElementChild;
            assert.strictEqual(toast.textContent, 'Click me', 'Toast created');

            // Simulate click
            toast.onclick();

            assert.strictEqual(toast.parentElement, null, 'Toast removed immediately on click');
            console.log('✅ showToast manual dismiss passed');
        }

        console.log('All tests passed!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
})();
