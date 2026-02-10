const { execSync } = require('child_process');

/**
 * Simple test runner to execute project tests.
 */
function runTest(name, command) {
    console.log(`\n=== Running ${name} ===`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`--- ${name} Passed ---`);
        return true;
    } catch (error) {
        console.error(`--- ${name} Failed ---`);
        return false;
    }
}

const tests = [
    { name: 'Bookmarklet Generation Check', command: 'node verify_bookmarklet_generation.js' },
    { name: 'Property Clipper Prompt Integrity', command: 'node tests/property-clipper.test.js' }
];

console.log("Starting Browser Toolkit Test Suite...");
let allPassed = true;
tests.forEach(test => {
    if (!runTest(test.name, test.command)) {
        allPassed = false;
    }
});

if (!allPassed) {
    console.error('\n❌ SOME TESTS FAILED');
    process.exit(1);
} else {
    console.log('\n✅ ALL TESTS PASSED');
    process.exit(0);
}
