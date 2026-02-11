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

    /* PROMPT LIBRARY */
    const PROMPTS = {
        str: `Act as a Senior Real Estate Investment Analyst specializing in Short-Term Rentals (STR). Please produce a "Forensic STR Comparative Viability Report" for the attached properties.

1. Infrastructure Forensics (Critical):
   - Specifically analyze Sewer vs. Septic. If Septic, calculate the legal 'Hard Occupancy Cap' using local township formulas (e.g., usually 2/bedroom + 2).
   - Assess if the building's vintage and heating type (e.g., electric baseboard vs. mini-splits) will cripple winter NOI due to utility volatility.
   - Flag "Vintage Risk": 1970s wiring (Aluminum?), 1980s siding (T1-11?), or pre-1978 lead paint.
2. Regulatory Audit:
   - Break down HOA 'Gate Taxes' (per-stay or per-car fees), mandatory registration costs, and township licensing friction. Flag any communities with high administrative overhead.
3. Amenity Audit:
   - Identify 'Value Drivers' (Central AC, parking volume, water access) vs. 'Value Drags' (single-bathroom bottlenecks for high-occupancy groups).
4. Visual Condition Audit (Look at the Embedded Photos):
   - Analyze the kitchen and bathrooms. Are they "Time Capsule" (original 80s/90s) or "Flip Grade" (LVP flooring, gray walls, quartz)?
   - Estimate immediate cosmetic CapEx needed to reach top-tier ADR.
5. Financial Stress Test:
   - Calculate 'Silent Costs,' including snow removal per-visit estimates and projected winter utility spikes based on current energy rates.
6. Forensic Verdict (Identifying Traps):
   - Forensicly highlight hidden liabilities. Provide a clear 'Analyst’s Pick' for the primary target.

*** IF MULTIPLE FILES ARE UPLOADED: ***
- Produce a "Comparative Forensic Matrix" table ranking properties by: [Price, Occupancy Cap, Heating Fuel, Renovation Needs, Risk Score].`,

        ltr: `Act as a Residential Portfolio Manager. Produce a "Forensic Long-Term Rental (LTR) Asset Analysis".

1. Tenant Avatar & Demand:
   - Based on School District, Bedroom Count, and Layout, who is the ideal tenant?
2. Condition & Durability Audit (Look at the Embedded Photos):
   - Flag "High-Maintenance" features: carpet (vs. LVP), complex landscaping, old appliances.
   - Judge the "Rental Grade": Does it need a full paint/floor refresh before listing?
3. Cash Flow Stability:
   - Calculate the Rent-to-Price ratio.
   - Identify non-recoverable costs (Taxes, HOA) that eat into the Cap Rate.
5. Verdict: 
   - Summarize the investment thesis. Is this a "Cash Flow Play," an "Appreciation Play," or a "Capital Preservation" asset?`,

        multi: `Act as a Commercial Real Estate Analyst. Produce a "Value-Add & Yield Analysis" for Multi-Unit assets.

1. Unit Mix & Metering (Critical):
   - Analyze the unit configuration.
   - CRITICAL: Are utilities (Electric, Heat, Water) separated or master-metered?
2. Visual CapEx Assessment (Look at the Embedded Photos):
   - Identify "Loss to Lease": Are units dated? Can cosmetic updates (cabinets, fixtures) force appreciation?
   - Flag "Deferred Maintenance" visible in photos (roof stains, siding issues).
3. Expense Ratio Reality Check:
   - Normalize taxes, insurance, and maintenance.
4. Verdict: 
   - Assess the overall investment viability. "Turnkey Yield" vs. "BRRRR Project."`,

        flip: `Act as a Project Manager & Fix-and-Flip Specialist. Produce a "Renovation Feasibility & ARV Report".

1. The "Bone Structure" (Forensic):
   - Identify structural red flags: Foundation issues, water intrusion, "As-Is" language, mold hints.
2. Renovation Scope Estimation (Look at the Embedded Photos):
   - Categorize required work: "Cosmetic" (Paint/Floors) vs. "Heavy" (Kitchen/Bath relocation) vs. "Gut".
   - Estimate a rough "Rehab Budget" range based on visual condition.
   - Does the kitchen layout require moving plumbing/gas? (High cost).
3. After Repair Value (ARV) Clues:
   - Does the layout support modern resale? 
4. Verdict: 
   - Evaluate the project feasibility. Does the spread justify the renovation risk?`
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
        
        const content = getCleanPageContent();
        const rawJSON = extractHiddenData();
        
        /* New Async Photo Embedding */
        updateStatus("Embedding photos (0/15)...", "loading");
        const photoGallery = await extractAndEmbedGallery();
        
        extractedContent = content + photoGallery + rawJSON;

        isExtracting = false;
        updateStatus("Ready for download.", "success");
        enableDownload();
    }

    /* UI GENERATION */
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
        step1.className = 'pc-step';
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
        step2.className = 'pc-step';
        step2.style.flexGrow = '1';
        step2.style.display = 'flex';
        step2.style.flexDirection = 'column';
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
        copyBtn.style.marginTop = "8px";
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

        const style = document.createElement('style');
        style.textContent = `
            #${CONFIG.overlayId} { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #${CONFIG.modalId} { background: white; width: 500px; height: 600px; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            .pc-header { padding: 16px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; font-size: 16px; color: #111827; }
            .pc-body { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; gap: 20px; background: #f9fafb; overflow-y: auto; }
            .pc-step label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
            .pc-select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; color: #1f2937; }
            .pc-textarea { width: 100%; flex-grow: 1; min-height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 12px; resize: none; color: #374151; line-height: 1.5; }
            .pc-footer { padding: 16px 20px; background: #fff; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px; }
            .pc-btn { padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; color: #374151; transition: all 0.2s; }
            .pc-btn:hover { background: #f3f4f6; }
            .pc-btn.primary { background: #3b82f6; color: white; border: none; }
            .pc-btn.primary:hover { background: #1d4ed8; }
            .pc-btn.primary.disabled { background: #93c5fd; cursor: not-allowed; }
            .pc-btn.secondary { background: #fff; color: #2563eb; border: 1px solid #2563eb; width: 100%; }
            .pc-btn.secondary:hover { background: #eff6ff; }
            .pc-pill { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
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
        /* Inject BASE tag AND Custom Photo Grid Styles */
        const customStyle = `
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
                .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; margin-top: 20px; }
                .gallery-item { break-inside: avoid; page-break-inside: avoid; }
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
            '[data-testid="fixed-header"]', 
            '[data-testid="ldp-header"]', 
            '[data-testid="search-wrapper"]',
            /* Map Killers */
            '[data-testid*="map"]', 
            '[id*="map"]', 
            '.map-container', 
            '.neighborhood-class-loader', 
            'img[alt*="map"]',
            'img[src*="maps.googleapis.com"]',
            '[class*="SearchBox"]',
            '[class*="ActionBar"]'
        ];
        junk.forEach(function(k) { c.querySelectorAll(k).forEach(function(e) { e.remove(); }); });

        /* Remove attributes to reduce token count */
        c.querySelectorAll('*').forEach(function(el) {
            el.removeAttribute('class');
            el.removeAttribute('style');
            el.removeAttribute('data-testid');
        });

        /* Clean empty lists */
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
            /* 1. Resolve Lazy Loading */
            if (img.dataset.src) img.src = img.dataset.src;
            if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;
            if (!img.src && img.srcset) {
                const parts = img.srcset.split(',');
                if(parts.length > 0) {
                     const firstSrc = parts[0].trim().split(' ')[0];
                     if(firstSrc) img.src = firstSrc;
                }
            }
            /* 2. Remove lazy loading attributes */
            img.removeAttribute('loading');
            
            /* 3. Stabilize Dimensions */
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
            'grid-template-columns', 'grid-template-rows', 'grid-auto-flow'
        ];
        
        let styleString = '';
        safeProperties.forEach(function(prop) {
            let val = computed.getPropertyValue(prop);
            if (val && val !== 'none' && val !== 'normal') {
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
