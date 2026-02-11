(function () {
    /* CONFIGURATION */
    const CONFIG = {
        highlightColor: 'rgba(0, 0, 255, 0.1)',
        outlineStyle: '2px solid blue',
        parentHighlightColor: 'rgba(255, 215, 0, 0.15)', /* Gold with low opacity */
        parentOutlineStyle: '4px dashed #FFD700', /* Thicker Gold dashed border */
        modalId: 'wc-bookmarklet-modal',
        overlayId: 'wc-bookmarklet-overlay',
        highlightId: 'wc-bookmarklet-highlight',
        parentHighlightId: 'wc-bookmarklet-highlight-parent',
        ignoreTags: ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME']
    };

    let activeElement = null;

    function getOrCreateHighlightEl(id, outline, color, zIndex) {
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
        return el;
    }

    /* PHASE 1: THE FINDER */
    function startFinder() {
        document.body.style.cursor = 'crosshair';
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);
        document.addEventListener('click', handleClick, { capture: true });
        document.addEventListener('keydown', handleEscape);
    }

    function stopFinder() {
        document.body.style.cursor = 'default';
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('click', handleClick, { capture: true });
        document.removeEventListener('keydown', handleEscape);
        clearHighlights();
        
        const h1 = document.getElementById(CONFIG.highlightId);
        if (h1) h1.remove();
        const h2 = document.getElementById(CONFIG.parentHighlightId);
        if (h2) h2.remove();
    }

    function handleMouseOver(e) {
        if (CONFIG.ignoreTags.includes(e.target.tagName) || e.target.closest('#' + CONFIG.overlayId) || e.target.closest('#' + CONFIG.highlightId)) return;
        
        activeElement = e.target;
        const rect = activeElement.getBoundingClientRect();

        /* 1. Highlight Active Element */
        const highlight = getOrCreateHighlightEl(CONFIG.highlightId, CONFIG.outlineStyle, CONFIG.highlightColor, '1000000');
        highlight.style.top = rect.top + 'px';
        highlight.style.left = rect.left + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        highlight.style.display = 'block';

        /* 2. Highlight Parent Element */
        const parent = activeElement.parentElement;
        if (parent && !CONFIG.ignoreTags.includes(parent.tagName)) {
            const parentRect = parent.getBoundingClientRect();
            const parentHighlight = getOrCreateHighlightEl(CONFIG.parentHighlightId, CONFIG.parentOutlineStyle, CONFIG.parentHighlightColor, '999999');
            
            let pTop = parentRect.top;
            let pLeft = parentRect.left;
            let pWidth = parentRect.width;
            let pHeight = parentRect.height;

            const padding = 6; 
            pTop -= padding;
            pLeft -= padding;
            pWidth += (padding * 2);
            pHeight += (padding * 2);

            parentHighlight.style.top = pTop + 'px';
            parentHighlight.style.left = pLeft + 'px';
            parentHighlight.style.width = pWidth + 'px';
            parentHighlight.style.height = pHeight + 'px';
            parentHighlight.style.display = 'block';
        } else {
            const ph = document.getElementById(CONFIG.parentHighlightId);
            if (ph) ph.style.display = 'none';
        }
    }

    function handleMouseOut(e) {
        if (e.target === activeElement) {
            clearHighlights();
            activeElement = null;
        }
    }

    function clearHighlights() {
        const h1 = document.getElementById(CONFIG.highlightId);
        if (h1) h1.style.display = 'none';
        const h2 = document.getElementById(CONFIG.parentHighlightId);
        if (h2) h2.style.display = 'none';
    }

    function handleClick(e) {
        if (!activeElement) return;
        e.preventDefault();
        e.stopPropagation();
        const target = activeElement;
        stopFinder();
        /* Show loading before processing */
        showLoadingOverlay();
        setTimeout(function() {
            openEditor(target);
        }, 50);
    }

    function handleEscape(e) {
        if (e.key === 'Escape') {
            stopFinder();
        }
    }

    function showLoadingOverlay() {
        const div = document.createElement('div');
        div.id = 'wc-loading';
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.width = '100%';
        div.style.height = '100%';
        div.style.background = 'rgba(255,255,255,0.8)';
        div.style.zIndex = '2000000';
        div.style.display = 'flex';
        div.style.justifyContent = 'center';
        div.style.alignItems = 'center';
        div.style.fontSize = '20px';
        div.style.fontFamily = 'sans-serif';
        div.innerHTML = '<span>Capturing styles & layout...</span>';
        document.body.appendChild(div);
    }

    function hideLoadingOverlay() {
        const div = document.getElementById('wc-loading');
        if (div) div.remove();
    }

    /* PHASE 2: THE EDITOR */
    function openEditor(element) {
        /* Clone node deeply */
        const clone = element.cloneNode(true);
        
        /* CRITICAL: Inline Computed Styles to preserve layout without external CSS */
        inlineComputedStyles(element, clone);
        
        /* Cleanup - remove scripts but KEEP classes and styles */
        cleanupDOM(clone);

        const overlay = document.createElement('div');
        overlay.id = CONFIG.overlayId;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;

        const header = document.createElement('div');
        header.className = 'wc-header';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-weight:700; font-size:16px;">Web Clipper</span> 
                    <span style="font-size:12px; color:#666; margin-left:8px;">(Snapshot Preview)</span>
                </div>
                <div id="wc-close-icon" style="cursor:pointer; font-size:20px; color:#999; line-height:1;">&times;</div>
            </div>
        `;

        const contentArea = document.createElement('div');
        contentArea.className = 'wc-content';
        contentArea.contentEditable = 'true';
        contentArea.innerHTML = clone.innerHTML;
        
        /* Copy style from clone root to contentArea to maintain container look */
        if (clone.getAttribute('style')) {
            contentArea.setAttribute('style', clone.getAttribute('style'));
        }

        const footer = document.createElement('div');
        footer.className = 'wc-footer';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Cancel';
        btnCancel.onclick = closeEditor;

        const btnRetry = document.createElement('button');
        btnRetry.textContent = 'Select New';
        btnRetry.onclick = function() {
            closeEditor();
            startFinder();
        };

        /* Format Selector */
        const formatSelect = document.createElement('select');
        formatSelect.style.marginRight = '10px';
        formatSelect.style.padding = '5px';
        formatSelect.style.borderRadius = '4px';
        formatSelect.style.border = '1px solid #ccc';
        
        const formats = [
            { val: 'html', txt: 'HTML Snapshot (.html)' },
            { val: 'md', txt: 'Markdown (.md)' },
            { val: 'txt', txt: 'Plain Text (.txt)' }
        ];
        
        formats.forEach(function(f) {
            const opt = document.createElement('option');
            opt.value = f.val;
            opt.text = f.txt;
            formatSelect.appendChild(opt);
        });

        const btnDownload = document.createElement('button');
        btnDownload.textContent = 'Download';
        btnDownload.onclick = function() { handleDownload(contentArea, formatSelect.value); };

        const btnCopy = document.createElement('button');
        btnCopy.textContent = 'Copy to Clipboard';
        btnCopy.className = 'primary';
        btnCopy.onclick = function() { handleCopy(contentArea); };

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
        setTimeout(function() {
            const closeIcon = document.getElementById('wc-close-icon');
            if(closeIcon) closeIcon.onclick = closeEditor;
        }, 0);

        const style = document.createElement('style');
        style.textContent = '#' + CONFIG.overlayId + '{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}' +
            '#' + CONFIG.modalId + '{background:white;width:80%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);overflow:hidden;}' +
            '.wc-header{padding:16px 24px;border-bottom:1px solid #eee;background:#fff;color:#333;}' +
            '.wc-content{padding:24px;overflow-y:auto;flex-grow:1;min-height:200px;outline:none;color:#000;line-height:1.6;background:#fff;}' +
            '.wc-content h1,.wc-content h2,.wc-content h3{margin-top:0;}' +
            '.wc-content p{margin-bottom:1em;}' +
            '.wc-footer{padding:16px 24px;border-top:1px solid #eee;background:#fff;display:flex;justify-content:flex-end;align-items:center;gap:10px;}' +
            '#' + CONFIG.modalId + ' button{padding:8px 16px;border:1px solid #d1d5db;background:white;border-radius:6px;cursor:pointer;font-size:14px;color:#374151;transition:all 0.2s;}' +
            '#' + CONFIG.modalId + ' button:hover{background:#f3f4f6;}' +
            '#' + CONFIG.modalId + ' button.primary{background:#2563eb;color:white;border:none;}' +
            '#' + CONFIG.modalId + ' button.primary:hover{background:#1d4ed8;}';

        overlay.appendChild(style);
        document.body.appendChild(overlay);
        hideLoadingOverlay();
        contentArea.focus();

        /* Start processing images after editor is visible */
        processImages(contentArea);
    }

    function inlineComputedStyles(source, target) {
        /* Recursively apply computed styles from source to target */
        const computed = window.getComputedStyle(source);
        if (!computed) return;
        
        /* Comprehensive list for layout fidelity */
        const properties = [
            /* Typography & Text */
            'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
            'text-align', 'line-height', 'text-decoration', 'text-transform', 'text-indent',
            'letter-spacing', 'word-spacing', 'white-space', 'word-break', 'text-overflow',
            
            /* Backgrounds */
            'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat', 'background-attachment',
            
            /* Box Model */
            'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
            'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
            'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
            'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
            'border-radius', 'box-sizing', 'box-shadow', 'outline',
            
            /* Layout & Positioning */
            'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
            'float', 'clear', 'overflow', 'overflow-x', 'overflow-y', 'visibility', 'opacity',
            
            /* Flexbox */
            'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 
            'flex-grow', 'flex-shrink', 'flex-basis', 'order',
            
            /* Grid */
            'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
            'gap', 'row-gap', 'column-gap', 'justify-items', 'align-self', 'justify-self',
            
            /* Visuals */
            'transform', 'transform-origin', 'vertical-align', 'list-style'
        ];
        
        /* Apply to current element */
        let styleString = '';
        properties.forEach(function(prop) {
            const val = computed.getPropertyValue(prop);
            /* Skip default values to keep size manageable, but preserve crucial layout indicators */
            if (val && 
                val !== 'none' && 
                val !== 'auto' && 
                val !== 'normal' && 
                val !== '0px' && 
                val !== 'rgba(0, 0, 0, 0)' && 
                val !== 'transparent' &&
                val !== 'visible' && /* default visibility */
                val !== 'static' /* default position */
            ) {
                 styleString += prop + ':' + val + '; ';
            } else if (prop === 'display' || prop === 'position' || prop === 'visibility' || prop === 'box-sizing') {
                 /* Always explicitly set key layout props even if default-ish */
                 styleString += prop + ':' + val + '; ';
            }
        });
        
        /* Preserve existing inline styles too */
        const existing = target.getAttribute('style') || '';
        target.setAttribute('style', styleString + existing);

        /* Recurse children */
        const sourceChildren = source.children;
        const targetChildren = target.children;
        
        for (let i = 0; i < sourceChildren.length; i++) {
            if (targetChildren[i]) {
                inlineComputedStyles(sourceChildren[i], targetChildren[i]);
            }
        }
    }

    function closeEditor() {
        const overlay = document.getElementById(CONFIG.overlayId);
        if (overlay) overlay.remove();
    }

    function cleanupDOM(node) {
        /* General Cleanup: Remove active scripts and dangerous elements only.
           IMPORTANT: Preserve 'class' and 'style' attributes to maintain layout fidelity. */
        const dangerous = node.querySelectorAll('script, iframe, object, embed, noscript, form, input, button, select, textarea, meta, link');
        dangerous.forEach(function(n) { n.remove(); });
        
        /* Attribute Cleanup: Remove only event handlers (on*) to prevent scripts running. */
        node.querySelectorAll('*').forEach(function(el) {
            Array.from(el.attributes).forEach(function(attr) {
                if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
            });
        });
    }

    function processImages(container) {
        const imgs = Array.from(container.querySelectorAll('img'));
        const CONCURRENCY = 3;
        let active = 0;
        let index = 0;

        function processNext() {
            if (index >= imgs.length && active === 0) return;

            while (active < CONCURRENCY && index < imgs.length) {
                const img = imgs[index++];
                if (!img.src || img.src.startsWith('data:')) continue;

                active++;
                const tempImg = new Image();
                tempImg.crossOrigin = "Anonymous";

                const onComplete = function() {
                    active--;
                    if (window.requestIdleCallback) {
                        window.requestIdleCallback(processNext);
                    } else {
                        setTimeout(processNext, 10);
                    }
                };

                tempImg.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                    ctx.drawImage(tempImg, 0, 0);
                    try {
                        img.src = canvas.toDataURL('image/png');
                        img.removeAttribute('srcset');
                    } catch (e) {
                        /* CORS error - keep original src */
                    }
                    onComplete();
                };

                tempImg.onerror = onComplete;
                tempImg.src = img.src;
            }
        }

        processNext();
    }

    /* Basic Markdown Converter */
    function htmlToMarkdown(html) {
        let temp = document.createElement('div');
        temp.innerHTML = html;
        
        /* Replace block elements with newlines */
        temp.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li').forEach(function(el) {
            el.innerHTML = el.innerHTML + '\n\n';
        });
        
        let text = temp.innerText || temp.textContent;
        return text.replace(/\n\s+\n/g, '\n\n').trim();
    }

    async function handleCopy(contentArea) {
        const html = contentArea.innerHTML;
        const text = contentArea.innerText;
        const btn = document.querySelector('#' + CONFIG.modalId + ' button.primary');
        try {
            /* Copying as 'text/html' preserves styles when pasting into Google Docs/Word */
            const data = [new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })];
            await navigator.clipboard.write(data);
            btn.textContent = "Copied!";
            btn.style.background = "#28a745";
            setTimeout(function() { closeEditor(); }, 1000);
        } catch (err) {
            console.error('Clipboard access failed:', err);
            btn.textContent = "Error";
            btn.style.background = "#dc3545";
            setTimeout(function() {
                btn.textContent = "Copy to Clipboard";
                btn.style.background = "#007bff";
            }, 1000);
        }
    }

    function handleDownload(contentArea, format) {
        const cleanTitle = BookmarkletUtils.sanitizeFilename(document.title || 'Web_Clip');
        let content, mimeType, filename;

        if (format === 'md') {
            content = htmlToMarkdown(contentArea.innerHTML);
            mimeType = 'text/markdown';
            filename = cleanTitle + '_' + Date.now() + '.md';
        } else if (format === 'txt') {
            content = contentArea.innerText;
            mimeType = 'text/plain';
            filename = cleanTitle + '_' + Date.now() + '.txt';
        } else {
            /* HTML Default - Wrap in basic structure but TRUST inline styles/classes for layout fidelity */
            content = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + cleanTitle + '</title></head><body>' + contentArea.innerHTML + '</body></html>';
            mimeType = 'text/html';
            filename = cleanTitle + '_' + Date.now() + '.html';
        }

        BookmarkletUtils.downloadFile(filename, content, mimeType);
    }
    startFinder();
})();
