(function () {
    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'pc-bookmarklet-modal',
        overlayId: 'pc-bookmarklet-overlay',
        filenamePrefix: ''
    };

    /* STATE MANAGEMENT */
    let extractedContent = null;
    let isExtracting = false;
    let propertyMetadata = {
        address: '',
        price: '',
        specs: '',
        yearBuilt: '',
        description: ''
    };

    /* PROMPT LIBRARY (OPTIMIZED FOR DEEP RESEARCH) */
    const DEEP_RESEARCH_CORE = `Act as a Senior Real Estate Investment Analyst. I am providing you with a complete property listing capture (HTML, embedded photos, and hidden JSON data). 

Your objective is to conduct a Deep Research analysis of this investment opportunity. Please do NOT restrict yourself to a narrow checklist or tunnel-vision solely on the provided text. Use your deep research capabilities to uncover market trends, hidden risks, local regulations, neighborhood dynamics, and any other factors that are not immediately obvious from the listing itself. Give me your best professional advice and highlight what I might be missing.`;

    const PROMPTS = {
        str: `${DEEP_RESEARCH_CORE}

FOCUS AREA: Short-Term Rental (STR) / Airbnb
While conducting your broad research, please ensure you investigate:
- Infrastructure Constraints: e.g., Sewer vs. Septic limits (which often legally cap occupancy).
- Regulatory Friction: e.g., HOA 'Gate taxes', short-term rental bans, or strict township licensing.
- Utility Volatility: Assess mechanical vintage/heating type for winter NOI impact.
- Value Drivers vs. Drags: Look at the embedded photos for cosmetic condition, layout bottlenecks, and required CapEx to reach top-tier ADR.

Conclude with a clear investment verdict (Strong Buy, Qualified Buy, or Hard Pass) and summarize the Risk vs. Reward profile.`,

        ltr: `${DEEP_RESEARCH_CORE}

FOCUS AREA: Long-Term Rental (LTR) / Buy & Hold
While conducting your broad research, please ensure you investigate:
- Target Demographics: Tenant demand drivers like school districts, transit, and employment hubs.
- Durability Risks: Look at the embedded photos to flag high-maintenance features (carpet, old appliances, complex landscaping).
- Financial Stability: True cash flow potential, factoring in non-recoverable costs like taxes and HOA fees.

Conclude with a clear investment verdict (Strong Buy, Qualified Buy, or Hard Pass) assessing whether this is a cash-flow play, appreciation play, or capital trap.`,

        multi: `${DEEP_RESEARCH_CORE}

FOCUS AREA: Multi-Unit / Small Multi-Family
While conducting your broad research, please ensure you investigate:
- Metering & Utilities: Are utilities master-metered (landlord risk) or separated?
- Value-Add Potential: Review embedded photos for 'Loss to Lease' opportunities (cosmetic updates) or unused zoning density.
- Expense Reality: Normalize taxes, insurance, and maintenance beyond what the listing claims.

Conclude with a clear investment verdict (Strong Buy, Qualified Buy, or Hard Pass) detailing the operational risk vs. potential yield.`,

        flip: `${DEEP_RESEARCH_CORE}

FOCUS AREA: Fix-and-Flip / Renovation
While conducting your broad research, please ensure you investigate:
- Structural & Vintage Risks: Identify red flags like foundation issues, 1970s aluminum wiring, or pre-1978 lead paint risks.
- Renovation Scope: Review the embedded photos to estimate the rehab budget (Cosmetic vs. Heavy vs. Gut) and layout obsolescence (e.g., 1.5 baths).
- ARV Caps: Does the neighborhood, street, or ceiling height place a permanent cap on After Repair Value?

Conclude with a clear investment verdict (Strong Buy, Qualified Buy, or Hard Pass) and evaluate if the profit spread justifies the renovation risk.`
    };

    /* INITIALIZATION */
    function init() {
        runBackgroundExtraction();
        createUI();
    }

    /* BACKGROUND WORKER */
    async function runBackgroundExtraction() {
        isExtracting = true;
        updateStatus("Scanning page...", "loading");

        await expandDetails();
        
        /* 1. Extract Snapshot (Runs BEFORE we alter the DOM) */
        const snapshotHtml = extractSnapshotData();

        /* 2. Clean and Stabilize Page Content */
        const content = getCleanPageContent();
        
        /* 3. Extract Raw JSON Data */
        const rawJSON = extractHiddenData();
        
        /* 4. Async Photo Embedding */
        updateStatus("Embedding photos (0/15)...", "loading");
        const photoGallery = await extractAndEmbedGallery();
        
        /* Combine everything */
        extractedContent = snapshotHtml + content + photoGallery + rawJSON;

        isExtracting = false;
        updateStatus("Ready for download.", "success");
        enableDownload();
    }

    /* PROPERTY SNAPSHOT EXTRACTION */
    function extractSnapshotData() {
        try {
            // Price
            const priceEl = document.querySelector('[data-testid="ldp-list-price"]');
            propertyMetadata.price = priceEl ? priceEl.innerText.replace(/\n/g, ' ').trim() : 'N/A';

            // Address (Avoid getting "View on map" text)
            const addressBtn = document.querySelector('[data-testid="address-line-ldp"] h1 button, [data-testid="address-line-ldp"] h1');
            propertyMetadata.address = addressBtn ? addressBtn.innerText.trim() : 'N/A';

            // Specs (Beds, Baths, SqFt)
            const beds = document.querySelector('[data-testid="property-meta-beds"]')?.innerText.replace(/\n/g, ' ') || '';
            const baths = document.querySelector('[data-testid="property-meta-baths"]')?.innerText.replace(/\n/g, ' ') || '';
            const sqft = document.querySelector('[data-testid="property-meta-sqft"]')?.innerText.replace(/\n/g, ' ') || '';
            propertyMetadata.specs = [beds, baths, sqft].filter(Boolean).join(' | ') || 'N/A';

            // Description
            const descEl = document.querySelector('[data-testid="romance-paragraph"]');
            propertyMetadata.description = descEl ? descEl.innerText.replace('Show more', '').trim() : 'N/A';

            // Year Built
            propertyMetadata.yearBuilt = 'N/A';
            const keyFacts = document.querySelectorAll('[data-testid="key-facts"] li');
            keyFacts.forEach(li => {
                const text = li.innerText.toLowerCase();
                if (text.includes('built in') || text.includes('year built')) {
                    propertyMetadata.yearBuilt = li.innerText.replace(/\n/g, ' ').trim();
                }
            });

            return `
            <div class="forensic-header">
                <h1>Property Snapshot</h1>
                <div class="core-facts">
                    <div class="fact-item">
                        <div class="fact-label">Address</div>
                        <div style="font-size: 16px;">${propertyMetadata.address}</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-label">Price</div>
                        <div style="font-size: 18px; font-weight: bold; color: #10b981;">${propertyMetadata.price}</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-label">Specs</div>
                        <div style="font-size: 16px;">${propertyMetadata.specs}</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-label">Age & History</div>
                        <div style="font-size: 16px;">${propertyMetadata.yearBuilt}</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <div class="fact-label" style="margin-bottom: 5px;">Description</div>
                    <div style="font-size: 14px; line-height: 1.6; color: #ccc;">${propertyMetadata.description}</div>
                </div>
            </div>
            `;
        } catch (e) {
            console.error('Snapshot extraction failed', e);
            return '<div style="color:red;">Failed to extract snapshot headers</div>';
        }
    }

    /* UI GENERATION (FIXED SCROLLBARS & FLEX LAYOUT) */
    function createUI() {
        const existing = document.getElementById(CONFIG.overlayId);
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = CONFIG.overlayId;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;

        const header = document.createElement('div');
        header.className = 'pc-header';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span><strong>Property Research</strong> <span style="font-weight:normal; opacity:0.7">| Commander</span></span>
                <span id="pc-status-pill" class="pc-pill loading">Initializing...</span>
            </div>
        `;

        const body = document.createElement('div');
        body.className = 'pc-body';

        const step1 = document.createElement('div');
        step1.className = 'pc-step-fixed';
        step1.innerHTML = `<label>1. Select Investment Strategy</label>`;
        
        const select = document.createElement('select');
        select.className = 'pc-select';
        select.innerHTML = `
            <option value="str">Short-Term Rental (Vacation/Airbnb)</option>
            <option value="ltr">Long-Term Rental (City/Suburban)</option>
            <option value="multi">Multi-Unit / House Hacking</option>
            <option value="flip">Fix & Flip / Renovation</option>
        `;
        step1.appendChild(select);

        const step2 = document.createElement('div');
        step2.className = 'pc-step-flex';
        step2.innerHTML = `<label>2. Generated Gemini Prompt (Editable)</label>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'pc-textarea';
        textarea.value = PROMPTS.str;
        
        select.onchange = (e) => {
            textarea.value = PROMPTS[e.target.value];
        };

        const copyBtn = document.createElement('button');
        copyBtn.className = 'pc-btn secondary';
        copyBtn.textContent = "Copy Prompt to Clipboard";
        copyBtn.style.marginTop = "12px";
        copyBtn.style.flexShrink = "0"; // Prevent button from squishing
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(textarea.value);
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = "Copy Prompt to Clipboard", 2000);
        };

        step2.appendChild(textarea);
        step2.appendChild(copyBtn);

        const footer = document.createElement('div');
        footer.className = 'pc-footer';

        const dlBtn = document.createElement('button');
        dlBtn.id = 'pc-dl-btn';
        dlBtn.className = 'pc-btn primary disabled';
        dlBtn.textContent = "Extracting Data...";
        dlBtn.disabled = true;
        dlBtn.onclick = () => handleDownload();

        const closeBtn = document.createElement('button');
        closeBtn.className = 'pc-btn';
        closeBtn.textContent = "Close";
        closeBtn.onclick = () => overlay.remove();

        footer.appendChild(closeBtn);
        footer.appendChild(dlBtn);

        body.appendChild(step1);
        body.appendChild(step2);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        /* CSS UPDATED FOR PROPER FLEX LAYOUT (NO DOUBLE SCROLLBARS) */
        const style = document.createElement('style');
        style.textContent = `
            #${CONFIG.overlayId} { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            
            #${CONFIG.modalId} { 
                background: white; 
                width: 90%; 
                max-width: 600px; 
                height: 85vh; 
                max-height: 800px;
                display: flex; 
                flex-direction: column; 
                border-radius: 12px; 
                overflow: hidden; 
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
            }
            
            .pc-header { padding: 16px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; font-size: 16px; color: #111827; flex-shrink: 0; }
            
            .pc-body { 
                flex-grow: 1; 
                padding: 24px; 
                display: flex; 
                flex-direction: column; 
                gap: 20px; 
                background: #f9fafb; 
                overflow: hidden; /* Prevent body scroll */
            }
            
            .pc-step-fixed { display: flex; flex-direction: column; flex-shrink: 0; }
            .pc-step-flex { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
            
            .pc-step-fixed label, .pc-step-flex label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
            
            .pc-select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; color: #1f2937; flex-shrink: 0; }
            
            .pc-textarea { 
                width: 100%; 
                flex-grow: 1; 
                padding: 14px; 
                border: 1px solid #d1d5db; 
                border-radius: 6px; 
                font-family: monospace; 
                font-size: 13px; 
                resize: none; 
                color: #374151; 
                line-height: 1.5; 
                overflow-y: auto; /* ONLY the textarea scrolls */
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }
            
            .pc-footer { padding: 16px 20px; background: #fff; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0; }
            
            .pc-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; transition: all 0.2s; }
            .pc-btn:hover { background: #f3f4f6; }
            .pc-btn.primary { background: #3b82f6; color: white; border: none; }
            .pc-btn.primary:hover { background: #1d4ed8; }
            .pc-btn.primary.disabled { background: #93c5fd; cursor: not-allowed; }
            .pc-btn.secondary { background: #fff; color: #2563eb; border: 1px solid #2563eb; width: 100%; }
            .pc-btn.secondary:hover { background: #eff6ff; }
            
            .pc-pill { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; display: inline-block; white-space: nowrap; }
            .pc-pill.loading { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
            .pc-pill.success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
        `;
        overlay.appendChild(style);
    }

    function updateStatus(text, type) {
        const pill = document.getElementById('pc-status-pill');
        if (pill) {
            pill.textContent = text;
            pill.className = `pc-pill ${type}`;
        }
    }

    function enableDownload() {
        const btn = document.getElementById('pc-dl-btn');
        if (btn) {
            btn.textContent = "Download Listing Data";
            btn.className = "pc-btn primary";
            btn.disabled = false;
        }
    }

    function handleDownload() {
        if (!extractedContent) return;
        const title = BookmarkletUtils.sanitizeFilename(document.title || 'Property');
        const filename = `${CONFIG.filenamePrefix}${title}_${Date.now()}.html`;
        
        /* Inject BASE tag AND Custom Snapshot + Photo Grid Styles */
        const customStyle = `
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.5; color: #333; }
                .forensic-header { background: #1a1a1a; color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
                .forensic-header h1 { margin: 0; font-size: 24px; color: #3b82f6; }
                .core-facts { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
                .fact-item { border-bottom: 1px solid #444; padding: 5px 0; }
                .fact-label { font-weight: bold; color: #999; font-size: 12px; text-transform: uppercase; }
                .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; margin-top: 20px; }
                .gallery-item { border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fff; }
                .gallery-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
                .raw-data-details { margin-top: 50px; border-top: 2px solid #000; padding-top: 20px; }
                @media print { .gallery-item { page-break-inside: avoid; } }
            </style>
        `;
        const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><base href="${window.location.origin}">${customStyle}</head><body>${extractedContent}</body></html>`;
        BookmarkletUtils.downloadFile(filename, fullHTML);
    }

    async function expandDetails() {
        const mainSelectors = ['#app-content', '.main-content', '#details-page-container', '[role="main"]'];
        let searchScope = document.body;
        for (const sel of mainSelectors) {
            const el = document.querySelector(sel);
            if (el) { searchScope = el; break; }
        }

        const targets = [
            '[data-testid="hero-view-more"]',
            '[data-testid="accordion-header"][aria-expanded="false"]',
            '#load-more-features',
            'button[class*="show-more"]',
            '.BottomLink',
            'button.clickable' 
        ];
        
        let c = 0;
        targets.forEach(function(s) {
            const els = searchScope.querySelectorAll(s);
            els.forEach(function(e) { try{e.click(); c++;}catch(r){} });
        });

        const candidates = searchScope.querySelectorAll('button, a, div[role="button"], span[role="button"]');
        for (let i = 0; i < candidates.length; i++) {
            const el = candidates[i];
            const link = el.closest('a');
            if (link && link.href && !link.href.includes('javascript') && !link.href.includes('#')) continue; 

            const t = (el.innerText || '').toLowerCase();
            const badTerms = ['photo', 'agent', 'map', 'school', 'sell', 'buy', 'rent', 'advice', 'contact'];
            if (badTerms.some(function(term) { return t.includes(term); })) continue;

            if ((t.includes('see more') || t.includes('show more') || t.includes('view all') || t.includes('read more'))) {
                if (el.offsetParent !== null) { try { el.click(); c++; } catch(e){} }
            }
        }
        
        if (c > 0) await new Promise(function(r) { setTimeout(r, 1200); });
    }

    /* ASYNC IMAGE EMBEDDER */
    async function extractAndEmbedGallery() {
        const imageUrls = new Set();
        const MAX_IMAGES = 15; /* Limit to avoid massive files */
        const TARGET_WIDTH = 800; /* Resize to reduce weight */

        /* 1. Try to find Next.js data (Highest quality) */
        const n = document.getElementById('__NEXT_DATA__');
        if(n) {
            try {
                const txt = n.innerText;
                const matches = txt.match(/https:\/\/[^"]+(jpg|jpeg|png|webp)/g);
                if (matches) {
                    matches.forEach(url => {
                        if (url.includes('rdcpix') || url.includes('zillowstatic') || url.includes('photos')) {
                            imageUrls.add(url.replace('s.jpg', 'od.jpg')); 
                        }
                    });
                }
            } catch(e){}
        }

        /* 2. Fallback: Scrape DOM images */
        document.querySelectorAll('img').forEach(img => {
            let src = img.src || img.dataset.src || img.getAttribute('srcset');
            if (src && (src.includes('rdcpix') || src.includes('zillowstatic')) && !src.includes('profile')) {
                if(src.indexOf(' ') > -1) src = src.split(' ')[0];
                imageUrls.add(src);
            }
        });

        if (imageUrls.size === 0) return '';

        const imagesArray = Array.from(imageUrls).slice(0, MAX_IMAGES);
        let html = '<section id="property-gallery" style="margin-top: 40px; border-top: 5px solid #333; padding-top: 20px;">';
        html += '<h2>PROPERTY PHOTOS (Embedded)</h2>';
        html += '<p><em>Visual evidence for kitchen/bath condition and renovation quality.</em></p>';
        html += '<div class="gallery-grid">';
        
        for (let i = 0; i < imagesArray.length; i++) {
            updateStatus(`Embedding photo ${i + 1}/${imagesArray.length}...`, "loading");
            try {
                const base64 = await toBase64(imagesArray[i], TARGET_WIDTH);
                if (base64) {
                    html += `<div class="gallery-item"><img src="${base64}" alt="Property Photo ${i}"></div>`;
                } else {
                    /* Fallback to hotlink if CORS fails */
                    html += `<div class="gallery-item"><img src="${imagesArray[i]}" alt="Property Photo ${i} (Linked)"></div>`;
                }
            } catch (e) {
                /* Ignore errors, just skip or link */
                html += `<div class="gallery-item"><img src="${imagesArray[i]}" alt="Property Photo ${i} (Linked)"></div>`;
            }
        }
        
        html += '</div></section>';
        return html;
    }

    function toBase64(url, maxWidth) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                try {
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } catch (e) {
                    resolve(null); /* Canvas tainted */
                }
            };
            
            img.onerror = () => resolve(null);
        });
    }

    function extractHiddenData() {
        let d = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) { try{d.push(JSON.parse(s.innerText))}catch(e){} });
        const n = document.getElementById('__NEXT_DATA__');
        if(n) try{d.push(JSON.parse(n.innerText))}catch(e){}
        if(d.length===0) return '';
        return `<hr><details class="raw-data-details"><summary style="font-size:1.5em;font-weight:bold;cursor:pointer;">RAW DATA (JSON)</summary><pre style="background:#f4f4f4;padding:15px;overflow-x:auto;white-space:pre-wrap;font-size:10px;font-family:monospace;">${JSON.stringify(d, null, 2)}</pre></details>`;
    }

    function getCleanPageContent() {
        const h = window.location.hostname;
        let s = null;
        if(h.includes('realtor.com')) s='#app-content, .main-content';
        else if(h.includes('zillow.com')) s='#details-page-container, .ds-container';
        else if(h.includes('redfin.com')) s='.DpHomeOverview, #content';
        else if(h.includes('trulia.com')) s='[data-testid="home-details-summary"]';
        else if(h.includes('homes.com')) s='.property-info';
        
        let t = s ? document.querySelector(s) : null;
        if(!t) t = document.querySelector('main')||document.querySelector('[role="main"]')||document.querySelector('article')||document.body;

        const c = t.cloneNode(!0);

        /* 1. Normalize Images */
        normalizeImagesInSubtree(c);

        /* 2. Inline Safe Styles (Minimal Stabilization) */
        inlineSafeStyles(t, c);

        /* 3. Clean the clone - SCORCHED EARTH MAP REMOVAL */
        const junk = [
            'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 
            'nav', 'footer', 'header', 'aside',
            '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]', '[role="dialog"]', '[role="search"]',
            '[id*="ad-"]', '[class*="ad-"]', '[class*="advert"]', '[id*="cookie"]',
            '.modal', '.popup', '.drawer', '.lightbox',
            '[data-testid="fixed-header"]', '[data-testid="ldp-header"]', '[data-testid="search-wrapper"]',
            '[data-testid*="map"]', '[id*="map"]', '.map-container', '.neighborhood-class-loader',
            'img[alt*="map"]', 'img[src*="maps.googleapis.com"]', '[class*="SearchBox"]', '[class*="ActionBar"]'
        ];
        junk.forEach(function(k) { c.querySelectorAll(k).forEach(function(e) { e.remove(); }); });

        /* 4. Remove attributes to reduce token count (CRITICAL FIX: Do NOT remove 'style' attribute here) */
        c.querySelectorAll('*').forEach(function(el) {
            el.removeAttribute('class');
            el.removeAttribute('data-testid');
        });

        /* 5. Clean empty lists */
        c.querySelectorAll('li').forEach(function(li) {
            if (!li.innerText.trim() && li.children.length === 0) { li.remove(); }
        });
        c.querySelectorAll('ul, ol').forEach(function(list) {
            if (list.children.length === 0) { list.remove(); }
        });

        return c.outerHTML;
    }

    /* Helper: Image Normalization */
    function normalizeImagesInSubtree(root) {
        const imgs = root.querySelectorAll('img');
        for (let i = 0; i < imgs.length; i++) {
            const img = imgs[i];
            if (img.dataset.src) img.src = img.dataset.src;
            if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;
            if (!img.src && img.srcset) {
                const parts = img.srcset.split(',');
                if(parts.length > 0) {
                     const firstSrc = parts[0].trim().split(' ')[0];
                     if(firstSrc) img.src = firstSrc;
                }
            }
            img.removeAttribute('loading');
            img.removeAttribute('width');
            img.removeAttribute('height');
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
        }
    }

    /* Helper: Inline Safe Styles */
    function inlineSafeStyles(source, target) {
        const computed = window.getComputedStyle(source);
        if (!computed) return;
        
        const safeProperties = [
            'display', 'visibility', 'opacity', 'z-index',
            'margin', 'padding', 'border', 'border-radius', 'box-shadow', 'box-sizing',
            'background', 'background-color', 'background-image', 'color',
            'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
            'list-style', 'vertical-align', 'float', 'clear',
            'flex-direction', 'justify-content', 'align-items', 'gap', 'align-self', 'flex-wrap',
            'grid-template-columns', 'grid-template-rows', 'grid-auto-flow',
            'grid-area', 'grid-column', 'grid-row',
            'place-content', 'place-items', 'place-self',
            'white-space', 'overflow', 'text-overflow', 'word-wrap', 'word-break',
            'text-transform', 'text-decoration', 'letter-spacing', 'word-spacing',
            'object-fit', 'object-position',
            'position', 'top', 'bottom', 'left', 'right',
            'transform', 'transform-origin', 'transform-style'
        ];
        
        let styleString = '';
        safeProperties.forEach(function(prop) {
            let val = computed.getPropertyValue(prop);
            if (val && val !== 'none' && val !== 'normal' && val !== 'static' && val !== '0px' && val !== 'auto' && val !== 'rgba(0, 0, 0, 0)') {
                 styleString += prop + ':' + val + '; ';
            }
        });
        
        if (styleString) {
            target.style.cssText += styleString;
        }

        const sourceChildren = source.children;
        const targetChildren = target.children;
        
        if (!targetChildren || sourceChildren.length !== targetChildren.length) return;

        for (let i = 0; i < sourceChildren.length; i++) {
            inlineSafeStyles(sourceChildren[i], targetChildren[i]);
        }
    }

    init();
})();
