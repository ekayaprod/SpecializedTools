const assert = require('assert');
const { find } = require('../bookmarklets/pa-county-finder.js');

console.log('Running PA County Finder Edge Cases...');

// Define test cases for split cities that are ONLY in O (Overrides)
const splitCitiesOnlyInOverrides = [
    { city: 'Adamstown', expected: ['Berks', 'Lancaster'] },
    { city: 'Seven Springs', expected: ['Fayette', 'Somerset'] }
];

// Define test cases for split cities that are in D (Data Array)
const splitCitiesInD = [
    { city: 'Bethlehem', expected: ['Lehigh', 'Northampton'] },
    { city: 'Trafford', expected: ['Allegheny', 'Westmoreland'] }
];

let passed = 0;
let failed = 0;

function runTest(testCase) {
    const input = testCase.city;
    const result = find(input);

    // Result format is "City: County1, County2"
    // Extract counties
    if (!result) {
        console.error(`❌ ${input}: Result is null/undefined.`);
        failed++;
        return;
    }

    const parts = result.split(':');
    if (parts.length < 2) {
        console.error(`❌ ${input}: Invalid format "${result}".`);
        failed++;
        return;
    }

    const countiesStr = parts[1].trim();
    const counties = countiesStr.split(', ').sort();
    const expected = testCase.expected.sort();

    try {
        assert.deepStrictEqual(counties, expected);
        console.log(`✅ ${input}: ${result}`);
        passed++;
    } catch (e) {
        console.error(`❌ ${input}`);
        console.error(`   Expected: ${expected.join(', ')}`);
        console.error(`   Actual:   ${counties.join(', ')}`);
        failed++;
    }
}

console.log('\nTesting Split Cities (Overrides Only)...');
splitCitiesOnlyInOverrides.forEach(runTest);

console.log('\nTesting Split Cities (In Main Data)...');
splitCitiesInD.forEach(runTest);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
    console.error('Test suite failed.');
    process.exit(1);
}
