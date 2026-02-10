const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const filePath = path.join(__dirname, '../bookmarklets/passphrase-generator.js');
let code = fs.readFileSync(filePath, 'utf8');

const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
const utils = fs.readFileSync(utilsPath, 'utf8');
code = code.replace('/* @IMPORT_UTILS */', utils);

// --- INSTRUMENTATION ---
// The code is an IIFE: (function() { ... })();
// We want to inject a hook right before the IIFE closes to export internal variables.

const hook = `
    if (typeof __TEST_HOOK__ === 'function') {
        __TEST_HOOK__({ PHRASE_STRUCTURES, fullWordBank });
    }
})();
`;

// Find the last occurrence of })();
const lastIndex = code.lastIndexOf('})();');
if (lastIndex === -1) {
    console.error('Could not find IIFE closing in the file.');
    process.exit(1);
}

// Replace })(); with our hook + })();
// We remove the original })(); and append the hook which contains it.
const instrumentedCode = code.substring(0, lastIndex) + hook + code.substring(lastIndex + 5);

// --- MOCKING ---
const sandbox = {
    window: {
        crypto: {
            getRandomValues: (arr) => {
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
            }
        },
        getSelection: () => ({ toString: () => '' })
    },
    document: {
        createElement: (tag) => {
            return {
                style: {},
                appendChild: () => {},
                remove: () => {},
                textContent: '',
                onclick: null
            };
        },
        body: {
            appendChild: () => {}
        }
    },
    navigator: {
        clipboard: {
            writeText: () => {}
        }
    },
    console: console,
    __TEST_HOOK__: (data) => {
        runTests(data);
    }
};

// --- EXECUTION ---
console.log('Running instrumented code...');
try {
    vm.createContext(sandbox);
    vm.runInContext(instrumentedCode, sandbox);
} catch (e) {
    console.error('Error running code:', e);
    process.exit(1);
}

// --- VERIFICATION ---
function runTests(data) {
    const { PHRASE_STRUCTURES, fullWordBank } = data;

    console.log('Verifying PHRASE_STRUCTURES...');

    // 1. Check Top Level Keys
    assert.ok(PHRASE_STRUCTURES.standard, 'Missing "standard" key');
    assert.ok(PHRASE_STRUCTURES.seasonal, 'Missing "seasonal" key');

    // 2. Check Word Count Keys (2, 3, 4)
    ['standard', 'seasonal'].forEach(type => {
        ['2', '3', '4'].forEach(count => {
            assert.ok(PHRASE_STRUCTURES[type][count], `Missing "${count}" key in ${type}`);
            assert.ok(Array.isArray(PHRASE_STRUCTURES[type][count]), `${type}[${count}] should be an array`);
        });
    });

    // 3. Check Categories
    // Standard
    console.log('Verifying standard categories...');
    Object.values(PHRASE_STRUCTURES.standard).forEach(structures => {
        structures.forEach(structure => {
            structure.forEach(category => {
                assert.ok(fullWordBank[category], `Standard category "${category}" not found in fullWordBank`);
            });
        });
    });

    // Seasonal
    console.log('Verifying seasonal categories...');
    const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];

    // Verify seasons exist in fullWordBank
    seasons.forEach(s => {
        assert.ok(fullWordBank[s], `Season "${s}" not found in fullWordBank`);
    });

    Object.values(PHRASE_STRUCTURES.seasonal).forEach(structures => {
        structures.forEach(structure => {
            structure.forEach(category => {
                if (category.startsWith('Season')) {
                    const baseCategory = category.replace('Season', '');
                    seasons.forEach(season => {
                        assert.ok(fullWordBank[season][baseCategory], `Seasonal category "${baseCategory}" not found in season "${season}"`);
                    });
                } else {
                     assert.ok(fullWordBank[category], `Seasonal structure uses standard category "${category}" which is not found in fullWordBank`);
                }
            });
        });
    });

    console.log('✅ All tests passed!');
}
