const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/property-clipper.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

// Mock BookmarkletUtils
const mockUtils = `
window.BookmarkletUtils = {
    buildElement: (tag, styles, text, parent, props) => {
        const el = document.createElement(tag);
        if (text) el.textContent = text;
        if (props) {
            for (let k in props) el.setAttribute(k, props[k]);
        }
        if (parent) parent.appendChild(el);
        return el;
    },
    showToast: () => {},
    escapeHtml: (s) => s || '',
    Prompts: { STANDARD_OUTPUTS: '', PROMPT_DATA: { 'investor': { label: 'Investor', role: 'Role for [Insert Property Address]', objective: 'Obj', noStandardOutput: false } } }
};
`;

function createDOM(jsonContent, elementId) {
    const html = `<!DOCTYPE html><body><script id="${elementId}" type="application/json">${jsonContent}</script></body>`;
    return new JSDOM(html, {
        url: 'https://example.com',
        runScripts: 'dangerously',
        resources: 'usable',
        beforeParse(window) {
            window.alert = console.log;
            // Inject utils mock
            window.eval(mockUtils);
        },
    });
}

async function runTests() {
    console.log('Running JSON Fragility Tests...');
    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Invalid JSON in __NEXT_DATA__
    try {
        console.log('Test 1: Invalid JSON in __NEXT_DATA__');
        const dom = createDOM('{ "foo": ', '__NEXT_DATA__');
        global.window = dom.window;
        global.document = dom.window.document;
        global.navigator = dom.window.navigator;

        // Spy on console.warn
        let warnings = [];
        const originalWarn = console.warn;
        console.warn = (...args) => warnings.push(args);

        // Run script
        dom.window.eval(scriptCode);

        // Assertions
        const parseErrorWarning = warnings.find((w) => w[0] && w[0].includes('JSON Parse Error [NextData]'));
        if (parseErrorWarning) {
            console.log('✅ Caught expected JSON Parse Error warning.');
            testsPassed++;
        } else {
            console.error('❌ Did NOT catch expected JSON Parse Error warning.');
            console.log('Warnings found:', warnings);
            testsFailed++;
        }

        console.warn = originalWarn; // Restore
    } catch (e) {
        console.error('Test 1 Unexpected Error:', e);
        testsFailed++;
    }

    // Test 2: Invalid JSON in .raw-data pre
    try {
        console.log('\nTest 2: Invalid JSON in .raw-data pre');
        const html = `<!DOCTYPE html><body><div class="raw-data"><pre>{ "bar": </pre></div></body>`;
        const dom = new JSDOM(html, {
            url: 'https://example.com',
            runScripts: 'dangerously',
            beforeParse(window) {
                window.alert = console.log;
                window.eval(mockUtils);
            },
        });

        let warnings = [];
        const originalWarn = console.warn;
        console.warn = (...args) => warnings.push(args);

        dom.window.eval(scriptCode);

        const parseErrorWarning = warnings.find((w) => w[0] && w[0].includes('JSON Parse Error [RawPre]'));
        if (parseErrorWarning) {
            console.log('✅ Caught expected JSON Parse Error warning (RawPre).');
            testsPassed++;
        } else {
            console.error('❌ Did NOT catch expected JSON Parse Error warning (RawPre).');
            console.log('Warnings found:', warnings);
            testsFailed++;
        }
        console.warn = originalWarn;
    } catch (e) {
        console.error('Test 2 Unexpected Error:', e);
        testsFailed++;
    }

    // Test 3: Valid JSON in __NEXT_DATA__ (Happy Path)
    try {
        console.log('\nTest 3: Valid JSON in __NEXT_DATA__');
        const validJson = JSON.stringify({
            props: {
                pageProps: {
                    initialReduxState: {
                        propertyDetails: {
                            location: {
                                address: {
                                    line: '123 Test St',
                                    city: 'TestCity',
                                    state_code: 'TS',
                                    postal_code: '12345',
                                },
                            },
                            list_price: 500000,
                            description: { text: 'Desc' },
                        },
                    },
                },
            },
        });
        const dom = createDOM(validJson, '__NEXT_DATA__');

        dom.window.eval(scriptCode);

        const modal = dom.window.document.getElementById('pc-pdf-modal');
        const txtArea = modal ? modal.querySelector('textarea') : null;

        if (txtArea && txtArea.value.includes('123 Test St')) {
            console.log('✅ Valid JSON extracted successfully.');
            testsPassed++;
        } else {
            console.error('❌ Valid JSON NOT extracted.');
            if (!modal) console.log('Modal not found.');
            else if (!txtArea) console.log('Textarea not found.');
            else console.log('Textarea content:', txtArea.value);
            testsFailed++;
        }
    } catch (e) {
        console.error('Test 3 Unexpected Error:', e);
        testsFailed++;
    }

    if (testsFailed > 0) {
        console.error(`\n${testsFailed} tests failed.`);
        process.exit(1);
    } else {
        console.log(`\nAll ${testsPassed} tests passed.`);
    }
}

runTests();
