(function (w) {
    if (!w.BookmarkletUtils) w.BookmarkletUtils = /** @type {any} */ ({});

    /**
     * Recursively traverses a DOM node to build a Markdown representation.
     * @param {Node} node - The current DOM node.
     * @param {string[]} parts - The array accumulating Markdown parts.
     */
    function traverse(node, parts) {
        if (node.nodeType === 3) {
            parts.push(node.nodeValue);
            return;
        }
        if (node.nodeType !== 1) return;

        // Cast to HTMLElement for safe access to tagName and attributes
        const el = /** @type {HTMLElement} */ (node);
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript') return;

        switch (tag) {
            case 'h1':
                parts.push('\n# ');
                break;
            case 'h2':
                parts.push('\n## ');
                break;
            case 'h3':
                parts.push('\n### ');
                break;
            case 'h4':
                parts.push('\n#### ');
                break;
            case 'strong':
            case 'b':
                parts.push('**');
                break;
            case 'em':
            case 'i':
                parts.push('*');
                break;
            case 'p':
                parts.push('\n\n');
                break;
            case 'br':
                parts.push('\n');
                break;
            case 'li':
                parts.push(
                    el.parentElement && el.parentElement.tagName.toLowerCase() === 'ol'
                        ? `\n${Array.prototype.indexOf.call(el.parentElement.children, el) + 1}. `
                        : '\n- '
                );
                break;
            case 'a':
                parts.push('[');
                break;
            case 'img':
                parts.push(`![${el.getAttribute('alt') || ''}](${el.getAttribute('src') || ''})`);
                return;
            case 'table':
                parts.push('\n\n');
                break;
            case 'td':
            case 'th':
                parts.push('| ');
                break;
        }

        for (let i = 0; i < el.childNodes.length; i++) traverse(el.childNodes[i], parts);

        switch (tag) {
            case 'strong':
            case 'b':
                parts.push('**');
                break;
            case 'em':
            case 'i':
                parts.push('*');
                break;
            case 'a':
                parts.push(`](${el.getAttribute('href') || ''})`);
                break;
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'p':
                parts.push('\n');
                break;
            case 'tr':
                parts.push('|\n');
                break;
        }
    }

    /**
     * Converts an HTML string to Markdown format.
     * Supported tags:
     * - Headings (h1-h4)
     * - Text formatting (strong, b, em, i)
     * - Paragraphs and line breaks
     * - Lists (ul, ol)
     * - Links and Images
     * - Tables (basic support)
     *
     * @param {string} html - The HTML string to convert.
     * @returns {string} The Markdown representation.
     */
    w.BookmarkletUtils.htmlToMarkdown = function (html) {
        /* Guard: Input must be string */
        if (typeof html !== 'string') return '';

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        /* Guard: Parsing must produce a body */
        if (!doc.body) return '';

        const parts = [];
        traverse(doc.body, parts);

        /* Cleanup excessive newlines */
        return parts
            .join('')
            .replace(/\n\s+\n/g, '\n\n')
            .trim();
    };
})(window);
