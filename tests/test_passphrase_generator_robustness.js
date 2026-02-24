const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const assert = require('assert');

const scriptPath = path.join(__dirname, '../bookmarklets/passphrase-generator.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// Global mock date
let mockDate = null;

// Mock Date class
const OriginalDate = Date;
class MockDate extends OriginalDate {
    constructor(...args) {
        if (args.length === 0 && mockDate) {
            super(mockDate);
        } else {
            super(...args);
        }
    }
}

// Setup environment
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Date = MockDate; // Override global Date

// Mock clipboard
global.navigator.clipboard = {
    writeText: (text) => Promise.resolve(),
};

function runScript() {
    try {
        eval(scriptContent);
    } catch (e) {
        console.error('Script execution failed:', e);
        throw e;
    }
}

function getOverlay() {
    return document.getElementById('passphrase-generator-overlay');
}

function getTitle() {
    const overlay = getOverlay();
    return overlay.querySelector('h2').textContent;
}

function getGeneratedPasswords() {
    const overlay = getOverlay();
    const divs = Array.from(overlay.querySelectorAll('div'));
    return divs.filter((d) => d.style.fontFamily === 'monospace').map((d) => d.textContent);
}

// Helper to trigger change event on inputs
function setInputValue(labelStart, value) {
    const overlay = getOverlay();
    if (!overlay) throw new Error('Overlay not found when trying to set input');

    const labels = Array.from(overlay.querySelectorAll('label'));
    const label = labels.find((l) => l.textContent.startsWith(labelStart));
    if (!label) throw new Error(`Label starting with "${labelStart}" not found`);

    // The input is a sibling of the label in the same container div
    const container = label.parentElement;
    const input = container.querySelector('input, select');

    if (input.tagName === 'INPUT' && input.type === 'checkbox') {
        input.checked = value;
    } else {
        input.value = value;
    }

    // Trigger change
    const event = new dom.window.Event('change', { bubbles: true });
    input.dispatchEvent(event);
}

// Tests
const tests = [
    {
        name: 'Season Detection: Winter',
        run: () => {
            mockDate = new OriginalDate('2023-01-15T12:00:00Z');
            runScript();
            const title = getTitle();
            assert.strictEqual(title, 'Passphrase Generator (Winter)');
        },
    },
    {
        name: 'Season Detection: Spring',
        run: () => {
            mockDate = new OriginalDate('2023-04-15T12:00:00Z');
            runScript();
            const title = getTitle();
            assert.strictEqual(title, 'Passphrase Generator (Spring)');
        },
    },
    {
        name: 'Season Detection: Summer',
        run: () => {
            mockDate = new OriginalDate('2023-07-15T12:00:00Z');
            runScript();
            const title = getTitle();
            assert.strictEqual(title, 'Passphrase Generator (Summer)');
        },
    },
    {
        name: 'Season Detection: Autumn',
        run: () => {
            mockDate = new OriginalDate('2023-10-15T12:00:00Z');
            runScript();
            const title = getTitle();
            assert.strictEqual(title, 'Passphrase Generator (Autumn)');
        },
    },
    {
        name: 'Structure: Long Word',
        run: () => {
            mockDate = new OriginalDate('2023-01-01');
            runScript();
            setInputValue('Word Structure', '1-0');

            const passwords = getGeneratedPasswords();
            assert.ok(passwords.length > 0, 'Should generate passwords');
            passwords.forEach((p) => {
                assert.ok(!p.includes(' '), `Password "${p}" should not contain spaces`);
                assert.ok(p.length > 5, `Password "${p}" is too short`);
            });
        },
    },
    {
        name: 'Numbers: Start Placement',
        run: () => {
            mockDate = new OriginalDate('2023-01-01');
            runScript();
            setInputValue('Number Position', 'start');

            const passwords = getGeneratedPasswords();
            passwords.forEach((p) => {
                assert.ok(/^\d/.test(p), `Password "${p}" should start with a digit`);
            });
        },
    },
    {
        name: 'Symbols: Suffix Placement',
        run: () => {
            mockDate = new OriginalDate('2023-01-01');
            runScript();
            setInputValue('Symbol Position', 'suffix');

            const passwords = getGeneratedPasswords();
            passwords.forEach((p) => {
                const lastChar = p.slice(-1);
                const isSymbol = /[!@#$%^&*]/.test(lastChar);
                assert.ok(isSymbol, `Password "${p}" should end with a symbol`);
            });
        },
    },
    {
        name: 'Constraints: Pad to Min Length',
        run: () => {
            mockDate = new OriginalDate('2023-01-01');
            runScript();

            // Set Min Length manually as helper logic for 'Length' is tricky
            const overlay = getOverlay();
            const lenLabel = Array.from(overlay.querySelectorAll('label')).find(
                (l) => l.textContent === 'Phrase Length'
            );
            const lenDiv = lenLabel.nextElementSibling;
            const minInput = lenDiv.querySelector('input[type=number]');
            minInput.value = '30';
            minInput.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

            setInputValue('Pad to Minimum', true);

            const passwords = getGeneratedPasswords();
            passwords.forEach((p) => {
                assert.ok(p.length >= 30, `Password "${p}" length ${p.length} should be >= 30`);
            });
        },
    },
    {
        name: 'UI: Accessibility and Controls',
        run: () => {
            mockDate = new OriginalDate('2023-01-01');
            runScript();

            // Test Regenerate Button Aria Label
            const regenBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent === 'Regenerate');
            assert.ok(regenBtn, 'Regenerate button should exist');
            assert.strictEqual(
                regenBtn.getAttribute('aria-label'),
                'Generate new passphrases',
                'Regenerate button has incorrect aria-label'
            );

            // Test Temp Password Mode Toggle
            const toggleBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('Mode'));
            assert.ok(toggleBtn, 'Mode toggle button should exist');

            // Toggle it
            toggleBtn.click();
            const passwords = getGeneratedPasswords();
            assert.ok(passwords.length > 0, 'Should generate passwords in Temp mode');
        },
    },
];

// Test Runner
async function runTests() {
    console.log(`Running ${tests.length} tests...`);
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        console.log(`\nTest: ${test.name}`);
        try {
            document.body.innerHTML = ''; // Clean slate
            test.run();
            console.log(`✅ Passed`);
            passed++;
        } catch (e) {
            console.error(`❌ Failed`);
            console.error(e);
            failed++;
        }
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
}

runTests();
