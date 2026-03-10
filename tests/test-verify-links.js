const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');
const assert = require('assert');

const scriptPath = path.resolve(__dirname, '../scripts/verify_links.py');
const tempDirPrefix = path.join(os.tmpdir(), 'verify_links_test_');

console.log('🚀 Running verify_links.py integration tests...');

function runTest() {
    let tempDir;
    try {
        // 1. Setup Temp Dir
        tempDir = fs.mkdtempSync(tempDirPrefix);
        console.log(`Created temp dir: ${tempDir}`);

        // 2. Create Content

        // Valid file
        const validPath = path.join(tempDir, 'valid.md');
        fs.writeFileSync(validPath, '# Header\n\n[Internal Link](#header)\n[File Link](sibling.md)');

        // Sibling target
        const siblingPath = path.join(tempDir, 'sibling.md');
        fs.writeFileSync(siblingPath, '# Sibling\n\nContent');

        // Invalid Anchor Test
        // Note: The script explicitly skips links starting with '#'.
        // To test anchor validation, we must reference the file explicitly (e.g., ./file.md#anchor).
        const invalidAnchorPath = path.join(tempDir, 'invalid_anchor.md');
        // Using explicit relative path to force script to check anchor in target file
        fs.writeFileSync(invalidAnchorPath, '# Test\n\n[Broken Anchor](./invalid_anchor.md#missing)');

        // Invalid File Test
        const invalidFilePath = path.join(tempDir, 'invalid_file.md');
        fs.writeFileSync(invalidFilePath, '# Test\n\n[Broken File](missing.md)');

        // 3. Execute Script
        console.log('Executing python script...');
        const result = spawnSync('python3', [scriptPath], {
            cwd: tempDir,
            encoding: 'utf8',
            env: process.env
        });

        // 4. Verification
        console.log('Exit Code:', result.status);
        assert.notStrictEqual(result.status, 0, 'Script should have failed with exit code 1, got 0');

        const output = result.stdout + (result.stderr || '');
        // console.log('Script Output:\n', output);

        // Broken Anchor Check
        // Expected output contains: "Broken anchor in ... invalid_anchor.md: ./invalid_anchor.md#missing (Anchor #missing not found in ...)"
        assert.ok(output.includes('Broken anchor in'), 'Output missing "Broken anchor in" message');
        assert.ok(output.includes('invalid_anchor.md'), 'Output missing filename "invalid_anchor.md"');
        assert.ok(output.includes('#missing'), 'Output missing anchor detail "#missing"');

        // Broken File Check
        assert.ok(output.includes('Broken link in'), 'Output missing "Broken link in" message');
        assert.ok(output.includes('invalid_file.md'), 'Output missing filename "invalid_file.md"');
        assert.ok(output.includes('missing.md'), 'Output missing file details "missing.md"');

        // Valid file shouldn't be reported
        // The regex /Broken .* in .*valid\.md/ ensures no error reported for valid.md
        const validErrorRegex = /Broken .* in .*valid\.md/;
        assert.ok(!validErrorRegex.test(output), 'valid.md reported false positive errors');

        console.log('✅ Test Passed: All broken links identified correctly.');

    } catch (e) {
        console.error('❌ Test Failed:', e.message);
        // Important: Propagate exit code for test runner without killing it immediately?
        // run_tests.js spawns this as a child process. So process.exit(1) IS correct for the child.
        // The review requested removing "self-execution" or "process.exit(1)" to avoid killing runner?
        // scripts/run_tests.js spawns each test file: spawnSync('node', [file]).
        // So process.exit(1) here ONLY kills this test process, which is exactly what run_tests.js expects to count failure.
        // The reviewer might have misunderstood the test runner architecture or assumed a unified runner like Mocha/Jest within the same process.
        // However, using `assert` is better.
        process.exit(1);
    } finally {
        // 5. Cleanup
        if (tempDir) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log('Cleaned up temp dir');
            } catch (e) {
                console.error('Failed to cleanup temp dir:', e);
            }
        }
    }
}

runTest();
