/* global html2canvas */
(function () {
    /** @require utils.js */
    /** @require html-to-markdown.js */
    /** @require i18n/web-clipper-en.js */

    const C = window.WebClipperConstants;

    if (window.__wc_instance) {
        window.__wc_instance.destroy();
    }

    const ERROR_RESET_DELAY = 2000;

    /**
     * @typedef {Object} WebClipperConfig
     * @property {string} highlightColor
     * @property {string} outlineStyle
     * @property {string} parentHighlightColor
     * @property {string} parentOutlineStyle
     * @property {string} modalId
     * @property {string} overlayId
     * @property {string} highlightId
     * @property {string} parentHighlightId
     * @property {string[]} ignoreTags
     */

    class WebClipper {
        constructor() {
            /** @type {WebClipperConfig} */
            this.config = {
                highlightColor: 'rgba(0, 0, 255, 0.1)',
                outlineStyle: '2px solid blue',
                parentHighlightColor: 'rgba(255, 215, 0, 0.15)' /* Gold with low opacity */,
                parentOutlineStyle: '4px dashed #FFD700' /* Thicker Gold dashed border */,
                modalId: 'wc-bookmarklet-modal',
                overlayId: 'wc-bookmarklet-overlay',
                highlightId: 'wc-bookmarklet-highlight',
                parentHighlightId: 'wc-bookmarklet-highlight-parent',
                ignoreTags: ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME'],
            };

            /** @type {HTMLElement|null} */
            this.activeElement = null;
            /** @type {number|null} */
            this.rafId = null;
            /** @type {HTMLElement|null} */
            this.highlightEl = null;
            /** @type {HTMLElement|null} */
            this.parentHighlightEl = null;

            // Bind methods to this instance
            this.handleMouseOver = this.handleMouseOver.bind(this);
            this.handleMouseOut = this.handleMouseOut.bind(this);
            this.handleClick = this.handleClick.bind(this);
            this.handleEscape = this.handleEscape.bind(this);
            this.closeEditor = this.closeEditor.bind(this);

            this.startFinder();
        }

        /**
         * @param {string} id
         * @param {string} outline
         * @param {string} color
         * @param {string} zIndex
         * @returns {HTMLElement}
         */
        getOrCreateHighlightEl(id, outline, color, zIndex) {
            /* Check cache first */
            if (id === this.config.highlightId && this.highlightEl) {
                this.highlightEl.style.border = outline;
                this.highlightEl.style.backgroundColor = color;
                this.highlightEl.style.zIndex = zIndex;
                return this.highlightEl;
            }
            if (id === this.config.parentHighlightId && this.parentHighlightEl) {
                this.parentHighlightEl.style.border = outline;
                this.parentHighlightEl.style.backgroundColor = color;
                this.parentHighlightEl.style.zIndex = zIndex;
                return this.parentHighlightEl;
            }

            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.style.position = 'fixed';
                el.style.pointerEvents = 'none';
                el.style.zIndex = zIndex;
                el.style.border = outline;
                el.style.backgroundColor = color;
                el.style.display = 'none';
                el.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
                document.body.appendChild(el);
            }
            /* Update style */
            el.style.border = outline;
            el.style.backgroundColor = color;
            el.style.zIndex = zIndex;

            /* Cache it */
            if (id === this.config.highlightId) {
                this.highlightEl = el;
                /* Palette+: Smooth transition for selection */
                if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
                    el.style.transition = 'all 0.15s ease-out';
                }
            }
            if (id === this.config.parentHighlightId) this.parentHighlightEl = el;

            return el;
        }

        /* PHASE 1: THE FINDER */
        /**
         * Starts the element selection phase.
         */
        startFinder() {
            document.body.style.cursor = 'crosshair';
            document.addEventListener('mouseover', this.handleMouseOver);
            document.addEventListener('mouseout', this.handleMouseOut);
            document.addEventListener('click', this.handleClick, { capture: true });
            document.addEventListener('keydown', this.handleEscape);
        }

        /**
         * Stops the element selection phase and cleans up highlights.
         */
        stopFinder() {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            document.body.style.cursor = 'default';
            document.removeEventListener('mouseover', this.handleMouseOver);
            document.removeEventListener('mouseout', this.handleMouseOut);
            document.removeEventListener('click', this.handleClick, { capture: true });
            document.removeEventListener('keydown', this.handleEscape);
            this.clearHighlights();

            if (this.highlightEl) {
                this.highlightEl.remove();
                this.highlightEl = null;
            }
            if (this.parentHighlightEl) {
                this.parentHighlightEl.remove();
                this.parentHighlightEl = null;
            }
        }

        /**
         * Handles mouse over events to highlight elements.
         * @param {MouseEvent} e
         */
        handleMouseOver(e) {
            if (this.rafId) cancelAnimationFrame(this.rafId);

            this.rafId = requestAnimationFrame(() => {
                const target = /** @type {HTMLElement} */ (e.target);
                if (
                    this.config.ignoreTags.includes(target.tagName) ||
                    target.closest('#' + this.config.overlayId) ||
                    target.closest('#' + this.config.highlightId)
                )
                    return;

                this.activeElement = target;
                const rect = this.activeElement.getBoundingClientRect();

                /* 1. Highlight Active Element */
                const highlight = this.getOrCreateHighlightEl(
                    this.config.highlightId,
                    this.config.outlineStyle,
                    this.config.highlightColor,
                    '1000000'
                );
                highlight.style.top = rect.top + 'px';
                highlight.style.left = rect.left + 'px';
                highlight.style.width = rect.width + 'px';
                highlight.style.height = rect.height + 'px';
                highlight.style.display = 'block';

                /* 2. Highlight Parent Element */
                const parent = this.activeElement.parentElement;
                if (parent && !this.config.ignoreTags.includes(parent.tagName)) {
                    const parentRect = parent.getBoundingClientRect();
                    const parentHighlight = this.getOrCreateHighlightEl(
                        this.config.parentHighlightId,
                        this.config.parentOutlineStyle,
                        this.config.parentHighlightColor,
                        '999999'
                    );

                    let pTop = parentRect.top;
                    let pLeft = parentRect.left;
                    let pWidth = parentRect.width;
                    let pHeight = parentRect.height;

                    const padding = 6;
                    pTop -= padding;
                    pLeft -= padding;
                    pWidth += padding * 2;
                    pHeight += padding * 2;

                    parentHighlight.style.top = pTop + 'px';
                    parentHighlight.style.left = pLeft + 'px';
                    parentHighlight.style.width = pWidth + 'px';
                    parentHighlight.style.height = pHeight + 'px';
                    parentHighlight.style.display = 'block';
                } else {
                    const ph = document.getElementById(this.config.parentHighlightId);
                    if (ph) ph.style.display = 'none';
                }
            });
        }

        /**
         * Handles mouse out events to clear highlights.
         * @param {MouseEvent} e
         */
        handleMouseOut(e) {
            if (this.rafId) cancelAnimationFrame(this.rafId);
            if (e.target === this.activeElement) {
                this.clearHighlights();
                this.activeElement = null;
            }
        }

        /**
         * Hides highlight elements.
         */
        clearHighlights() {
            if (this.highlightEl) this.highlightEl.style.display = 'none';
            if (this.parentHighlightEl) this.parentHighlightEl.style.display = 'none';
        }

        /**
         * Handles click events to select an element.
         * @param {MouseEvent} e
         */
        handleClick(e) {
            if (!this.activeElement) return;
            e.preventDefault();
            e.stopPropagation();
            const target = this.activeElement;
            this.stopFinder();
            /* Show loading before processing */
            this.showLoadingOverlay();
            setTimeout(() => {
                this.openEditor(target).catch((err) => {
                    console.error('Web Clipper editor open failed', {
                        target: {
                            tagName: target.tagName,
                            id: target.id,
                            className: target.className,
                        },
                        error: err,
                        url: window.location.href,
                        timestamp: new Date().toISOString(),
                    });
                    this.hideLoadingOverlay();
                    BookmarkletUtils.showToast('Error opening editor: ' + err.message, 'error');
                });
            }, 50);
        }

        /**
         * Handles escape key press to cancel selection.
         * @param {KeyboardEvent} e
         */
        handleEscape(e) {
            if (e.key === 'Escape') {
                this.stopFinder();
            }
        }

        /**
         * Shows a loading overlay.
         * @param {string} [message]
         */
        showLoadingOverlay(message) {
            const msg = message || C.MSG_CAPTURING;
            let div = document.getElementById('wc-loading');
            if (!div) {
                div = document.createElement('div');
                div.id = 'wc-loading';
                div.style.position = 'fixed';
                div.style.top = '0';
                div.style.left = '0';
                div.style.width = '100%';
                div.style.height = '100%';
                div.style.background = 'rgba(255,255,255,0.95)';
                div.style.zIndex = '2000000';
                div.style.display = 'flex';
                div.style.flexDirection = 'column';
                div.style.justifyContent = 'center';
                div.style.alignItems = 'center';
                div.style.gap = '16px';
                div.style.fontSize = '16px';
                div.style.color = '#333';
                div.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                document.body.appendChild(div);
            }

            /* Curator: Polished SVG Spinner */
            const spinner = `
                <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" role="status" aria-label="Loading">
                    <circle cx="12" cy="12" r="10" stroke="#e5e7eb" stroke-width="4"></circle>
                    <path fill="#2563eb" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </path>
                </svg>
            `;

            /* Remove animation for reduced motion */
            const safeSpinner = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? spinner.replace('<animateTransform', '<!-- <animateTransform').replace('/>', '-->')
                : spinner;

            div.innerHTML = safeSpinner + '<span style="font-weight:500;">' + msg + '</span>';
        }

        /**
         * Hides the loading overlay.
         */
        hideLoadingOverlay() {
            const div = document.getElementById('wc-loading');
            if (div) div.remove();
        }

        /* PHASE 2: THE EDITOR */
        /**
         * Opens the editor modal with the selected element.
         * @param {HTMLElement} element
         */
        async openEditor(element) {
            /* 1. Normalize Images IN PLACE (before cloning) to capture true sources */
            await BookmarkletUtils.normalizeImages(element);

            /* 2. Clone node deeply */
            const clone = /** @type {HTMLElement} */ (element.cloneNode(true));

            /* 3. Inline "Safe" Computed Styles */
            /* Changed strategy: Minimal stabilization to avoid layout breakage */
            await BookmarkletUtils.inlineStylesAsync(element, clone, (count) => {
                this.showLoadingOverlay(C.MSG_PROCESSING_PREFIX + count + C.MSG_PROCESSING_SUFFIX);
            });

            /* 4. Cleanup - remove scripts but KEEP classes and styles */
            this.cleanupDOM(clone);

            const overlay = document.createElement('div');
            overlay.id = this.config.overlayId;

            const modal = document.createElement('div');
            modal.id = this.config.modalId;

            /* Updated Header with Close Icon */
            const header = document.createElement('div');
            header.className = 'wc-header';
            header.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <span style="font-weight:700; font-size:16px;">${C.TITLE_HEADER}</span>
                        <span style="font-size:12px; color:#666; margin-left:8px;">${C.LABEL_PREVIEW}</span>
                    </div>
                    <div id="wc-close-icon" role="button" aria-label="Close" tabindex="0" style="cursor:pointer; color:#999; display:flex; align-items:center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </div>
                </div>
            `;

            const contentArea = document.createElement('div');
            contentArea.className = 'wc-content';
            contentArea.contentEditable = 'true';

            /* IMPORTANT FIX: Append the clone directly to preserve the root element wrapper */
            contentArea.appendChild(clone);

            /* Copy style from clone root to contentArea to maintain container look */
            if (clone.getAttribute('style')) {
                /* We merge it carefully to not break the editor area */
                const originalStyle = clone.getAttribute('style');
                /* Ensure editor area is scrollable */
                contentArea.setAttribute(
                    'style',
                    originalStyle +
                        '; overflow-y: auto !important; height: auto !important; max-height: none !important;'
                );
            }

            const footer = document.createElement('div');
            footer.className = 'wc-footer';

            const btnCancel = document.createElement('button');
            btnCancel.textContent = C.BTN_CANCEL;
            btnCancel.onclick = this.closeEditor;

            const btnRetry = document.createElement('button');
            btnRetry.textContent = C.BTN_RETRY;
            btnRetry.onclick = () => {
                this.closeEditor();
                this.startFinder();
            };

            /* Format Selector */
            const formatSelect = document.createElement('select');
            formatSelect.style.marginRight = '10px';
            formatSelect.style.padding = '5px';
            formatSelect.style.borderRadius = '4px';
            formatSelect.style.border = '1px solid #ccc';

            const formats = [
                { val: 'html', txt: C.FORMAT_HTML },
                { val: 'md', txt: C.FORMAT_MD },
                { val: 'txt', txt: C.FORMAT_TXT },
                { val: 'png', txt: C.FORMAT_PNG },
            ];

            formats.forEach((f) => {
                const opt = document.createElement('option');
                opt.value = f.val;
                opt.text = f.txt;
                formatSelect.appendChild(opt);
            });

            const btnDownload = document.createElement('button');
            btnDownload.textContent = C.BTN_DOWNLOAD;
            btnDownload.onclick = () => {
                this.handleDownload(contentArea, formatSelect.value, btnDownload);
            };

            const btnCopy = document.createElement('button');
            btnCopy.textContent = C.BTN_COPY;
            btnCopy.className = 'primary';
            btnCopy.onclick = () => {
                this.handleCopy(contentArea);
            };

            footer.appendChild(btnCancel);
            footer.appendChild(btnRetry);
            footer.appendChild(formatSelect); /* Add selector */
            footer.appendChild(btnDownload);
            footer.appendChild(btnCopy);

            modal.appendChild(header);
            modal.appendChild(contentArea);
            modal.appendChild(footer);
            overlay.appendChild(modal);

            /* Event Listener for Close Icon */
            setTimeout(() => {
                const closeIcon = document.getElementById('wc-close-icon');
                if (closeIcon) {
                    closeIcon.onclick = this.closeEditor;
                    closeIcon.onkeydown = (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            this.closeEditor();
                        }
                    };
                }
            }, 0);

            const style = document.createElement('style');
            style.textContent =
                '#' +
                this.config.overlayId +
                '{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}' +
                '#' +
                this.config.modalId +
                '{background:white;width:80%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);overflow:hidden;}' +
                '@keyframes wc-fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }' +
                '.wc-animate-in { animation: wc-fade-in 0.2s ease-out forwards; }' +
                '@media (prefers-reduced-motion: reduce) { .wc-animate-in { animation: none; } }' +
                '.wc-header{padding:16px 24px;border-bottom:1px solid #eee;background:#fff;color:#333;}' +
                '.wc-content{padding:24px;overflow-y:auto;flex-grow:1;min-height:200px;outline:none;color:#000;line-height:1.6;background:#fff;}' +
                '.wc-content h1,.wc-content h2,.wc-content h3{margin-top:0;}' +
                '.wc-content p{margin-bottom:1em;}' +
                '.wc-footer{padding:16px 24px;border-top:1px solid #eee;background:#fff;display:flex;justify-content:flex-end;align-items:center;gap:10px;}' +
                '#' +
                this.config.modalId +
                ' button{padding:8px 16px;border:1px solid #d1d5db;background:white;border-radius:6px;cursor:pointer;font-size:14px;color:#374151;transition:all 0.2s;}' +
                '#' +
                this.config.modalId +
                ' button:hover{background:#f3f4f6;}' +
                '#' +
                this.config.modalId +
                ' button.primary{background:#2563eb;color:white;border:none;}' +
                '#' +
                this.config.modalId +
                ' button.primary:hover{background:#1d4ed8;}' +
                '@media (prefers-reduced-motion: no-preference) { #' +
                this.config.modalId +
                ' button:active { transform: scale(0.96); } }';

            /* Apply animation class */
            modal.classList.add('wc-animate-in');

            overlay.appendChild(style);
            document.body.appendChild(overlay);
            this.hideLoadingOverlay();
            contentArea.focus();
        }

        /**
         * Closes the editor modal.
         */
        closeEditor() {
            const overlay = document.getElementById(this.config.overlayId);
            if (overlay) overlay.remove();
        }

        /**
         * Cleans up the DOM by removing dangerous elements and attributes.
         * @param {HTMLElement} node
         */
        cleanupDOM(node) {
            /* General Cleanup: Remove active scripts and dangerous elements only. */
            const dangerous = node.querySelectorAll(
                'script, iframe, object, embed, noscript, form, input, button, select, textarea'
            );
            dangerous.forEach((n) => {
                n.remove();
            });

            /* Attribute Cleanup: Remove event handlers (on*) and dangerous URLs */
            BookmarkletUtils.sanitizeAttributes(node);
        }

        /**
         * Handles copying content to the clipboard.
         * @param {HTMLElement} contentArea
         */
        async handleCopy(contentArea) {
            const html = contentArea.innerHTML;
            const text = contentArea.innerText;
            const btn = /** @type {HTMLElement} */ (
                document.querySelector('#' + this.config.modalId + ' button.primary')
            );
            try {
                /* Copying as 'text/html' preserves styles when pasting into Google Docs/Word */
                const data = [
                    new ClipboardItem({
                        'text/html': new Blob([html], { type: 'text/html' }),
                        'text/plain': new Blob([text], { type: 'text/plain' }),
                    }),
                ];
                await navigator.clipboard.write(data);
                btn.textContent = C.BTN_COPIED;
                btn.style.background = '#28a745';
                setTimeout(() => {
                    this.closeEditor();
                }, 1000);
            } catch (err) {
                console.error('Clipboard access failed:', {
                    error: err,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                });
                btn.textContent = C.BTN_ERROR;
                btn.style.background = '#dc3545';
                setTimeout(() => {
                    btn.textContent = C.BTN_COPY;
                    btn.style.background = '#007bff';
                }, 1000);
            }
        }

        /**
         * Handles downloading content in the selected format.
         * @param {HTMLElement} contentArea
         * @param {string} format
         * @param {HTMLButtonElement} [btn]
         */
        handleDownload(contentArea, format, btn) {
            const filename = BookmarkletUtils.generateFilename(document.title || C.FILENAME_DEFAULT);

            if (format === 'md') {
                const content = BookmarkletUtils.htmlToMarkdown(contentArea.innerHTML);
                BookmarkletUtils.downloadFile(filename + '.md', content, 'text/markdown');
            } else if (format === 'txt') {
                const content = contentArea.innerText;
                BookmarkletUtils.downloadFile(filename + '.txt', content, 'text/plain');
            } else if (format === 'png') {
                const originalText = btn ? btn.textContent : C.BTN_DOWNLOAD;
                if (btn) {
                    btn.textContent = C.BTN_CREATING_IMAGE;
                    btn.disabled = true;
                }

                /* Dynamically load html2canvas if needed */
                BookmarkletUtils.loadLibrary(
                    'html2canvas',
                    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
                    'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H'
                )
                    .then(() => this.capturePng(contentArea, filename, btn, originalText))
                    .catch((err) => {
                        console.error('Failed to load html2canvas for PNG export:', err);
                        BookmarkletUtils.showToast(C.ERR_HTML2CANVAS, 'error');
                        if (btn) {
                            btn.textContent = C.BTN_ERROR;
                            btn.style.background = '#dc3545';
                            btn.style.color = 'white';
                            setTimeout(() => {
                                btn.textContent = originalText;
                                btn.disabled = false;
                                btn.style.background = '';
                                btn.style.color = '';
                            }, ERROR_RESET_DELAY);
                        }
                    });
            } else {
                /* HTML Default */
                const content =
                    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
                    filename +
                    '</title></head><body>' +
                    contentArea.innerHTML +
                    '</body></html>';
                BookmarkletUtils.downloadFile(filename + '.html', content, 'text/html');
            }
        }

        /**
         * Captures the element as a PNG image using html2canvas.
         * @param {HTMLElement} element
         * @param {string} filename
         * @param {HTMLButtonElement} [btn]
         * @param {string} [originalText]
         */
        async capturePng(element, filename, btn, originalText) {
            /* Temporarily ensure element is visible and has white background for capture */
            const originalBg = element.style.backgroundColor;
            element.style.backgroundColor = '#ffffff';

            try {
                const canvas = await html2canvas(element, { useCORS: true, logging: false });
                element.style.backgroundColor = originalBg; /* Restore */

                const link = document.createElement('a');
                link.download = filename + '.png';
                link.href = canvas.toDataURL();
                link.click();

                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } catch (err) {
                console.error('PNG Capture failed:', {
                    error: err,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                });
                element.style.backgroundColor = originalBg;

                if (btn) {
                    btn.textContent = C.BTN_ERROR;
                    btn.style.background = '#dc3545';
                    btn.style.color = 'white';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.disabled = false;
                        btn.style.background = '';
                        btn.style.color = '';
                    }, ERROR_RESET_DELAY);
                } else {
                    BookmarkletUtils.showToast(C.ERR_PNG_EXPORT, 'error');
                }
            }
        }

        /**
         * Destroys the WebClipper instance, removing listeners and UI.
         */
        destroy() {
            this.stopFinder();
            this.closeEditor();
            this.hideLoadingOverlay();
            delete window.__wc_instance;
        }
    }

    window.__wc_instance = new WebClipper();
})();
