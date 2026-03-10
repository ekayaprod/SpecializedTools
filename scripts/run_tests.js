const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Determine the tests directory
const testsDir = path.join(__dirname, '../tests');

// Check if tests directory exists
if (!fs.existsSync(testsDir)) {
    console.error(`Tests directory not found: ${testsDir}`);
    process.exit(1);
}

// Find test files
const files = fs
    .readdirSync(testsDir)
    .filter((file) => file.startsWith('test-') && file.endsWith('.js'))
    .sort(); // Sort alphabetically for consistent execution order

if (files.length === 0) {
    console.warn('No test files found.');
    process.exit(0);
}

console.log(`Found ${files.length} test files to run.`);

let passed = 0;
let failed = 0;

// Execute each test file
for (const file of files) {
    console.log(`\n🚀 Running ${file}...`);

    const startTime = Date.now();
    const result = spawnSync('node', [path.join(testsDir, file)], {
        stdio: 'inherit',
        env: process.env, // Inherit environment variables
    });
    const duration = Date.now() - startTime;

    if (result.status === 0) {
        console.log(`✅ ${file} passed (${duration}ms)`);
        passed++;
    } else {
        console.error(`❌ ${file} failed with exit code ${result.status} (${duration}ms)`);
        failed++;
    }
}

console.log('\n----------------------------------------');
console.log(`Summary: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
