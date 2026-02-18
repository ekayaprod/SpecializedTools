(function () {
    /** @require utils.js */
    /** @require property-clipper-prompts.js */

    /* CONFIGURATION */
    /**
     * Configuration options for the Property Clipper.
     * @property {string} modalId - The ID for the modal element.
     * @property {string} overlayId - The ID for the overlay element.
     * @property {string} filenamePrefix - The prefix for generated filenames.
     * @property {string} jspdfUrl - The URL to load jsPDF from.
     * @property {number} imgMaxWidth - The maximum width for processed images.
     * @property {number} imgQuality - The JPEG quality for processed images (0.0 to 1.0).
     */
    const CONFIG = {
        modalId: 'pc-pdf-modal',
        overlayId: 'pc-pdf-overlay',
        filenamePrefix: 'Property_Report',
        jspdfUrl: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        imgMaxWidth: 1000,
        imgQuality: 0.7
    };

    /* PROMPT LIBRARY (Loaded from property-clipper-prompts.js) */
    const { STANDARD_OUTPUTS, PROMPT_DATA } = (window.BookmarkletUtils && window.BookmarkletUtils.Prompts) || {
        STANDARD_OUTPUTS: '', PROMPT_DATA: {}
    };

    /* UTILITIES */
    const buildElement = BookmarkletUtils.buildElement;

    /**
     * Formats a number as a currency string (USD).
     * @param {number|string|null} val - The value to format.
     * @returns {string} The formatted currency string or 'N/A'.
     */
    const formatCurrency = (val) => (val != null) ? '$' + Number(val).toLocaleString() : 'N/A';

    /**
     * Generates a safe filename based on the property address and current timestamp.
     * @param {string} address - The property address.
     * @returns {string} The generated filename (e.g., "123_Main_St_20231027-1430").
     */
    const generateFilename = (address) => {
        // Extract first line (e.g. "123 Main St" from "123 Main St, City, ST 12345")
        let firstLine = (address || 'Property_Report').split(',')[0].trim();
        // Sanitize: replace spaces/slashes with underscores, remove special chars
        firstLine = firstLine.replace(/[\s/]/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');

        // Compact Timestamp: YYYYMMDD-HHmm
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

        return `${firstLine}_${ts}`;
    };

    /**
     * Constructs the full prompt text by combining the role, objective, and standard outputs.
     * Replaces placeholders with actual property data.
     * @param {string} key - The key identifying the prompt persona.
     * @param {Object} [data] - The property data to inject into placeholders.
     * @returns {string} The complete prompt text.
     */
    const getFullPrompt = (key, data) => {
        const p = PROMPT_DATA[key];
        if (!p) return '';
        let text = `${p.role}\n\n${p.objective}`;
        if (!p.noStandardOutput) {
             text += `\n${STANDARD_OUTPUTS}`;
        }
        if (data) {
            text = text.replace(/\[Insert Property Address\]/g, data.address || '[Address]')
                       .replace(/\[Insert Asking Price\]/g, data.price || '[Price]');
        }
        return text;
    };

    /* 1. CORE EXTRACTOR */
    /**
     * Handles the extraction of property data from various sources on the page.
     */
    const PropertyExtractor = {
        _parseLocation: function(pd, data) {
            const loc = pd.location?.address;
            if (loc) data.address = `${loc.line || ''}, ${loc.city || ''}, ${loc.state_code || ''} ${loc.postal_code || ''}`.replace(/^, | ,/g, '').trim();
            if (pd.list_price) data.price = formatCurrency(pd.list_price);
            data.description = pd.description?.text || '';
        },

        _parseSpecs: function(pd, data) {
            const desc = pd.description || {};
            if (desc.beds) data.specs['Beds'] = desc.beds;
            if (desc.baths_consolidated) data.specs['Baths'] = desc.baths_consolidated;
            if (desc.sqft) data.specs['Sq. Ft.'] = desc.sqft.toLocaleString();
            if (desc.lot_sqft) data.specs['Lot Size'] = (desc.lot_sqft / 43560).toFixed(2) + ' Acres';
            if (desc.year_built) data.specs['Year Built'] = desc.year_built;
        },

        _parseFinancials: function(pd, data) {
            if (pd.mortgage?.estimate) {
                data.financials['Est. Payment'] = formatCurrency(pd.mortgage.estimate.monthly_payment);
                const tax = pd.mortgage.estimate.monthly_payment_details?.find(d => d.type === 'property_tax');
                if (tax) data.financials['Taxes'] = formatCurrency(tax.amount);
                const hoa = pd.mortgage.estimate.monthly_payment_details?.find(d => d.type === 'hoa_fees');
                if (hoa) data.financials['HOA Fees'] = formatCurrency(hoa.amount);
            }
        },

        _parseMarketData: function(pd, data) {
            if (pd.days_on_market) data.market['Days on Market'] = pd.days_on_market;
            const marketData = pd.neighborhood || pd.market || {};
            if (marketData.median_listing_price) data.market['Listing Price Median'] = formatCurrency(marketData.median_listing_price);
            if (marketData.median_sold_price) data.market['Sold Price Median'] = formatCurrency(marketData.median_sold_price);
            if (marketData.median_price_per_sqft) data.market['Price/SqFt Median'] = formatCurrency(marketData.median_price_per_sqft);
        },

        _parseHistory: function(pd, data) {
            if (pd.property_history && Array.isArray(pd.property_history)) {
                data.history = pd.property_history.map(h => ({
                    date: h.date,
                    event: h.event_name,
                    price: h.price ? formatCurrency(h.price) : '-'
                }));
            }
        },

        _parsePhotos: function(pd, data) {
            if (pd.augmented_gallery && Array.isArray(pd.augmented_gallery)) {
                pd.augmented_gallery.forEach(group => {
                    if (group.key === 'all_photos') return;
                    const categoryName = group.category || group.key || 'Other';
                    const validPhotos = (group.photos || []).filter(p => p.href).map(p => ({
                        url: p.href.replace('s.jpg', 'od-w1024_h768.webp'),
                        label: categoryName
                    }));
                    if (validPhotos.length > 0) data.photoGroups.push({ category: categoryName, photos: validPhotos });
                });
            }
            if (data.photoGroups.length === 0 && pd.photos) {
                data.photoGroups.push({ category: 'Gallery', photos: pd.photos.map(p => ({ url: p.href, label: 'Property Photo' })) });
            }
        },

        /**
         * Parses the raw property details object and populates the normalized data structure.
         * @param {Object} pd - The raw property details object (usually from JSON).
         * @param {Object} data - The target data object to populate.
         */
        parseDetails: function(pd, data) {
            data.raw = pd;
            this._parseLocation(pd, data);
            this._parseSpecs(pd, data);
            this._parseFinancials(pd, data);
            this._parseMarketData(pd, data);
            this._parseHistory(pd, data);
            this._parsePhotos(pd, data);
        },

        /**
         * Scrapes property data from the current page using available JSON or DOM sources.
         * Attempts to parse Next.js hydration data first, falling back to raw pre tags,
         * and finally scraping specific DOM elements for fallback values.
         *
         * @returns {Object} The normalized property data object containing address, price, specs, etc.
         */
        getData: function () {
            let data = {
                address: 'Unknown Address', price: 'Unknown Price', specs: {},
                financials: {}, market: {}, history: [], description: '',
                photoGroups: [], raw: null, heroUrl: null
            };

            /* Extract Hero Image (OG:IMAGE is usually most reliable) */
            try {
                const ogImage = document.querySelector('meta[property="og:image"]');
                if (ogImage && ogImage.content) data.heroUrl = ogImage.content;
            } catch (e) { console.warn('Hero Image Extraction Warning:', { error: e, url: window.location.href, title: document.title }); }

            // 1. JSON Extraction
            try {
                const nextDataNode = document.getElementById('__NEXT_DATA__');
                const rawPreNode = document.querySelector('.raw-data pre');
                if (nextDataNode) {
                    const jsonData = JSON.parse(nextDataNode.textContent);
                    const pd = jsonData?.props?.pageProps?.initialReduxState?.propertyDetails;
                    if (pd) PropertyExtractor.parseDetails(pd, data);
                } else if (rawPreNode) {
                    const pd = JSON.parse(rawPreNode.textContent);
                    if (pd) PropertyExtractor.parseDetails(pd, data);
                }
            } catch (e) {
                console.warn('JSON Extraction Failed', {
                    error: e instanceof Error ? e.message : String(e),
                    hasNextData: !!document.getElementById('__NEXT_DATA__'),
                    hasRawPre: !!document.querySelector('.raw-data pre'),
                    url: window.location.href
                });
            }

            // 2. DOM Extraction
            try {
                const keyFacts = document.querySelectorAll('[data-testid="key-facts"] li, .key-fact-item, ul[data-testid*="detail"] li');
                keyFacts.forEach(li => {
                    const text = /** @type {HTMLElement} */ (li).innerText || '';
                    let parts = text.includes(':') ? text.split(':') : text.split('\n');
                    parts = parts.map(s => s.trim()).filter(s => s);
                    
                    if (parts.length >= 2) {
                        const label = parts[0];
                        const value = parts.slice(1).join(' ');
                        if (!data.specs[label] && !data.financials[label]) {
                            data.specs[label] = value;
                        }
                    }
                });
                
                if (data.address === 'Unknown Address') data.address = /** @type {HTMLElement} */ (document.querySelector('h1'))?.innerText || data.address;
                if (data.price === 'Unknown Price') data.price = /** @type {HTMLElement} */ (document.querySelector('[data-testid="ldp-list-price"]'))?.innerText || data.price;
                
            } catch (e) { console.warn('DOM Extraction Warning:', { error: e, partialAddress: data.address, partialPrice: data.price }); }

            return data;
        }
    };

    /* 2. IMAGE PROCESSOR */
    /**
     * Handles image loading and processing (resizing, format conversion).
     */
    const ImageProcessor = {
        /**
         * Loads an image from a URL, resizes it if necessary, and returns data URL.
         * @param {string} url - The URL of the image to process.
         * @returns {Promise<Object|null>} A promise resolving to an object with dataUrl, width, height, and ratio, or null on failure.
         */
        process: async (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > CONFIG.imgMaxWidth) {
                        height = Math.round(height * (CONFIG.imgMaxWidth / width));
                        width = CONFIG.imgMaxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    try {
                        resolve({ dataUrl: canvas.toDataURL('image/jpeg', CONFIG.imgQuality), width, height, ratio: width / height });
                    } catch (e) {
                        console.warn('Image processing failed:', { error: e, url, width, height });
                        resolve(null);
                    }
                };
                img.onerror = (e) => {
                    console.warn('Image load failed:', { url, error: e });
                    resolve(null);
                };
                img.src = url;
            });
        }
    };

    /* 3. HTML GENERATOR */
    /**
     * Generates HTML reports.
     */
    const HTMLGenerator = {
        /**
         * Creates an HTML report file and triggers a download.
         * @param {Object} data - The property data.
         * @param {Array<{url: string, label: string}>} selectedPhotos - The list of photos to include.
         */
        create: (data, selectedPhotos) => {
            const specsHtml = Object.entries({ ...data.specs, ...data.financials }).map(([k, v]) => `
                <div class="metric-box">
                    <div class="metric-label">${BookmarkletUtils.escapeHtml(k)}</div>
                    <div class="metric-value">${BookmarkletUtils.escapeHtml(v)}</div>
                </div>`).join('');

            const photosHtml = selectedPhotos.map(p => `
                <div class="photo-card">
                    <img src="${p.url}" loading="lazy" alt="${BookmarkletUtils.escapeHtml(p.label)}">
                    <div class="photo-label">${BookmarkletUtils.escapeHtml(p.label)}</div>
                </div>`).join('');

            // HERO IMAGE LOGIC
            let heroHtml = '';
            const heroUrl = data.heroUrl || (selectedPhotos.length > 0 ? selectedPhotos[0].url : null);
            if (heroUrl) {
                heroHtml = `
                <div class="hero-section" style="margin-bottom: 30px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
                    <img src="${heroUrl}" alt="Primary view of ${BookmarkletUtils.escapeHtml(data.address)}" style="width: 100%; height: auto; max-height: 500px; object-fit: cover; display: block;">
                </div>`;
            }

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${BookmarkletUtils.escapeHtml(data.address)} - Property Report</title>
    <style>
        :root { --primary: #2563eb; --gray-100: #f3f4f6; --gray-800: #1f2937; }
        body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; background: #fafafa; }
        .report-container { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid var(--gray-100); padding-bottom: 20px; margin-bottom: 20px; }
        h1 { margin: 0; color: var(--gray-800); font-size: 28px; }
        .price { font-size: 32px; font-weight: bold; color: var(--primary); margin: 10px 0; }
        h2 { color: var(--gray-800); margin-top: 40px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
        .metric-box { background: var(--gray-100); padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e7eb; }
        .metric-label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; }
        .metric-value { font-size: 15px; font-weight: 500; color: var(--gray-800); margin-top: 4px; }
        .description { white-space: pre-line; color: #4b5563; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #94a3b8; }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 20px; }
        .photo-card { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
        .photo-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
        .photo-label { padding: 10px; font-size: 12px; color: #4b5563; background: #f9fafb; border-top: 1px solid #eee; }
        .raw-data { margin-top: 40px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .raw-data pre { white-space: pre-wrap; word-break: break-all; font-size: 11px; color: #334155; max-height: 400px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>${BookmarkletUtils.escapeHtml(data.address)}</h1>
            <div class="price">${BookmarkletUtils.escapeHtml(data.price)}</div>
        </div>
        ${heroHtml}
        <h2>Property Overview</h2>
        <div class="metrics-grid">${specsHtml}</div>
        <h2>Description</h2>
        <div class="description">${BookmarkletUtils.escapeHtml(data.description)}</div>
        <h2>Photo Gallery</h2>
        <div class="gallery-grid">${photosHtml}</div>
        <details class="raw-data">
            <summary>Raw Data (JSON)</summary>
            <pre>${data.raw ? BookmarkletUtils.escapeHtml(JSON.stringify(data.raw, null, 2)) : 'No raw data.'}</pre>
        </details>
    </div>
</body>
</html>`;
            
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${generateFilename(data.address)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
        }
    };

    /* 4. PDF GENERATOR */
    /**
     * Generates PDF reports using jsPDF.
     */
    const PDFGenerator = {
        _renderHeader: function(doc, data, margin, y) {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(data.address, margin, y);
            y += 8;

            doc.setFontSize(14);
            doc.setTextColor(37, 99, 235);
            doc.text(data.price, margin, y);
            doc.setTextColor(0);
            y += 15;
            return y;
        },

        _renderHero: async function(doc, data, selectedPhotos, margin, y, contentWidth, statusCb) {
            const heroUrl = data.heroUrl || (selectedPhotos.length > 0 ? selectedPhotos[0].url : null);
            if (heroUrl) {
                if(statusCb) statusCb('Processing Hero Image...');
                const heroProcessed = await ImageProcessor.process(heroUrl);
                
                if (heroProcessed) {
                    const heroWidth = contentWidth;
                    let heroHeight = contentWidth / heroProcessed.ratio;
                    
                    if (heroHeight > 90) {
                        heroHeight = 90;
                    }
                    
                    doc.addImage(heroProcessed.dataUrl, 'JPEG', margin, y, heroWidth, heroHeight);
                    y += heroHeight + 10;
                }
            }
            if (y > 220) { doc.addPage(); y = 20; }
            return y;
        },

        _renderGridSection: function(doc, title, items, margin, y, pageWidth, boxWidth) {
            if (!items || Object.keys(items).length === 0) return y;
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(title, margin, y);
            y += 6;

            const boxH = 14;
            const gap = 3;
            let col = 0;

            const keys = Object.keys(items);

            keys.forEach((key) => {
                if (margin + (col * (boxWidth + gap)) + boxWidth > pageWidth - margin) {
                    col = 0;
                    y += boxH + gap;
                }

                if (y > 270) { doc.addPage(); y = 20; col = 0; }

                const x = margin + (col * (boxWidth + gap));

                doc.setFillColor(250, 250, 250);
                doc.setDrawColor(220, 220, 220);
                doc.roundedRect(x, y, boxWidth, boxH, 2, 2, 'FD');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(100, 100, 100);
                const labelSafe = key.substring(0, 25);
                doc.text(labelSafe.toUpperCase(), x + 2, y + 4);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(9);
                const valSafe = String(items[key]).substring(0, 22);
                doc.text(valSafe, x + 2, y + 10);

                col++;
            });
            y += boxH + 10;
            return y;
        },

        _renderDescription: function(doc, description, margin, y, contentWidth) {
            if (y > 240) { doc.addPage(); y = 20; }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text("Seller/Listing Agent Description", margin, y);
            y += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);

            const descLines = doc.splitTextToSize(description, contentWidth);
            doc.text(descLines, margin, y, { lineHeightFactor: 1.5 });

            const descHeight = descLines.length * 10 * 1.5 * 0.3527777778;
            y += descHeight + 15;
            return y;
        },

        _renderHistory: function(doc, history, margin, y) {
            if (history && history.length > 0) {
                if (y > 220) { doc.addPage(); y = 20; }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text("Property History", margin, y);
                y += 8;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                history.forEach(h => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    const line = `${h.date || 'N/A'} - ${h.event || 'Event'} - ${h.price || '-'}`;
                    doc.text(line, margin, y);
                    y += 6;
                });
                y += 10;
            }
            return y;
        },

        _renderPhotoAppendix: async function(doc, selectedPhotos, margin, y, contentWidth, statusCb) {
            if (selectedPhotos.length > 0) {
                doc.addPage();
                y = 20;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text("Photo Appendix", margin, y);
                y += 10;

                if (statusCb) statusCb(`Processing ${selectedPhotos.length} photos...`);
                let processedCount = 0;
                const processedResults = await Promise.all(selectedPhotos.map(async (photo) => {
                    const res = await ImageProcessor.process(photo.url);
                    processedCount++;
                    if (statusCb) statusCb(`Processing photos (${processedCount}/${selectedPhotos.length})...`);
                    return res;
                }));

                for (let i = 0; i < selectedPhotos.length; i++) {
                    const photo = selectedPhotos[i];
                    const processed = processedResults[i];
                    if (!processed) continue;

                    const MAX_IMG_HEIGHT = 105;

                    let finalH = contentWidth / processed.ratio;
                    let finalW = contentWidth;

                    if (finalH > MAX_IMG_HEIGHT) {
                        finalH = MAX_IMG_HEIGHT;
                        finalW = finalH * processed.ratio;
                    }

                    if (y + finalH + 20 > 280) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(50, 50, 50);
                    const label = (photo.label || 'Property Photo').toUpperCase();
                    doc.text(label, margin, y);
                    y += 5;

                    const x = margin + (contentWidth - finalW) / 2;
                    doc.addImage(processed.dataUrl, 'JPEG', x, y, finalW, finalH);
                    y += finalH + 15;
                }
            }
            return y;
        },

        _renderRawData: function(doc, rawData, margin, y, contentWidth) {
            if (rawData) {
                doc.addPage();
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.text("RAW PROPERTY DATA (For AI Context)", margin, 15);

                const jsonStr = JSON.stringify(rawData);
                const lines = doc.splitTextToSize(jsonStr, contentWidth);
                let lineIdx = 0;
                let pageY = 20;
                while (lineIdx < lines.length) {
                    if (pageY > 280) { doc.addPage(); pageY = 15; }
                    doc.text(lines[lineIdx], margin, pageY);
                    pageY += 3.5;
                    lineIdx++;
                }
            }
        },

        /**
         * Creates a PDF report and triggers a download.
         * @param {Object} data - The property data.
         * @param {Array<{url: string, label: string}>} selectedPhotos - The list of photos to include.
         * @param {function(string): void} [statusCb] - Callback to update status message during generation.
         * @returns {Promise<void>}
         */
        create: async function(data, selectedPhotos, statusCb) {
            await BookmarkletUtils.loadLibrary('jspdf', CONFIG.jspdfUrl);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });

            const margin = 15;
            let y = 20;
            const pageWidth = 210;
            const contentWidth = pageWidth - (margin * 2);

            y = this._renderHeader(doc, data, margin, y);
            y = await this._renderHero(doc, data, selectedPhotos, margin, y, contentWidth, statusCb);

            const primarySpecs = {};
            primarySpecs['Price'] = data.price;
            const targetSpecs = ['Beds', 'Baths', 'Sq. Ft.', 'Lot Size', 'Year Built'];
            targetSpecs.forEach(k => { if (data.specs[k]) primarySpecs[k] = data.specs[k]; });
            if (data.financials['HOA Fees']) primarySpecs['HOA Fees'] = data.financials['HOA Fees'];
            if (data.financials['Taxes']) primarySpecs['Taxes'] = data.financials['Taxes'];

            y = this._renderGridSection(doc, "Primary Property Specs", primarySpecs, margin, y, pageWidth, 43);
            y = this._renderGridSection(doc, "Market Context & Medians", data.market, margin, y, pageWidth, 43);

            y = this._renderDescription(doc, data.description, margin, y, contentWidth);
            y = this._renderHistory(doc, data.history, margin, y);
            y = await this._renderPhotoAppendix(doc, selectedPhotos, margin, y, contentWidth, statusCb);
            this._renderRawData(doc, data.raw, margin, y, contentWidth);

            doc.save(`${generateFilename(data.address)}.pdf`);
        }
    };

    /* 5. WIZARD UI */
    /**
     * Manages the multi-step photo selection wizard.
     */
    const Wizard = {
        state: { data: null, step: 0, selectedPhotos: [], format: 'pdf' },
        
        /**
         * Initializes the wizard with property data and selected output format.
         * @param {Object} data - The property data.
         * @param {'html'|'pdf'} format - The desired output format.
         */
        init: (data, format) => {
            Wizard.state.data = data;
            Wizard.state.format = format;
            Wizard.state.selectedPhotos = [];
            Wizard.state.step = 0;
            Wizard.renderStart();
        },

        /**
         * Renders the initial step of the wizard (All Photos vs. Manual Selection).
         */
        renderStart: () => {
            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = `<h3 style="margin-top:0">Photo Strategy</h3>`;
            const total = Wizard.state.data.photoGroups.reduce((a, g) => a + g.photos.length, 0);
            
            const btnAll = buildElement('button', { width: '100%', padding: '15px', marginBottom: '10px', cursor: 'pointer', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', textAlign: 'left' }, `All Photos (${total})`, container);
            btnAll.onclick = () => {
                Wizard.state.selectedPhotos = Wizard.state.data.photoGroups.flatMap(g => g.photos);
                Wizard.generate();
            };

            const btnManual = buildElement('button', { width: '100%', padding: '15px', cursor: 'pointer', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'left' }, `Select Photos`, container);
            btnManual.onclick = () => { Wizard.renderStep(); };
        },

        /**
         * Renders the current step of the manual photo selection process.
         */
        renderStep: () => {
            const grp = Wizard.state.data.photoGroups[Wizard.state.step];
            if (!grp) return Wizard.generate();
            
            if (grp.photos.length === 1) {
                Wizard.state.selectedPhotos.push(grp.photos[0]);
                Wizard.state.step++;
                return Wizard.renderStep();
            }

            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = `<h3 style="margin:0 0 10px 0">${grp.category} (${Wizard.state.step+1}/${Wizard.state.data.photoGroups.length})</h3>`;
            
            const grid = buildElement('div', { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', maxHeight: '400px', overflowY: 'auto' }, '', container);
            const checks = [];
            
            grp.photos.forEach(p => {
                const d = buildElement('div', { position: 'relative' }, '', grid);
                const img = buildElement('img', { width: '100%', height: '80px', objectFit: 'cover' }, '', d, { src: p.url, alt: p.label || 'Property Photo', loading: 'lazy' });
                const chk = buildElement('input', { position: 'absolute', top: '2px', left: '2px' }, '', d, { type: 'checkbox', checked: true, 'aria-label': `Select photo: ${p.label || 'Property Photo'}` });
                checks.push({ chk, p });
            });

            const nextBtn = buildElement('button', { marginTop: '15px', width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }, 'Next', container);
            nextBtn.onclick = () => {
                Wizard.state.selectedPhotos.push(...checks.filter(c => c.chk.checked).map(c => c.p));
                Wizard.state.step++;
                Wizard.renderStep();
            };
        },

        /**
         * Triggers the report generation based on the selected photos and format.
         */
        generate: () => {
            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = '<div style="text-align:center;padding:20px"><h3>Generating Report...</h3><div id="pdf-status">Starting...</div></div>';
            
            if (Wizard.state.format === 'pdf') {
                PDFGenerator.create(Wizard.state.data, Wizard.state.selectedPhotos, (msg) => document.getElementById('pdf-status').innerText = msg)
                    .then(closeModal).catch(e => BookmarkletUtils.showToast(e.message, 'error'));
            } else {
                HTMLGenerator.create(Wizard.state.data, Wizard.state.selectedPhotos);
                closeModal();
            }
        }
    };

    /* 6. MAIN UI - PROMPT STUDIO */
    /**
     * Creates and displays the main Persona Selection / Prompt Studio modal.
     * Extracts initial data to populate prompt placeholders.
     */
    function createPersonaModal() {
        if (document.getElementById(CONFIG.modalId)) return;
        const ov = buildElement('div', { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: '999998' }, '', document.body, { id: CONFIG.overlayId });
        const mo = buildElement('div', { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: '25px', width: '500px', borderRadius: '12px', zIndex: '999999', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '15px' }, '', document.body, { id: CONFIG.modalId });
        
        buildElement('h2', { margin: '0', textAlign: 'center', fontSize: '20px' }, 'Analysis Studio', mo);

        // Data Pre-fetch for Prompt Placeholders
        const data = PropertyExtractor.getData();
        if (!data.raw) BookmarkletUtils.showToast('Warning: Raw data not found. Report limited.', 'error');

        // 1. Dropdown
        const row1 = buildElement('div', { display: 'flex', flexDirection: 'column', gap: '5px' }, '', mo);
        buildElement('label', { fontSize: '12px', fontWeight: 'bold', color: '#555' }, 'Persona:', row1);
        const select = buildElement('select', { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }, '', row1, { 'aria-label': 'Select Persona / Analysis Type' });
        
        Object.entries(PROMPT_DATA).forEach(([k, v]) => {
            const opt = buildElement('option', {}, v.label, select);
            opt.value = k;
        });

        // 2. Text Area
        const row2 = buildElement('div', { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1' }, '', mo);
        buildElement('label', { fontSize: '12px', fontWeight: 'bold', color: '#555' }, 'AI Context:', row2);
        const txtArea = buildElement('textarea', { width: '100%', height: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }, '', row2);
        
        // Update text area on change
        const updateText = () => { txtArea.value = getFullPrompt(select.value, data); };
        select.onchange = updateText;
        updateText(); // Init

        // 3. Actions Row
        const row3 = buildElement('div', { display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }, '', mo);
        
        const leftGroup = buildElement('div', { display: 'flex', gap: '5px' }, '', row3);
        const copyBtn = buildElement('button', { padding: '8px 12px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }, 'Copy', leftGroup);
        copyBtn.onclick = () => { navigator.clipboard.writeText(txtArea.value); copyBtn.innerText = 'Copied!'; setTimeout(() => copyBtn.innerText = 'Copy', 1500); };

        const rightGroup = buildElement('div', { display: 'flex', gap: '10px' }, '', row3);
        const cancelBtn = buildElement('button', { padding: '8px 12px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }, 'Close', rightGroup);
        
        const htmlBtn = buildElement('button', { padding: '10px 15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }, 'HTML', rightGroup);
        const pdfBtn = buildElement('button', { padding: '10px 15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }, 'PDF', rightGroup);

        // Handlers
        const launchWizard = (fmt) => {
            Wizard.init(data, fmt);
        };

        cancelBtn.onclick = closeModal;
        htmlBtn.onclick = () => launchWizard('html');
        pdfBtn.onclick = () => launchWizard('pdf');
    }

    /**
     * Closes and removes the modal and overlay from the DOM.
     */
    function closeModal() {
        document.getElementById(CONFIG.modalId)?.remove();
        document.getElementById(CONFIG.overlayId)?.remove();
    }

    createPersonaModal();
})();
