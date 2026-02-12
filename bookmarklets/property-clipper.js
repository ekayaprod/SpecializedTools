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

    /* PROMPT LIBRARY */
    const STANDARD_OUTPUTS = `
REQUIRED OUTPUT STRUCTURE:
1. **Executive Summary**: Concise overview of findings.
2. **Detailed Analysis Phases**: (As selected below).
3. **Financial Analysis**:
   - Projected ADR, Occupancy, Gross Revenue.
   - Expense Ratio, NOI, Cash-on-Cash Return, Cap Rate.
   - Break-even Occupancy.
4. **Risk & Sensitivity**:
   - Risk Scoring (1-5 Scale for Regulatory, Structural, Market, Financial).
   - Confidence Level (High/Moderate/Low).
   - Sensitivity Analysis (±10% ADR/Occupancy).
   - Exit Strategy Evaluation.
5. **Assumptions & Data Gaps**: Explicitly list tax rates, financing terms, and any missing data.
6. **Verdict & Tables**:
   - Final Investment Grade (Strong Buy / Qualified Buy / Hard Pass).
   - Comparison Tables must be used throughout to contrast findings.
`;

    const PROMPT_DATA = {
        str: {
            label: "Short-Term Rental (STR)",
            role: "Act as a Senior Real Estate Investment Analyst specializing in Short-Term Rentals (STR).",
            objective: 'Perform a "Forensic STR Deep Research Audit" for the attached property data.',
            defaults: ['forensic_search', 'infrastructure', 'regulatory', 'amenity', 'visual', 'financial', 'verdict'],
            sections: {
                forensic_search: {
                    title: "Phase 1: Geographic & Forensic Identification",
                    content: `   - Extract the full address, County, and Township from the data.
   - SEARCH PROTOCOL: Use web research and cite authoritative sources to find: "[County] Tax Assessor [Address]", "[Township] STR Ordinance [Current Year]", and "[County] GIS Property Map".
   - Identify the current owner and check for recent transfers or "Lis Pendens" (distress signals).`
                },
                infrastructure: {
                    title: "Phase 2: Infrastructure Forensics",
                    content: `   - Specifically analyze Sewer vs. Septic. If Septic, verify the legal 'Hard Occupancy Cap' (cite ordinance section) using local township formulas.
   - Search for utility rate hikes in this specific zip code (Electric/Water) over the past 12-24 months.
   - Flag "Construction-Era Risk Checklist": Search for 1970s wiring (Aluminum?), 1980s siding (T1-11?), or pre-1978 lead paint issues in this neighborhood.`
                },
                regulatory: {
                    title: "Phase 3: Regulatory & HOA Audit",
                    content: `   - Verify HOA "Registration/Impact Fees" (Gate Taxes) and STR caps. Check meeting minutes (if publicly accessible).
   - Search for "Township STR Moratorium" or pending registration changes. Check the current fee schedule for licenses.`
                },
                amenity: {
                    title: "Phase 4: Amenity & Market Audit",
                    content: `   - Identify 'Value Drivers' (Central AC, parking) vs. 'Value Drags' (1-bath bottlenecks).
   - Cross-reference AirDNA/Rabbu data with local hotel occupancy trends via web research.`
                },
                visual: {
                    title: "Phase 5: Visual Condition Audit (Photos)",
                    content: `   - Analyze embedded photos for "Renovation Tiers" (Cosmetic vs Value-Add vs Full Gut).
   - Identify "Clutter/Maintenance Issues" or "Deferred Maintenance" visible in photos (roof, siding, cluttered rooms).
   - Estimate CapEx needed for top-tier ADR based on photo evidence using a structured table (Immediate, 1-3 Year, Deferred).`
                },
                financial: {
                    title: "Phase 6: Financial Stress Test",
                    content: `   - Calculate 'Silent Costs' (Snow removal, seasonal landscaping).
   - Verify property tax assessment resets upon sale for this County.`
                },
                verdict: {
                    title: "Phase 7: Forensic Verdict",
                    content: `   - Provide a final "Investment Grade": Strong Buy, Qualified Buy, or Hard Pass.
   - Explicitly list the "Top 3 Hidden Liabilities" found during research.
   - Include comparison tables throughout the conclusion.`
                }
            }
        },
        ltr: {
            label: "Long-Term Rental (LTR)",
            role: "Act as a Residential Portfolio Manager.",
            objective: 'Perform a "Forensic LTR Deep Research Analysis" for the attached assets.',
            defaults: ['forensic_search', 'tenant', 'condition', 'cashflow', 'verdict'],
            sections: {
                forensic_search: {
                    title: "Phase 1: Geographic & Permit Identification",
                    content: `   - Identify County/Township.
   - SEARCH PROTOCOL: Use web research and cite authoritative sources to find "[County] Building Permits [Address]" and "[County] Code Violations".
   - Verify the "Certificate of Occupancy" requirements for LTR in this jurisdiction.`
                },
                tenant: {
                    title: "Phase 2: Tenant Avatar & Demand",
                    content: `   - Verify School District ratings (GreatSchools) and local crime indices.
   - Search for major employers within 10 miles and their current layoff/growth news.`
                },
                condition: {
                    title: "Phase 3: Durability Audit (Photos)",
                    content: `   - Flag high-maintenance features in photos: carpet, old appliances, complex landscaping.
   - Judge "Renovation Tier": Does it need a refresh before listing?`
                },
                cashflow: {
                    title: "Phase 4: Cash Flow Stability",
                    content: `   - Calculate Rent-to-Price ratio.
   - Identify non-recoverable costs (Taxes, HOA) by searching official County tax rates for the current year.`
                },
                verdict: {
                    title: "Phase 5: Verdict",
                    content: `   - Summarize the thesis: Cash Flow, Appreciation, or Capital Preservation?
   - Include comparison tables in the conclusion.`
                }
            }
        },
        multi: {
            label: "Multi-Unit / House Hacking",
            role: "Act as a Commercial Real Estate Analyst.",
            objective: 'Perform a "Multi-Unit Yield & Forensic Audit".',
            defaults: ['forensic_search', 'unitmix', 'visual', 'expense', 'verdict'],
            sections: {
                forensic_search: {
                    title: "Phase 1: Metering & Zoning Verification",
                    content: `   - SEARCH PROTOCOL: Use web research and cite authoritative sources for "[Township] Zoning Map". Verify if the unit count is legally non-conforming or fully permitted.
   - Look for "Master Meter" records or utility billing history for this address.`
                },
                unitmix: {
                    title: "Phase 2: Unit Mix & Utility Split",
                    content: `   - Analyze the configuration. Are Electric/Heat/Water separated?
   - Search for local utility company "Landlord Programs" and cost to separate meters.`
                },
                visual: {
                    title: "Phase 3: Visual CapEx Assessment (Photos)",
                    content: `   - Identify "Renovation Tiers": Are units dated? Can cosmetic updates (cabinets, fixtures) force appreciation?
   - Flag "Deferred Maintenance" signals (Roof age, siding stains).`
                },
                expense: {
                    title: "Phase 4: Expense Ratio Reality Check",
                    content: `   - Search for commercial waste removal costs and multi-unit insurance premiums in this region.`
                },
                verdict: {
                    title: "Phase 5: Verdict",
                    content: `   - Evaluate viability: "Turnkey Yield" vs. "Value-Add Project".
   - Include comparison tables in the conclusion.`
                }
            }
        },
        flip: {
            label: "Fix & Flip / Renovation",
            role: "Act as a Project Manager & Fix-and-Flip Specialist.",
            objective: 'Perform a "Renovation Feasibility & ARV Forensic Report".',
            defaults: ['forensic_search', 'bones', 'scope', 'arv', 'verdict'],
            sections: {
                forensic_search: {
                    title: "Phase 1: Structural & Permit History",
                    content: `   - SEARCH PROTOCOL: Use web research and cite authoritative sources for "[County] Permit History [Address]". Identify if previous renovations were unpermitted.
   - Search for "Soil Stability" or "Flood Zone" issues for this specific street.`
                },
                bones: {
                    title: "Phase 2: The 'Bone Structure' (Forensic)",
                    content: `   - Identify structural red flags: Foundation cracks, water intrusion, mold hints in "As-Is" language.`
                },
                scope: {
                    title: "Phase 3: Renovation Scope Estimation (Photos)",
                    content: `   - Categorize work: Cosmetic vs Heavy vs Gut.
   - Estimate "Rehab Budget" based on visual condition. Does kitchen layout require moving plumbing/gas?`
                },
                arv: {
                    title: "Phase 4: ARV Clues",
                    content: `   - Search for "Sold" comps within 0.5 miles with similar finishes. Compare "Price per SQFT" of renovated vs unrenovated homes.`
                },
                verdict: {
                    title: "Phase 5: Verdict",
                    content: `   - Evaluate project feasibility. Does the spread justify the renovation risk?
   - Include comparison tables in the conclusion.`
                }
            }
        }
    };

    const GLOBAL_SECTIONS = {
        deep_research: {
            title: "Deep Research Verification Protocol",
            content: `   - MANDATORY: Use web research and cite authoritative sources for County Tax Records, Zoning Maps, and Code Violations.
   - Verify school ratings and local crime statistics via current data.
   - Search for recent building permits (last 5 years).`
        },
        renovation: {
            title: "Renovation Estimator",
            content: `   - Estimate rehab costs based on photos. Distinguish between "Cosmetic", "Value-Add", and "Full Gut".`
        },
        neighborhood: {
            title: "Neighborhood Analysis",
            content: `   - Analyze via map data and description. Identify noise sources (highways, trains) and proximity to anchors.`
        }
    };

    function buildPrompt(strategyKey, selectedSections, globalOptions) {
        const strategy = PROMPT_DATA[strategyKey];
        if (!strategy) return "Error: Invalid Strategy";

        let role = strategy.role;
        if (globalOptions.includes('skeptical')) {
            role = role.replace("Act as a", "Act as a highly skeptical, forensic, and risk-averse");
        }

        let prompt = `${role}\n\nMISSION:\n${strategy.objective}\n\n${STANDARD_OUTPUTS}\n\n`;

        prompt += `SOURCE HIERARCHY:\n1. Official County/Township Government Records (Assessor, GIS, Permits)\n2. Official Regulatory Codes (Zoning, STR Ordinances)\n3. Primary Market Data (AirDNA, Comps)\n4. Property Listing Description (Least Trusted)\n\n`;

        let sectionIndex = 1;
        const allSections = [];

        Object.keys(strategy.sections).forEach(key => {
            if (selectedSections.includes(key)) {
                allSections.push({ ...strategy.sections[key], id: key });
            }
        });

        Object.keys(GLOBAL_SECTIONS).forEach(key => {
            if (selectedSections.includes(key)) {
                allSections.push({ ...GLOBAL_SECTIONS[key], id: key });
            }
        });

        allSections.forEach(section => {
            prompt += `${sectionIndex}. ${section.title}:\n${section.content}\n\n`;
            sectionIndex++;
        });

        prompt += `*** IF MULTIPLE FILES ARE UPLOADED: ***\n- Produce a "Forensic Comparative Matrix" ranking properties by: [Price, Risk Score, Yield Potential, Renovation Intensity].\n\nPROPERTY DATA FOR ANALYSIS:\n[ATTACHED BELOW]`;

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
        
        /* 1. Extract JSON-based metadata first */
        const rawJSON = extractHiddenData();
        scrapeMetadata(rawJSON);

        /* 2. Get cleaned body */
        const content = getCleanPageContent();
        
        /* 3. Get images */
        updateStatus("Embedding photos (0/20)...", "loading");
        const photoGallery = await extractAndEmbedGallery();
        
        extractedContent = content + photoGallery + rawJSON;

        isExtracting = false;
        updateStatus("Ready for download.", "success");
        enableDownload();
    }

    function scrapeMetadata(jsonHtml) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(jsonHtml, 'text/html');
            const pre = doc.querySelector('pre');
            if (!pre) return;
            const data = JSON.parse(pre.innerText);

            // Attempt to find Realtor.com specific structures
            data.forEach(item => {
                if (item.props && item.props.pageProps && item.props.pageProps.propertyData) {
                    const p = item.props.pageProps.propertyData;
                    propertyMetadata.address = p.location?.address?.line + ", " + p.location?.address?.city;
                    propertyMetadata.price = "$" + (p.list_price || p.price);
                    propertyMetadata.specs = `${p.description?.beds}bd, ${p.description?.baths}ba, ${p.description?.sqft}sqft`;
                    propertyMetadata.yearBuilt = p.description?.year_built;
                    propertyMetadata.description = p.description?.text;
                }
            });
        } catch(e) {}
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
        Object.keys(PROMPT_DATA).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = PROMPT_DATA[k].label;
            select.appendChild(opt);
        });
        step1.appendChild(select);

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

        const globalOpts = [
            { id: 'deep_research', label: 'Deep Research Protocol' },
            { id: 'renovation', label: 'Renovation Estimator' },
            { id: 'neighborhood', label: 'Neighborhood Analysis' },
            { id: 'skeptical', label: 'Forensic Skepticism', type: 'option' }
        ];

        globalOpts.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'pc-checkbox-item';
            div.innerHTML = `
                <input type="checkbox" id="pc-opt-${opt.id}" value="${opt.id}" data-type="${opt.type || 'section'}" checked>
                <label for="pc-opt-${opt.id}">${opt.label}</label>
            `;
            globalList.appendChild(div);
        });

        optionsContainer.appendChild(sectionsGroup);
        optionsContainer.appendChild(globalGroup);

        const step2 = document.createElement('div');
        step2.className = 'pc-step';
        step2.style.flexGrow = '1';
        step2.style.display = 'flex';
        step2.style.flexDirection = 'column';
        step2.innerHTML = `<label>Generated Prompt (Editable)</label>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'pc-textarea';
        
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

        function refreshPrompt() {
            const strat = select.value;
            const selectedSections = [];
            const globalOptions = [];
            sectionsList.querySelectorAll('input:checked').forEach(cb => selectedSections.push(cb.value));
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
                    <label for="pc-sec-${k}" title="${s.title}">${s.title.split(':')[1]?.trim() || s.title}</label>
                `;
                sectionsList.appendChild(div);
            });
            sectionsList.querySelectorAll('input').forEach(i => i.onchange = refreshPrompt);
            refreshPrompt();
        }

        select.onchange = renderStrategySections;
        globalList.querySelectorAll('input').forEach(i => i.onchange = refreshPrompt);
        renderStrategySections();

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
        body.appendChild(optionsContainer);
        body.appendChild(step2);
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
            #${CONFIG.overlayId} { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #${CONFIG.modalId} { background: white; width: 900px; height: 80vh; max-height: 800px; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            .pc-header { padding: 16px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; font-size: 16px; color: #111827; }
            .pc-body { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: #f9fafb; overflow-y: auto; }
            .pc-step label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
            .pc-select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; color: #1f2937; }
            .pc-textarea { width: 100%; flex-grow: 1; min-height: 400px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 12px; resize: none; color: #374151; line-height: 1.5; }
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
        const rawAddr = propertyMetadata.address || document.title || 'Property';
        const cleanAddr = BookmarkletUtils.sanitizeFilename(rawAddr.split(',')[0]);
        const filename = `${cleanAddr}_${Date.now()}.html`;
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
                .gallery-item img { width: 100%; height: 220px; object-fit: cover; display: block; }
                .gallery-caption { padding: 10px; font-size: 12px; color: #666; background: #f9f9f9; min-height: 40px; }
                .content-section { margin-top: 40px; }
                h2 { border-left: 4px solid #3b82f6; padding-left: 15px; text-transform: uppercase; font-size: 18px; }
                .raw-data-details { margin-top: 50px; opacity: 0.6; }
                @media print { .gallery-item { break-inside: avoid; } }
            </style>
        `;

        const headerHtml = `
            <div class="forensic-header">
                <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #3b82f6;">Forensic Asset Export</div>
                <h1>${propertyMetadata.address || 'Property Snapshot'}</h1>
                <div class="core-facts">
                    <div class="fact-item"><div class="fact-label">List Price</div><div>${propertyMetadata.price || 'N/A'}</div></div>
                    <div class="fact-item"><div class="fact-label">Specs</div><div>${propertyMetadata.specs || 'N/A'}</div></div>
                    <div class="fact-item"><div class="fact-label">Year Built</div><div>${propertyMetadata.yearBuilt || 'N/A'}</div></div>
                    <div class="fact-item"><div class="fact-label">Export Date</div><div>${new Date().toLocaleString()}</div></div>
                </div>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #444;">
                    <div class="fact-label">Marketing Summary</div>
                    <p style="font-size: 14px; color: #ccc;">${propertyMetadata.description || 'No description extracted.'}</p>
                </div>
            </div>
        `;

        const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${cleanAddr}</title><base href="${window.location.origin}">${customStyle}</head><body>${headerHtml}${extractedContent}</body></html>`;
        BookmarkletUtils.downloadFile(filename, fullHTML);
    }

    async function expandDetails() {
        const mainSelectors = ['#app-content', '.main-content', '#details-page-container', '[role="main"]'];
        let searchScope = document.body;
        for (const sel of mainSelectors) {
            const el = document.querySelector(sel);
            if (el) { searchScope = el; break; }
        }
        const targets = ['[data-testid="hero-view-more"]', '[data-testid="accordion-header"][aria-expanded="false"]', '#load-more-features', 'button[class*="show-more"]', '.BottomLink', 'button.clickable'];
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

    async function extractAndEmbedGallery() {
        const photoData = [];
        const MAX_IMAGES = 20;
        const TARGET_WIDTH = 1000;

        const n = document.getElementById('__NEXT_DATA__');
        if(n) {
            try {
                const data = JSON.parse(n.innerText);
                // Attempt to find realtor.com photos with captions
                const photos = data.props?.pageProps?.propertyData?.photos || [];
                photos.forEach(p => {
                    const url = p.href || p.url;
                    if (url) {
                        photoData.push({
                            url: url.replace('s.jpg', 'od.jpg').replace('m.jpg', 'od.jpg'),
                            caption: p.title || p.caption || ''
                        });
                    }
                });
            } catch(e){}
        }

        // Fallback to DOM if JSON failed
        if (photoData.length === 0) {
            document.querySelectorAll('img').forEach(img => {
                let src = img.src || img.dataset.src || img.getAttribute('srcset');
                if (src && (src.includes('rdcpix') || src.includes('zillowstatic')) && !src.includes('profile')) {
                    if(src.indexOf(' ') > -1) src = src.split(' ')[0];
                    photoData.push({ url: src, caption: img.alt || '' });
                }
            });
        }

        if (photoData.length === 0) return '';

        const imagesArray = photoData.slice(0, MAX_IMAGES);
        let html = '<section class="content-section" id="property-gallery">';
        html += '<h2>Visual Evidence (Embedded Photos)</h2>';
        html += '<p><em>Analyze for "Hoarding Clutter", "Contractor Grade Flips", and "Deferred Maintenance" (roof/mold/clutter).</em></p>';
        html += '<div class="gallery-grid">';
        
        for (let i = 0; i < imagesArray.length; i++) {
            updateStatus(`Embedding photo ${i + 1}/${imagesArray.length}...`, "loading");
            const item = imagesArray[i];
            try {
                const base64 = await toBase64(item.url, TARGET_WIDTH);
                if (base64) {
                    html += `
                        <div class="gallery-item">
                            <img src="${base64}" alt="Property Photo ${i}">
                            <div class="gallery-caption">${item.caption || `Photo ${i+1}`}</div>
                        </div>`;
                } else {
                    html += `
                        <div class="gallery-item">
                            <img src="${item.url}" alt="Property Photo ${i} (Linked)">
                            <div class="gallery-caption">${item.caption || `Photo ${i+1} (External Link)`}</div>
                        </div>`;
                }
            } catch (e) {
                html += `
                    <div class="gallery-item">
                        <img src="${item.url}" alt="Property Photo ${i} (Linked)">
                        <div class="gallery-caption">${item.caption || `Photo ${i+1} (External Link)`}</div>
                    </div>`;
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
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                } catch (e) { resolve(null); }
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
        BookmarkletUtils.normalizeImages(c);
        BookmarkletUtils.inlineStyles(t, c);

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

        BookmarkletUtils.sanitizeAttributes(c);

        c.querySelectorAll('*').forEach(function(el) {
            el.removeAttribute('class');
            el.removeAttribute('style');
            el.removeAttribute('data-testid');
        });

        c.querySelectorAll('li').forEach(function(li) {
            if (!li.innerText.trim() && li.children.length === 0) { li.remove(); }
        });
        c.querySelectorAll('ul, ol').forEach(function(list) {
            if (list.children.length === 0) { list.remove(); }
        });

        return `<div class="content-section"><h2>Full Listing Details</h2>${c.outerHTML}</div>`;
    }

    init();
})();