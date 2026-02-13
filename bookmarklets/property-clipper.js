(function () {
    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'pc-bookmarklet-modal',
        overlayId: 'pc-bookmarklet-overlay',
        filenamePrefix: 'Property_Report',
        // We now load jsPDF instead of JSZip
        jsPdfUrl: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    };

    /* PROMPT LIBRARY (OPTIMIZED FOR DEEP RESEARCH) */
    const STANDARD_OUTPUTS = `
EXPECTED DELIVERABLES (Structure your report organically based on your findings):
- **Executive Summary & Verdict**: Provide your final Investment Grade (Strong Buy / Qualified Buy / Hard Pass) with a clear Risk vs. Reward profile.
- **Hidden Insights & Red Flags**: Focus heavily on off-page data (regulations, true costs, environmental/structural risks, macro trends).
- **Financial Reality Check**: Project true cash flow, factoring in silent costs, CapEx, and local market trends.
- **Visual & Condition Audit**: CRITICAL: You must analyze the provided Photo Gallery pages in this document. Look for visual evidence of wear, renovation quality (luxury vs. builder grade), roof condition, HVAC age indicators, and layout flow. Match these visual findings against the text claims.
- **Comparison Tables**: If multiple properties are provided, use tables to contrast their metrics, risks, and neighborhood qualities.
`;

    /**
     * @typedef {Object} PropertyData
     * @property {string} address - Full address of the property.
     * @property {string} price - Listing price.
     * @property {Object.<string, string>} specs - Key specs like Beds, Baths, Sqft.
     * @property {Object.<string, string>} financials - Financial details like tax, HOA, estimated payment.
     * @property {Object.<string, string>} history - Listing and sale history.
     * @property {string[]} agents - List of agents and brokers involved.
     * @property {string} description - Full property description text.
     * @property {Array<{category: string, text: string[]}>} features - Detailed features by category.
     * @property {Array<{url: string, label: string}>} photos - List of photo URLs and labels.
     * @property {Object|null} raw - The raw JSON data extracted from Next.js state (for debugging/AI).
     */

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

    /* PDF PROCESSOR */
    const PdfProcessor = {
        loadLibrary: async () => {
            if (window.jspdf) return;
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = CONFIG.jsPdfUrl;
                script.onload = () => resolve();
                script.onerror = () => reject('Failed to load jsPDF');
                document.head.appendChild(script);
            });
        },

        generatePdf: async (data, promptText, promptLabel, statusCb) => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let cursorY = 20;

            const addText = (text, size = 10, isBold = false) => {
                doc.setFontSize(size);
                doc.setFont("helvetica", isBold ? "bold" : "normal");
                const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
                
                // Check page break
                if (cursorY + (lines.length * size * 0.4) > pageHeight - margin) {
                    doc.addPage();
                    cursorY = 20;
                }
                
                doc.text(lines, margin, cursorY);
                cursorY += (lines.length * size * 0.4) + 2; // Line height spacing
            };

            // --- PAGE 1: TEXT REPORT ---
            
            // Header
            addText("AI PROPERTY ANALYSIS DOSSIER", 10);
            cursorY += 5;
            addText(data.address, 18, true);
            addText(data.price, 14, true);
            cursorY += 10;

            // System Prompt Box
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, cursorY, pageWidth - (margin*2), 40, 'F');
            cursorY += 5;
            addText(`ANALYSIS MODE: ${promptLabel}`, 10, true);
            addText(promptText, 8);
            cursorY += 10;

            // Specs
            addText("Specifications:", 12, true);
            const specStr = Object.entries(data.specs).map(([k, v]) => `${k}: ${v}`).join(' | ');
            addText(specStr, 10);
            cursorY += 5;

            // Description
            addText("Description:", 12, true);
            addText(data.description.substring(0, 2000) + (data.description.length > 2000 ? "..." : ""), 9);
            cursorY += 5;

            // Features (Brief)
            addText("Key Features:", 12, true);
            const featureStr = data.features.map(f => f.category).join(', ');
            addText(featureStr, 9);
            
            // --- PAGES 2+: IMAGES ---
            // Max 25 images to keep PDF manageable, but high res
            const imagesToProcess = data.photos.slice(0, 25); 
            
            for (let i = 0; i < imagesToProcess.length; i++) {
                const photo = imagesToProcess[i];
                if (statusCb) statusCb(`Processing Image ${i + 1}/${imagesToProcess.length}...`);

                try {
                    // Fetch blob
                    const response = await fetch(photo.url);
                    if (!response.ok) throw new Error('Fetch failed');
                    const blob = await response.blob();
                    
                    // Convert to Base64
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });

                    // Determine format
                    let format = 'JPEG';
                    if (photo.url.toLowerCase().endsWith('.png')) format = 'PNG';
                    if (photo.url.toLowerCase().endsWith('.webp')) format = 'WEBP';

                    // Add new page
                    doc.addPage();
                    
                    // Header for image page
                    doc.setFontSize(10);
                    doc.text(`Image ${i+1}: ${photo.label}`, margin, 10);

                    // Calc dimensions to fit page max
                    const imgProps = doc.getImageProperties(base64);
                    const pdfWidth = pageWidth - (margin * 2);
                    const pdfHeight = pageHeight - (margin * 2) - 10; // minus top header space
                    
                    const imgRatio = imgProps.width / imgProps.height;
                    const pageRatio = pdfWidth / pdfHeight;

                    let finalW, finalH;
                    
                    if (imgRatio > pageRatio) {
                        // Image is wider than page area
                        finalW = pdfWidth;
                        finalH = finalW / imgRatio;
                    } else {
                        // Image is taller than page area
                        finalH = pdfHeight;
                        finalW = finalH * imgRatio;
                    }

                    // Center image
                    const x = margin + (pdfWidth - finalW) / 2;
                    const y = 20 + (pdfHeight - finalH) / 2;

                    doc.addImage(base64, format, x, y, finalW, finalH);

                } catch (e) {
                    console.warn(`Failed to load image ${photo.url}`, e);
                }
            }
            
            return doc;
        }
    };

    /* CORE EXTRACTOR - Builds Custom Data Object (FROM ORIGINAL SCRIPT) */
    const PropertyExtractor = {
        /**
         * Scrapes property details from the DOM and internal React/Next.js state.
         * @returns {PropertyData} Normalized property data object.
         */
        getData: function() {
            let data = {
                address: 'Unknown Address', price: 'Unknown Price', specs: {},
                financials: {}, history: {}, agents: [], description: '', features: [], photos: [],
                raw: null
            };

            // 1. EXTRACT FROM HIDDEN JSON STATE (Most Reliable)
            try {
                (() => {
                    const nextDataNode = document.getElementById('__NEXT_DATA__');
                    if (!nextDataNode) return;

                    const jsonData = JSON.parse(nextDataNode.innerText);
                    const pd = jsonData?.props?.pageProps?.initialReduxState?.propertyDetails;
                    if (!pd) return;

                    // Capture Raw Data for AI Context
                    data.raw = pd;

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
                        if (!isNaN(parsedDate.getTime())) {
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

                    // Granular Features
                    if (pd.details && Array.isArray(pd.details)) data.features = pd.details;

                    // Photos with Labels
                    if (pd.photos) {
                        data.photos = pd.photos.map(p => {
                            let labelParts = [];
                            if (p.category) labelParts.push(p.category);
                            if (p.tags && Array.isArray(p.tags)) {
                                p.tags.forEach(t => { if (t.label) labelParts.push(t.label); });
                            }
                            // Unique labels only, join with comma
                            const cleanLabel = [...new Set(labelParts)].join(', ').replace(/_/g, ' ');
                            return { url: p.href, label: cleanLabel || 'Property Photo' };
                        });
                    }
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
                const textParts = /** @type {HTMLElement} */ (li).innerText.split('\n').map(t => t.trim()).filter(t => t);
                if (textParts.length >= 2) {
                    let label = textParts[0].replace(/:$/, '');
                    let val = textParts.slice(1).join(' ');
                    if (!data.specs[label] && !data.financials[label] && !data.history[label]) {
                        data.specs[label] = val;
                    }
                }
            });

            // 3. CLEANUP & NORMALIZE PHOTOS
            // If no photos from JSON, scrape DOM. Ensure photos are objects {url, label}
            let rawPhotos = data.photos.length > 0 ? data.photos :
                Array.from(document.querySelectorAll('img[src*="rdcpix.com"]')).map(img => {
                    const image = /** @type {HTMLImageElement} */ (img);
                    return {
                        url: image.src,
                        label: image.alt || 'Property Photo'
                    };
                });

            // Deduplicate by URL
            const photoMap = new Map();
            rawPhotos.forEach(p => {
                if (typeof p.url === 'string') {
                    photoMap.set(p.url, p);
                }
            });

            data.photos = Array.from(photoMap.values()).map(p => {
                let upscaled = p.url;
                if (upscaled.endsWith('s.jpg')) upscaled = upscaled.replace('s.jpg', 'rd-w1280_h960.webp');
                upscaled = upscaled.replace(/-w\d+_h\d+/g, '-w1280_h960');
                return { url: upscaled, label: p.label };
            }).filter(p => p.url && p.url.trim() !== '');

            return data;
        }
    };

    /* EXPORT LOGIC */
    async function extractAndPackageContent(promptKey, statusCallback) {
        const selectedPrompt = PROMPT_DATA[promptKey];
        const combinedPromptText = `${selectedPrompt.role}\n\n${selectedPrompt.objective}\n${STANDARD_OUTPUTS}`;

        if (statusCallback) statusCallback("Loading PDF engine...");
        await PdfProcessor.loadLibrary();

        const propertyData = PropertyExtractor.getData();

        if (statusCallback) statusCallback(`Found ${propertyData.photos.length} photos. Generating PDF...`);

        // Generate PDF
        const doc = await PdfProcessor.generatePdf(
            propertyData,
            combinedPromptText,
            selectedPrompt.label,
            statusCallback
        );

        if (statusCallback) statusCallback('Saving...');
        
        const safeTitle = (propertyData.address || CONFIG.filenamePrefix).replace(/[^a-z0-9]/gi, '_').substring(0, 40);
        doc.save(`${safeTitle}_Analysis.pdf`);
        
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

        buildElement('h2', { margin: '0 0 20px 0', fontSize: '20px', color: '#111827', textAlign: 'center' }, 'Generate Property PDF', modal);

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
