const assert = require('assert');
const { compile, extractDependencies } = require('../bookmarklets/bookmarklet-builder.js');

console.log('Running tests for bookmarklet robustness...');

const tests = [
    {
        name: 'Block comment inside string',
        input: 'const s = "/* comment */";',
        expected: 'const s = "/* comment */";'
    },
    {
        name: 'Block comment inside template literal',
        input: 'const t = `/* comment */`;',
        expected: 'const t = `/* comment */`;'
    },
    {
        name: 'Template literal with indentation (preserved)',
        input: 'const t = `\n  indent\n  indent`;',
        expected: 'const t = `\n  indent\n  indent`;'
    },
    {
        name: 'Template literal with empty lines (preserved)',
        input: 'const t = `\n\n`;',
        expected: 'const t = `\n\n`;'
    },
    {
        name: 'Template literal with string interpolation',
        input: 'const t = `prefix ${val} suffix`;',
        expected: 'const t = `prefix ${val} suffix`;'
    },
    {
        name: 'Mixed content: Code + Comment + String',
        input: `
/* Remove me */
const s = "Keep me";
// Keep me (line comment)
/* Remove me too */
        `,
        expected: `const s = "Keep me";
// Keep me (line comment)`
    },
    {
        name: 'Multiple strings and templates',
        input: `
const a = "string 1";
/* comment */
const b = \`
  template
\`;
        `,
        expected: `const a = "string 1";
const b = \`
  template
\`;`
    }
];

const dependencyTests = [
    {
        name: 'Dependency in string (ignored)',
        input: 'const s = "/* @require malicious.js */";',
        expected: []
    },
    {
        name: 'Dependency in template literal (ignored)',
        input: 'const t = `/* @require malicious.js */`;',
        expected: []
    },
    {
        name: 'Valid dependency outside string',
        input: '/* @require utils.js */\nconst s = "text";',
        expected: ['utils.js']
    }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    try {
        const actual = compile(test.input);
        // Normalize whitespace for assertion if necessary, but we expect exact match for strings
        // Current implementation trims heavily, so we expect failure initially
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

console.log('\nRunning dependency robustness tests...');

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
