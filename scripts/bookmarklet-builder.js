(function (root) {
    // Regex source string for matching strings and block comments
    // Note on escaping: In a string literal, we need quadruple backslashes to match a literal backslash in the regex.
    // Pattern parts:
    // 1. Double quotes: "(?:\\.|[^"])*" -> matches " then (escaped char OR non-quote)* then "
    //    Actually, to match ANY escaped char (including newline), we use [\s\S].
    //    So: "(?:\\.[\s\S]|[^"])*" ? No, `.` doesn't match newline.
    //    Standard JS string regex: /"(?:[^"\\]|\\.)*"/
    //    My robust pattern: "(?:[^"\\]|\\.)*"
    //    Let's use the simpler standard pattern which handles newlines if we use [\s\S] for the dot?
    //    Wait, `.` in regex doesn't match newline.
    //    So `\\.` matches `\` followed by non-newline.
    //    But strings can have escaped newlines `\` + newline.
    //    So `\\[\s\S]` matches `\` followed by ANY character.
    //    So regex should be: `"(?:[^"\\]|\\[\s\S])*"`

    // String literal representation:
    // " -> \"
    // [^"\\] -> [^"\\\\]
    // \\[\s\S] -> \\\\[\\s\\S]

    // Added support for regex literals: /\/((?:[^/\\\r\n]|\\.)+)\/[gimuy]*/
    // This prevents the parser from confusing quotes inside regex literals with string delimiters.
    // Added support for line comments: /\/\/[^\r\n]*/
    const TOKEN_PATTERN =
        '("(?:[^"\\\\]|\\\\[\\s\\S])*"|\'(?:[^\'\\\\]|\\\\[\\s\\S])*\'|`(?:[^`\\\\]|\\\\[\\s\\S])*`|\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\r\\n]*|\\/(?:[^/\\\\\\r\\n]|\\\\.)+\\/[gimuy]*)';

    /**
     * Compiles source code by removing block and line comments and trimming lines while preserving strings and regex literals.
     * This acts as a basic minifier to prepare code for bookmarklet encoding.
     *
     * @param {string} code - The raw source code to compile.
     * @returns {string} The compiled (minified) code.
     *
     * @example
     * const raw = 'function test() { /* comment *' + '/ return "hello"; }';
     * const compiled = BookmarkletBuilder.compile(raw);
     * console.log(compiled); // Output: function test() { return "hello"; }
     */
    function compile(code) {
        const placeholders = [];
        // Create fresh regex instance to avoid state issues
        const tokenRegex = new RegExp(TOKEN_PATTERN, 'g');

        // 1. Mask strings and remove block/line comments
        let maskedCode = code.replace(tokenRegex, (match) => {
            if (match.startsWith('/*') || match.startsWith('//')) {
                // Comment: remove it
                return '';
            }
            // String/Template: preserve it by replacing with a placeholder
            // This prevents the subsequent line-trimming logic from destroying formatting inside templates
            const placeholder = `__BKM_STR_${placeholders.length}__`;
            placeholders.push(match);
            return placeholder;
        });

        // 2. Trim lines and remove empty lines
        // This effectively minifies the code structure while keeping newlines for readability/debugging
        maskedCode = maskedCode
            .split('\n')
            .map((line) => line.trim())
            .filter((l) => l.length > 0)
            .join('\n');

        // 3. Restore strings from placeholders
        return maskedCode.replace(/__BKM_STR_(\d+)__/g, (_, index) => {
            return placeholders[parseInt(index, 10)];
        });
    }

    /**
     * Scans source code for `@require` directives within block comments to identify dependencies.
     * This allows bookmarklets to declare their dependencies (e.g., utils.js) explicitly.
     *
     * @param {string} code - The source code to scan.
     * @returns {string[]} An array of dependency filenames found in the code.
     *
     * @example
     * const code = '/** @require utils.js *' + '/\nfunction init() {}';
     * const deps = BookmarkletBuilder.extractDependencies(code);
     * console.log(deps); // Output: ['utils.js']
     */
    function extractDependencies(code) {
        const deps = [];
        const tokenRegex = new RegExp(TOKEN_PATTERN, 'g');
        let match;

        while ((match = tokenRegex.exec(code)) !== null) {
            const token = match[0];
            if (token.startsWith('/*')) {
                // It's a comment, check for @require directives
                const requireRegex = /@require\s+(\S+)/g;
                let reqMatch;
                while ((reqMatch = requireRegex.exec(token)) !== null) {
                    deps.push(reqMatch[1]);
                }
            }
        }
        return deps;
    }

    const BookmarkletBuilder = { compile, extractDependencies };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = BookmarkletBuilder;
    } else {
        root.BookmarkletBuilder = BookmarkletBuilder;
    }
})(this);
