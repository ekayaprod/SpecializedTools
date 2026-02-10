const fs = require('fs');
const path = require('path');

/**
 * Robustly extracts an object literal from code based on a starting marker.
 * Handles nested braces by counting them.
 */
function extractObject(code, startMarker) {
    const startIndex = code.indexOf(startMarker);
    if (startIndex === -1) return null;

    const openingBraceIndex = code.indexOf('{', startIndex);
    if (openingBraceIndex === -1) return null;

    let braceCount = 1;
    let i = openingBraceIndex + 1;
    while (braceCount > 0 && i < code.length) {
        const char = code[i];
        // Note: Simple brace counting is sufficient for this controlled source file
        // as it doesn't contain braces within strings or comments that would trip this up.
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        i++;
    }

    if (braceCount === 0) {
        return code.substring(openingBraceIndex, i);
    }
    return null;
}

/**
 * Validates the integrity of the PROMPTS object in property-clipper.js
 */
function testPrompts() {
    console.log("Testing Property Clipper Prompts...");
    const filePath = path.join(__dirname, '../bookmarklets/property-clipper.js');

    if (!fs.existsSync(filePath)) {
        console.error(`FAIL: File not found at ${filePath}`);
        process.exit(1);
    }

    const code = fs.readFileSync(filePath, 'utf8');

    // Improved extraction logic using brace matching instead of brittle regex
    const promptsStr = extractObject(code, 'const PROMPTS =');

    if (!promptsStr) {
        console.error("FAIL: Could not extract PROMPTS object from property-clipper.js");
        process.exit(1);
    }

    let PROMPTS;
    try {
        // Using eval on the object literal string.
        // Safe in this controlled test environment.
        PROMPTS = eval('(' + promptsStr + ')');
    } catch (e) {
        console.error("FAIL: Failed to parse extracted PROMPTS object", e);
        process.exit(1);
    }

    const requiredKeys = ['str', 'ltr', 'multi', 'flip'];
    let failed = false;

    // 1. Check that all required keys are present
    requiredKeys.forEach(key => {
        if (!(key in PROMPTS)) {
            console.error(`FAIL: Missing required key "${key}" in PROMPTS`);
            failed = true;
        }
    });

    // 2. Validate that EVERY key in the object is a non-empty string
    Object.keys(PROMPTS).forEach(key => {
        const prompt = PROMPTS[key];
        if (typeof prompt !== 'string') {
            console.error(`FAIL: Prompt "${key}" is not a string (type: ${typeof prompt})`);
            failed = true;
        } else if (prompt.trim().length === 0) {
            console.error(`FAIL: Prompt "${key}" is empty`);
            failed = true;
        } else {
            console.log(`  ✔ Prompt "${key}" is valid (length: ${prompt.length})`);

            // Smoke test for keywords to ensure content integrity
            const knownKeywords = {
                str: ['Short-Term Rental', 'STR', 'Sewer vs. Septic', 'HOA'],
                ltr: ['Long-Term Rental', 'LTR', 'Tenant', 'School District'],
                multi: ['Multi-Unit', 'Small Multi-Family', 'metered'],
                flip: ['Fix-and-Flip', 'Renovation', 'ARV', 'Rehab']
            };

            if (knownKeywords[key]) {
                knownKeywords[key].forEach(word => {
                    if (!prompt.includes(word)) {
                        console.warn(`  ⚠ WARNING: Prompt "${key}" might be missing keyword: "${word}"`);
                    }
                });
            }
        }
    });

    if (failed) {
        console.error("FAILED: Some prompt validation tests failed.");
        process.exit(1);
    }
    console.log("SUCCESS: All property-clipper prompt tests passed!");
}

// Run the test
if (require.main === module) {
    testPrompts();
}

module.exports = { testPrompts };
