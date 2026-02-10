const assert = require('assert');
const { find } = require('./bookmarklets/pa-county-finder.js');

console.log('Running PA County Finder Tests...');

// 1. Valid ZIP Code (Adams County)
{
    const input = '17301';
    const expected = '17301: Adams';
    const result = find(input);
    assert.strictEqual(result, expected, `Failed for input ${input}`);
    console.log(`✅ Valid ZIP ${input}`);
}

// 2. Split ZIP Code (Allegheny and Westmoreland)
// 15085 is in both Allegheny and Westmoreland counties based on the O object.
{
    const input = '15085';
    const result = find(input);
    assert.ok(result.includes('Allegheny'), `Result for ${input} should include Allegheny`);
    assert.ok(result.includes('Westmoreland'), `Result for ${input} should include Westmoreland`);
    console.log(`✅ Split ZIP ${input}`);
}

// 3. Valid City (Gettysburg)
{
    const input = 'Gettysburg';
    const expected = 'Gettysburg: Adams';
    const result = find(input);
    assert.strictEqual(result, expected, `Failed for input ${input}`);
    console.log(`✅ Valid City ${input}`);
}

// 4. Case Insensitivity (PITTSBURGH)
{
    const input = 'PITTSBURGH';
    const expected = 'PITTSBURGH: Allegheny';
    const result = find(input);
    assert.strictEqual(result, expected, `Failed for input ${input}`);
    console.log(`✅ Case Insensitive City ${input}`);
}

// 5. Invalid ZIP
{
    const input = '99999';
    const result = find(input);
    assert.strictEqual(result, null, `Failed for invalid ZIP ${input}`);
    console.log(`✅ Invalid ZIP ${input}`);
}

// 6. Invalid City
{
    const input = 'Atlantis';
    const result = find(input);
    assert.strictEqual(result, null, `Failed for invalid City ${input}`);
    console.log(`✅ Invalid City ${input}`);
}

// 7. Empty String
{
    const input = '   ';
    const result = find(input);
    assert.strictEqual(result, null, `Failed for empty string`);
    console.log(`✅ Empty String`);
}

// 8. Partial Match (Should fail, code uses ===)
{
    const input = 'Pitt';
    const result = find(input);
    assert.strictEqual(result, null, `Failed for partial match ${input}`);
    console.log(`✅ Partial Match ${input}`);
}

console.log('All tests passed!');
