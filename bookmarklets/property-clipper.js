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
    const PROMPT_DATA = {
        str: {
            label: "Short-Term Rental (STR)",
            role: "Act as a Senior Real Estate Investment Analyst specializing in Short-Term Rentals (STR).",
            objective: 'Produce a "Forensic STR Comparative Viability Report" for the attached properties.',
            defaults: ['infrastructure', 'regulatory', 'amenity', 'visual', 'financial', 'verdict'],
            sections: {
                infrastructure: {
                    title: "Infrastructure Forensics (Critical)",
                    content: `   - Specifically analyze Sewer vs. Septic. If Septic, calculate the legal 'Hard Occupancy Cap' using local township formulas (e.g., usually 2/bedroom + 2).\n   - Assess if the building's vintage and heating type (e.g., electric baseboard vs. mini-splits) will cripple winter NOI due to utility volatility.\n   - Flag "Vintage Risk": 1970s wiring (Aluminum?), 1980s siding (T1-11?), or pre-1978 lead paint.`
                },
                regulatory: {
                    title: "Regulatory Audit",
                    content: `   - Break down HOA 'Gate Taxes' (per-stay or per-car fees), mandatory registration costs, and township licensing friction. Flag any communities with high administrative overhead.`
                },
                amenity: {
                    title: "Amenity Audit",
                    content: `   - Identify 'Value Drivers' (Central AC, parking volume, water access) vs. 'Value Drags' (single-bathroom bottlenecks for high-occupancy groups).`
                },
                visual: {
                    title: "Visual Condition Audit (Look at the Embedded Photos)",
                    content: `   - Analyze the kitchen and bathrooms. Are they "Time Capsule" (original 80s/90s) or "Flip Grade" (LVP flooring, gray walls, quartz)?\n   - Estimate immediate cosmetic CapEx needed to reach top-tier ADR.`
                },
                financial: {
                    title: "Financial Stress Test",
                    content: `   - Calculate 'Silent Costs,' including snow removal per-visit estimates and projected winter utility spikes based on current energy rates.`
                },
                verdict: {
                    title: "Forensic Verdict (Identifying Traps)",
                    content: `   - Forensicly highlight hidden liabilities. Provide a clear 'Analyst’s Pick' for the primary target.`
                }
            }
        },
        ltr: {
            label: "Long-Term Rental (LTR)",
            role: "Act as a Residential Portfolio Manager.",
            objective: 'Produce a "Forensic Long-Term Rental (LTR) Asset Analysis".',
            defaults: ['tenant', 'condition', 'cashflow', 'verdict'],
            sections: {
                tenant: {
                    title: "Tenant Avatar & Demand",
                    content: `   - Based on School District, Bedroom Count, and Layout, who is the ideal tenant?`
                },
                condition: {
                    title: "Condition & Durability Audit (Look at the Embedded Photos)",
                    content: `   - Flag "High-Maintenance" features: carpet (vs. LVP), complex landscaping, old appliances.\n   - Judge the "Rental Grade": Does it need a full paint/floor refresh before listing?`
                },
                cashflow: {
                    title: "Cash Flow Stability",
                    content: `   - Calculate the Rent-to-Price ratio.\n   - Identify non-recoverable costs (Taxes, HOA) that eat into the Cap Rate.`
                },
                verdict: {
                    title: "Verdict",
                    content: `   - Summarize the investment thesis. Is this a "Cash Flow Play," an "Appreciation Play," or a "Capital Preservation" asset?`
                }
            }
        },
        multi: {
            label: "Multi-Unit / House Hacking",
            role: "Act as a Commercial Real Estate Analyst.",
            objective: 'Produce a "Value-Add & Yield Analysis" for Multi-Unit assets.',
            defaults: ['unitmix', 'visual', 'expense', 'verdict'],
            sections: {
                unitmix: {
                    title: "Unit Mix & Metering (Critical)",
                    content: `   - Analyze the unit configuration.\n   - CRITICAL: Are utilities (Electric, Heat, Water) separated or master-metered?`
                },
                visual: {
                    title: "Visual CapEx Assessment (Look at the Embedded Photos)",
                    content: `   - Identify "Loss to Lease": Are units dated? Can cosmetic updates (cabinets, fixtures) force appreciation?\n   - Flag "Deferred Maintenance" visible in photos (roof stains, siding issues).`
                },
                expense: {
                    title: "Expense Ratio Reality Check",
                    content: `   - Normalize taxes, insurance, and maintenance.`
                },
                verdict: {
                    title: "Verdict",
                    content: `   - Assess the overall investment viability. "Turnkey Yield" vs. "BRRRR Project."`
                }
            }
        },
        flip: {
            label: "Fix & Flip / Renovation",
            role: "Act as a Project Manager & Fix-and-Flip Specialist.",
            objective: 'Produce a "Renovation Feasibility & ARV Report".',
            defaults: ['bones', 'scope', 'arv', 'verdict'],
            sections: {
                bones: {
                    title: 'The "Bone Structure" (Forensic)',
                    content: `   - Identify structural red flags: Foundation issues, water intrusion, "As-Is" language, mold hints.`
                },
                scope: {
                    title: "Renovation Scope Estimation (Look at the Embedded Photos)",
                    content: `   - Categorize required work: "Cosmetic" (Paint/Floors) vs. "Heavy" (Kitchen/Bath relocation) vs. "Gut".\n   - Estimate a rough "Rehab Budget" range based on visual condition.\n   - Does the kitchen layout require moving plumbing/gas? (High cost).`
                },
                arv: {
                    title: "After Repair Value (ARV) Clues",
                    content: `   - Does the layout support modern resale?`
                },
                verdict: {
                    title: "Verdict",
                    content: `   - Evaluate the project feasibility. Does the spread justify the renovation risk?`
                }
            }
        }
    };

    const GLOBAL_SECTIONS = {
        deep_research: {
            title: "Deep Research Verification",
            content: `   - Verify all data points using external sources (County Tax Records, Zoning Maps).\n   - Search for recent permits and code violations.\n   - Cross-reference school ratings and local crime statistics.`
        },
        thinking: {
            title: "Thinking Process (Chain of Thought)",
            content: `   - Before providing the final verdict, explicitly show your reasoning steps.\n   - Weigh the pros and cons of each major finding.`
        },
        renovation: {
            title: "Renovation Estimator",
            content: `   - Estimate cosmetic vs structural rehab costs based on photos and description.\n   - Create a rough budget for "Rent Ready" or "Flip Grade" status.`
        },
        neighborhood: {
            title: "Neighborhood Analysis",
            content: `   - Analyze the neighborhood using map data and description.\n   - Identify proximity to amenities, schools, and potential noise sources (highways, trains).`
        }
    };

    function buildPrompt(strategyKey, selectedSections, globalOptions) {
        const strategy = PROMPT_DATA[strategyKey];
        if (!strategy) return "Error: Invalid Strategy";

        let role = strategy.role;
        if (globalOptions.includes('skeptical')) {
            role = role.replace("Act as a", "Act as a highly skeptical and forensic");
        }

        let prompt = `${role} ${strategy.objective}\n\n`;

        if (globalOptions.includes('thinking_header')) {
            prompt += `[IMPORTANT: Use a step-by-step thinking process before finalizing each section.]\n\n`;
        }

        let sectionIndex = 1;

        const allSections = [];

        /* Add Strategy Sections */
        Object.keys(strategy.sections).forEach(key => {
            if (selectedSections.includes(key)) {
                allSections.push({ ...strategy.sections[key], id: key });
            }
        });

        /* Add Global Sections */
        Object.keys(GLOBAL_SECTIONS).forEach(key => {
            if (selectedSections.includes(key)) {
                allSections.push({ ...GLOBAL_SECTIONS[key], id: key });
            }
        });

        allSections.forEach(section => {
            prompt += `${sectionIndex}. ${section.title}:\n${section.content}\n`;
            sectionIndex++;
        });

        prompt += `\n*** IF MULTIPLE FILES ARE UPLOADED: ***\n- Produce a "Comparative Forensic Matrix" table ranking properties by: [Price, Occupancy Cap, Heating Fuel, Renovation Needs, Risk Score].`;

        return prompt;
    }

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

        /* --- UI: STRATEGY SELECTOR --- */
        const step1 = document.createElement('div');
        step1.className = 'pc-step';
        step1.innerHTML = `<label>1. Select Investment Strategy</label>`;
        
        const select = document.createElement('select');
        select.className = 'pc-select';
        /* Populate Strategies */
        Object.keys(PROMPT_DATA).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = PROMPT_DATA[k].label;
            select.appendChild(opt);
        });
        step1.appendChild(select);

        /* --- UI: OPTIONS CONTAINER --- */
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'pc-options-container';

        const sectionsGroup = document.createElement('fieldset');
        sectionsGroup.className = 'pc-fieldset';
        sectionsGroup.innerHTML = `<legend>Include Sections</legend>`;
        const sectionsList = document.createElement('div');
        sectionsList.className = 'pc-checkbox-grid';
        sectionsGroup.appendChild(sectionsList);

        const globalGroup = document.createElement('fieldset');
        globalGroup.className = 'pc-fieldset';
        globalGroup.innerHTML = `<legend>Advanced Options</legend>`;
        const globalList = document.createElement('div');
        globalList.className = 'pc-checkbox-grid';
        globalGroup.appendChild(globalList);

        /* Render Global Options Once */
        const globalOpts = [
            { id: 'deep_research', label: 'Deep Research (Web)' },
            { id: 'thinking', label: 'Thinking Process Step' },
            { id: 'renovation', label: 'Renovation Estimator' },
            { id: 'neighborhood', label: 'Neighborhood Analysis' },
            { id: 'skeptical', label: 'Skeptical/Forensic Tone', type: 'option' },
            { id: 'thinking_header', label: 'Chain of Thought Header', type: 'option' }
        ];

        globalOpts.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'pc-checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="pc-opt-${opt.id}" value="${opt.id}" data-type="${opt.type || 'section'}">
                <label for="pc-opt-${opt.id}">${opt.label}</label>
            `;
            globalList.appendChild(div);
        });

        optionsContainer.appendChild(sectionsGroup);
        optionsContainer.appendChild(globalGroup);

        /* --- UI: TEXTAREA --- */
        const step2 = document.createElement('div');
        step2.className = 'pc-step';
        step2.style.flexGrow = '1';
        step2.style.display = 'flex';
        step2.style.flexDirection = 'column';
        step2.innerHTML = `<label>Generated Prompt (Editable)</label>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'pc-textarea';
        
        /* COPY BUTTON */
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

        /* --- LOGIC: UPDATE PROMPT --- */
        function refreshPrompt() {
            const strat = select.value;
            const selectedSections = [];
            const globalOptions = [];

            /* Gather Section Checkboxes */
            sectionsList.querySelectorAll('input:checked').forEach(cb => selectedSections.push(cb.value));

            /* Gather Global Checkboxes */
            globalList.querySelectorAll('input:checked').forEach(cb => {
                if(cb.dataset.type === 'section') selectedSections.push(cb.value);
                else globalOptions.push(cb.value);
            });

            textarea.value = buildPrompt(strat, selectedSections, globalOptions);
        }

        function renderStrategySections() {
            const strat = select.value;
            const data = PROMPT_DATA[strat];
            sectionsList.innerHTML = '';

            Object.keys(data.sections).forEach(k => {
                const s = data.sections[k];
                const div = document.createElement('div');
                div.className = 'pc-checkbox-item';
                const isChecked = data.defaults.includes(k) ? 'checked' : '';
                div.innerHTML = `
                    <input type="checkbox" id="pc-sec-${k}" value="${k}" ${isChecked}>
                    <label for="pc-sec-${k}" title="${s.title}">${s.title.split('(')[0].trim()}</label>
                `;
                sectionsList.appendChild(div);
            });

            /* Re-bind events for new checkboxes */
            sectionsList.querySelectorAll('input').forEach(i => i.onchange = refreshPrompt);
            refreshPrompt();
        }

        /* Bind Events */
        select.onchange = renderStrategySections;
        globalList.querySelectorAll('input').forEach(i => i.onchange = refreshPrompt);

        /* Initial Render */
        renderStrategySections();

        /* --- FOOTER --- */
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
        body.appendChild(optionsContainer); // Insert Options
        body.appendChild(step2);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
            #${CONFIG.overlayId} { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #${CONFIG.modalId} { background: white; width: 600px; height: 80vh; max-height: 800px; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            .pc-header { padding: 16px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; font-size: 16px; color: #111827; }
            .pc-body { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: #f9fafb; overflow-y: auto; }
            .pc-step label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
            .pc-select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; color: #1f2937; }
            .pc-textarea { width: 100%; flex-grow: 1; min-height: 150px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 12px; resize: none; color: #374151; line-height: 1.5; }
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
            /* New Styles for Builder */
            .pc-options-container { display: flex; gap: 15px; }
            .pc-fieldset { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: white; }
            .pc-fieldset legend { font-size: 11px; font-weight: bold; color: #6b7280; padding: 0 4px; text-transform: uppercase; }
            .pc-checkbox-grid { display: flex; flex-direction: column; gap: 6px; max-height: 150px; overflow-y: auto; }
            .pc-checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
            .pc-checkbox-item input { margin: 0; cursor: pointer; }
            .pc-checkbox-item label { margin: 0; cursor: pointer; text-transform: none; font-weight: 400; }
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

    /**
     * Asynchronously extracts property images and embeds them as base64 strings.
     *
     * Strategy:
     * 1. Scrapes high-res image URLs from Next.js data (`__NEXT_DATA__`) or fallback DOM <img> tags.
     * 2. Fetches each image to convert it to a resized base64 string (to avoid hotlinking issues).
     * 3. Handles CORS errors by falling back to direct hotlinks if conversion fails.
     * 4. Returns an HTML string containing a responsive grid of the embedded images.
     *
     * @returns {Promise<string>} HTML string representing the gallery section.
     */
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
        BookmarkletUtils.normalizeImages(c);

        /* 2. Inline Safe Styles (Minimal Stabilization) */
        BookmarkletUtils.inlineStyles(t, c);

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

    init();
})();
