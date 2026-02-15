const fs = require('fs');
const path = require('path');
const { compile, extractDependencies } = require('./compile_bookmarklet');

const files = [
  'bookmarklets/pa-county-finder.js',
  'bookmarklets/passphrase-generator.js',
  'bookmarklets/web-clipper.js',
  'bookmarklets/property-clipper.js',
  'bookmarklets/utils.js',
  'bookmarklets/quick-clicker.js',
  'bookmarklets/macro-builder.js',
  'bookmarklets/interaction-recorder.js',
  'bookmarklets/delayed-clicker.js'
];

const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// Helper to read file content
async function readFile(filePath) {
    return fs.promises.readFile(filePath, 'utf8');
}

(async () => {
    let hasError = false;

    console.log('Building bookmarklets...');

    // Pre-load utils.js content for injection if needed
    let utilsContent = '';
    try {
        utilsContent = await readFile('bookmarklets/utils.js');
    } catch (e) {
        console.error('Error reading utils.js:', e);
        process.exit(1);
    }

    await Promise.all(files.map(async file => {
        try {
            const rawCode = await readFile(file);
            const fileName = path.basename(file);

            // 1. Check for single-line comments (Verification Step)
            if (rawCode.includes('//')) {
                console.warn(`WARNING: ${file} contains single-line comments ('//'). Ensure newlines are preserved.`);
            }

            // 2. Extract Dependencies
            const deps = extractDependencies(rawCode);
            let codeToCompile = rawCode;

            // 3. Inject Dependencies (specifically utils.js)
            if (deps.includes('utils.js')) {
                // Remove the directive comment is handled by compile() removing block comments?
                // compile() removes /* ... */ blocks. So the @require block will be removed.
                // We just prepend the utils content.
                codeToCompile = utilsContent + '\n' + codeToCompile;
                console.log(`  + Injected utils.js into ${fileName}`);
            }

            // 4. Compile
            const compiledCode = compile(codeToCompile);

            // 5. Generate Bookmarklet URI (for size check)
            const bookmarklet = `javascript:${encodeURIComponent(compiledCode)}`;

            // 6. Size Check
            if (bookmarklet.length > 2000) {
                console.warn(`  ! ${fileName} size > 2000 chars (${bookmarklet.length}). May not work in older browsers.`);
            }

            // 7. Write to dist/
            const distPath = path.join(distDir, fileName);
            await fs.promises.writeFile(distPath, compiledCode);

            console.log(`✅ ${fileName} built (${compiledCode.length} bytes)`);

        } catch (err) {
            console.error(`❌ Error processing ${file}: ${err.message}`);
            hasError = true;
        }
    }));

    if (hasError) {
        process.exit(1);
    } else {
        console.log('Build complete.');
    }
})();
