const assert = require('assert');
const { stripBlockComments } = require('./verify_bookmarklet_generation.js');

console.log('Testing stripBlockComments...');

// Test 1: Basic single-line block comment
const code1 = 'var a = 1; /* comment */ var b = 2;';
const expected1 = 'var a = 1;  var b = 2;';
assert.strictEqual(stripBlockComments(code1), expected1, 'Failed Test 1: Basic single-line block comment');

// Test 2: Multi-line block comment
const code2 = 'var a = 1;\n/* \n multi \n line \n */\nvar b = 2;';
const expected2 = 'var a = 1;\n\nvar b = 2;';
assert.strictEqual(stripBlockComments(code2), expected2, 'Failed Test 2: Multi-line block comment');

// Test 3: Multiple block comments
const code3 = '/* one */ var a = 1; /* two */';
const expected3 = ' var a = 1; ';
assert.strictEqual(stripBlockComments(code3), expected3, 'Failed Test 3: Multiple block comments');

// Test 4: No comments
const code4 = 'var a = 1;';
const expected4 = 'var a = 1;';
assert.strictEqual(stripBlockComments(code4), expected4, 'Failed Test 4: No comments');

// Test 5: Comment with code-like characters
const code5 = '/* var x = 1; */';
const expected5 = '';
assert.strictEqual(stripBlockComments(code5), expected5, 'Failed Test 5: Comment with code-like characters');

// Test 6: Incomplete comment start (should not strip)
const code6 = 'var a = 10 / 2 * 5;'; // Looks like / * but isn't comment
const expected6 = 'var a = 10 / 2 * 5;';
assert.strictEqual(stripBlockComments(code6), expected6, 'Failed Test 6: Incomplete comment start');

console.log('All tests passed!');
