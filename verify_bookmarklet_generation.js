const fs = require('fs');
const path = require('path');
const { compile } = require('./compile_bookmarklet');

const files = [
  'bookmarklets/pa-county-finder.js',
  'bookmarklets/passphrase-generator.js',
  'bookmarklets/target-edit.js',
  'bookmarklets/temp-password.js',
  'bookmarklets/property-clipper.js',
  'bookmarklets/utils.js'
];

if (require.main === module) {
  (async () => {
    await Promise.all(files.map(async file => {
      try {
        const rawCode = await fs.promises.readFile(file, 'utf8');

        // --- SIMULATE index.html LOGIC ---
        // Uses shared compilation logic to prevent drift
        let code = compile(rawCode);

        // 3. Encode
        const bookmarklet = `javascript:${encodeURIComponent(code)}`;

        console.log(`\n--- ${file} ---`);
        console.log(`Original Length: ${rawCode.length}`);
        console.log(`Processed Length: ${code.length}`);
        console.log(`Bookmarklet Length: ${bookmarklet.length}`);

        // Check for single-line comments in the processed code
        if (code.includes('//')) {
            console.warn(`WARNING: ${file} contains single-line comments ('//'). Without newline preservation, this would break.`);
            // Verify newlines are present
            if (!code.includes('\n')) {
                console.error(`CRITICAL: Single-line comment found but no newlines preserved! Code is broken.`);
            } else {
                console.log(`SAFE: Single-line comments found, but newlines preserved.`);
            }
        } else {
            console.log(`SAFE: No single-line comments found.`);
        }

        // Check size limit (approx 2000 chars is safe for older browsers, modern support ~64k)
        if (bookmarklet.length > 2000) {
            console.warn(`NOTE: Bookmarklet size > 2000 chars. Modern browsers handle this, but older ones (IE) might not.`);
        }

      } catch (err) {
        console.error(`Error reading ${file}: ${err.message}`);
      }
    }));
  })();
}
