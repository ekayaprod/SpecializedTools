const fs = require('fs');
const path = require('path');
const { verifyFile } = require('./verify_bookmarklet_generation');

const TEST_DIR = 'test_temp_bookmarklets';

if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR);
}

const testCases = [
    {
        name: 'valid_code.js',
        content: `
            /* Block Comment */
            function hello() {
                console.log("Hello");
            }
        `,
        expectedSuccess: true,
        expectedWarnings: 0,
        expectedErrors: 0
    },
    {
        name: 'single_line_comment_warning.js',
        content: `
            function hello() {
                // This is a comment
                console.log("Hello");
            }
        `,
        expectedSuccess: true, // It is technically safe if newlines preserved
        expectedWarnings: 1,   // Should warn about //
        expectedErrors: 0
    },
    {
        name: 'single_line_comment_critical.js',
        content: `// This is a comment that breaks single line code`,
        expectedSuccess: false,
        expectedWarnings: 1,
        expectedErrors: 1
    },
    {
        name: 'valid_minified_like.js',
        content: `javascript:alert('hello');`,
        expectedSuccess: true,
        expectedWarnings: 0,
        expectedErrors: 0
    }
];

async function runTests() {
    let failed = 0;

    for (const test of testCases) {
        const filePath = path.join(TEST_DIR, test.name);
        fs.writeFileSync(filePath, test.content);

        console.log(`Testing ${test.name}...`);
        const result = await verifyFile(filePath);

        let passed = true;
        if (result.success !== test.expectedSuccess) {
            console.error(`  FAIL: Expected success=${test.expectedSuccess}, got ${result.success}`);
            passed = false;
        }

        // Check warnings count (approximate check is fine, verify > 0 if expected)
        if (test.expectedWarnings > 0 && result.warnings.length === 0) {
             console.error(`  FAIL: Expected warnings, got none.`);
             passed = false;
        } else if (test.expectedWarnings === 0 && result.warnings.length > 0) {
             console.error(`  FAIL: Expected no warnings, got ${result.warnings.length}: ${result.warnings.join(', ')}`);
             passed = false;
        }

        // Check errors count
        if (test.expectedErrors > 0 && result.errors.length === 0) {
             console.error(`  FAIL: Expected errors, got none.`);
             passed = false;
        } else if (test.expectedErrors === 0 && result.errors.length > 0) {
             console.error(`  FAIL: Expected no errors, got ${result.errors.length}: ${result.errors.join(', ')}`);
             passed = false;
        }

        if (passed) {
            console.log(`  PASS`);
        } else {
            failed++;
        }
    }

    // Cleanup
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    if (failed > 0) {
        console.error(`\n${failed} tests failed.`);
        process.exit(1);
    } else {
        console.log(`\nAll tests passed.`);
    }
}

runTests();
