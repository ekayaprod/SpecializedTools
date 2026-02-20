const assert = require('assert');
const { compile } = require('../bookmarklets/bookmarklet-builder.js');

console.log('Running tests for bookmarklet regex handling...');

const tests = [
    {
        name: 'Regex with single quote',
        input: `
            const r = /'/;
            const s = 'string';
        `,
        // Expected: preserved regex and string.
        // The builder trims lines, so indentation is removed.
        expected: `const r = /'/;\nconst s = 'string';`
    },
    {
        name: 'Regex with double quote',
        input: `
            const r = /"/;
            const s = "string";
        `,
        expected: `const r = /"/;\nconst s = "string";`
    },
    {
        name: 'Regex with escaped slash',
        input: `
            const pathRegex = /\\/home\\/user/;
            const s = 'path';
        `,
        expected: `const pathRegex = /\\/home\\/user/;\nconst s = 'path';`
    },
    {
        name: 'Complex Regex with flags',
        input: `const r = /['"]/gim;`,
        expected: `const r = /['"]/gim;`
    },
    {
        name: 'Regex followed by comment',
        input: `
            const r = /'/; /* comment */
            const s = 'foo';
        `,
        // Comment should be removed if correctly parsed as comment.
        // However, if parsed as string part, it would remain.
        // If parsed as regex token, it remains? No.
        // If /'/ is tokenized, then /* comment */ follows.
        // It matches as comment block and is removed.
        expected: `const r = /'/;\nconst s = 'foo';`
    },
    {
        name: 'Division (Not Regex)',
        input: `
            const x = 10 / 2;
            const y = 5;
        `,
        // Should not be mangled.
        expected: `const x = 10 / 2;\nconst y = 5;`
    },
    {
        name: 'Division looking like regex start',
        input: `
            const x = 10 / 2 / 5;
        `,
        // Should be preserved.
        // If our regex pattern matches / 2 /, it preserves it.
        // Result: const x = 10 / 2 / 5;
        expected: `const x = 10 / 2 / 5;`
    },
    {
        name: 'String containing regex-like text',
        input: `const s = "/abc/";`,
        expected: `const s = "/abc/";`
    },
    {
        name: 'Regression: Normal String',
        input: `const s = "hello";`,
        expected: `const s = "hello";`
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
        console.error(`   Input:    ${JSON.stringify(test.input)}`);
        console.error(`   Expected: ${JSON.stringify(test.expected)}`);
        console.error(`   Actual:   ${JSON.stringify(compile(test.input))}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    process.exit(1);
}
