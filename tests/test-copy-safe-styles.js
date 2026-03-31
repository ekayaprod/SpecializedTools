const fs = require('fs');
const path = require('path');
const assert = require('assert');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
let utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Expose internal copySafeStyles for testing
utilsCode = utilsCode.replace(
    'w.BookmarkletUtils =',
    'w.copySafeStyles = copySafeStyles; w.BookmarkletUtils ='
);

// Mock browser globals
const mockWindow = {
    getComputedStyle: (el) => {
        return {
            getPropertyValue: (prop) => {
                // Handle camelCase vs kebab-case if necessary
                // In BookmarkletUtils, it uses computed.getPropertyValue(prop)
                // prop is usually kebab-case (e.g., 'font-size')
                return el.style[prop] || '';
            }
        };
    }
};

const mockDocument = {
    getElementById: (id) => {
        if (!mockDocument.elements) mockDocument.elements = {};
        if (!mockDocument.elements[id]) {
            mockDocument.elements[id] = {
                id: id,
                style: {
                    setProperty: function(prop, val) {
                        this[prop] = val;
                    },
                    getPropertyValue: function(prop) {
                        return this[prop] || '';
                    }
                }
            };
        }
        return mockDocument.elements[id];
    }
};

// Use Function constructor to evaluate in mock scope
const runUtils = new Function('window', 'document', utilsCode);
runUtils(mockWindow, mockDocument);

const copySafeStyles = mockWindow.copySafeStyles;

if (typeof copySafeStyles !== 'function') {
    console.error('Failed to expose copySafeStyles');
    process.exit(1);
}

console.log('Running copySafeStyles tests (No JSDOM)...');

try {
    const source = mockDocument.getElementById('source');
    const target = mockDocument.getElementById('target');

    // Test 1: Happy Path - Safe properties are copied
    {
        console.log('Test 1: Happy Path - Safe properties');
        // BookmarkletUtils uses kebab-case for property names
        source.style['color'] = 'rgb(255, 0, 0)';
        source.style['font-size'] = '16px';

        copySafeStyles(source, target);

        assert.strictEqual(target.style['color'], 'rgb(255, 0, 0)', 'Color should be copied');
        assert.strictEqual(target.style['font-size'], '16px', 'font-size should be copied');

        // Reset target
        target.style['color'] = '';
        target.style['font-size'] = '';
    }

    // Test 2: Unsafe properties are NOT copied
    {
        console.log('Test 2: Unsafe properties');
        source.style['cursor'] = 'pointer';
        source.style['pointer-events'] = 'none';

        copySafeStyles(source, target);

        assert.strictEqual(target.style['cursor'], undefined, 'Unsafe property cursor should NOT be copied');
        assert.strictEqual(target.style['pointer-events'], undefined, 'Unsafe property pointer-events should NOT be copied');

        source.style['cursor'] = '';
        source.style['pointer-events'] = '';
    }

    // Test 3: Values 'none' and 'normal' are skipped
    {
        console.log('Test 3: Skip none/normal values');
        source.style['display'] = 'none';
        source.style['line-height'] = 'normal';
        source.style['color'] = 'blue';

        copySafeStyles(source, target);

        assert.strictEqual(target.style['display'], undefined, 'Value "none" should be skipped');
        assert.strictEqual(target.style['line-height'], undefined, 'Value "normal" should be skipped');
        assert.strictEqual(target.style['color'], 'blue', 'Other safe properties should still be copied');

        target.style['color'] = '';
        source.style['display'] = '';
        source.style['line-height'] = '';
    }

    // Test 4: Redundancy check (Optimization)
    {
        console.log('Test 4: Redundancy check optimization');
        source.style['color'] = 'green';
        target.style['color'] = 'green';

        let setPropertyCalled = false;
        const originalSetProperty = target.style.setProperty;
        target.style.setProperty = function(prop, val) {
            if (prop === 'color') setPropertyCalled = true;
            return originalSetProperty.apply(this, arguments);
        };

        copySafeStyles(source, target);

        assert.strictEqual(setPropertyCalled, false, 'setProperty should NOT be called if values match');

        // Verify it IS called if values differ
        source.style['color'] = 'yellow';
        copySafeStyles(source, target);
        assert.strictEqual(setPropertyCalled, true, 'setProperty SHOULD be called if values differ');
        assert.strictEqual(target.style['color'], 'yellow', 'Value should be updated');

        target.style.setProperty = originalSetProperty;
    }

    console.log('✅ All copySafeStyles tests passed!');
} catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
}
