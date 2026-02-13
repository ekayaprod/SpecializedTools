(function () {
    /* CONFIGURATION */
    /**
     * @typedef {Object} Config
     * @property {string} modalId - The DOM ID for the modal container.
     * @property {string} overlayId - The DOM ID for the overlay background.
     * @property {string} filenamePrefix - The prefix for the generated PDF filename.
     * @property {string} html2pdfUrl - The CDN URL for the html2pdf library.
     */

    /** @type {Config} */
    const CONFIG = {
        modalId: 'pc-bookmarklet-modal',
        overlayId: 'pc-bookmarklet-overlay',
        filenamePrefix: 'Property_Report',
        html2pdfUrl: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
    };

    /* PROMPT LIBRARY */
    /** @type {string} */
    const STANDARD_OUTPUTS = `
EXPECTED DELIVERABLES (Structure your report organically based on your findings):
- **Executive Summary & Verdict**: Provide your final Investment Grade (Strong Buy / Qualified Buy / Hard Pass) with a clear Risk vs. Reward profile.
- **Hidden Insights & Red Flags**: Focus heavily on off-page data (regulations, true costs, environmental/structural risks, macro trends).
- **Financial Reality Check**: Project true cash flow, factoring in silent costs, CapEx, and local market trends.
- **Visual & Condition Audit**: CRITICAL: You must analyze the embedded photos in the report below. Use the specific room labels (e.g., 'Original Kitchen', 'Unfinished Basement') to infer value-add potential. Look for visual cues in the descriptions that suggest renovation quality, roof condition, or layout flow.
- **Comparison Tables**: If multiple properties are provided, use tables to contrast their metrics, risks, and neighborhood qualities.
`;

    /**
     * @typedef {Object} PromptConfig
     * @property {string} label - The display label for the button.
     * @property {string} role - The role description for the AI.
     * @property {string} objective - The specific analysis objective.
     */

    /** @type {Record<string, PromptConfig>} */
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
    /**
     * Escapes HTML characters to prevent XSS.
     * @param {string|null|undefined} str - The string to escape.
     * @returns {string} The escaped string.
     */
    const escapeHTML = (str) => {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, match => {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[match];
        });
    };

    /**
     * Helper to build a DOM element.
     * @param {string} tag - The HTML tag name.
     * @param {Partial<CSSStyleDeclaration>} [styles={}] - Inline styles.
     * @param {string} [text=''] - Inner text content.
     * @param {Node|null} [parent=null] - Parent element to append to.
     * @returns {HTMLElement} The created element.
     */
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
        return el ? (/** @type {HTMLElement} */ (el)).innerText.trim() : '';
    };

    /**
     * @typedef {Object} PhotoData
     * @property {string} url - The URL or Base64 data of the photo.
     * @property {string} label - A descriptive label for the photo.
     */

    /* IMAGE PROCESSOR */
    /**
     * Handles fetching and embedding images.
     * @namespace ImageProcessor
     */
    const ImageProcessor = {
        /**
         * Fetches an image URL and converts it to a Base64 string.
         * @param {string} url - The image URL.
         * @returns {Promise<string>} The Base64 string or original URL on failure.
         */
        toBase64: async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Network error');
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(/** @type {string} */ (reader.result));
                    reader.onerror = () => reject('Reader error');
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.warn('Image embedding failed, using original link:', url);
                return url;
            }
        },
        
        /**
         * Embeds photos by converting their URLs to Base64 in-place.
         * @param {PhotoData[]} photos - The list of photos to process.
         * @param {(status: string) => void} [statusCb] - Optional status callback.
         */
        embedPhotos: async (photos, statusCb) => {
            const total = photos.length;
            let processed = 0;
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i];
                const base64 = await ImageProcessor.toBase64(photo.url);
                photo.url = base64;
                processed++;
                if (statusCb) statusCb(`Embedding Image ${processed}/${total}...`);
            }
        }
    };

    /* PDF PROCESSOR */
    /**
     * Handles PDF generation using html2pdf.
     * @namespace PdfProcessor
     */
    const PdfProcessor = {
        /**
         * Loads the html2pdf library from CDN if not already loaded.
         * @returns {Promise<void>}
         */
        loadLibrary: async () => {
            if (window.html2pdf) return;
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = CONFIG.html2pdfUrl;
                script.onload = () => resolve();
                script.onerror = () => reject('Failed to load html2pdf');
                document.head.appendChild(script);
            });
        },

        /**
         * Generates and saves the PDF.
         * @param {PropertyData} data - The property data used for filename.
         * @param {string} htmlContent - The HTML content to render.
         * @param {(status: string) => void} [statusCb] - Optional status callback.
         */
        generate: async (data, htmlContent, statusCb) => {
            if (statusCb) statusCb('Generating PDF Layout...');
            
            const container = document.createElement('div');
            container.innerHTML = htmlContent;
            container.style.width = '800px'; 
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            const opt = {
                margin: 0.3,
                filename: `${data.address || 'Property_Report'}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 1.5, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            try {
                await html2pdf().set(opt).from(container).save();
            } finally {
                document.body.removeChild(container);
            }
        }
    };

    /**
     * @typedef {Object} PropertyData
     * @property {string} address
     * @property {string} price
     * @property {Object.<string, string|number>} specs
     * @property {Object.<string, string>} financials
     * @property {Object.<string, string>} history
     * @property {string[]} agents
     * @property {string} description
     * @property {Array<{category?: string, text?: string[]}>} features
     * @property {PhotoData[]} photos
     * @property {any} raw
     */

    /* CORE EXTRACTOR */
    /**
     * Core logic for extracting property data.
     * @namespace PropertyExtractor
     */
    const PropertyExtractor = {
        /**
         * Extracts data from the JSON object found in __NEXT_DATA__.
         * @param {any} pd - The property details object from JSON.
         * @param {PropertyData} data - The data object to populate.
         */
        _extractFromJSON: function(pd, data) {
            // 1. Preserve Raw Data (UNALTERED)
            data.raw = JSON.parse(JSON.stringify(pd));

            // 2. Extract Fields
            const loc = pd.location?.address;
            if (loc) {
                data.address = `${loc.line || ''}, ${loc.city || ''}, ${loc.state_code || ''} ${loc.postal_code || ''}`.replace(/^, | ,/g, '').trim();
            }
            if (pd.list_price) data.price = formatCurrency(pd.list_price);

            const desc = pd.description || {};
            data.description = desc.text || '';
            if (desc.type) data.specs['Property Type'] = desc.type.replace('_', ' ');
            if (desc.beds) data.specs['Beds'] = desc.beds;
            if (desc.baths_consolidated) data.specs['Baths'] = desc.baths_consolidated;
            if (desc.sqft) data.specs['Sq. Ft.'] = desc.sqft.toLocaleString();
            if (desc.lot_sqft) data.specs['Lot Size'] = (desc.lot_sqft / 43560).toFixed(2) + ' Acres';
            if (desc.year_built) data.specs['Year Built'] = desc.year_built;

            if (pd.mortgage?.estimate) {
                const est = pd.mortgage.estimate;
                data.financials['Est. Monthly Payment'] = formatCurrency(est.monthly_payment);
                if (est.monthly_payment_details) {
                    est.monthly_payment_details.forEach(detail => {
                        data.financials[detail.display_name] = formatCurrency(detail.amount);
                    });
                }
            }

            if (pd.list_date) {
                const parsedDate = new Date(pd.list_date);
                if (!isNaN(parsedDate.getTime())) {
                    data.history['List Date'] = parsedDate.toLocaleDateString();
                }
            }
            if (pd.last_sold_date) data.history['Last Sold Date'] = pd.last_sold_date;
            if (pd.last_sold_price) data.history['Last Sold Price'] = formatCurrency(pd.last_sold_price);

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

            if (pd.details && Array.isArray(pd.details)) data.features = pd.details;

            // 3. Process Photos for Visual Gallery (Filtered Labels)
            if (pd.photos) {
                data.photos = pd.photos.map(p => {
                    let label = '';

                    if (p.category && p.category !== 'All Photos') {
                        label = p.category;
                    }

                    if (!label && p.tags && Array.isArray(p.tags)) {
                        const noise = ['house_view', 'interior', 'exterior', 'watermark', 'complete', 'white', 'blue', 'grey', 'virtual_tour', 'video', 'floor_plan', 'realtordotcom_mls_listing_image'];
                        const validTag = p.tags.find(t => t.label && !noise.includes(t.label.toLowerCase()));
                        if (validTag) {
                            label = validTag.label.replace(/_/g, ' ');
                        }
                    }

                    if (label) {
                        label = label.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                    }

                    return { url: p.href, label: label || '' };
                });
            }
        },

        /**
         * Applies fallback extraction logic using DOM selectors.
         * @param {PropertyData} data - The data object to populate.
         */
        _applyFallbacks: function(data) {
            if (data.address === 'Unknown Address') {
                data.address = getDOMText('h1') || data.address;
            }
            if (data.price === 'Unknown Price') {
                data.price = getDOMText('[data-testid="ldp-list-price"]') || data.price;
            }
            if (!data.description || data.description.length < 20) {
                data.description = getDOMText('[data-testid="property-description"]') || getDOMText('#ldp-detail-romance') || data.description;
            }
        },

        /**
         * Deduplicates and finalizes the photo list, including DOM images.
         * @param {PropertyData} data - The data object to update.
         */
        _finalizePhotos: function(data) {
            // Deduplication & Upscaling
            const photoMap = new Map();
            // Start with JSON photos
            data.photos.forEach(p => photoMap.set(p.url, p));
            
            // Add DOM photos if missing
            Array.from(document.querySelectorAll('img[src*="rdcpix.com"]')).forEach((/** @type {HTMLImageElement} */ img) => {
                if (!photoMap.has(img.src)) {
                    photoMap.set(img.src, { url: img.src, label: '' });
                }
            });
            
            data.photos = Array.from(photoMap.values()).map(p => {
                let upscaled = p.url;
                if (upscaled.endsWith('s.jpg')) upscaled = upscaled.replace('s.jpg', 'rd-w1280_h960.webp'); 
                upscaled = upscaled.replace(/-w\d+_h\d+/g, '-w1280_h960');
                return { url: upscaled, label: p.label };
            }).filter(p => p.url && p.url.trim() !== '');
        },

        /**
         * Main entry point to get property data.
         * @returns {PropertyData} The extracted property data.
         */
        getData: function() {
            /** @type {PropertyData} */
            let data = {
                address: 'Unknown Address', price: 'Unknown Price', specs: {},
                financials: {}, history: {}, agents: [], description: '', features: [], photos: [],
                raw: null
            };

            try {
                const nextDataNode = document.getElementById('__NEXT_DATA__');
                if (nextDataNode) {
                    const textContent = nextDataNode.textContent || nextDataNode.innerText;
                    const jsonData = JSON.parse(textContent);
                    const pd = jsonData?.props?.pageProps?.initialReduxState?.propertyDetails;
                    if (pd) {
                        this._extractFromJSON(pd, data);
                    }
                }
            } catch (e) {
                console.warn('Hidden JSON extraction partially failed', e);
            }

            this._applyFallbacks(data);
            this._finalizePhotos(data);

            return data;
        },

        /**
         * Builds the HTML template for the PDF report.
         * @param {PropertyData} data - The property data.
         * @param {string} promptText - The prompt text to display.
         * @param {string} promptLabel - The label of the selected prompt.
         * @returns {string} The HTML string.
         */
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
    <style>
        body { font-family: Helvetica, Arial, sans-serif; line-height: 1.4; color: #333; font-size: 12px; margin: 0; padding: 20px; }
        h1 { margin: 0; color: #1f2937; font-size: 24px; }
        h2 { color: #1f2937; margin-top: 25px; border-bottom: 2px solid #f3f4f6; padding-bottom: 5px; font-size: 16px; page-break-after: avoid; }
        h3 { font-size: 14px; margin: 10px 0 5px 0; color: #374151; page-break-after: avoid; }
        
        .header { margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 15px; }
        .price { font-size: 20px; font-weight: bold; color: #2563eb; margin-top: 5px; }
        
        .system-prompt { background: #f1f5f9; color: #475569; padding: 15px; border-radius: 6px; margin-bottom: 20px; white-space: pre-wrap; font-family: monospace; font-size: 10px; border-left: 4px solid #94a3b8; page-break-inside: avoid; }
        .prompt-label { font-weight: bold; color: #2563eb; display: block; margin-bottom: 5px; text-transform: uppercase; }
        
        .metrics-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .metric-box { flex: 1 1 30%; min-width: 150px; background: #f9fafb; padding: 10px; border: 1px solid #e5e7eb; border-radius: 4px; page-break-inside: avoid; }
        .metric-label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
        .metric-value { font-size: 12px; font-weight: 500; color: #111827; margin-top: 2px; }
        
        .description { font-size: 11px; white-space: pre-wrap; color: #374151; text-align: justify; }
        
        .features-grid { display: flex; flex-wrap: wrap; gap: 15px; }
        .feature-category { flex: 1 1 45%; page-break-inside: avoid; }
        .feature-category ul { margin: 0; padding-left: 15px; }
        
        .photo-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
        .photo-card { width: 48%; margin-bottom: 10px; page-break-inside: avoid; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; background: #fff; position: relative; }
        .photo-card img { width: 100%; height: 200px; object-fit: cover; display: block; }
        
        /* Label Positioned Above the Photo */
        .photo-label { 
            background: #f3f4f6; color: #1f2937; 
            padding: 6px 10px; font-size: 11px; font-weight: 700; 
            text-align: center; border-bottom: 1px solid #ddd;
            display: block; width: 100%;
        }
        
        .agent-list { list-style: none; padding: 0; margin: 0; }
        .agent-list li { padding: 5px 0; border-bottom: 1px solid #eee; }

        .raw-data-section { margin-top: 30px; border-top: 4px solid #cbd5e1; padding-top: 10px; page-break-before: always; }
        .raw-data-content { white-space: pre-wrap; word-break: break-all; font-family: monospace; font-size: 8px; color: #475569; background: #f8fafc; padding: 10px; }
    </style>
</head>
<body>
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
        ${data.photos.map(p => `
            <div class="photo-card">
                ${p.label ? `<div class="photo-label">${escapeHTML(p.label)}</div>` : ''}
                <img src="${escapeHTML(p.url)}" alt="${escapeHTML(p.label)}">
            </div>
        `).join('')}
    </div>

    <div class="raw-data-section">
        <h2>Appendix: Raw Data</h2>
        <div class="raw-data-content">${(() => {
            try {
                return data.raw ? escapeHTML(JSON.stringify(data.raw, null, 2)) : 'No raw JSON detected.';
            } catch(e) { return 'Error parsing raw data.'; }
        })()}</div>
    </div>
</body>
</html>`;
        }
    };

    /**
     * Orchestrates the extraction and PDF generation process.
     * @param {string} promptKey - The key of the selected prompt.
     * @param {(status: string) => void} [statusCallback] - Optional status callback.
     */
    async function extractAndPackageContent(promptKey, statusCallback) {
        const selectedPrompt = PROMPT_DATA[promptKey];
        const combinedPromptText = `${selectedPrompt.role}\n\n${selectedPrompt.objective}\n${STANDARD_OUTPUTS}`;
        
        if (statusCallback) statusCallback("Loading PDF Engine...");
        await PdfProcessor.loadLibrary();

        const propertyData = PropertyExtractor.getData();
        
        if (propertyData.photos && propertyData.photos.length > 0) {
            if (statusCallback) statusCallback(`Embedding ${propertyData.photos.length} photos...`);
            await ImageProcessor.embedPhotos(propertyData.photos, statusCallback);
        }

        const finalHTML = PropertyExtractor.buildHTMLTemplate(propertyData, combinedPromptText, selectedPrompt.label);
        
        if (statusCallback) statusCallback("Rendering PDF...");
        await PdfProcessor.generate(propertyData, finalHTML, statusCallback);
        
        closeModal();
    }

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
                btnContainer.style.pointerEvents = 'none';
                btn.style.opacity = '0.7';
                extractAndPackageContent(key, (statusText) => {
                    btn.innerText = statusText;
                });
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