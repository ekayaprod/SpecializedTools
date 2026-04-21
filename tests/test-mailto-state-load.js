const fs = require('fs');
const assert = require('assert');
const path = require('path');

const codePath = path.join(__dirname, '../mailto-link-generator/js/mailto.js');
const code = fs.readFileSync(codePath, 'utf8');

// Strip the automatic initialization to prevent App.init from running
const testableCode = code.split('if (document.readyState === \'loading\')')[0];

console.log('Running mailto.js State.load Tests...');

function setupEnv() {
    let capturedError = null;
    const mockLocalStorage = {
        _data: {},
        getItem: function(key) { return this._data[key] || null; },
        setItem: function(key, val) { this._data[key] = val; }
    };

    const mockConsole = {
        error: (...args) => { capturedError = args; },
        log: () => {}
    };

    const mockDocument = {
        getElementById: () => ({
            addEventListener: () => {},
            classList: { add: () => {}, remove: () => {} },
            appendChild: () => {},
            removeChild: () => {}
        }),
        createElement: () => ({ style: {}, classList: { add: () => {}, remove: () => {} } }),
        addEventListener: () => {},
        removeEventListener: () => {},
        readyState: 'complete'
    };

    const env = {
        document: mockDocument,
        localStorage: mockLocalStorage,
        console: mockConsole,
        crypto: {},
        navigator: {},
        addEventListener: () => {},
        // URL and Blob might be used
        URL: { createObjectURL: () => '', revokeObjectURL: () => '' },
        Blob: function() {}
    };

    const wrappedCode = `
        const { document, localStorage, console, crypto, navigator, addEventListener, URL, Blob } = arguments[0];
        ${testableCode}
        return { State, CONFIG };
    `;

    const { State, CONFIG } = new Function(wrappedCode)(env);

    return { State, CONFIG, mockLocalStorage, mockConsole, getCapturedError: () => capturedError };
}

// Test Case 1: localStorage is empty
{
    console.log('Test Case 1: localStorage is empty');
    const { State } = setupEnv();

    // Initial state should be null as defined in the file, but we want to test load()
    assert.strictEqual(State.data, null);

    State.load();

    assert.deepStrictEqual(State.data, { library: [] }, 'State should initialize to empty library');
    console.log('✅ Passed');
}

// Test Case 2: localStorage contains valid JSON object
{
    console.log('Test Case 2: localStorage contains valid JSON object');
    const { State, CONFIG, mockLocalStorage } = setupEnv();

    const validData = { library: [{ id: '1', type: 'template', name: 'Test' }] };
    mockLocalStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(validData));

    State.load();

    assert.deepStrictEqual(State.data, validData, 'State should load valid JSON object');
    console.log('✅ Passed');
}

// Test Case 3: localStorage contains valid JSON array (legacy support)
{
    console.log('Test Case 3: localStorage contains valid JSON array');
    const { State, CONFIG, mockLocalStorage } = setupEnv();

    const legacyData = [{ id: '1', type: 'template', name: 'Legacy' }];
    mockLocalStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(legacyData));

    State.load();

    assert.deepStrictEqual(State.data, { library: legacyData }, 'State should wrap legacy array in an object');
    console.log('✅ Passed');
}

// Test Case 4: localStorage contains malformed JSON
{
    console.log('Test Case 4: localStorage contains malformed JSON');
    const { State, CONFIG, mockLocalStorage, getCapturedError } = setupEnv();

    mockLocalStorage.setItem(CONFIG.STORAGE_KEY, '{ malformed: json ...');

    State.load();

    assert.deepStrictEqual(State.data, { library: [] }, 'State should fall back to empty library on error');
    assert.ok(getCapturedError(), 'An error should have been logged to console');
    assert.ok(getCapturedError()[0].includes('State load failed'), 'Error message should mention state load failure');
    console.log('✅ Passed');
}

console.log('\nAll State.load tests passed!');
