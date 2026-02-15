(function(w) {
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
         * Creates a DOM element with specified properties.
         * @param {string} tag - The tag name of the element.
         * @param {Object} [styles={}] - The style object to apply.
         * @param {string} [text=''] - The text content of the element.
         * @param {HTMLElement|null} [parent=null] - The parent element to append to.
         * @param {Object} [props={}] - Additional properties to assign to the element.
         * @returns {HTMLElement} The created element.
         */
        buildElement(tag, styles = {}, text = '', parent = null, props = {}) {
            const el = document.createElement(tag);
            if (text) el.textContent = text;
            Object.assign(el.style, styles);
            Object.assign(el, props);
            if (parent) parent.appendChild(el);
            return /** @type {HTMLElement} */ (el);
        },

        /**
         * Cleans a string to be safe for use as a filename.
         * Truncates to 50 chars and replaces special chars with underscores.
         *
         * @param {string} s - The input string (e.g., page title).
         * @returns {string} Safe filename string.
         */
        sanitizeFilename(s) {
            /* Replace non-alphanumeric characters with underscores and truncate */
            return String(s || 'export').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        },
        downloadFile(filename, content, type) {
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
        /**
         * Loads an external script (library) dynamically if not already present.
         *
         * @param {string} globalVar - The global variable name to check (e.g., 'jspdf').
         * @param {string} url - The URL of the script.
         * @param {string} [integrity] - Optional SRI hash.
         * @returns {Promise<void>} Resolves when loaded or already present.
         */
        loadLibrary(globalVar, url, integrity) {
            return new Promise(function(resolve, reject) {
                if (window[globalVar]) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = url;
                if (integrity) {
                    script.integrity = integrity;
                    script.crossOrigin = 'anonymous';
                }
                script.onload = function() { resolve(); };
                script.onerror = function() { reject(new Error('Failed to load ' + globalVar)); };
                document.head.appendChild(script);
            });
        },
        /**
         * Stabilizes images for export by resolving lazy loading attributes (data-src)
         * and selecting the highest resolution candidate from srcset.
         *
         * @param {HTMLElement} root - The root element to scan for images.
         */
        normalizeImages(root) {
            /* Basic <picture> Support */
            const pictures = root.querySelectorAll('picture');
            pictures.forEach(function(pic) {
                const img = pic.querySelector('img');
                const source = pic.querySelector('source');
                if (source && source.srcset && img) {
                    /* Check if image is missing or placeholder */
                    const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
                    if (isPlaceholder) {
                         img.src = source.srcset.split(',')[0].trim().split(' ')[0];
                    }
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
        sanitizeAttributes(root) {
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
                    /* 3. Malicious URIs (javascript:, vbscript:, data: strict check) */
                    else if (['href', 'src', 'action', 'data', 'formaction', 'poster', 'xlink:href', 'srcset'].includes(lowerName)) {
                        /* Remove all whitespace to prevent bypasses like 'java\tscript:' */
                        const checkVal = val.replace(/\s+/g, '').toLowerCase();
                        const isSrcset = lowerName === 'srcset';

                        if (checkVal.startsWith('javascript:') || checkVal.startsWith('vbscript:') || (isSrcset && (checkVal.includes('javascript:') || checkVal.includes('vbscript:')))) {
                            el.removeAttribute(name);
                        }
                        else if (checkVal.startsWith('data:')) {
                            /* Only allow data:image/ (excluding SVG) on specific image tags */
                            const isImageTag = ['img', 'source', 'picture'].includes(el.tagName.toLowerCase());
                            const isImageMime = checkVal.startsWith('data:image/');
                            const isSvg = checkVal.includes('svg+xml');

                            if (!isImageTag || !isImageMime || isSvg) {
                                el.removeAttribute(name);
                            }
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
         * Asynchronously applies computed styles from a source element to a target element.
         * Processes elements in chunks to avoid blocking the main thread.
         *
         * @param {HTMLElement} source - The original DOM element.
         * @param {HTMLElement} target - The cloned element.
         * @param {function(number): void} [onProgress] - Callback reporting processed count.
         * @returns {Promise<void>}
         */
        inlineStylesAsync(source, target, onProgress) {
            return new Promise(function(resolve) {
                const queue = [{s: source, t: target}];
                let count = 0;
                const CHUNK_SIZE = 50;

                function processChunk() {
                    const startTime = performance.now();

                    while (queue.length > 0) {
                        const item = queue.shift();
                        const s = item.s;
                        const t = item.t;

                        /* Apply styles to current element */
                        const computed = window.getComputedStyle(s);
                        if (computed) {
                            const styles = [];
                            for (let i = 0, len = safeProperties.length; i < len; i++) {
                                const prop = safeProperties[i];
                                const val = computed.getPropertyValue(prop);
                                if (val && val !== 'none' && val !== 'normal') {
                                    styles.push(prop + ':' + val);
                                }
                            }
                            if (styles.length > 0) {
                                t.style.cssText += styles.join('; ') + '; ';
                            }
                        }

                        count++;

                        /* Add children to queue */
                        const sourceChildren = s.children;
                        const targetChildren = t.children;
                        for (let i = 0; i < sourceChildren.length; i++) {
                            if (targetChildren[i]) {
                                queue.push({s: /** @type {HTMLElement} */ (sourceChildren[i]), t: /** @type {HTMLElement} */ (targetChildren[i])});
                            }
                        }

                        /* Yield if chunk size reached or time exceeded */
                        if (count % CHUNK_SIZE === 0 || (performance.now() - startTime) > 12) {
                             if (onProgress) onProgress(count);
                             setTimeout(processChunk, 0);
                             return;
                        }
                    }

                    /* Done */
                    if (onProgress) onProgress(count);
                    resolve();
                }

                processChunk();
            });
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
        htmlToMarkdown(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const parts = [];

            function traverse(node) {
                if (node.nodeType === 3) {
                    /* Text node */
                    parts.push(node.nodeValue);
                    return;
                }

                if (node.nodeType !== 1) return;

                const tag = node.tagName.toLowerCase();

                if (tag === 'script' || tag === 'style' || tag === 'noscript') return;

                switch(tag) {
                    case 'h1': parts.push('\n# '); break;
                    case 'h2': parts.push('\n## '); break;
                    case 'h3': parts.push('\n### '); break;
                    case 'h4': parts.push('\n#### '); break;
                    case 'strong':
                    case 'b': parts.push('**'); break;
                    case 'em':
                    case 'i': parts.push('*'); break;
                    case 'p': parts.push('\n\n'); break;
                    case 'br': parts.push('\n'); break;
                    case 'li':
                        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'ol') {
                            const index = Array.prototype.indexOf.call(node.parentElement.children, node) + 1;
                            parts.push('\n' + index + '. ');
                        } else {
                            parts.push('\n- ');
                        }
                        break;
                    case 'a': parts.push('['); break;
                    case 'img':
                        const src = node.getAttribute('src');
                        const alt = node.getAttribute('alt') || '';
                        parts.push('![' + alt + '](' + src + ')');
                        return; /* Skip children of img */
                    case 'table': parts.push('\n\n'); break;
                case 'tr': break;
                    case 'td':
                    case 'th': parts.push('| '); break;
                }

                /* Traverse children */
                for (let i = 0; i < node.childNodes.length; i++) {
                    traverse(node.childNodes[i]);
                }

                /* Closing tags */
                switch(tag) {
                    case 'strong':
                    case 'b': parts.push('**'); break;
                    case 'em':
                    case 'i': parts.push('*'); break;
                    case 'a':
                        const href = node.getAttribute('href');
                        if (href) parts.push('](' + href + ')');
                        else parts.push(']');
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                case 'p':
                        parts.push('\n'); break;
                    case 'tr': parts.push('|\n'); break;
                }
            }

            traverse(doc.body);

            /* Cleanup excessive newlines */
            return parts.join('').replace(/\n\s+\n/g, '\n\n').trim();
        }
    };
})(window);
