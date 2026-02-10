const fs = require('fs');
const path = require('path');

const DEFAULT_FILES = [
  'bookmarklets/pa-county-finder.js',
  'bookmarklets/passphrase-generator.js',
  'bookmarklets/target-edit.js',
  'bookmarklets/temp-password.js',
  'bookmarklets/property-clipper.js'
];

/**
 * Validates a bookmarklet file.
 * @param {string} file The path to the file.
 * @returns {Promise<{success: boolean, errors: string[], warnings: string[]}>}
 */
async function verifyFile(file) {
    const errors = [];
    const warnings = [];

    try {
        const rawCode = await fs.promises.readFile(file, 'utf8');

        // --- SIMULATE index.html LOGIC ---
        // 1. Remove Block Comments
        let code = rawCode.replace(/\/\*[\s\S]*?\*\//g, '');

        // 2. Trim lines but PRESERVE NEWLINES.
        code = code.split('\n').map(line => line.trim()).filter(l => l.length > 0).join('\n');

        // 3. Encode
        const bookmarklet = `javascript:${encodeURIComponent(code)}`;

        console.log(`\n--- ${file} ---`);
        console.log(`Original Length: ${rawCode.length}`);
        console.log(`Processed Length: ${code.length}`);
        console.log(`Bookmarklet Length: ${bookmarklet.length}`);

        // Check for single-line comments in the processed code
        if (code.includes('//')) {
            warnings.push(`${file} contains single-line comments ('//'). Without newline preservation, this would break.`);
            console.warn(`WARNING: ${file} contains single-line comments ('//'). Without newline preservation, this would break.`);

            // Verify newlines are present
            if (!code.includes('\n')) {
                errors.push(`${file}: Single-line comment found but no newlines preserved! Code is broken.`);
                console.error(`CRITICAL: Single-line comment found but no newlines preserved! Code is broken.`);
            } else {
                console.log(`SAFE: Single-line comments found, but newlines preserved.`);
            }
        } else {
            console.log(`SAFE: No single-line comments found.`);
        }

        // Check size limit
        if (bookmarklet.length > 2000) {
            warnings.push(`NOTE: Bookmarklet size > 2000 chars. Modern browsers handle this, but older ones (IE) might not.`);
            console.warn(`NOTE: Bookmarklet size > 2000 chars. Modern browsers handle this, but older ones (IE) might not.`);
        }

        return {
            success: errors.length === 0,
            errors,
            warnings
        };

    } catch (err) {
        const msg = `Error reading ${file}: ${err.message}`;
        console.error(msg);
        errors.push(msg);
        return { success: false, errors, warnings };
    }
}

async function main(files) {
    const results = await Promise.all(files.map(verifyFile));

    const failedFiles = results.filter(r => !r.success);

    if (failedFiles.length > 0) {
        console.error(`\nVerification failed for ${failedFiles.length} files.`);
        process.exit(1);
    } else {
        console.log('\nAll files verified successfully.');
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const files = args.length > 0 ? args : DEFAULT_FILES;
    main(files);
}

module.exports = { verifyFile, DEFAULT_FILES };
