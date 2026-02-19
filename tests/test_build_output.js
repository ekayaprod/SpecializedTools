const fs = require('fs');
const path = require('path');

const DIST_TOOLS_PATH = path.join(__dirname, '../dist/tools.json');

console.log('Running test_build_output.js...');

if (!fs.existsSync(DIST_TOOLS_PATH)) {
    console.error(`FAIL: ${DIST_TOOLS_PATH} does not exist. Run 'npm run build' first.`);
    process.exit(1);
}

try {
    const content = fs.readFileSync(DIST_TOOLS_PATH, 'utf8');
    const tools = JSON.parse(content);

    if (!Array.isArray(tools)) {
        console.error('FAIL: dist/tools.json is not an array.');
        process.exit(1);
    }

    if (tools.length === 0) {
        console.error('FAIL: dist/tools.json is empty.');
        process.exit(1);
    }

    let errors = 0;
    tools.forEach((tool, index) => {
        if (!tool.href || !tool.href.startsWith('javascript:')) {
            console.error(`FAIL: Tool at index ${index} (${tool.name}) has invalid href.`);
            errors++;
        }
        if (!tool.name) {
            console.error(`FAIL: Tool at index ${index} missing name.`);
            errors++;
        }
        // Check if compilation worked (no raw comments left)
        if (decodeURIComponent(tool.href).includes('/* @include_text')) {
             console.error(`FAIL: Tool at index ${index} (${tool.name}) contains uncompiled @include_text directive.`);
             errors++;
        }
    });

    if (errors > 0) {
        console.error(`FAIL: Found ${errors} errors in build output.`);
        process.exit(1);
    }

    console.log(`PASS: Verified ${tools.length} bookmarklets in dist/tools.json.`);

} catch (err) {
    console.error('FAIL: Error reading/parsing dist/tools.json:', err);
    process.exit(1);
}
