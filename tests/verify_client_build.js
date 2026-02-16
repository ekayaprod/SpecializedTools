const fs = require('fs');
const path = require('path');

// Mock of the logic inside index.html
function compile(code) {
    // 1. Remove Block Comments (Strictly avoid // comments in source files)
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    // 2. Trim lines but PRESERVE NEWLINES.
    code = code.split('\n').map(line => line.trim()).filter(l => l.length > 0).join('\n');

    return code;
}

function extractDependencies(code) {
    const deps = [];
    const regex = /\/\*+\s*@require\s+(\S+)\s*\*\//g;
    let match;
    while ((match = regex.exec(code)) !== null) {
        deps.push(match[1]);
    }
    return deps;
}

async function simulateBuild(filename) {
    const filepath = path.join(__dirname, '../bookmarklets', filename);
    let code = fs.readFileSync(filepath, 'utf8');

    const deps = extractDependencies(code);
    // Reverse because we prepend one by one
    const reversedDeps = [...deps].reverse();

    for (const dep of reversedDeps) {
        const depPath = path.join(__dirname, '../bookmarklets', dep);
        const depCode = fs.readFileSync(depPath, 'utf8');
        code = depCode + '\n' + code;
    }

    return compile(code);
}

(async () => {
    try {
        console.log('Verifying client-side build logic...');

        // Test with web-clipper.js which has a dependency
        const clientBuilt = await simulateBuild('web-clipper.js');

        // Read the dist version (reference)
        const distPath = path.join(__dirname, '../dist/web-clipper.js');
        const distBuilt = fs.readFileSync(distPath, 'utf8');

        if (clientBuilt === distBuilt) {
            console.log('✅ Client-side build logic matches dist/web-clipper.js');
        } else {
            console.error('❌ Mismatch in web-clipper.js build!');
            console.log('Client Length:', clientBuilt.length);
            console.log('Dist Length:', distBuilt.length);
            // Verify first few chars
            console.log('Client Start:', clientBuilt.substring(0, 50));
            console.log('Dist Start:', distBuilt.substring(0, 50));
            process.exit(1);
        }

        // Test with property-clipper.js (no deps)
        const clientBuiltProp = await simulateBuild('property-clipper.js');
        const distPathProp = path.join(__dirname, '../dist/property-clipper.js');
        const distBuiltProp = fs.readFileSync(distPathProp, 'utf8');

        if (clientBuiltProp === distBuiltProp) {
            console.log('✅ Client-side build logic matches dist/property-clipper.js');
        } else {
            console.error('❌ Mismatch in property-clipper.js build!');
             console.log('Client Length:', clientBuiltProp.length);
            console.log('Dist Length:', distBuiltProp.length);
            process.exit(1);
        }

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
})();
