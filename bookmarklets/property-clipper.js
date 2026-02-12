(function () {
    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'pc-bookmarklet-modal',
        overlayId: 'pc-bookmarklet-overlay',
        filenamePrefix: 'Property_Report'
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
            objective: 'Conduct a Deep Research audit of this STR target. Analyze macro/micro location data, saturation, regulatory environment, and revenue potential. Output a highly structured, data-dense report. Identify constraints that a novice investor would miss.'
        },
        ltr: {
            label: "Long-Term Rental (LTR)",
            role: "Act as a Senior Real Estate Investment Analyst specializing in Long-Term Buy-and-Hold Rentals.",
            objective: 'Conduct a Deep Research audit of this LTR target. Analyze population growth, tenant demographics, local economic drivers, and long-term appreciation vs. cash flow balance. Output a highly structured, data-dense report.'
        },
        flip: {
            label: "Fix & Flip",
            role: "Act as a Senior Real Estate Investment Analyst and Project Manager specializing in Fix-and-Flip properties.",
            objective: 'Conduct a Deep Research audit of this flip target. Estimate After Repair Value (ARV) based on comparable data, estimate CapEx for necessary rehab (based on visual/condition analysis), and identify deal-breaking structural or permitting risks.'
        },
        househack: {
            label: "House Hacking",
            role: "Act as a Senior Real Estate Investment Analyst specializing in House Hacking and Multi-Family Owner-Occupied strategies.",
            objective: 'Conduct a Deep Research audit of this property. Analyze its layout for unit-splitting or ADU potential, estimate offset rental income against the primary mortgage, and review zoning compliance.'
        }
    };

    /* UTILITIES */
    const escapeHTML = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, match => {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match];
        });
    };

    const buildElement = (tag, styles = {}, text = '', parent = null) => {
        const el = document.createElement(tag);
        if (text) el.innerText = text;
        Object.assign(el.style, styles);
        if (parent) parent.appendChild(el);
        return el;
    };

    const formatCurrency = (val) => (val != null) ? '$' + Number(val).toLocaleString() : 'N/A';

    const getDOMText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : '';
    };

    /* CORE EXTRACTOR - Builds Custom Data Object */
    const PropertyExtractor = {
        getData: function() {
            let data = {
                address: 'Unknown Address', price: 'Unknown Price', specs: {},
                financials: {}, history: {}, agents: [], description: '', features: [], photos: []
            };

            // 1. EXTRACT FROM HIDDEN JSON STATE (Most Reliable)
            try {
                (() => {
                    const nextDataNode = document.getElementById('__NEXT_DATA__');
                    if (!nextDataNode) return;
                    
                    const jsonData = JSON.parse(nextDataNode.innerText);
                    const pd = jsonData?.props?.pageProps?.initialReduxState?.propertyDetails;
                    if (!pd) return;

                    // Core Details
                    const loc = pd.location?.address;
                    if (loc) {
                        data.address = `${loc.line || ''}, ${loc.city || ''}, ${loc.state_code || ''} ${loc.postal_code || ''}`.replace(/^, | ,/g, '').trim();
                    }
                    if (pd.list_price) data.price = formatCurrency(pd.list_price);
                    
                    // Specs & Description
                    const desc = pd.description || {};
                    data.description = desc.text || '';
                    if (desc.type) data.specs['Property Type'] = desc.type.replace('_', ' ');
                    if (desc.beds) data.specs['Beds'] = desc.beds;
                    if (desc.baths_consolidated) data.specs['Baths'] = desc.baths_consolidated;
                    if (desc.sqft) data.specs['Sq. Ft.'] = desc.sqft.toLocaleString();
                    if (desc.lot_sqft) data.specs['Lot Size'] = (desc.lot_sqft / 43560).toFixed(2) + ' Acres';
                    if (desc.year_built) data.specs['Year Built'] = desc.year_built;

                    // Financials
                    if (pd.mortgage?.estimate) {
                        const est = pd.mortgage.estimate;
                        data.financials['Est. Monthly Payment'] = formatCurrency(est.monthly_payment);
                        if (est.monthly_payment_details) {
                            est.monthly_payment_details.forEach(detail => {
                                data.financials[detail.display_name] = formatCurrency(detail.amount);
                            });
                        }
                    }

                    // History
                    if (pd.list_date) {
                        const parsedDate = new Date(pd.list_date);
                        if (!isNaN(parsedDate)) {
                            data.history['List Date'] = parsedDate.toLocaleDateString();
                        }
                    }
                    if (pd.last_sold_date) data.history['Last Sold Date'] = pd.last_sold_date;
                    if (pd.last_sold_price) data.history['Last Sold Price'] = formatCurrency(pd.last_sold_price);

                    // Agents & Advertisers
                    if (pd.advertisers && Array.isArray(pd.advertisers)) {
                        pd.advertisers.forEach(adv => {
                            if (adv.name) {
                                let agentStr = `${adv.type || 'Agent'}: ${adv.name}`;
                                if (adv.broker?.name) agentStr += ` (${adv.broker.name})`;
                                else if (adv.office?.name) agentStr += ` (${adv.office.name})`;
                                data.agents.push(agentStr);
                            }
                        });
                    }

                    // Granular Features & High-Res Photos
                    if (pd.details && Array.isArray(pd.details)) data.features = pd.details;
                    if (pd.photos) data.photos = pd.photos.map(p => p.href);
                })();
            } catch (e) {
                console.warn('Hidden JSON extraction partially failed', e);
            }

            // 2. EXTRACT & ENRICH FROM DOM (Fallback & Catch-All)
            if (data.address === 'Unknown Address') {
                data.address = getDOMText('h1') || data.address;
            }
            if (data.price === 'Unknown Price') {
                data.price = getDOMText('[data-testid="ldp-list-price"]') || data.price;
            }
            if (!data.description || data.description.length < 20) {
                data.description = getDOMText('[data-testid="property-description"]') || getDOMText('#ldp-detail-romance') || data.description;
            }

            document.querySelectorAll('[data-testid="key-facts"] li, .key-fact-item').forEach(li => {
                const textParts = li.innerText.split('\n').map(t => t.trim()).filter(t => t);
                if (textParts.length >= 2) {
                    let label = textParts[0].replace(/:$/, '');
                    let val = textParts.slice(1).join(' ');
                    if (!data.specs[label] && !data.financials[label] && !data.history[label]) {
                        data.specs[label] = val;
                    }
                }
            });

            // 3. CLEANUP & NORMALIZE PHOTOS
            let rawPhotos = data.photos.length > 0 ? data.photos : Array.from(document.querySelectorAll('img[src*="rdcpix.com"]')).map(img => img.src);
            data.photos = [...new Set(rawPhotos)].map(url => {
                if (typeof url !== 'string') return url;
                let upscaled = url;
                if (upscaled.endsWith('s.jpg')) upscaled = upscaled.replace('s.jpg', 'rd-w1280_h960.webp'); 
                upscaled = upscaled.replace(/-w\d+_h\d+/g, '-w1280_h960');
                return upscaled;
            }).filter(url => typeof url === 'string' && url.trim() !== '');

            return data;
        },

        buildHTMLTemplate: function(data, promptText, promptLabel) {
            const renderGrid = (obj) => {
                if (Object.keys(obj).length === 0) return '<p>No data available.</p>';
                return Object.entries(obj).map(([key, val]) => `
                    <div class="metric-box">
                        <div class="metric-label">${escapeHTML(key)}</div>
                        <div class="metric-value">${escapeHTML(val)}</div>
                    </div>
                `).join('');
            };

            const featuresHTML = data.features.map(f => `
                <div class="feature-category">
                    <h3>${escapeHTML(f.category || 'Features')}</h3>
                    <ul>${(f.text || []).map(t => `<li>${escapeHTML(t)}</li>`).join('')}</ul>
                </div>
            `).join('');

            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${escapeHTML(data.address)} - Property Report</title>
    <style>
        :root { --primary: #2563eb; --gray-100: #f3f4f6; --gray-200: #e5e7eb; --gray-800: #1f2937; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fafafa; }
        .report-container { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        
        .system-prompt { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; font-family: monospace; white-space: pre-wrap; font-size: 14px; border-left: 4px solid #3b82f6; }
        .prompt-label { font-weight: bold; color: #60a5fa; margin-bottom: 10px; display: block; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .header { border-bottom: 2px solid var(--gray-100); padding-bottom: 20px; margin-bottom: 30px; }
        h1 { margin: 0; color: var(--gray-800); font-size: 28px; }
        .price { font-size: 32px; font-weight: bold; color: var(--primary); margin: 10px 0; }
        
        h2 { color: var(--gray-800); margin-top: 40px; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 20px; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .metric-box { background: var(--gray-100); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--gray-200); }
        .metric-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; letter-spacing: 0.05em; }
        .metric-value { font-size: 16px; font-weight: 500; color: var(--gray-800); margin-top: 4px; }
        
        .description { font-size: 16px; white-space: pre-line; color: #4b5563; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #94a3b8; }
        
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .feature-category h3 { font-size: 16px; color: var(--gray-800); margin-bottom: 8px; background: var(--gray-100); padding: 8px 12px; border-radius: 6px; }
        .feature-category ul { margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; }
        .feature-category li { margin-bottom: 4px; }
        
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; margin-top: 20px; }
        .photo-grid img { width: 100%; height: 260px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .agent-list { list-style: none; padding: 0; margin: 0; }
        .agent-list li { padding: 8px 0; border-bottom: 1px solid #eee; color: #4b5563; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="system-prompt">
            <span class="prompt-label">Analysis Objective: ${escapeHTML(promptLabel)}</span>
            ${escapeHTML(promptText)}
        </div>
        
        <div class="header">
            <h1>${escapeHTML(data.address)}</h1>
            <div class="price">${escapeHTML(data.price)}</div>
        </div>

        <h2>Property Overview</h2>
        <div class="metrics-grid">
            ${renderGrid(data.specs)}
        </div>

        <h2>Financial & Market Data</h2>
        <div class="metrics-grid">
            ${renderGrid(data.financials)}
            ${renderGrid(data.history)}
        </div>

        <h2>Agent & Broker Info</h2>
        <ul class="agent-list">
            ${data.agents.length > 0 ? data.agents.map(a => `<li>${escapeHTML(a)}</li>`).join('') : '<li>No agent information found.</li>'}
        </ul>

        <h2>Property Description</h2>
        <div class="description">${escapeHTML(data.description) || 'No description extracted.'}</div>

        <h2>Detailed Features</h2>
        <div class="features-grid">
            ${featuresHTML || '<p>No specific features extracted.</p>'}
        </div>

        <h2>Photo Gallery</h2>
        <div class="photo-grid">
            ${data.photos.map(url => `<img src="${escapeHTML(url)}" alt="Property Photo" loading="lazy" onerror="this.style.display='none'">`).join('')}
        </div>
    </div>
</body>
</html>`;
        }
    };

    /* EXPORT LOGIC */
    function downloadHTML(htmlContent, baseFileName) {
        const cleanName = baseFileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const finalName = `${cleanName}_${Date.now()}.html`;
        
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 1000);
    }

    function extractAndPackageContent(promptKey) {
        const selectedPrompt = PROMPT_DATA[promptKey];
        const combinedPromptText = `${selectedPrompt.role}\n\n${selectedPrompt.objective}\n${STANDARD_OUTPUTS}`;
        
        const propertyData = PropertyExtractor.getData();
        const finalHTML = PropertyExtractor.buildHTMLTemplate(propertyData, combinedPromptText, selectedPrompt.label);
        
        downloadHTML(finalHTML, propertyData.address || CONFIG.filenamePrefix);
        closeModal();
    }

    /* UI MANAGEMENT */
    function createModal() {
        if (document.getElementById(CONFIG.modalId)) return;

        const fragment = document.createDocumentFragment();

        const overlay = buildElement('div', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: '999998', transition: 'opacity 0.2s'
        }, '', fragment);
        overlay.id = CONFIG.overlayId;

        const modal = buildElement('div', {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: '#ffffff', padding: '30px', borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            zIndex: '999999', width: '90%', maxWidth: '400px', fontFamily: 'system-ui, sans-serif'
        }, '', fragment);
        modal.id = CONFIG.modalId;

        buildElement('h2', { margin: '0 0 20px 0', fontSize: '20px', color: '#111827', textAlign: 'center' }, 'Extract Property For AI Analysis', modal);

        const btnContainer = buildElement('div', { display: 'flex', flexDirection: 'column', gap: '10px' }, '', modal);

        const BTN_COLORS = {
            defaultBg: '#f9fafb', defaultBorder: '#e5e7eb', defaultText: '#374151',
            hoverBg: '#eff6ff', hoverBorder: '#bfdbfe', hoverText: '#1d4ed8'
        };

        Object.entries(PROMPT_DATA).forEach(([key, prompt]) => {
            const btn = buildElement('button', {
                padding: '12px 16px', border: `1px solid ${BTN_COLORS.defaultBorder}`, borderRadius: '8px',
                backgroundColor: BTN_COLORS.defaultBg, color: BTN_COLORS.defaultText, fontSize: '15px',
                fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s',
                textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }, prompt.label, btnContainer);
            
            btn.onmouseover = () => { btn.style.backgroundColor = BTN_COLORS.hoverBg; btn.style.borderColor = BTN_COLORS.hoverBorder; btn.style.color = BTN_COLORS.hoverText; };
            btn.onmouseout = () => { btn.style.backgroundColor = BTN_COLORS.defaultBg; btn.style.borderColor = BTN_COLORS.defaultBorder; btn.style.color = BTN_COLORS.defaultText; };
            
            btn.onclick = () => {
                btn.innerText = 'Extracting Data...';
                btnContainer.style.pointerEvents = 'none';
                btn.style.opacity = '0.7';
                setTimeout(() => extractAndPackageContent(key), 100);
            };
        });

        const cancelBtn = buildElement('button', {
            marginTop: '20px', padding: '10px', border: 'none', background: 'none',
            color: '#6b7280', fontSize: '14px', cursor: 'pointer', width: '100%'
        }, 'Cancel', modal);
        
        cancelBtn.onclick = closeModal;
        cancelBtn.onmouseover = () => cancelBtn.style.color = '#111827';
        cancelBtn.onmouseout = () => cancelBtn.style.color = '#6b7280';

        document.body.appendChild(fragment);
    }

    function closeModal() {
        const modal = document.getElementById(CONFIG.modalId);
        const overlay = document.getElementById(CONFIG.overlayId);
        if (modal) modal.remove();
        if (overlay) overlay.remove();
    }

    createModal();
})();
