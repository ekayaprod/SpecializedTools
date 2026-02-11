(function () {
    /* CONFIGURATION */
    const CONFIG = {
        highlightColor: 'rgba(0, 0, 255, 0.1)',
        outlineStyle: '2px solid blue',
        parentHighlightColor: 'rgba(255, 215, 0, 0.1)', /* Gold with low opacity */
        parentOutlineStyle: '4px dashed #FFD700', /* Thicker Gold dashed border */
        modalId: 'te-bookmarklet-modal',
        overlayId: 'te-bookmarklet-overlay',
        highlightId: 'te-bookmarklet-highlight',
        parentHighlightId: 'te-bookmarklet-highlight-parent',
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
        /* Update style ensuring dynamic config changes apply */
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
            
            /* Logic: Always make parent highlight visibly larger/distinct */
            /* Default to bounding box */
            let pTop = parentRect.top;
            let pLeft = parentRect.left;
            let pWidth = parentRect.width;
            let pHeight = parentRect.height;

            /* Expansion Logic: Add padding to ensure visual separation (The "Space between blue and yellow") */
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
        openEditor(target);
    }

    function handleEscape(e) {
        if (e.key === 'Escape') {
            stopFinder();
        }
    }

    /* PHASE 2: THE EDITOR */
    function openEditor(element) {
        const clone = element.cloneNode(true);
        cleanupDOM(clone);

        const overlay = document.createElement('div');
        overlay.id = CONFIG.overlayId;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;

        const header = document.createElement('div');
        header.className = 'te-header';
        header.innerHTML = '<span>Target & Edit</span> <span style="font-size:12px; color:#888;">(Edit content below)</span>';

        const contentArea = document.createElement('div');
        contentArea.className = 'te-content';
        contentArea.contentEditable = 'true';
        contentArea.innerHTML = clone.innerHTML;

        const footer = document.createElement('div');
        footer.className = 'te-footer';

        const btnCancel = document.createElement('button');
        btnCancel.textContent = 'Cancel';
        btnCancel.onclick = closeEditor;

        const btnRetry = document.createElement('button');
        btnRetry.textContent = 'Pick Another';
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
            { val: 'html', txt: 'HTML (.html)' },
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

        const style = document.createElement('style');
        style.textContent = '#' + CONFIG.overlayId + '{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}' +
            '#' + CONFIG.modalId + '{background:white;width:80%;max-width:800px;max-height:90vh;display:flex;flex-direction:column;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);overflow:hidden;}' +
            '.te-header{padding:15px 20px;border-bottom:1px solid #eee;font-weight:bold;font-size:16px;background:#f9f9f9;color:#333;}' +
            '.te-content{padding:20px;overflow-y:auto;flex-grow:1;min-height:200px;outline:none;color:#000;line-height:1.6;}' +
            '.te-content h1,.te-content h2,.te-content h3{margin-top:0;}' +
            '.te-content p{margin-bottom:1em;}' +
            '.te-footer{padding:15px 20px;border-top:1px solid #eee;background:#f9f9f9;display:flex;justify-content:flex-end;align-items:center;gap:10px;}' +
            '#' + CONFIG.modalId + ' button{padding:8px 16px;border:1px solid #ccc;background:white;border-radius:4px;cursor:pointer;font-size:14px;color:#333;}' +
            '#' + CONFIG.modalId + ' button:hover{background:#f0f0f0;}' +
            '#' + CONFIG.modalId + ' button.primary{background:#007bff;color:white;border-color:#0069d9;}' +
            '#' + CONFIG.modalId + ' button.primary:hover{background:#0069d9;}';

        overlay.appendChild(style);
        document.body.appendChild(overlay);
        contentArea.focus();

        /* Start processing images after editor is visible */
        processImages(contentArea);
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
        const cleanTitle = BookmarkletUtils.sanitizeFilename(document.title || 'snippet');
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
