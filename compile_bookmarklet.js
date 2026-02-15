(function(root) {

    function compile(code) {
        // 1. Remove Block Comments (Strictly avoid // comments in source files)
        code = code.replace(/\/\*[\s\S]*?\*\//g, '');

        // 2. Trim lines but PRESERVE NEWLINES.
        // This is critical for template literals (like LLM Prompts) to maintain formatting.
        code = code.split('\n').map(line => line.trim()).filter(l => l.length > 0).join('\n');

        return code;
    }

    function extractDependencies(code) {
        const deps = [];
        // Extract @require directives from block comments
        const regex = /\/\*+\s*@require\s+(\S+)\s*\*\//g;
        let match;
        while ((match = regex.exec(code)) !== null) {
            deps.push(match[1]);
        }
        return deps;
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { compile, extractDependencies };
    } else {
        root.BookmarkletCompiler = { compile, extractDependencies };
    }

})(typeof self !== 'undefined' ? self : this);
