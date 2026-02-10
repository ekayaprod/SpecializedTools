(function () {
    /* CONFIGURATION */
    const CONFIG = {
        highlightColor: 'rgba(0, 0, 255, 0.1)',
        outlineStyle: '2px solid blue',
        modalId: 'te-bookmarklet-modal',
        overlayId: 'te-bookmarklet-overlay',
        highlightId: 'te-bookmarklet-highlight',
        ignoreTags: ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME']
    };

    let activeElement = null;

    function getOrCreateHighlightEl() {
        let el = document.getElementById(CONFIG.highlightId);
        if (!el) {
            el = document.createElement('div');
            el.id = CONFIG.highlightId;
            el.style.position = 'fixed';
            el.style.pointerEvents = 'none';
            el.style.zIndex = '1000000';
            el.style.border = CONFIG.outlineStyle;
            el.style.backgroundColor = CONFIG.highlightColor;
            el.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
            el.style.display = 'none';
            document.body.appendChild(el);
        }
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
        clearHighlight();
        const highlight = document.getElementById(CONFIG.highlightId);
        if (highlight) highlight.remove();
    }

    function handleMouseOver(e) {
        if (CONFIG.ignoreTags.includes(e.target.tagName) || e.target.closest('#' + CONFIG.overlayId) || e.target.closest('#' + CONFIG.highlightId)) return;
        activeElement = e.target;

        const rect = activeElement.getBoundingClientRect();
        const highlight = getOrCreateHighlightEl();

        highlight.style.top = rect.top + 'px';
        highlight.style.left = rect.left + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        highlight.style.display = 'block';
    }

    function handleMouseOut(e) {
        if (e.target === activeElement) {
            clearHighlight();
            activeElement = null;
        }
    }

    function clearHighlight() {
        const highlight = document.getElementById(CONFIG.highlightId);
        if (highlight) {
            highlight.style.display = 'none';
        }
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

        const btnDownload = document.createElement('button');
        btnDownload.textContent = 'Download HTML';
        btnDownload.onclick = function() { handleDownload(contentArea); };

        const btnCopy = document.createElement('button');
        btnCopy.textContent = 'Copy to Clipboard';
        btnCopy.className = 'primary';
        btnCopy.onclick = function() { handleCopy(contentArea); };

        footer.appendChild(btnCancel);
        footer.appendChild(btnRetry);
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
            '.te-footer{padding:15px 20px;border-top:1px solid #eee;background:#f9f9f9;display:flex;justify-content:flex-end;gap:10px;}' +
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
        const dangerous = node.querySelectorAll('script, iframe, object, embed, style, noscript');
        dangerous.forEach(function(n) { n.remove(); });
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
                /* Skip if no src or already data URI */
                if (!img.src || img.src.startsWith('data:')) continue;

                active++;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const tempImg = new Image();
                /* Bypass CORS if possible */
                tempImg.crossOrigin = "Anonymous";

                const onComplete = function() {
                    active--;
                    /* Schedule next batch */
                    if (window.requestIdleCallback) {
                        window.requestIdleCallback(processNext);
                    } else {
                        setTimeout(processNext, 10);
                    }
                };

                tempImg.onload = function() {
                    canvas.width = tempImg.width;
                    canvas.height = tempImg.height;
                    ctx.drawImage(tempImg, 0, 0);
                    try {
                        img.src = canvas.toDataURL('image/png');
                        img.removeAttribute('srcset');
                    } catch (e) {
                        console.warn('Target & Edit: Image processing failed (likely CORS)', e);
                    }
                    onComplete();
                };

                tempImg.onerror = onComplete;
                tempImg.src = img.src;
            }
        }

        processNext();
    }

    async function handleCopy(contentArea) {
        const html = contentArea.innerHTML;
        const text = contentArea.innerText;
        const btn = document.querySelector('#' + CONFIG.modalId + ' button.primary');
        try {
            const data = [new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })];
            await navigator.clipboard.write(data);
            btn.textContent = "Copied!";
            btn.style.background = "#28a745";
            setTimeout(function() { closeEditor(); }, 1000);
        } catch (err) {
            /* Replace alert with non-blocking UI update */
            console.error('Clipboard access failed:', err);
            btn.textContent = "Error";
            btn.style.background = "#dc3545";
            setTimeout(function() {
                btn.textContent = "Copy to Clipboard";
                btn.style.background = "#007bff";
            }, 1000);
        }
    }

    function handleDownload(contentArea) {
        const cleanTitle = (document.title || 'snippet').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const filename = cleanTitle + '_' + Date.now() + '.html';
        const fullHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + cleanTitle + '</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;line-height:1.6;padding:0 1rem;}img{max-width:100%;height:auto;}</style></head><body>' + contentArea.innerHTML + '</body></html>';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([fullHtml], { type: 'text/html' }));
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    startFinder();
})();
