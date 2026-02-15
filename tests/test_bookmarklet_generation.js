const assert = require('assert');
const { compile, extractDependencies } = require('../compile_bookmarklet');

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
    },
    {
        name: 'Block comment removal',
        input: `/* This is a comment */
        code();
        /* Another
           Comment */`,
        expected: 'code();'
    }
];

const dependencyTests = [
    {
        name: 'Extract single dependency',
        input: `/** @require utils.js */
        code();`,
        expected: ['utils.js']
    },
    {
        name: 'Extract multiple dependencies',
        input: `/** @require utils.js */
        /** @require other.js */
        code();`,
        expected: ['utils.js', 'other.js']
    },
    {
        name: 'Extract dependency with extra spaces',
        input: `/*   @require    utils.js    */
        code();`,
        expected: ['utils.js']
    },
    {
        name: 'Ignore normal comments',
        input: `/* This is a comment */
        /* @require utils.js */
        code();`,
        expected: ['utils.js']
    },
    {
        name: 'No dependencies',
        input: `/* This is a comment */
        code();`,
        expected: []
    }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    try {
        const actual = compile(test.input);
        assert.strictEqual(actual, test.expected);
        console.log(`✅ ${test.name}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${test.name}`);
        console.error(`   Expected: ${JSON.stringify(test.expected)}`);
        console.error(`   Actual:   ${JSON.stringify(compile(test.input))}`);
        failed++;
    }
});

console.log('\nRunning dependency extraction tests...');

dependencyTests.forEach(test => {
    try {
        const actual = extractDependencies(test.input);
        assert.deepStrictEqual(actual, test.expected);
        console.log(`✅ ${test.name}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${test.name}`);
        console.error(`   Expected: ${JSON.stringify(test.expected)}`);
        console.error(`   Actual:   ${JSON.stringify(extractDependencies(test.input))}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
}
