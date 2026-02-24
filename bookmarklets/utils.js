(function (/** @type {Window} */ w) {
    /**
     * Restricted list: Stabilize layout without breaking flexible content.
     * This whitelist ensures only safe visual styles are copied, preventing
     * style-injection attacks (e.g. binding behaviors) and keeping the export lightweight.
     * @type {string[]}
     */
    const safeProperties = [
        'display',
        'visibility',
        'opacity',
        'z-index',
        'margin',
        'padding',
        'border',
        'border-radius',
        'box-shadow',
        'box-sizing',
        'background',
        'background-color',
        'background-image',
        'color',
        'font-family',
        'font-size',
        'font-weight',
        'line-height',
        'text-align',
        'list-style',
        'vertical-align',
        'float',
        'clear',
        /* Dimensions */
        'width',
        'height',
        'min-width',
        'min-height',
        'max-width',
        'max-height',
        /* Flexbox */
        'flex',
        'flex-direction',
        'flex-wrap',
        'flex-flow',
        'flex-grow',
        'flex-shrink',
        'flex-basis',
        'justify-content',
        'align-items',
        'align-content',
        'align-self',
        'gap',
        'order',
        /* Grid */
        'grid-template-columns',
        'grid-template-rows',
        'grid-template-areas',
        'grid-auto-columns',
        'grid-auto-rows',
        'grid-auto-flow',
        'grid-area',
        'grid-column',
        'grid-row',
        /* Alignment */
        'place-content',
        'place-items',
        'place-self',
        /* Text & Overflow */
        'white-space',
        'overflow',
        'text-overflow',
        'word-wrap',
        'word-break',
        'text-transform',
        'text-decoration',
        'letter-spacing',
        'word-spacing',
        /* Images/Media */
        'object-fit',
        'object-position',
        /* Positioning & Transform (Fix for Layout Collapse) */
        'position',
        'top',
        'bottom',
        'left',
        'right',
        'transform',
        'transform-origin',
        'transform-style',
    ];

    /* Sanitization Helpers */
    const REGEX_WHITESPACE = /\s+/g;

    /* Constants for Async Processing */
    const ASYNC_CHUNK_SIZE = 50;
    const ASYNC_TIME_SLICE_MS = 12;

    /**
     * @typedef {Object} SanitizerType
     * @property {(name: string) => boolean} isEventAttribute
     * @property {(name: string) => boolean} isUnsafeAttribute
     * @property {(value: string, isSrcset: boolean) => boolean} containsMaliciousProtocol
     * @property {(tagName: string, value: string) => boolean} isValidDataUri
     * @property {(value: string) => boolean} isSafeStyle
     * @property {(el: Element) => void} sanitizeElement
     * @property {(el: Element, name: string) => void} _sanitizeAttribute
     */

    /** @type {SanitizerType} */
    const Sanitizer = {
        /**
         * Checks if an attribute is an event handler (starts with 'on').
         * @param {string} name - The attribute name.
         * @returns {boolean} True if it's an event attribute.
         */
        isEventAttribute(name) {
            return name.toLowerCase().startsWith('on');
        },
        /**
         * Checks if an attribute is known to be unsafe (e.g., href, src, data).
         * @param {string} name - The attribute name.
         * @returns {boolean} True if it's an unsafe attribute.
         */
        isUnsafeAttribute(name) {
            const lower = name.toLowerCase();
            return ['href', 'src', 'action', 'data', 'formaction', 'poster', 'xlink:href', 'srcset'].includes(lower);
        },
        /**
         * Checks if a value contains malicious protocols like javascript: or vbscript:.
         * @param {string} value - The attribute value.
         * @param {boolean} isSrcset - Whether the attribute is srcset.
         * @returns {boolean} True if it contains a malicious protocol.
         */
        containsMaliciousProtocol(value, isSrcset) {
            const checkVal = value.replace(REGEX_WHITESPACE, '').toLowerCase();
            if (isSrcset) {
                return checkVal.includes('javascript:') || checkVal.includes('vbscript:');
            }
            return checkVal.startsWith('javascript:') || checkVal.startsWith('vbscript:');
        },
        /**
         * Checks if a Data URI is valid and safe (image only, no SVG).
         * @param {string} tagName - The tag name of the element.
         * @param {string} value - The attribute value.
         * @returns {boolean} True if valid and safe.
         */
        isValidDataUri(tagName, value) {
            const checkVal = value.replace(REGEX_WHITESPACE, '').toLowerCase();
            if (!checkVal.startsWith('data:')) return true;

            const isImageTag = ['img', 'source', 'picture'].includes(tagName.toLowerCase());
            const isImageMime = checkVal.startsWith('data:image/');
            const isSvg = checkVal.includes('svg+xml');

            return isImageTag && isImageMime && !isSvg;
        },
        /**
         * Checks if a style value is safe (no javascript: or expression).
         * @param {string} value - The style string.
         * @returns {boolean} True if safe.
         */
        isSafeStyle(value) {
            const checkVal = value.replace(REGEX_WHITESPACE, '').toLowerCase();
            return !(
                checkVal.includes('javascript:') ||
                checkVal.includes('vbscript:') ||
                checkVal.includes('expression(')
            );
        },
        /**
         * Sanitizes all attributes of an element.
         * @param {Element} el - The element to sanitize.
         */
        sanitizeElement(el) {
            if (!el.attributes) return;
            /* Iterate backwards to safely remove attributes without copying */
            for (let i = el.attributes.length - 1; i >= 0; i--) {
                Sanitizer._sanitizeAttribute(el, el.attributes[i].name);
            }
        },
        /**
         * Internal helper to sanitize a single attribute.
         * @param {Element} el - The element.
         * @param {string} name - The attribute name.
         */
        _sanitizeAttribute(el, name) {
            const lowerName = name.toLowerCase();
            const val = (el.getAttribute(name) || '').toLowerCase().trim();

            /* 1. Event Handlers (on*) */
            if (Sanitizer.isEventAttribute(lowerName)) {
                el.removeAttribute(name);
            } else if (lowerName === 'srcdoc') {
            /* 2. SRCDOC (Always remove to prevent iframe injection) */
                el.removeAttribute(name);
            } else if (Sanitizer.isUnsafeAttribute(lowerName)) {
            /* 3. Malicious URIs (javascript:, vbscript:, data: strict check) */
                const isSrcset = lowerName === 'srcset';
                if (Sanitizer.containsMaliciousProtocol(val, isSrcset)) {
                    el.removeAttribute(name);
                } else if (!Sanitizer.isValidDataUri(el.tagName, val)) {
                    el.removeAttribute(name);
                }
            } else if (lowerName === 'style') {
            /* 4. Style Attribute (check for javascript: or expression) */
                if (!Sanitizer.isSafeStyle(val)) {
                    el.removeAttribute(name);
                }
            }
        },
    };

    /**
     * Processes a <picture> element to ensure the fallback <img> has a valid src.
     * @param {HTMLElement} pic - The picture element.
     */
    function processPictureElement(pic) {
        const img = pic.querySelector('img');
        const source = pic.querySelector('source');
        if (source && source.srcset && img) {
            /* Check if image is missing or placeholder */
            const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
            if (isPlaceholder) {
                img.src = source.srcset.split(',')[0].trim().split(' ')[0];
            }
        }
    }

    /**
     * Processes an <img> element to resolve lazy loading and stabilize dimensions.
     * @param {HTMLImageElement} img - The image element.
     */
    function processImageElement(img) {
        /* 1. Resolve Lazy Loading */
        if (img.dataset.src) img.src = img.dataset.src;
        if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;

        /* Check for placeholder or missing src */
        const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
        if (isPlaceholder && img.srcset) {
            const parts = img.srcset.split(',');
            if (parts.length > 0) {
                /* Pick the last candidate (usually highest res) */
                const bestCandidate = parts[parts.length - 1].trim().split(' ')[0];
                if (bestCandidate) img.src = bestCandidate;
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

    /**
     * Copies safe computed styles from a source element to a target element.
     * @param {HTMLElement} s - The source element.
     * @param {HTMLElement} t - The target element.
     */
    function copySafeStyles(s, t) {
        const computed = window.getComputedStyle(s);
        if (computed) {
            const targetStyle = t.style;
            for (const prop of safeProperties) {
                const val = computed.getPropertyValue(prop);
                if (val && val !== 'none' && val !== 'normal') {
                    /* Optimization: Skip if target already has this style */
                    // We strictly check redundancy to avoid overwriting existing inline styles.
                    // Note: We cannot safely skip '0px' defaults because UA styles might be non-zero (e.g. <p> margin).
                    if (targetStyle.getPropertyValue(prop) === val) continue;

                    targetStyle.setProperty(prop, val);
                }
            }
        }
    }

    w.BookmarkletUtils = /** @type {BookmarkletUtilsInterface} */ (/** @type {Omit<BookmarkletUtilsInterface, 'htmlToMarkdown' | 'Prompts'>} */ ({
        /**
         * Logs a message with context and consistent formatting.
         * @param {string} component - The component name (e.g., 'MacroBuilder').
         * @param {string} message - The message to log.
         * @param {Object} [context={}] - Additional context data.
         * @param {'info'|'warn'|'error'} [level='info'] - The log level.
         */
        log(component, message, context, level) {
            context = context || {};
            level = level || 'info';
            const prefix = '[' + component + ']';

            /* Standardize format */
            const logFn = console[level] || console.log;

            /* Ensure no PII is logged (heuristic: keys like password, token, email) */
            const safeContext = {};
            for (const key in context) {
                if (Object.prototype.hasOwnProperty.call(context, key)) {
                    if (/password|token|secret|key|auth|email|phone/i.test(key)) {
                        safeContext[key] = '***REDACTED***';
                    } else {
                        safeContext[key] = context[key];
                    }
                }
            }

            logFn(prefix + ' ' + message, safeContext);
        },
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
                    if (Object.prototype.hasOwnProperty.call(styles, key)) {
                        el.style[key] = styles[key];
                    }
                }
            }
            if (text) el.textContent = text;
            if (props) {
                for (let key in props) {
                    if (Object.prototype.hasOwnProperty.call(props, key)) {
                        const val = props[key];
                        if (val === null || val === undefined) continue;

                        if (key.startsWith('on') && typeof val === 'function') {
                            el[key] = val;
                        } else {
                            el.setAttribute(key, val);
                        }
                    }
                }
            }
            if (parent) parent.appendChild(el);
            return el;
        },


        /**
         * Creates a shadow DOM host and root.
         * @param {string} [id] - The ID for the host element.
         * @param {string} [cssText] - The CSS text for the host element.
         * @param {HTMLElement|null} [parent=document.body] - The parent to append the host to.
         * @returns {{ h: HTMLElement, s: ShadowRoot }}
         */
        createShadowRoot(id, cssText, parent) {
            const h = document.createElement('div');
            if (id) h.id = id;
            if (cssText) h.style.cssText = cssText;
            const s = h.attachShadow({ mode: 'open' });
            if (parent !== null) {
                (parent || document.body).appendChild(h);
            }
            return { h, s };
        },

        /**
         * Makes an element draggable using a specific handle.
         * @param {HTMLElement} handle - The element to drag by.
         * @param {HTMLElement} target - The element to move.
         */
        makeDraggable(handle, target) {
            let pos1 = 0,
                pos2 = 0,
                pos3 = 0,
                pos4 = 0;
            let rafId = null;
            let latestX = 0;
            let latestY = 0;

            const dragMouseDown = (e) => {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.addEventListener('mouseup', closeDragElement);
                document.addEventListener('mousemove', elementDrag);
            };

            const elementDrag = (e) => {
                e = e || window.event;
                e.preventDefault();
                latestX = e.clientX;
                latestY = e.clientY;

                if (rafId) return;

                rafId = requestAnimationFrame(() => {
                    pos1 = pos3 - latestX;
                    pos2 = pos4 - latestY;
                    pos3 = latestX;
                    pos4 = latestY;
                    target.style.top = target.offsetTop - pos2 + 'px';
                    target.style.left = target.offsetLeft - pos1 + 'px';
                    rafId = null;
                });
            };

            const closeDragElement = () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                document.removeEventListener('mouseup', closeDragElement);
                document.removeEventListener('mousemove', elementDrag);
            };
            handle.onmousedown = dragMouseDown;
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
                container = this.buildElement(
                    'div',
                    {
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: '10000',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        pointerEvents: 'none' /* Allow clicks to pass through container */,
                    },
                    '',
                    document.body,
                    { id: 'bm-toast-container' }
                );
            }

            const colors = {
                info: '#2563eb', // Blue
                success: '#10b981', // Green
                error: '#ef4444', // Red
            };

            const toast = this.buildElement(
                'div',
                {
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
                    pointerEvents: 'auto' /* Make toast interactive */,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    maxWidth: '300px',
                },
                message,
                container,
                {
                    role: 'alert',
                }
            );

            /* Click to dismiss */
            toast.onclick = function () {
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
         * @param {string|number} s - The input string (e.g., page title).
         * @returns {string} Safe filename string.
         */
        sanitizeFilename(s) {
            /* Replace non-alphanumeric characters with underscores and truncate */
            const input = s || s === 0 ? s : 'export';
            return String(input)
                .replace(/[^a-z0-9]/gi, '_')
                .substring(0, 50);
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
            setTimeout(function () {
                URL.revokeObjectURL(url);
            }, 100);
        },
        /**
         * Loads an external script (library) dynamically if not already present.
         * Includes exponential backoff retry logic.
         *
         * @param {string} globalVar - The global variable name to check (e.g., 'jspdf').
         * @param {string} url - The URL of the script.
         * @param {string} [integrity] - Optional SRI hash.
         * @param {number} [retries=3] - Number of retry attempts.
         * @param {number} [initialDelay=1000] - Initial delay in ms before first retry.
         * @returns {Promise<void>} Resolves when loaded or already present.
         */
        loadLibrary(globalVar, url, integrity, retries, initialDelay) {
            retries = typeof retries === 'number' ? retries : 3;
            initialDelay = typeof initialDelay === 'number' ? initialDelay : 1000;

            const loadAttempt = () => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    if (integrity) {
                        script.integrity = integrity;
                        script.crossOrigin = 'anonymous';
                    }
                    script.onload = () => {
                        if (/** @type {Record<string, any>} */ (window)[globalVar]) {
                            resolve();
                        } else {
                            script.remove();
                            reject(new Error('Library loaded but ' + globalVar + ' not found'));
                        }
                    };
                    script.onerror = () => {
                        script.remove();
                        reject(new Error('Failed to load ' + globalVar));
                    };
                    document.head.appendChild(script);
                });
            };

            const retry = (attempt) => {
                return loadAttempt().catch((err) => {
                    if (attempt >= retries) {
                        throw err;
                    }
                    const delay = initialDelay * Math.pow(2, attempt);
                    return new Promise((r) => setTimeout(r, delay)).then(() => retry(attempt + 1));
                });
            };

            if (/** @type {Record<string, any>} */ (window)[globalVar]) {
                return Promise.resolve();
            }

            return retry(0);
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
            return new Promise((resolve, reject) => {
                /* Use stack-based traversal (DFS) to avoid expensive querySelectorAll on huge DOMs */
                const queue = [root];
                let imagesProcessed = 0;

                function processChunk() {
                    try {
                        const startTime = performance.now();
                        let chunkNodes = 0;

                        while (queue.length > 0) {
                            /* Use pop() for DFS */
                            const node = queue.pop();
                            chunkNodes++;

                            /* Process if image or picture */
                            const el = /** @type {HTMLElement} */ (node);
                            if (el.tagName) {
                                const tag = el.tagName.toLowerCase();
                                if (tag === 'picture') {
                                    processPictureElement(el);
                                    imagesProcessed++;
                                } else if (tag === 'img') {
                                    processImageElement(/** @type {HTMLImageElement} */ (el));
                                    imagesProcessed++;
                                }
                            }

                            /* Add children to queue (reverse order for DFS visual order) */
                            if (node.children && node.children.length > 0) {
                                for (let i = node.children.length - 1; i >= 0; i--) {
                                    queue.push(/** @type {HTMLElement} */ (node.children[i]));
                                }
                            }

                            /* Yield if chunk size reached AND time exceeded limit */
                            if (chunkNodes % ASYNC_CHUNK_SIZE === 0 && performance.now() - startTime > ASYNC_TIME_SLICE_MS) {
                                if (onProgress) onProgress(imagesProcessed);
                                setTimeout(processChunk, 0);
                                return;
                            }
                        }

                        if (onProgress) onProgress(imagesProcessed);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
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
            Sanitizer.sanitizeElement(/** @type {Element} */ (root));
            const all = root.querySelectorAll('*');
            for (let i = 0; i < all.length; i++) {
                Sanitizer.sanitizeElement(all[i]);
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
         *
         * @example
         * const source = document.getElementById('source');
         * const target = source.cloneNode(true);
         * BookmarkletUtils.inlineStylesAsync(source, target).then(() => {
         *   console.log('Styles inlined!');
         * });
         */
        inlineStylesAsync(source, target, onProgress) {
            return new Promise((resolve, reject) => {
                /** @type {Array<{s: HTMLElement, t: HTMLElement}>} */
                const queue = [{ s: source, t: target }];
                let count = 0;

                function processChunk() {
                    try {
                        const startTime = performance.now();

                        while (queue.length > 0) {
                            /* OPTIMIZATION: Use pop() (DFS) instead of shift() (BFS) to avoid O(N) array re-indexing */
                            const item = queue.pop();
                            const s = item.s;
                            const t = item.t;

                            /* Apply styles to current element */
                            copySafeStyles(s, t);

                            count++;

                            /* Add children to queue */
                            const sourceChildren = s.children;
                            const targetChildren = t.children;
                            /* Use reverse loop for DFS to maintain visual order in stack */
                            for (let i = sourceChildren.length - 1; i >= 0; i--) {
                                if (targetChildren[i]) {
                                    const sChild = /** @type {HTMLElement} */ (/** @type {unknown} */ (sourceChildren[i]));
                                    const tChild = /** @type {HTMLElement} */ (/** @type {unknown} */ (targetChildren[i]));
                                    queue.push({
                                        s: sChild,
                                        t: tChild,
                                    });
                                }
                            }

                            /* Yield if chunk size reached or time exceeded */
                            if (count % ASYNC_CHUNK_SIZE === 0 || performance.now() - startTime > ASYNC_TIME_SLICE_MS) {
                                if (onProgress) onProgress(count);
                                setTimeout(processChunk, 0);
                                return;
                            }
                        }

                        /* Done */
                        if (onProgress) onProgress(count);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }

                processChunk();
            });
        },
        /**
         * Escapes HTML characters in a string.
         *
         * @param {string|number} s - The string to escape.
         * @returns {string} The escaped string.
         *
         * @example
         * const escaped = BookmarkletUtils.escapeHtml('<img src=x onerror=alert(1)>');
         * // Returns: "&lt;img src=x onerror=alert(1)&gt;"
         */
        escapeHtml(s) {
            const input = s || s === 0 ? s : '';
            return String(input)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },
    }));
})(window);
