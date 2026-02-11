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
        /* 1. Normalize Images IN PLACE (before cloning) to capture true sources */
        normalizeImagesInSubtree(element);
        
        /* 2. Clone node deeply */
        const clone = element.cloneNode(true);
        
        /* 3. Inline "Safe" Computed Styles */
        /* Changed strategy: Minimal stabilization to avoid layout breakage */
        inlineSafeStyles(element, clone);
        
        /* 4. Cleanup - remove scripts but KEEP classes and styles */
        cleanupDOM(clone);

        const overlay = document.createElement('div');
        overlay.id = CONFIG.overlayId;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;

        /* Updated Header with Close Icon */
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
        
        /* IMPORTANT FIX: Append the clone directly to preserve the root element wrapper */
        contentArea.appendChild(clone);
        
        /* Copy style from clone root to contentArea to maintain container look */
        if (clone.getAttribute('style')) {
            /* We merge it carefully to not break the editor area */
            const originalStyle = clone.getAttribute('style');
            /* Ensure editor area is scrollable */
            contentArea.setAttribute('style', originalStyle + '; overflow-y: auto !important; height: auto !important; max-height: none !important;');
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
            { val: 'txt', txt: 'Plain Text (.txt)' },
            { val: 'png', txt: 'Image (.png)' }
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
    }

    function normalizeImagesInSubtree(root) {
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
    }

    function inlineSafeStyles(source, target) {
        /* Recursively apply SAFE computed styles from source to target */
        const computed = window.getComputedStyle(source);
        if (!computed) return;
        
        /* Restricted list: Stabilize layout without breaking flexible content. */
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
            'object-fit', 'object-position'
        ];
        
        /* Apply to current element */
        let styleString = '';
        safeProperties.forEach(function(prop) {
            let val = computed.getPropertyValue(prop);
            
            /* Skip default values to keep size manageable */
            if (val && val !== 'none' && val !== 'normal') {
                 styleString += prop + ':' + val + '; ';
            }
        });
        
        /* Preserve existing inline styles too - using cssText to avoid overwrites */
        if (styleString) {
            target.style.cssText += styleString;
        }

        /* Recurse children */
        const sourceChildren = source.children;
        const targetChildren = target.children;
        
        for (let i = 0; i < sourceChildren.length; i++) {
            if (targetChildren[i]) {
                inlineSafeStyles(sourceChildren[i], targetChildren[i]);
            }
        }
    }

    function closeEditor() {
        const overlay = document.getElementById(CONFIG.overlayId);
        if (overlay) overlay.remove();
    }

    function cleanupDOM(node) {
        /* General Cleanup: Remove active scripts and dangerous elements only. */
        const dangerous = node.querySelectorAll('script, iframe, object, embed, noscript, form, input, button, select, textarea');
        dangerous.forEach(function(n) { n.remove(); });
        
        /* Attribute Cleanup: Remove only event handlers (on*) */
        node.querySelectorAll('*').forEach(function(el) {
            Array.from(el.attributes).forEach(function(attr) {
                if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
            });
        });
    }

    /* Basic Markdown Converter */
    function htmlToMarkdown(html) {
        let temp = document.createElement('div');
        temp.innerHTML = html;
        
        let markdown = '';
        
        function traverse(node) {
            if (node.nodeType === 3) {
                // Text node
                markdown += node.nodeValue;
                return;
            }
            
            if (node.nodeType !== 1) return;
            
            const tag = node.tagName.toLowerCase();
            
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
                case 'tr': markdown += '\n'; break;
                case 'td':
                case 'th': markdown += '| '; break;
            }
            
            // Traverse children
            for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
            }
            
            // Closing tags
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
                    markdown += '\n'; break;
                case 'tr': markdown += '|\n'; break;
            }
        }
        
        traverse(temp);
        
        // Cleanup excessive newlines
        return markdown.replace(/\n\s+\n/g, '\n\n').trim();
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

        if (format === 'md') {
            const content = htmlToMarkdown(contentArea.innerHTML);
            BookmarkletUtils.downloadFile(cleanTitle + '_' + Date.now() + '.md', content, 'text/markdown');
        } else if (format === 'txt') {
            const content = contentArea.innerText;
            BookmarkletUtils.downloadFile(cleanTitle + '_' + Date.now() + '.txt', content, 'text/plain');
        } else if (format === 'png') {
            /* Dynamically load html2canvas if needed */
            if (typeof html2canvas === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                script.onload = () => capturePng(contentArea, cleanTitle);
                script.onerror = () => alert('Failed to load html2canvas for PNG export.');
                document.body.appendChild(script);
            } else {
                capturePng(contentArea, cleanTitle);
            }
        } else {
            /* HTML Default */
            const content = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + cleanTitle + '</title></head><body>' + contentArea.innerHTML + '</body></html>';
            BookmarkletUtils.downloadFile(cleanTitle + '_' + Date.now() + '.html', content, 'text/html');
        }
    }

    function capturePng(element, title) {
        /* Temporarily ensure element is visible and has white background for capture */
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = '#ffffff';
        
        html2canvas(element, { useCORS: true, logging: false }).then(canvas => {
            element.style.backgroundColor = originalBg; /* Restore */
            
            const link = document.createElement('a');
            link.download = title + '_' + Date.now() + '.png';
            link.href = canvas.toDataURL();
            link.click();
        }).catch(err => {
            console.error('PNG Capture failed:', err);
            alert('PNG export failed. Check console for details.');
            element.style.backgroundColor = originalBg;
        });
    }

    startFinder();
})();
