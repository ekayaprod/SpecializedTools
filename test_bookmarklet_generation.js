const assert = require('assert');
const { formatCode } = require('./verify_bookmarklet_generation');

console.log('Running tests for bookmarklet generation logic...');

const tests = [
    {
        name: 'Basic code trimming',
        input: `
            function test() {
                return true;
            }
        `,
        expected: `function test() {
return true;
}`
    },
    {
        name: 'Remove empty lines',
        input: `
            line 1

            line 2
        `,
        expected: `line 1
line 2`
    },
    {
        name: 'Preserve newlines',
        input: `line 1
line 2`,
        expected: `line 1
line 2`
    },
    {
        name: 'Template literals (newlines preserved, indentation trimmed)',
        input: 'const prompt = `line 1\n  line 2`;',
        expected: 'const prompt = `line 1\nline 2`;'
    },
    {
        name: 'Single line code',
        input: 'alert("hello");',
        expected: 'alert("hello");'
    },
    {
        name: 'Trailing spaces',
        input: 'line 1   \nline 2   ',
        expected: 'line 1\nline 2'
    }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    try {
        const actual = formatCode(test.input);
        assert.strictEqual(actual, test.expected);
        console.log(`✅ ${test.name}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${test.name}`);
        console.error(`   Expected: ${JSON.stringify(test.expected)}`);
        console.error(`   Actual:   ${JSON.stringify(formatCode(test.input))}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
}
