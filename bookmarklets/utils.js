(function(w) {
    /* Shared Random Buffer */
    const BUFFER_SIZE = 256;
    const r = new Uint32Array(BUFFER_SIZE);
    let rIdx = BUFFER_SIZE;

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
        'object-fit', 'object-position',
        /* Positioning & Transform (Fix for Layout Collapse) */
        'position', 'top', 'bottom', 'left', 'right',
        'transform', 'transform-origin', 'transform-style'
    ];

    w.BookmarkletUtils = {
        sanitizeFilename: function(s) {
            /* Replace non-alphanumeric characters with underscores and truncate */
            return (s || 'export').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        },
        downloadFile: function(filename, content, type) {
            /* Create blob and download link */
            var blob = new Blob([content], { type: type || 'text/html' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
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
        inlineStyles: function(source, target) {
            /* Recursively apply SAFE computed styles from source to target */
            const computed = window.getComputedStyle(source);
            if (!computed) return;

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
                    window.BookmarkletUtils.inlineStyles(sourceChildren[i], targetChildren[i]);
                }
            }
        }
    };
})(window);
