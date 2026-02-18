(function(w) {
    w.PropertyClipperLib = w.PropertyClipperLib || {};
    const Lib = w.PropertyClipperLib;

    /* CONFIGURATION */
    Lib.CONFIG = {
        modalId: 'pc-pdf-modal',
        overlayId: 'pc-pdf-overlay',
        filenamePrefix: 'Property_Report',
        jspdfUrl: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        imgMaxWidth: 1000,
        imgQuality: 0.7
    };

    /* PROMPT LIBRARY (Loaded from property-clipper-prompts.js) */
    const { STANDARD_OUTPUTS, PROMPT_DATA } = (w.BookmarkletUtils && w.BookmarkletUtils.Prompts) || {
        STANDARD_OUTPUTS: '', PROMPT_DATA: {}
    };

    /* UTILITIES */
    Lib.buildElement = BookmarkletUtils.buildElement;

    Lib.formatCurrency = (val) => (val != null) ? '$' + Number(val).toLocaleString() : 'N/A';

    Lib.generateFilename = (address) => {
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

    Lib.getFullPrompt = (key, data) => {
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
    Lib.PropertyExtractor = {
        parseDetails: function(pd, data) {
            data.raw = pd;
            const loc = pd.location?.address;
            if (loc) data.address = `${loc.line || ''}, ${loc.city || ''}, ${loc.state_code || ''} ${loc.postal_code || ''}`.replace(/^, | ,/g, '').trim();
            if (pd.list_price) data.price = Lib.formatCurrency(pd.list_price);
            data.description = pd.description?.text || '';

            const desc = pd.description || {};
            if (desc.beds) data.specs['Beds'] = desc.beds;
            if (desc.baths_consolidated) data.specs['Baths'] = desc.baths_consolidated;
            if (desc.sqft) data.specs['Sq. Ft.'] = desc.sqft.toLocaleString();
            if (desc.lot_sqft) data.specs['Lot Size'] = (desc.lot_sqft / 43560).toFixed(2) + ' Acres';
            if (desc.year_built) data.specs['Year Built'] = desc.year_built;

            if (pd.mortgage?.estimate) {
                data.financials['Est. Payment'] = Lib.formatCurrency(pd.mortgage.estimate.monthly_payment);
                const tax = pd.mortgage.estimate.monthly_payment_details?.find(d => d.type === 'property_tax');
                if (tax) data.financials['Taxes'] = Lib.formatCurrency(tax.amount);
                const hoa = pd.mortgage.estimate.monthly_payment_details?.find(d => d.type === 'hoa_fees');
                if (hoa) data.financials['HOA Fees'] = Lib.formatCurrency(hoa.amount);
            }

            // Market Context Extraction (Try multiple paths)
            if (pd.days_on_market) data.market['Days on Market'] = pd.days_on_market;

            // Try to find market data in neighborhood or similar structures
            const marketData = pd.neighborhood || pd.market || {};
            if (marketData.median_listing_price) data.market['Listing Price Median'] = Lib.formatCurrency(marketData.median_listing_price);
            if (marketData.median_sold_price) data.market['Sold Price Median'] = Lib.formatCurrency(marketData.median_sold_price);
            if (marketData.median_price_per_sqft) data.market['Price/SqFt Median'] = Lib.formatCurrency(marketData.median_price_per_sqft);

            // Property History Extraction
            if (pd.property_history && Array.isArray(pd.property_history)) {
                data.history = pd.property_history.map(h => ({
                    date: h.date,
                    event: h.event_name,
                    price: h.price ? Lib.formatCurrency(h.price) : '-'
                }));
            }

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
            } catch (e) { console.warn('Hero Image Extraction Warning:', e); }

            // 1. JSON Extraction
            try {
                const nextDataNode = document.getElementById('__NEXT_DATA__');
                const rawPreNode = document.querySelector('.raw-data pre');
                if (nextDataNode) {
                    const jsonData = JSON.parse(nextDataNode.textContent);
                    const pd = jsonData?.props?.pageProps?.initialReduxState?.propertyDetails;
                    if (pd) Lib.PropertyExtractor.parseDetails(pd, data);
                } else if (rawPreNode) {
                    const pd = JSON.parse(rawPreNode.textContent);
                    if (pd) Lib.PropertyExtractor.parseDetails(pd, data);
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

            } catch (e) { console.warn('DOM Extraction Warning:', e); }

            return data;
        }
    };

    /* 2. IMAGE PROCESSOR */
    Lib.ImageProcessor = {
        process: async (url) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > Lib.CONFIG.imgMaxWidth) {
                        height = Math.round(height * (Lib.CONFIG.imgMaxWidth / width));
                        width = Lib.CONFIG.imgMaxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    try {
                        resolve({ dataUrl: canvas.toDataURL('image/jpeg', Lib.CONFIG.imgQuality), width, height, ratio: width / height });
                    } catch (e) {
                        console.warn('Image processing failed:', e);
                        resolve(null);
                    }
                };
                img.onerror = (e) => {
                    console.warn('Image load failed:', url, e);
                    resolve(null);
                };
                img.src = url;
            });
        }
    };
})(window);
