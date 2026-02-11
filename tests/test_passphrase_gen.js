const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// 1. Mock Browser Environment
const window = {
    crypto: {
        getRandomValues: (array) => {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 0xffffffff);
            }
            return array;
        }
    },
    TEMP_PASSWORD_CONFIG: null,
    BookmarkletUtils: {} // Will be populated by utils.js
};

const document = {
    createElement: (tag) => {
        return {
            style: {},
            appendChild: () => {},
            textContent: '',
            innerHTML: '',
            setAttribute: () => {},
            addEventListener: () => {},
            onclick: null,
            remove: () => {},
            value: '',
            dataset: {}
        };
    },
    body: {
        appendChild: () => {},
        removeChild: () => {},
        style: {}
    },
    getElementById: () => null
};

const navigator = {
    clipboard: {
        writeText: () => Promise.resolve()
    }
};

const context = {
    window,
    document,
    navigator,
    URL: {
        createObjectURL: () => 'blob:url',
        revokeObjectURL: () => {}
    },
    Blob: class Blob {},
    Uint32Array: Uint32Array,
    console: console,
    setTimeout: (fn) => fn(), // Execute immediately
    Object: Object
};

vm.createContext(context);

// 2. Load Source Files
const utilsCode = fs.readFileSync('bookmarklets/utils.js', 'utf8');
const passGenCode = fs.readFileSync('bookmarklets/passphrase-generator.js', 'utf8');

// 3. Execute Utils first (simulating injection)
try {
    vm.runInContext(utilsCode, context);
    console.log('✅ utils.js executed successfully');
} catch (e) {
    console.error('❌ utils.js failed:', e);
    process.exit(1);
}

// 4. Check if BookmarkletUtils is defined
if (!context.window.BookmarkletUtils) {
    console.error('❌ window.BookmarkletUtils is not defined after running utils.js');
    process.exit(1);
} else {
    console.log('✅ window.BookmarkletUtils is defined');
}

// 5. Execute Passphrase Generator
try {
    // We need to instrument the code to inspect internal state or return value?
    // passphrase-generator.js is an IIFE that renders UI. It doesn't return anything.
    // However, it uses getRand internally.

    // If we want to verify it works, we can spy on document.body.appendChild to see if overlay is added.
    let overlayAdded = false;
    context.document.body.appendChild = (el) => {
        overlayAdded = true;
    };

    vm.runInContext(passGenCode, context);

    if (overlayAdded) {
        console.log('✅ passphrase-generator.js executed and added overlay to body');
    } else {
        console.error('❌ passphrase-generator.js executed but did NOT add overlay to body');
        process.exit(1);
    }

} catch (e) {
    console.error('❌ passphrase-generator.js failed:', e);
    process.exit(1);
}

console.log('🎉 All tests passed!');
