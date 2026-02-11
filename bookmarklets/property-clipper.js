(function () {
    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'pc-bookmarklet-modal',
        overlayId: 'pc-bookmarklet-overlay',
        filenamePrefix: '' /* Removed prefix as requested */
    };

    /* STATE MANAGEMENT */
    let extractedContent = null;
    let isExtracting = false;

    /* PROMPT LIBRARY - UPDATED TO FORENSIC STANDARD */
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
4. Financial Stress Test:
   - Calculate 'Silent Costs,' including snow removal per-visit estimates and projected winter utility spikes based on current energy rates.
5. Revenue & Acquisition Strategy:
   - Provide revenue projections based on market ADR and occupancy rates.
   - Rank properties from best to worst STR fitness.
6. Offer Recommendations:
   - Suggest specific offer prices for each based on Days on Market (DOM), list-to-sale price trends, and prior sales history.
7. Forensic Verdict (Identifying Traps):
   - Forensicly highlight hidden liabilities (e.g., contradictory data or regulatory time bombs like legacy cesspools). Provide a clear 'Analyst’s Pick' for the primary target.

*** IF MULTIPLE FILES ARE UPLOADED: ***
- Produce a "Comparative Forensic Matrix" table ranking properties by: [Price, Occupancy Cap, Heating Fuel, HOA Fees, Risk Score].`,

        ltr: `Act as a Residential Portfolio Manager. Produce a "Forensic Long-Term Rental (LTR) Asset Analysis".

1. Tenant Avatar & Demand:
   - Based on School District, Bedroom Count, and Layout, who is the ideal tenant? (e.g., "Long-term family" vs. "Transient workforce").
2. Durability & OpEx Audit (Forensic):
   - Flag "High-Maintenance" features: carpet (vs. LVP), complex landscaping, old appliances, oil heat.
   - Estimate CapEx reserves needed for Roof/HVAC based on listed age.
3. School & Location Premium:
   - Does the School District justify a rent premium?
   - Is it close to major employment hubs or transit?
4. Cash Flow Stability:
   - Calculate the Rent-to-Price ratio.
   - Identify non-recoverable costs (Taxes, HOA) that eat into the Cap Rate.
5. Verdict: 
   - Summarize the investment thesis. Is this a "Cash Flow Play," an "Appreciation Play," or a "Capital Preservation" asset?

*** IF MULTIPLE FILES ARE UPLOADED: ***
- Create a "Portfolio Ranking Table" comparing: [Price, Est. Rent, Taxes, School Rating, Cash-on-Cash Return].`,

        multi: `Act as a Commercial Real Estate Analyst. Produce a "Value-Add & Yield Analysis" for Multi-Unit assets.

1. Unit Mix & Metering (Critical):
   - Analyze the unit configuration (e.g., 2x2 vs. 1x1).
   - CRITICAL: Are utilities (Electric, Heat, Water) separated or master-metered? (Master-metered = landlord expense risk).
2. Value-Add Opportunities:
   - Identify "Loss to Lease": Are units dated? Can cosmetic updates force appreciation?
   - Is there unused zoning density (e.g., finishable basement/attic)?
3. Expense Ratio Reality Check:
   - Normalize taxes, insurance, and maintenance.
   - Flag "Deferred Maintenance" visible in descriptions (e.g., "needs TLC," "original roof").
4. Exit Strategy:
   - Who is the end buyer? (Owner-occupant house hacker vs. Pure investor).
5. Verdict: 
   - Assess the overall investment viability. "Turnkey Yield" vs. "BRRRR Project."

*** IF MULTIPLE FILES ARE UPLOADED: ***
- Compare assets in a table: [Price per Door, Gross Rent Multiplier (GRM), Utility Config, Cap Rate].`,

        flip: `Act as a Project Manager & Fix-and-Flip Specialist. Produce a "Renovation Feasibility & ARV Report".

1. The "Bone Structure" (Forensic):
   - Identify structural red flags: Foundation issues, water intrusion, "As-Is" language, mold hints.
   - Vintage Risks: 1950s (Galvanized pipe), 1970s (Aluminum wiring), Pre-1978 (Lead paint/Asbestos).
2. Renovation Scope Estimation:
   - Categorize required work: "Cosmetic" (Paint/Floors) vs. "Heavy" (Kitchen/Bath relocation) vs. "Gut".
   - Estimate a rough "Rehab Budget" range based on listed condition.
3. After Repair Value (ARV) Clues:
   - Does the layout support modern resale? (e.g., 1.5 baths is a killer; closed floor plan).
   - Is the ceiling height or lot size a permanent cap on value?
4. Location Analysis:
   - Is this an up-and-coming neighborhood or a declining one? Does the street support the potential ARV?
5. Verdict: 
   - Evaluate the project feasibility. Does the spread justify the renovation risk? Characterize the difficulty level.

*** IF MULTIPLE FILES ARE UPLOADED: ***
- Rank projects in a table by "Profit Spread" and "Risk Level".`
    };

    /* INITIALIZATION */
    function init() {
        /* Start extraction immediately in background */
        runBackgroundExtraction();
        /* Show UI immediately */
        createUI();
    }

    /* BACKGROUND WORKER */
    async function runBackgroundExtraction() {
        isExtracting = true;
        updateStatus("Scanning page...", "loading");

        /* 1. Expand Details (Wait for clicks) */
        await expandDetails();
        
        /* 2. Extract HTML & JSON */
        const content = getCleanPageContent(); 
        const rawJSON = extractHiddenData();
        
        /* Combine visual content with raw data */
        extractedContent = content + rawJSON;

        isExtracting = false;
        updateStatus("Listing data captured.", "success");
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

        /* HEADER */
        const header = document.createElement('div');
        header.className = 'pc-header';
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span><strong>Property Research</strong> <span style="font-weight:normal; opacity:0.7">| Commander</span></span>
                <span id="pc-status-pill" class="pc-pill loading">Initializing...</span>
            </div>
        `;

        /* BODY */
        const body = document.createElement('div');
        body.className = 'pc-body';

        /* STEP 1: STRATEGY SELECTOR */
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

        /* STEP 2: PROMPT AREA */
        const step2 = document.createElement('div');
        step2.className = 'pc-step';
        step2.style.flexGrow = '1';
        step2.style.display = 'flex';
        step2.style.flexDirection = 'column';
        step2.innerHTML = `<label>2. Generated Gemini Prompt (Editable)</label>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'pc-textarea';
        textarea.value = PROMPTS.str; /* Default */
        
        /* Update prompt on select change */
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

        /* FOOTER */
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

        /* INJECT STYLES */
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
            .pc-btn.primary { background: #2563eb; color: white; border: none; }
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
        /* Inject BASE tag to fix relative links */
        const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><base href="${window.location.origin}"></head><body>${extractedContent}</body></html>`;
        BookmarkletUtils.downloadFile(filename, fullHTML);
    }

    /* SAFE EXTRACTION LOGIC */
    async function expandDetails() {
        /* SEARCH SCOPE: Try to find the main content to avoid header/footer links */
        const mainSelectors = ['#app-content', '.main-content', '#details-page-container', '[role="main"]'];
        let searchScope = document.body;
        for (const sel of mainSelectors) {
            const el = document.querySelector(sel);
            if (el) { searchScope = el; break; }
        }

        /* 1. Click Specific Targets (Known Expanders) */
        const targets = [
            '[data-testid="hero-view-more"]', /* Realtor.com Main Expand */
            '[data-testid="accordion-header"][aria-expanded="false"]', /* Realtor.com Property History Accordions */
            '#load-more-features',
            'button[class*="show-more"]', /* Zillow */
            '.BottomLink', /* Redfin (sometimes divs) */
            'button.clickable' 
        ];
        
        let c = 0;
        targets.forEach(function(s) {
            const els = searchScope.querySelectorAll(s);
            els.forEach(function(e) { try{e.click(); c++;}catch(r){} });
        });

        /* 2. Fuzzy Match Text (Scoped & Safe) */
        const candidates = searchScope.querySelectorAll('button, a, div[role="button"], span[role="button"]');
        for (let i = 0; i < candidates.length; i++) {
            const el = candidates[i];
            
            /* SAFETY: Check if element or any ancestor is a dangerous link */
            const link = el.closest('a');
            if (link && link.href && !link.href.includes('javascript') && !link.href.includes('#')) {
                /* If it links to a different URL, SKIP IT */
                continue; 
            }

            const t = (el.innerText || '').toLowerCase();
            const badTerms = ['photo', 'agent', 'map', 'school', 'sell', 'buy', 'rent', 'advice', 'contact'];
            if (badTerms.some(function(term) { return t.includes(term); })) continue;

            if ((t.includes('see more') || t.includes('show more') || t.includes('view all') || t.includes('read more'))) {
                if (el.offsetParent !== null) { /* Visible */
                    try { el.click(); c++; } catch(e){}
                }
            }
        }
        
        if (c > 0) await new Promise(function(r) { setTimeout(r, 1200); });
    }

    function extractHiddenData() {
        let d = [];
        document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s) { try{d.push(JSON.parse(s.textContent))}catch(e){} });
        const n = document.getElementById('__NEXT_DATA__');
        if(n) try{d.push(JSON.parse(n.textContent))}catch(e){}
        if(d.length===0) return '';
        return `<hr><details open style="margin-top:50px;border-top:5px solid #000;padding-top:20px;"><summary style="font-size:1.5em;font-weight:bold;cursor:pointer;">RAW DATA (JSON)</summary><pre style="background:#f4f4f4;padding:15px;overflow-x:auto;white-space:pre-wrap;font-size:10px;font-family:monospace;">${JSON.stringify(d, null, 2)}</pre></details>`;
    }

    function getCleanPageContent() {
        /* Determine target selector based on hostname */
        const h = window.location.hostname;
        let s = null;
        if(h.includes('realtor.com')) s='#app-content, .main-content';
        else if(h.includes('zillow.com')) s='#details-page-container, .ds-container';
        else if(h.includes('redfin.com')) s='.DpHomeOverview, #content';
        else if(h.includes('trulia.com')) s='[data-testid="home-details-summary"]';
        else if(h.includes('homes.com')) s='.property-info';
        
        /* Find target in live DOM or fallback */
        let t = s ? document.querySelector(s) : null;
        if(!t) t = document.querySelector('main')||document.querySelector('[role="main"]')||document.querySelector('article')||document.body;

        /* Clone ONLY the target element */
        const c = t.cloneNode(!0);

        /* 1. Normalize Images (Ported from Web Clipper) */
        normalizeImagesInSubtree(c);

        /* 2. Inline Safe Styles (Ported from Web Clipper - Minimal Stabilization) */
        inlineSafeStyles(t, c); /* Apply styles from live element 't' to clone 'c' */

        /* 3. Clean the clone - AGGRESSIVE STRIPPING of Junk */
        const junk = [
            'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 
            'nav', 'footer', 'header', 'aside',
            '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]', '[role="dialog"]', '[role="search"]',
            '[id*="ad-"]', '[class*="ad-"]', '[class*="advert"]', '[id*="cookie"]',
            '.modal', '.popup', '.drawer', '.lightbox',
            '[data-testid="fixed-header"]', /* Realtor.com headers */
            '[data-testid="ldp-header"]', /* Realtor.com search bar */
            '[data-testid="search-wrapper"]',
            '[data-testid="map-loader"]', /* Maps */
            '.map-container',
            '[class*="SearchBox"]',
            '[class*="ActionBar"]',
            /* Additional Map Killers */
            '.neighborhood-class-loader', /* The US map artifact */
            '[data-testid="map-wrap"]',
            '[data-testid="listing-summary-map"]', /* Realtor.com Map Artifact */
            '.listing-summary-map',
            '#map',
            '.map-inner',
            '.leaflet-container',
            '.mapboxgl-map'
        ];
        junk.forEach(function(k) { c.querySelectorAll(k).forEach(function(e) { e.remove(); }); });

        /* Remove empty lists */
        c.querySelectorAll('li').forEach(function(li) {
            if (!li.textContent.trim() && li.children.length === 0) { li.remove(); }
        });
        c.querySelectorAll('ul, ol').forEach(function(list) {
            if (list.children.length === 0) { list.remove(); }
        });

        /* Instead of innerHTML, return the outerHTML of the stabilized clone */
        return c.outerHTML;
    }

    /* Helper: Image Normalization (From Web Clipper) */
    function normalizeImagesInSubtree(root) {
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

    /* Helper: Inline Safe Styles (From Web Clipper - Option A) */
    function inlineSafeStyles(source, target) {
        const computed = window.getComputedStyle(source);
        if (!computed) return;
        
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
        
        /* Stop recursion if trees diverge */
        if (!targetChildren || sourceChildren.length !== targetChildren.length) return;

        for (let i = 0; i < sourceChildren.length; i++) {
            inlineSafeStyles(sourceChildren[i], targetChildren[i]);
        }
    }

    init();
})();
