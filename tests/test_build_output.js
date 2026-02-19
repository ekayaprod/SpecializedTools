const fs = require('fs');
const path = require('path');
const assert = require('assert');

const DIST_FILE = path.join(__dirname, '../dist/tools.json');

console.log('Running test_build_output.js...');

if (!fs.existsSync(DIST_FILE)) {
    console.error(`❌ Build artifact not found: ${DIST_FILE}`);
    console.error('   Run "node scripts/build_bookmarklets.js" first.');
    process.exit(1);
}

try {
    const content = fs.readFileSync(DIST_FILE, 'utf8');
    const tools = JSON.parse(content);

    // 1. Check valid array
    assert(Array.isArray(tools), 'Output should be an array');
    console.log('✅ Output is a valid JSON array');

    // 2. Check count (should be 8)
    assert.strictEqual(tools.length, 8, 'Should have 8 tools');
    console.log('✅ Tool count matches (8)');

    // 3. Verify each tool
    tools.forEach(tool => {
        assert(tool.id, 'Tool missing ID');
        assert(tool.href, `Tool ${tool.id} missing href`);
        assert(tool.href.startsWith('javascript:'), `Tool ${tool.id} href must start with "javascript:"`);

        // Check for URI encoding
        // If it contains raw spaces, it's not encoded properly
        assert(!tool.href.includes(' '), `Tool ${tool.id} href should be URI encoded (no spaces)`);

        // Basic length check to ensure code was injected
        assert(tool.href.length > 100, `Tool ${tool.id} href seems too short`);
    });
    console.log('✅ All tools have valid javascript: hrefs');

    // 4. Verify specific content injection
    // Property Clipper (prop-clipper) should have injected includes
    const propClipper = tools.find(t => t.id === 'prop-clipper');
    assert(propClipper, 'Property Clipper not found');

    const decodedCode = decodeURIComponent(propClipper.href.replace('javascript:', ''));

    // Check for "Executive Summary & Verdict" which comes from standard-outputs.md
    assert(decodedCode.includes('Executive Summary & Verdict'),
        'Property Clipper missing included content from standard-outputs.md');

    // Check for "Senior STR Investment Analyst" from str-objective.md
    assert(decodedCode.includes('Senior STR Investment Analyst'),
        'Property Clipper missing included content from str-objective.md');

    console.log('✅ Content injection verified (Property Clipper)');

    console.log('\nALL TESTS PASSED');

} catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
}
