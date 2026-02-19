const fs = require('fs');
const path = require('path');
const BookmarkletBuilder = require('../lib/bookmarklet-builder.js');

const TOOLS_PATH = path.join(__dirname, '../bookmarklets/tools.json');
const DIST_DIR = path.join(__dirname, '../dist');
const DIST_TOOLS_PATH = path.join(DIST_DIR, 'tools.json');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR);
}

// Read tools configuration
const tools = JSON.parse(fs.readFileSync(TOOLS_PATH, 'utf8'));

const distTools = [];

console.log(`Building ${tools.length} bookmarklets...`);

tools.forEach(tool => {
    console.log(`Processing: ${tool.name} (${tool.file})`);

    const sourcePath = path.join(__dirname, '..', tool.file);
    const sourceDir = path.dirname(sourcePath);

    try {
        let mainCode = fs.readFileSync(sourcePath, 'utf8');

        // 1. Extract and inject dependencies (Shallow, consistent with index.html)
        // Note: index.html prepends dependencies.
        const deps = BookmarkletBuilder.extractDependencies(mainCode);
        // Reverse to prepend in correct order (dependency first)
        const reversedDeps = [...deps].reverse();

        let finalCode = mainCode;

        for (const dep of reversedDeps) {
            const depPath = path.join(sourceDir, dep);
            console.log(`  - Injecting dependency: ${dep}`);
            const depCode = fs.readFileSync(depPath, 'utf8');
            finalCode = depCode + '\n' + finalCode;
        }

        // 2. Process @include_text directives
        // Regex to match /* @include_text path/to/file.ext */
        // We use the same regex logic as index.html to be consistent.
        const includeRegex = /\/\*\s*@include_text\s+['"]?([^'"]+?)['"]?\s*\*\//g;

        finalCode = finalCode.replace(includeRegex, (match, relPath) => {
            const incPath = path.join(sourceDir, relPath.trim());
            console.log(`  - Including text: ${relPath}`);
            try {
                let incText = fs.readFileSync(incPath, 'utf8');
                // Escape backticks and ${} to be safe inside template literals
                incText = incText.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
                return incText;
            } catch (err) {
                console.error(`  ! Failed to include ${incPath}: ${err.message}`);
                throw err;
            }
        });

        // 3. Compile/Minify
        const compiled = BookmarkletBuilder.compile(finalCode);

        // 4. Generate URI
        const href = `javascript:${encodeURIComponent(compiled)}`;

        // 5. Add to dist object
        distTools.push({
            ...tool,
            href: href,
            buildTime: new Date().toISOString()
        });

    } catch (err) {
        console.error(`Error building ${tool.name}:`, err);
        process.exit(1);
    }
});

// Write output
fs.writeFileSync(DIST_TOOLS_PATH, JSON.stringify(distTools, null, 2));
console.log(`\nBuild complete! Output written to ${DIST_TOOLS_PATH}`);
