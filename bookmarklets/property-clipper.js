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
    const STANDARD_OUTPUTS = `
EXPECTED DELIVERABLES (Structure your report organically based on your findings):
- **Executive Summary & Verdict**: Provide your final Investment Grade (Strong Buy / Qualified Buy / Hard Pass) with a clear Risk vs. Reward profile.
- **Hidden Insights & Red Flags**: Focus heavily on off-page data (regulations, true costs, environmental/structural risks, macro trends).
- **Financial Reality Check**: Project true cash flow, factoring in silent costs, CapEx, and local market trends.
- **Visual & Condition Audit**: Analyze the embedded photo gallery for renovation tiers and deferred maintenance.
- **Comparison Tables**: If multiple properties are provided, use tables to contrast their metrics, risks, and neighborhood qualities.
`;

    const PROMPT_DATA = {
        str: {
            label: "Short-Term Rental (STR)",
            role: "Act as a Senior Real Estate Investment Analyst specializing in Short-Term Rentals (STR).",
            objective: 'Conduct a Deep Research audit of this STR investment opportunity.',
            defaults: ['forensic_search', 'infrastructure', 'regulatory', 'amenity', 'visual', 'financial'],
            sections: {
                forensic_search: {
                    title: "Geographic & Forensic Identification",
                    content: `   - Extract the full address, County, and Township.
   - Use web research to locate the specific County Tax Assessor data, current Township STR Ordinances, and GIS Property Maps. 
   - Look for distressed signals or recent transfers.`
                },
                infrastructure: {
                    title: "Infrastructure Forensics",
                    content: `   - Investigate Sewer vs. Septic constraints. If Septic, verify the legal 'Hard Occupancy Cap' using local township formulas.
   - Research utility rate hikes in this specific zip code over the past 12-24 months.
   - Flag "Vintage Risks": e.g., 1970s wiring, 1980s siding, or pre-1978 lead paint issues common in this neighborhood.`
                },
                regulatory: {
                    title: "Regulatory & HOA Audit",
                    content: `   - Uncover HOA "Registration/Impact Fees" (Gate Taxes) and STR caps.
   - Search for "Township STR Moratoriums" or pending registration changes. What is the current fee schedule for licenses?`
                },
                amenity: {
                    title: "Amenity & Market Audit",
                    content: `   - Identify 'Value Drivers' (e.g., Central AC, parking) vs. 'Value Drags'.
   - Cross-reference market data (AirDNA/Rabbu/KeyData) with local hotel occupancy trends via web research.`
                },
                visual: {
                    title: "Visual Condition Audit (Photos)",
                    content: `   - Analyze embedded photos to determine the "Renovation Tier" (Cosmetic vs Value-Add vs Full Gut).
   - Identify "Clutter/Maintenance Issues" or "Deferred Maintenance" visible in photos (roof, siding, water damage).
   - Estimate CapEx needed for top-tier ADR.`
                },
                financial: {
                    title: "Financial Stress Test",
                    content: `   - Calculate 'Silent Costs' (Snow removal, seasonal landscaping).
   - Verify if property tax assessments reset upon sale for this specific County.`
                }
            }
        },
        ltr: {
            label: "Long-Term Rental (LTR)",
            role: "Act as a Residential Portfolio Manager.",
            objective: 'Conduct a Deep Research analysis of this LTR asset.',
            defaults: ['forensic_search', 'tenant', 'condition', 'cashflow'],
            sections: {
                forensic_search: {
                    title: "Geographic & Permit Identification",
                    content: `   - Identify the County and Township.
   - Use web research to find "[County] Building Permits" and "[County] Code Violations" for this address.
   - Verify the "Certificate of Occupancy" requirements for LTR in this jurisdiction.`
                },
                tenant: {
                    title: "Tenant Avatar & Demand",
                    content: `   - Verify School District ratings (GreatSchools) and local crime indices.
   - Search for major employers within 10 miles and their current macro-economic trends (layoffs/growth).`
                },
                condition: {
                    title: "Durability Audit (Photos)",
                    content: `   - Flag high-maintenance features in the photos: carpet, old appliances, complex landscaping.
   - Judge the "Renovation Tier": Does it need a refresh before listing to attract premium tenants?`
                },
                cashflow: {
                    title: "Cash Flow Stability",
                    content: `   - Calculate the Rent-to-Price ratio against current local market rents.
   - Identify non-recoverable costs (Taxes, HOA) by searching official County tax rates for the current year.`
                }
            }
        },
        multi: {
            label: "Multi-Unit / House Hacking",
            role: "Act as a Commercial Real Estate Analyst.",
            objective: 'Conduct a Multi-Unit Yield & Forensic Audit.',
            defaults: ['forensic_search', 'unitmix', 'visual', 'expense'],
            sections: {
                forensic_search: {
                    title: "Metering & Zoning Verification",
                    content: `   - Use web research to locate the "[Township] Zoning Map". Verify if the unit count is legally non-conforming or fully permitted.
   - Look for "Master Meter" records or utility billing history for this address.`
                },
                unitmix: {
                    title: "Unit Mix & Utility Split",
                    content: `   - Analyze the configuration. Are Electric/Heat/Water separated?
   - Search for local utility company "Landlord Programs" and the estimated cost to separate meters if master-metered.`
                },
                visual: {
                    title: "Visual CapEx Assessment (Photos)",
                    content: `   - Identify "Loss to Lease" potential: Are units dated? Can cosmetic updates force appreciation?
   - Flag "Deferred Maintenance" signals (Roof age, siding stains, foundation cracks).`
                },
                expense: {
                    title: "Expense Ratio Reality Check",
                    content: `   - Search for commercial waste removal costs and multi-unit insurance premiums in this specific region to build a realistic expense ratio.`
                }
            }
        },
        flip: {
            label: "Fix & Flip / Renovation",
            role: "Act as a Project Manager & Fix-and-Flip Specialist.",
            objective: 'Conduct a Renovation Feasibility & ARV Forensic Report.',
            defaults: ['forensic_search', 'bones', 'scope', 'arv'],
            sections: {
                forensic_search: {
                    title: "Structural & Permit History",
                    content: `   - Use web research to find the "[County] Permit History" for this address. Identify if previous renovations were unpermitted.
   - Search for "Soil Stability" or "Flood Zone" issues for this specific street/county.`
                },
                bones: {
                    title: "The 'Bone Structure' (Forensic)",
                    content: `   - Identify structural red flags: Foundation cracks, water intrusion, or mold hints in the "As-Is" language.`
                },
                scope: {
                    title: "Renovation Scope Estimation (Photos)",
                    content: `   - Categorize work: Cosmetic vs Heavy vs Gut.
   - Estimate the "Rehab Budget" based on visual condition. Does the kitchen layout require moving plumbing/gas?`
                },
                arv: {
                    title: "ARV (After Repair Value) Clues",
                    content: `   - Search for recent "Sold" comps within 0.5 miles with similar finishes. 
   - Determine if the neighborhood, street, or layout (e.g., 1.5 baths, ceiling height) places a permanent cap on resale value.`
                }
            }
        }
    };

    const GLOBAL_SECTIONS = {
        deep_research: {
            title: "Advanced Verification Protocol",
            content: `   - MANDATORY: Use web research and cite authoritative sources for your findings (County Tax Records, Zoning Maps, Code Violations).
   - Cross-reference listing claims with actual public data.`
        },
        renovation: {
            title: "Detailed Renovation Estimator",
            content: `   - Provide a line-item estimate of rehab costs based on the embedded photos.`
        },
        neighborhood: {
            title: "Micro-Neighborhood Analysis",
            content: `   - Analyze the exact street via map data research. Identify noise sources (highways, trains) and proximity to anchors/amenities.`
        }
    };

    /**
     * Constructs a specialized investment analysis prompt for LLMs based on user selection.
     *
     * @param {string} strategyKey - The investment strategy key (e.g., 'str', 'flip').
     * @param {string[]} selectedSections - Array of section IDs to include in the prompt.
     * @param {string[]} globalOptions - Array of global option IDs (e.g., 'skeptical').
     * @returns {string} The fully constructed prompt string ready for clipboard copy.
     */
    function buildPrompt(strategyKey, selectedSections, globalOptions) {
        const strategy = PROMPT_DATA[strategyKey];
        if (!strategy) return "Error: Invalid Strategy";

        let role = strategy.role;
        if (globalOptions.includes('skeptical')) {
            role = role.replace("Act as a", "Act as a highly skeptical, forensic, and risk-averse");
        }

        let prompt = `${role}\n\nMISSION:\n${strategy.objective}\n\n`;
        
        prompt += `DEEP RESEARCH MANDATE:\nDo NOT restrict yourself to a narrow checklist or tunnel-vision solely on the provided text. Use your deep research capabilities to uncover market trends, hidden risks, local regulations, neighborhood dynamics, and any other factors that are not immediately obvious from the listing itself. Give me your best professional advice and highlight what I might be missing.\n\n`;
        
        prompt += `SOURCE HIERARCHY:\n1. Official County/Township Government Records (Assessor, GIS, Permits)\n2. Official Regulatory Codes (Zoning, STR Ordinances)\n3. Primary Market Data (AirDNA, Comps)\n4. Property Listing Description (Least Trusted)\n\n`;

        prompt += `AREAS OF INVESTIGATION (Use these as research vectors, not a rigid format):\n`;

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
            prompt += `- **${section.title}**:\n${section.content}\n\n`;
        });

        prompt += `${STANDARD_OUTPUTS}\n\n`;
        prompt += `PROPERTY DATA FOR ANALYSIS:\n[ATTACHED BELOW]`;

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
        
        const rawJSON = extractHiddenData();
        scrapeMetadata(rawJSON);
        scrapeMetadataFromDOM();

        const content = getCleanPageContent();
        
        updateStatus("Embedding photos (0/24)...", "loading");
        const photoGallery = await extractAndEmbedGallery();
        
        extractedContent = extractSnapshotData() + content + photoGallery + rawJSON;

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

    function scrapeMetadataFromDOM() {
        try {
            const priceEl = document.querySelector('[data-testid="ldp-list-price"]');
            if (priceEl) propertyMetadata.price = priceEl.innerText.replace(/\n/g, ' ').trim();

            const addressBtn = document.querySelector('[data-testid="address-line-ldp"] h1 button, [data-testid="address-line-ldp"] h1');
            if (addressBtn) propertyMetadata.address = addressBtn.innerText.trim();

            const beds = document.querySelector('[data-testid="property-meta-beds"]')?.innerText.replace(/\n/g, ' ') || '';
            const baths = document.querySelector('[data-testid="property-meta-baths"]')?.innerText.replace(/\n/g, ' ') || '';
            const sqft = document.querySelector('[data-testid="property-meta-sqft"]')?.innerText.replace(/\n/g, ' ') || '';
            const specsStr = [beds, baths, sqft].filter(Boolean).join(' | ');
            if (specsStr) propertyMetadata.specs = specsStr;

            const descEl = document.querySelector('[data-testid="romance-paragraph"]');
            if (descEl) propertyMetadata.description = descEl.innerText.replace('Show more', '').trim();

            const keyFacts = document.querySelectorAll('[data-testid="key-facts"] li');
            keyFacts.forEach(li => {
                const text = li.innerText.toLowerCase();
                if (text.includes('built in') || text.includes('year built')) {
                    propertyMetadata.yearBuilt = li.innerText.replace(/\n/g, ' ').trim();
                }
            });
        } catch (e) {
            console.error('DOM metadata extraction failed', e);
        }
    }

    function extractSnapshotData() {
        try {
            return `
            <div class="forensic-header">
                <h1>Property Snapshot</h1>
                <div class="core-facts">
                    <div class="fact-item">
                        <div class="fact-label">Address</div>
                        <div style="font-size: 16px;">${propertyMetadata.address || 'N/A'}</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-label">Price</div>
                        <div style="font-size: 18px; font-weight: bold; color: #10b981;">${propertyMetadata.price || 'N/A'}</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-label">Specs</div>
                        <div style="font-size: 16px;">${propertyMetadata.specs || 'N/A'}</div>
                    </div>
                    <div class="fact-item">
                        <div class="fact-label">Age & History</div>
                        <div style="font-size: 16px;">${propertyMetadata.yearBuilt || 'N/A'}</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <div class="fact-label" style="margin-bottom: 5px;">Description</div>
                    <div style="font-size: 14px; line-height: 1.6; color: #ccc;">${propertyMetadata.description || 'N/A'}</div>
                </div>
            </div>
            `;
        } catch (e) {
            return '<div style="color:red;">Failed to extract snapshot headers</div>';
        }
    }

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
        sectionsGroup.innerHTML = `<legend>Research Vectors</legend>`;
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
        step2.className = 'pc-step-flex';
        step2.innerHTML = `<label>Generated Prompt (Editable)</label>`;

        const textarea = document.createElement('textarea');
        textarea.className = 'pc-textarea';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'pc-btn secondary';
        copyBtn.textContent = "Copy Prompt to Clipboard";
        copyBtn.style.marginTop = "8px";
        copyBtn.style.flexShrink = "0";
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
            #${CONFIG.modalId} { background: white; width: 90%; max-width: 900px; height: 85vh; max-height: 800px; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
            .pc-header { padding: 16px 20px; background: #fff; border-bottom: 1px solid #e5e7eb; font-size: 16px; color: #111827; flex-shrink: 0; }
            .pc-body { flex-grow: 1; padding: 20px; display: flex; flex-direction: column; gap: 15px; background: #f9fafb; overflow: hidden; }
            .pc-step-fixed { display: flex; flex-direction: column; flex-shrink: 0; }
            .pc-step-flex { display: flex; flex-direction: column; flex-grow: 1; overflow: hidden; }
            .pc-step-fixed label, .pc-step-flex label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
            .pc-select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; color: #1f2937; flex-shrink: 0; }
            .pc-options-container { display: flex; gap: 15px; flex-shrink: 0; }
            .pc-fieldset { flex: 1; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: white; }
            .pc-fieldset legend { font-size: 11px; font-weight: bold; color: #6b7280; padding: 0 4px; text-transform: uppercase; }
            .pc-checkbox-grid { display: flex; flex-direction: column; gap: 6px; max-height: 120px; overflow-y: auto; }
            .pc-checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
            .pc-checkbox-item input { margin: 0; cursor: pointer; }
            .pc-checkbox-item label { margin: 0; cursor: pointer; text-transform: none; font-weight: 400; }
            .pc-textarea { width: 100%; flex-grow: 1; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 12px; resize: none; color: #374151; line-height: 1.5; overflow-y: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
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

    /**
     * Scans the page for high-resolution property photos using regex and DOM traversal.
     * Prioritizes finding full-size images hidden in NEXT_DATA JSON blobs or Zillow/Realtor static URLs.
     * Embeds the top 24 images as Base64 to ensure the LLM can "see" the property condition.
     *
     * @returns {Promise<string>} HTML string containing the gallery section.
     */
    async function extractAndEmbedGallery() {
        const uniqueUrls = new Set();
        const photoData = [];
        const MAX_IMAGES = 24;
        const TARGET_WIDTH = 800; // Optimal size for embedding 24 images

        // 1. Regex search the entire NEXT_DATA blob for any hidden rdcpix/zillow URLs
        const n = document.getElementById('__NEXT_DATA__');
        if(n) {
            try {
                const txt = n.innerText;
                const matches = txt.match(/https:\/\/[^"'\\]+(jpg|jpeg|png|webp)/gi) || [];
                matches.forEach(url => {
                    let cleanUrl = url.replace(/\\u002F/g, '/');
                    if (cleanUrl.includes('rdcpix.com') && !cleanUrl.includes('profile')) {
                        // Extract base URL to deduplicate and force high-res suffix
                        let base = cleanUrl.split('-w')[0];
                        if (base) {
                            uniqueUrls.add(base + '-w1024_h768.jpg'); // Force high-res standard
                        }
                    } else if (cleanUrl.includes('zillowstatic.com') && !cleanUrl.includes('profile')) {
                        uniqueUrls.add(cleanUrl);
                    }
                });
            } catch(e){}
        }

        // 2. Fallback to DOM images
        document.querySelectorAll('img').forEach(img => {
            let src = img.src || img.dataset.src || img.getAttribute('srcset');
            if (src && (src.includes('rdcpix') || src.includes('zillowstatic')) && !src.includes('profile')) {
                if(src.indexOf(' ') > -1) src = src.split(' ')[0];
                let base = src.split('-w')[0];
                if (base && src.includes('rdcpix')) {
                    uniqueUrls.add(base + '-w1024_h768.jpg');
                } else {
                    uniqueUrls.add(src);
                }
            }
        });

        uniqueUrls.forEach(url => photoData.push({ url: url, caption: '' }));

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
                        </div>`;
                } else {
                    html += `
                        <div class="gallery-item">
                            <img src="${item.url}" alt="Property Photo ${i} (Linked)">
                        </div>`;
                }
            } catch (e) {
                html += `
                    <div class="gallery-item">
                        <img src="${item.url}" alt="Property Photo ${i} (Linked)">
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

        /* SCORCHED EARTH DOM CLEANUP FOR LLM OPTIMIZATION */
        const junk = [
            'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input', 'textarea', 'form',
            'nav', 'footer', 'header', 'aside',
            '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]', '[role="dialog"]', '[role="search"]',
            '[id*="ad-"]', '[class*="ad-"]', '[class*="advert"]', '[id*="cookie"]',
            '.modal', '.popup', '.drawer', '.lightbox',
            /* Map Killers */
            '[data-testid*="map"]', '[id*="map"]', '.map-container', '.neighborhood-class-loader',
            'img[alt*="map"]', 'img[src*="maps.googleapis.com"]',
            /* Search & Headers */
            '[data-testid="fixed-header"]', '[data-testid="ldp-header"]', '[data-testid="search-wrapper"]',
            '[class*="SearchBox"]', '[class*="ActionBar"]',
            /* Marketing & Form Killers */
            '[data-testid="ldp-monthly-payment-and-lender"]', /* Mortgage Calculators */
            '[data-testid="full-screen-leadform"]', '[data-leadform="full-screen"]', /* Contact Forms */
            '[data-testid="ldp-verteran-benefit"]', '.action-card-body', /* Loan Ads */
            '[data-testid="OpenHouses"]', '[data-testid="ldp-property-details-cta"]',
            '[data-testid="ldp-summarybutton"]', '[data-testid="bottom-right-overlay-component"]',
            '[data-testid="hero-ad-slide"]', '[data-testid="popular-search-fallback"]'
        ];
        junk.forEach(function(k) { c.querySelectorAll(k).forEach(function(e) { e.remove(); }); });

        BookmarkletUtils.sanitizeAttributes(c);

        c.querySelectorAll('*').forEach(function(el) {
            el.removeAttribute('class');
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
