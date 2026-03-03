const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Mock Browser Environment (Minimal for getDeepTarget)
const mockWindow = {
    performance: { now: () => Date.now() },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Promise: Promise,
};

global.window = mockWindow;
global.document = {
    createElement: (tag) => ({ tagName: tag.toUpperCase(), style: {} }),
};

// 2. Load utils.js
// We need to handle the IIFE and the fact it expects 'window'
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
let utilsCode = fs.readFileSync(utilsPath, 'utf8');

try {
    // Strip IIFE to expose BookmarkletUtils or just eval it
    eval(utilsCode);
} catch (e) {
    console.error('Error evaluating utils.js:', e);
    process.exit(1);
}

const utils = window.BookmarkletUtils;

console.log('Running tests for BookmarkletUtils.getDeepTarget...');

// Helper to create a mock element
function createMockElement(tagName, shadowRoot = null) {
    return {
        tagName: tagName.toUpperCase(),
        shadowRoot: shadowRoot
    };
}

// Helper to create a mock shadow root
function createMockShadowRoot(elementFromPointFn) {
    return {
        elementFromPoint: elementFromPointFn
    };
}

try {
    // Test 1: No Shadow DOM
    {
        console.log('Test 1: No Shadow DOM');
        const target = createMockElement('DIV');
        const event = { target: target, clientX: 10, clientY: 20 };
        const result = utils.getDeepTarget(event);
        assert.strictEqual(result, target, 'Should return the original target when no shadow root exists');
        console.log('✅ Passed');
    }

    // Test 2: Shadow DOM piercing (1 level)
    {
        console.log('Test 2: Shadow DOM piercing (1 level)');
        const inner = createMockElement('BUTTON');
        const shadowRoot = createMockShadowRoot((x, y) => {
            if (x === 10 && y === 20) return inner;
            return null;
        });
        const host = createMockElement('CUSTOM-EL', shadowRoot);
        const event = { target: host, clientX: 10, clientY: 20 };
        const result = utils.getDeepTarget(event);
        assert.strictEqual(result, inner, 'Should pierce shadow root to find nested element');
        console.log('✅ Passed');
    }

    // Test 3: Multiple Shadow DOM layers
    {
        console.log('Test 3: Multiple Shadow DOM layers');
        const deepest = createMockElement('SPAN');
        const midShadow = createMockShadowRoot(() => deepest);
        const midHost = createMockElement('MID-EL', midShadow);
        const topShadow = createMockShadowRoot(() => midHost);
        const topHost = createMockElement('TOP-EL', topShadow);

        const event = { target: topHost, clientX: 0, clientY: 0 };
        const result = utils.getDeepTarget(event);
        assert.strictEqual(result, deepest, 'Should pierce multiple layers of shadow DOM');
        console.log('✅ Passed');
    }

    // Test 4: Shadow root but missing elementFromPoint
    {
        console.log('Test 4: Shadow root but missing elementFromPoint');
        const host = createMockElement('CUSTOM-EL', {}); // Empty shadow root
        const event = { target: host, clientX: 0, clientY: 0 };
        const result = utils.getDeepTarget(event);
        assert.strictEqual(result, host, 'Should return host if elementFromPoint is missing');
        console.log('✅ Passed');
    }

    // Test 5: elementFromPoint returns null
    {
        console.log('Test 5: elementFromPoint returns null');
        const shadowRoot = createMockShadowRoot(() => null);
        const host = createMockElement('CUSTOM-EL', shadowRoot);
        const event = { target: host, clientX: 0, clientY: 0 };
        const result = utils.getDeepTarget(event);
        assert.strictEqual(result, host, 'Should return host if elementFromPoint returns null');
        console.log('✅ Passed');
    }

    // Test 6: elementFromPoint returns same element (loop prevention)
    {
        console.log('Test 6: elementFromPoint returns same element (loop prevention)');
        let host;
        const shadowRoot = createMockShadowRoot(() => host);
        host = createMockElement('CUSTOM-EL', shadowRoot);
        const event = { target: host, clientX: 0, clientY: 0 };
        const result = utils.getDeepTarget(event);
        assert.strictEqual(result, host, 'Should break loop if elementFromPoint returns the same element');
        console.log('✅ Passed');
    }

    console.log('All getDeepTarget tests passed!');
} catch (e) {
    console.error('Test Failed:', e);
    process.exit(1);
}
