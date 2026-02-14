(function(w) {
    /* Shared Random Buffer */
    const BUFFER_SIZE = 256;
    const r = new Uint32Array(BUFFER_SIZE);
    let rIdx = BUFFER_SIZE;

    /*
     * Restricted list: Stabilize layout without breaking flexible content.
     * This whitelist ensures only safe visual styles are copied, preventing
     * style-injection attacks (e.g. binding behaviors) and keeping the export lightweight.
     */
    const safeProperties = [
        'display', 'visibility', 'opacity', 'z-index',
        'margin', 'padding', 'border', 'border-radius', 'box-shadow', 'box-sizing',
        'background', 'background-color', 'background-image', 'color',
        'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
        'list-style', 'vertical-align', 'float', 'clear',
        /* Dimensions */
        'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
        /* Flexbox */
        'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-basis',
        'justify-content', 'align-items', 'align-content', 'align-self', 'gap', 'order',
        /* Grid */
        'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
        'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
        'grid-area', 'grid-column', 'grid-row',
        /* Alignment */
        'place-content', 'place-items', 'place-self',
        /* Text & Overflow */
        'white-space', 'overflow', 'text-overflow', 'word-wrap', 'word-break',
        'text-transform', 'text-decoration', 'letter-spacing', 'word-spacing',
        /* Images/Media */
        'object-fit', 'object-position',
        /* Positioning & Transform (Fix for Layout Collapse) */
        'position', 'top', 'bottom', 'left', 'right',
        'transform', 'transform-origin', 'transform-style'
    ];

    w.BookmarkletUtils = {
        /**
         * Cleans a string to be safe for use as a filename.
         * Truncates to 50 chars and replaces special chars with underscores.
         *
         * @param {string} s - The input string (e.g., page title).
         * @returns {string} Safe filename string.
         */
        sanitizeFilename: function(s) {
            /* Replace non-alphanumeric characters with underscores and truncate */
            return String(s || 'export').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        },
        downloadFile: function(filename, content, type) {
            /* Create blob and download link */
            const blob = new Blob([content], { type: type || 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            /* Revoke URL after short delay to free memory */
            setTimeout(function() { URL.revokeObjectURL(url); }, 100);
        },
        getRand: function(m) {
            if (rIdx >= BUFFER_SIZE) {
                window.crypto.getRandomValues(r);
                rIdx = 0;
            }
            return r[rIdx++] % m;
        },
        /**
         * Stabilizes images for export by resolving lazy loading attributes (data-src)
         * and selecting the highest resolution candidate from srcset.
         *
         * @param {HTMLElement} root - The root element to scan for images.
         */
        normalizeImages: function(root) {
            /* Basic <picture> Support */
            const pictures = root.querySelectorAll('picture');
            pictures.forEach(function(pic) {
                const img = pic.querySelector('img');
                const source = pic.querySelector('source');
                if (source && source.srcset && img && !img.src) {
                    img.src = source.srcset.split(',')[0].trim().split(' ')[0];
                }
            });

            const imgs = root.querySelectorAll('img');
            for (let i = 0; i < imgs.length; i++) {
                const img = imgs[i];
                /* 1. Resolve Lazy Loading */
                if (img.dataset.src) img.src = img.dataset.src;
                if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;

                /* Check for placeholder or missing src */
                const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
                if (isPlaceholder && img.srcset) {
                    const parts = img.srcset.split(',');
                    if(parts.length > 0) {
                         /* Pick the last candidate (usually highest res) */
                         const bestCandidate = parts[parts.length - 1].trim().split(' ')[0];
                         if(bestCandidate) img.src = bestCandidate;
                    }
                }

                /* 2. Remove lazy loading attributes to force render */
                img.removeAttribute('loading');

                /* 3. Stabilize Dimensions: remove specific width/height attrs to let CSS max-width work */
                img.removeAttribute('width');
                img.removeAttribute('height');
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
            }
        },
        /**
         * Recursively removes dangerous attributes (event handlers, javascript: URIs)
         * from a root element and all its descendants to prevent XSS.
         *
         * @param {HTMLElement} root - The root element to sanitize.
         */
        sanitizeAttributes: function(root) {
            /* Recursively remove dangerous attributes from root and its descendants */
            const process = function(el) {
                if (!el.attributes) return;
                const attrs = [];
                /* Iterate copy of attributes to safely remove them */
                for (let i = 0; i < el.attributes.length; i++) attrs.push(el.attributes[i].name);

                for (let i = 0; i < attrs.length; i++) {
                    const name = attrs[i];
                    const lowerName = name.toLowerCase();
                    const val = (el.getAttribute(name) || '').toLowerCase().trim();

                    /* 1. Event Handlers (on*) */
                    if (lowerName.startsWith('on')) {
                        el.removeAttribute(name);
                    }
                    /* 2. SRCDOC (Always remove to prevent iframe injection) */
                    else if (lowerName === 'srcdoc') {
                        el.removeAttribute(name);
                    }
                    /* 3. Malicious URIs (javascript:, vbscript:, data: except images) */
                    else if (lowerName === 'href' || lowerName === 'src' || lowerName === 'action' || lowerName === 'data' || lowerName === 'formaction' || lowerName === 'poster' || lowerName === 'xlink:href') {
                        if (val.startsWith('javascript:') || val.startsWith('vbscript:')) {
                            el.removeAttribute(name);
                        }
                        else if (val.startsWith('data:') && !val.startsWith('data:image/')) {
                            el.removeAttribute(name);
                        }
                    }
                    /* 4. Style Attribute (check for javascript: or expression) */
                    else if (lowerName === 'style') {
                        /* Remove all whitespace to catch obfuscation like 'java script:' */
                        const checkVal = val.replace(/\s+/g, '');
                        if (checkVal.includes('javascript:') || checkVal.includes('vbscript:') || checkVal.includes('expression(')) {
                            el.removeAttribute(name);
                        }
                    }
                }
            };

            process(root);
            const all = root.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
                process(all[i]);
            }
        },
        /**
         * Recursively applies computed styles from a source element to a target element.
         * Only properties listed in the 'safeProperties' whitelist are copied to preserve layout
         * without breaking flexibility or security.
         *
         * @param {HTMLElement} source - The original DOM element to read styles from.
         * @param {HTMLElement} target - The cloned/target element to apply styles to.
         */
        inlineStyles: function(source, target) {
            /* Recursively apply SAFE computed styles from source to target */
            const computed = window.getComputedStyle(source);
            if (!computed) return;

            /* Apply to current element */
            const styles = [];
            for (let i = 0, len = safeProperties.length; i < len; i++) {
                const prop = safeProperties[i];
                const val = computed.getPropertyValue(prop);

                /* Skip default values to keep size manageable */
                if (val && val !== 'none' && val !== 'normal') {
                     styles.push(prop + ':' + val);
                }
            }

            /* Preserve existing inline styles too - using cssText to avoid overwrites */
            if (styles.length > 0) {
                target.style.cssText += styles.join('; ') + '; ';
            }

            /* Recurse children */
            const sourceChildren = source.children;
            const targetChildren = target.children;

            for (let i = 0; i < sourceChildren.length; i++) {
                if (targetChildren[i]) {
                    window.BookmarkletUtils.inlineStyles(sourceChildren[i], targetChildren[i]);
                }
            }
        },
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
        htmlToMarkdown: function(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            let markdown = '';

            function traverse(node) {
                if (node.nodeType === 3) {
                    /* Text node */
                    markdown += node.nodeValue;
                    return;
                }

                if (node.nodeType !== 1) return;

                const tag = node.tagName.toLowerCase();

                if (tag === 'script' || tag === 'style' || tag === 'noscript') return;

                switch(tag) {
                    case 'h1': markdown += '\n# '; break;
                    case 'h2': markdown += '\n## '; break;
                    case 'h3': markdown += '\n### '; break;
                    case 'h4': markdown += '\n#### '; break;
                    case 'strong':
                    case 'b': markdown += '**'; break;
                    case 'em':
                    case 'i': markdown += '*'; break;
                    case 'p': markdown += '\n\n'; break;
                    case 'br': markdown += '\n'; break;
                    case 'li':
                        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'ol') {
                            const index = Array.prototype.indexOf.call(node.parentElement.children, node) + 1;
                            markdown += '\n' + index + '. ';
                        } else {
                            markdown += '\n- ';
                        }
                        break;
                    case 'a': markdown += '['; break;
                    case 'img':
                        const src = node.getAttribute('src');
                        const alt = node.getAttribute('alt') || '';
                        markdown += '![' + alt + '](' + src + ')';
                        return; /* Skip children of img */
                    case 'table': markdown += '\n\n'; break;
                case 'tr': break;
                    case 'td':
                    case 'th': markdown += '| '; break;
                }

                /* Traverse children */
                for (let i = 0; i < node.childNodes.length; i++) {
                    traverse(node.childNodes[i]);
                }

                /* Closing tags */
                switch(tag) {
                    case 'strong':
                    case 'b': markdown += '**'; break;
                    case 'em':
                    case 'i': markdown += '*'; break;
                    case 'a':
                        const href = node.getAttribute('href');
                        if (href) markdown += '](' + href + ')';
                        else markdown += ']';
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                case 'p':
                        markdown += '\n'; break;
                    case 'tr': markdown += '|\n'; break;
                }
            }

            traverse(doc.body);

            /* Cleanup excessive newlines */
            return markdown.replace(/\n\s+\n/g, '\n\n').trim();
        }
    };
})(window);
