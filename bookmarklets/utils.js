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

    /* Sanitization Helpers */
    function isEventAttribute(name) {
        return name.toLowerCase().startsWith('on');
    }

    function isUnsafeAttribute(name) {
        const lower = name.toLowerCase();
        return ['href', 'src', 'action', 'data', 'formaction', 'poster', 'xlink:href', 'srcset'].includes(lower);
    }

    function containsMaliciousProtocol(value, isSrcset) {
        const checkVal = value.replace(/\s+/g, '').toLowerCase();
        if (isSrcset) {
            return checkVal.includes('javascript:') || checkVal.includes('vbscript:');
        }
        return checkVal.startsWith('javascript:') || checkVal.startsWith('vbscript:');
    }

    function isValidDataUri(tagName, value) {
        const checkVal = value.replace(/\s+/g, '').toLowerCase();
        if (!checkVal.startsWith('data:')) return true;

        const isImageTag = ['img', 'source', 'picture'].includes(tagName.toLowerCase());
        const isImageMime = checkVal.startsWith('data:image/');
        const isSvg = checkVal.includes('svg+xml');

        return isImageTag && isImageMime && !isSvg;
    }

    function isSafeStyle(value) {
        const checkVal = value.replace(/\s+/g, '').toLowerCase();
        return !(checkVal.includes('javascript:') || checkVal.includes('vbscript:') || checkVal.includes('expression('));
    }

    w.BookmarkletUtils = {
        /**
         * Creates a DOM element with specified properties.
         * @param {string} tag - The tag name of the element.
         * @param {Object} [styles={}] - The style object to apply.
         * @param {string} [text=''] - The text content of the element.
         * @param {HTMLElement|null} [parent=null] - The parent element to append to.
         * @param {Object} [props={}] - Additional properties to assign to the element.
         * @returns {HTMLElement} The created element.
         *
         * @example
         * const btn = BookmarkletUtils.buildElement('button', {
         *   backgroundColor: 'blue',
         *   color: 'white',
         *   padding: '10px'
         * }, 'Click Me', document.body, {
         *   id: 'my-btn',
         *   onclick: () => alert('Clicked!')
         * });
         */
        buildElement(tag, styles, text, parent, props) {
            const el = document.createElement(tag);
            if (styles) {
                for (let key in styles) {
                    if (styles.hasOwnProperty(key)) {
                        el.style[key] = styles[key];
                    }
                }
            }
            if (text) el.textContent = text;
            if (props) {
                for (let key in props) {
                    if (props.hasOwnProperty(key)) {
                        if (key.startsWith('on') && typeof props[key] === 'function') {
                            el[key] = props[key];
                        } else {
                            el.setAttribute(key, props[key]);
                        }
                    }
                }
            }
            if (parent) parent.appendChild(el);
            return el;
        },

        /**
         * Shows a toast notification.
         * @param {string} message - The message to display.
         * @param {'info'|'success'|'error'} [type='info'] - The type of notification.
         * @param {number} [duration=3000] - Duration in ms before auto-dismissing.
         */
        showToast(message, type, duration) {
            type = type || 'info';
            duration = duration || 3000;

            let container = document.getElementById('bm-toast-container');
            if (!container) {
                container = this.buildElement('div', {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: '10000',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    pointerEvents: 'none' /* Allow clicks to pass through container */
                }, '', document.body, { id: 'bm-toast-container' });
            }

            const colors = {
                info: '#2563eb',    // Blue
                success: '#10b981', // Green
                error: '#ef4444'    // Red
            };

            const toast = this.buildElement('div', {
                background: colors[type] || colors.info,
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px',
                opacity: '0',
                transform: 'translateY(-20px)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                pointerEvents: 'auto', /* Make toast interactive */
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                maxWidth: '300px'
            }, message, container, {
                role: 'alert'
            });

            /* Click to dismiss */
            toast.onclick = function() {
                if (toast.parentElement) toast.remove();
            };

            /* Trigger animation */
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });

            /* Auto-dismiss */
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(-20px)';
                    setTimeout(() => {
                        if (toast.parentElement) toast.remove();
                    }, 300);
                }
            }, duration);
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
        /**
         * Triggers a download of a file with the given content.
         *
         * @param {string} filename - The name of the file to download.
         * @param {string} content - The content of the file.
         * @param {string} [type='text/html'] - The MIME type of the file.
         * @returns {void}
         */
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
            return new Promise((resolve, reject) => {
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
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load ' + globalVar));
                document.head.appendChild(script);
            });
        },
        /**
         * Stabilizes images for export by resolving lazy loading attributes (data-src)
         * and selecting the highest resolution candidate from srcset.
         * Processes in chunks to avoid blocking the UI.
         *
         * @param {HTMLElement} root - The root element to scan for images.
         * @param {function(number): void} [onProgress] - Callback reporting processed count.
         * @returns {Promise<void>}
         *
         * @example
         * const container = document.getElementById('content');
         * BookmarkletUtils.normalizeImages(container, (count) => {
         *   console.log(`Processed ${count} images...`);
         * }).then(() => {
         *   console.log('All images normalized!');
         * });
         */
        normalizeImages(root, onProgress) {
            return new Promise(function(resolve) {
                /* Collect all items to process */
                const queue = Array.prototype.slice.call(root.querySelectorAll('picture, img'));
                let count = 0;
                const CHUNK_SIZE = 50;

                function processChunk() {
                    const startTime = performance.now();

                    while (queue.length > 0) {
                        const el = queue.shift();

                        if (el.tagName.toLowerCase() === 'picture') {
                            const pic = el;
                            const img = pic.querySelector('img');
                            const source = pic.querySelector('source');
                            if (source && source.srcset && img) {
                                /* Check if image is missing or placeholder */
                                const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
                                if (isPlaceholder) {
                                     img.src = source.srcset.split(',')[0].trim().split(' ')[0];
                                }
                            }
                        } else {
                            const img = el;
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

                        count++;

                        /* Yield if chunk size reached or time exceeded */
                        if (count % CHUNK_SIZE === 0 || (performance.now() - startTime) > 12) {
                             if (onProgress) onProgress(count);
                             setTimeout(processChunk, 0);
                             return;
                        }
                    }

                    if (onProgress) onProgress(count);
                    resolve();
                }

                processChunk();
            });
        },
        /**
         * Recursively removes dangerous attributes (event handlers, javascript: URIs)
         * from a root element and all its descendants to prevent XSS.
         *
         * @param {HTMLElement} root - The root element to sanitize.
         * @returns {void}
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
                    if (isEventAttribute(lowerName)) {
                        el.removeAttribute(name);
                    }
                    /* 2. SRCDOC (Always remove to prevent iframe injection) */
                    else if (lowerName === 'srcdoc') {
                        el.removeAttribute(name);
                    }
                    /* 3. Malicious URIs (javascript:, vbscript:, data: strict check) */
                    else if (isUnsafeAttribute(lowerName)) {
                        const isSrcset = lowerName === 'srcset';
                        if (containsMaliciousProtocol(val, isSrcset)) {
                            el.removeAttribute(name);
                        }
                        else if (!isValidDataUri(el.tagName, val)) {
                            el.removeAttribute(name);
                        }
                    }
                    /* 4. Style Attribute (check for javascript: or expression) */
                    else if (lowerName === 'style') {
                        if (!isSafeStyle(val)) {
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
                        /* OPTIMIZATION: Use pop() (DFS) instead of shift() (BFS) to avoid O(N) array re-indexing */
                        const item = queue.pop();
                        const s = item.s;
                        const t = item.t;

                        /* Apply styles to current element */
                        const computed = window.getComputedStyle(s);
                        if (computed) {
                            const styles = [];
                            const targetStyle = t.style;
                            for (let i = 0, len = safeProperties.length; i < len; i++) {
                                const prop = safeProperties[i];
                                const val = computed.getPropertyValue(prop);
                                if (val && val !== 'none' && val !== 'normal') {
                                    /* Optimization: Skip if target already has this style */
                                    // We strictly check redundancy to avoid overwriting existing inline styles.
                                    // Note: We cannot safely skip '0px' defaults because UA styles might be non-zero (e.g. <p> margin).
                                    if (targetStyle.getPropertyValue(prop) === val) continue;

                                    styles.push(prop + ':' + val);
                                }
                            }
                            if (styles.length > 0) {
                                targetStyle.cssText += styles.join('; ') + '; ';
                            }
                        }

                        count++;

                        /* Add children to queue */
                        const sourceChildren = s.children;
                        const targetChildren = t.children;
                        /* Use reverse loop for DFS to maintain visual order in stack */
                        for (let i = sourceChildren.length - 1; i >= 0; i--) {
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
         *
         * @example
         * const html = '<h1>Title</h1><p>Check <a href="https://example.com">this</a>.</p>';
         * const md = BookmarkletUtils.htmlToMarkdown(html);
         * // Returns:
         * // "# Title"
         * // ""
         * // "Check [this](https://example.com)."
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
