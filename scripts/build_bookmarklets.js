const fs = require('fs');
const path = require('path');
const BookmarkletBuilder = require('../lib/bookmarklet-builder.js');

const TOOLS_CONFIG = path.join(__dirname, '../bookmarklets/tools.json');
const DIST_DIR = path.join(__dirname, '../dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'tools.json');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
}

async function build() {
    console.log('⚡ Starting Bookmarklet Build...');

    const tools = JSON.parse(fs.readFileSync(TOOLS_CONFIG, 'utf8'));
    const processedTools = [];

    for (const tool of tools) {
        console.log(`\n🔨 Building: ${tool.name} (${tool.id})`);

        try {
            const mainFilePath = path.join(__dirname, '..', tool.file);
            const visited = new Set();

            // Recursive dependency resolution
            const resolveSource = (filePath) => {
                // Normalize path to avoid duplicates
                const absPath = path.resolve(filePath);

                // If we've already included this file in this chain (or global set if we want singleton deps?)
                // Usually deps are singleton per bookmarklet build.
                if (visited.has(absPath)) {
                    return '';
                }
                visited.add(absPath);

                console.log(`   📄 Reading: ${path.relative(__dirname + '/..', absPath)}`);
                let code = fs.readFileSync(absPath, 'utf8');

                // 1. Resolve Dependencies (@require)
                // We use BookmarkletBuilder.extractDependencies which parses the current code
                const deps = BookmarkletBuilder.extractDependencies(code);
                let depsContent = '';

                // Process dependencies in reverse order so the first dependency
                // in the file ends up being first in the output (due to prepend logic)
                // Wait, recursive logic:
                // A requires B, C.
                // deps = [B, C].
                // Loop B: content += resolve(B). content is B.
                // Loop C: content += resolve(C). content is B + C.
                // Result: B + C + A.
                // If A says:
                // require B
                // require C
                // Then B should be before C?
                // Usually yes.
                // So deps array order [B, C].
                // content = resolve(B) + resolve(C).
                // Yes.

                for (const dep of deps) {
                    const depPath = path.join(path.dirname(absPath), dep);
                    depsContent += resolveSource(depPath) + '\n';
                }

                // 2. Resolve Includes (@include_text)
                // "/* @include_text 'path/to/file' */"
                const includeRegex = /\/\*\s*@include_text\s+['"]?([^'"]+?)['"]?\s*\*\//g;
                code = code.replace(includeRegex, (match, includePath) => {
                    const incAbsPath = path.join(path.dirname(absPath), includePath);
                    console.log(`      🔗 Including: ${path.relative(__dirname + '/..', incAbsPath)}`);
                    let incText = fs.readFileSync(incAbsPath, 'utf8');

                    // Escape for JS Template Literal (backticks and ${})
                    // Assuming the directive is used inside a backtick string
                    incText = incText.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

                    return incText;
                });

                return depsContent + code;
            };

            const fullCode = resolveSource(mainFilePath);
            const compiledCode = BookmarkletBuilder.compile(fullCode);
            const href = `javascript:${encodeURIComponent(compiledCode)}`;

            processedTools.push({
                ...tool,
                href: href
            });

            console.log(`   ✅ Compiled (Length: ${href.length} chars)`);

        } catch (err) {
            console.error(`   ❌ Error building ${tool.id}:`, err);
            process.exit(1);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(processedTools, null, 2));
    console.log(`\n🎉 Build Complete! Output: ${path.relative(__dirname + '/..', OUTPUT_FILE)}`);
}

build();
