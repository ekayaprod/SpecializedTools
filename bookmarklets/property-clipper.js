(function () {
    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'pc-bookmarklet-modal',
        overlayId: 'pc-bookmarklet-overlay',
        filenamePrefix: 'Investment_Analysis_'
    };

    /* INVESTMENT PROMPTS */
    const PROMPTS = {
        single: `Act as a Senior Real Estate Investment Analyst. I am providing a property listing file for analysis. Please produce a "Comprehensive Investment Risk & Valuation Report" focusing on Short-Term Rental (STR) viability.

1. Executive Strategic Thesis: Classify this asset (e.g., "Cash Flow Cow," "Value Trap," "Appreciation Play").
2. Infrastructure Forensics (CRITICAL):
   - Analyze Sewer vs. Septic status. If Septic, flag occupancy cap risks based on bedroom count.
   - Assess mechanical vintage (e.g., Baseboard heat = high OpEx? 1970s build = Aluminum wiring risk?).
3. Regulatory & Friction Analysis:
   - Evaluate HOA fees and "Hidden Gate Taxes" (guest registration fees).
   - Identify zoning red flags for STR operation.
4. Financial Stress Test: Estimate "Silent" costs (Flood insurance, landscaping, snow removal).
5. Final Verdict: Provide a strict Buy/Pass recommendation.`,

        comparative: `Act as a Senior Real Estate Investment Analyst. I am providing multiple property listing files. Please produce a "Strategic Comparative Investment Matrix" ranking these assets for an STR portfolio.

1. Asset Ranking: Rank properties #1 to #N based on Risk-Adjusted Return.
2. The "Sewer Divide": Explicitly compare occupancy potential. (Central Sewer > Septic).
3. CapEx & OpEx Comparison: Compare heating systems, age of roof/mechanicals, and fixed HOA costs.
4. Deal Breakers: Highlight fatal flaws in lower-ranked assets (e.g., 1.5 baths, road noise, restrictive HOAs).
5. Recommendation: Which single asset offers the best blend of regulatory safety and yield?`
    };

    /* MAIN LOGIC */
    function init() {
        const cleanHTML = getCleanPageContent();
        createModal(cleanHTML);
    }

    function getCleanPageContent() {
        const clone = document.body.cloneNode(true);

        /* 1. Aggressive Noise Removal */
        const noiseSelectors = [
            'script', 'style', 'noscript', 'iframe', 'svg', 'button', 'input',
            'nav', 'footer', 'header', 'aside',
            '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]', '[role="dialog"]',
            '[id*="ad-"]', '[class*="ad-"]', '[class*="advert"]', '[id*="cookie"]',
            '.modal', '.popup', '.drawer', '.lightbox'
        ];
        noiseSelectors.forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));

        /* 2. Platform-Specific Targeting */
        /* We try to find the specific container for major sites to reduce clutter. */
        const host = window.location.hostname;
        let targetSelector = null;

        if (host.includes('realtor.com')) targetSelector = '#app-content, .main-content';
        else if (host.includes('zillow.com')) targetSelector = '#details-page-container, .ds-container';
        else if (host.includes('redfin.com')) targetSelector = '.DpHomeOverview, #content';
        else if (host.includes('trulia.com')) targetSelector = '[data-testid="home-details-summary"]';
        else if (host.includes('homes.com')) targetSelector = '.property-info';

        /* 3. Extraction */
        let content = null;
        if (targetSelector) {
            const found = clone.querySelector(targetSelector);
            if (found) content = found.innerHTML;
        }

        /* 4. Fallback (Semantic Main or Body) */
        if (!content) {
            const main = clone.querySelector('main') || clone.querySelector('[role="main"]') || clone.querySelector('article');
            content = main ? main.innerHTML : clone.innerHTML;
        }

        return content;
    }

    function createModal(content) {
        const overlay = document.createElement('div');
        overlay.id = CONFIG.overlayId;

        const modal = document.createElement('div');
        modal.id = CONFIG.modalId;

        /* --- HEADER --- */
        const header = document.createElement('div');
        header.className = 'pc-header';
        header.innerHTML = '<strong>Property Clipper</strong> <span style="font-weight:normal; opacity:0.7">| Investment Research Tool</span>';

        /* --- SECTION 1: PROMPT CONFIG --- */
        const promptSection = document.createElement('div');
        promptSection.className = 'pc-section pc-prompt-bg';

        const controls = document.createElement('div');
        controls.style.marginBottom = '8px';
        controls.style.display = 'flex';
        controls.style.justifyContent = 'space-between';
        controls.style.alignItems = 'center';

        const label = document.createElement('label');
        label.innerHTML = '<strong>Analysis Mode:</strong>';

        const select = document.createElement('select');
        select.innerHTML = `
            <option value="single">Single Property Deep Dive</option>
            <option value="comparative">Comparative Matrix (Multi-File)</option>
        `;
        select.style.marginLeft = '10px';
        select.style.padding = '4px';

        const promptBox = document.createElement('textarea');
        promptBox.className = 'pc-prompt-box';
        promptBox.readOnly = true;
        promptBox.value = PROMPTS.single;

        select.onchange = (e) => promptBox.value = PROMPTS[e.target.value];

        const copyBtn = document.createElement('button');
        copyBtn.textContent = "Copy Prompt for Gemini";
        copyBtn.className = 'pc-btn primary';
        copyBtn.style.width = '100%';
        copyBtn.style.marginTop = '8px';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(promptBox.value);
            copyBtn.textContent = "Copied to Clipboard!";
            setTimeout(() => copyBtn.textContent = "Copy Prompt for Gemini", 2000);
        };

        controls.appendChild(label);
        controls.appendChild(select);
        promptSection.appendChild(controls);
        promptSection.appendChild(promptBox);
        promptSection.appendChild(copyBtn);

        /* --- SECTION 2: LISTING PREVIEW --- */
        const contentSection = document.createElement('div');
        contentSection.className = 'pc-content-section';
        const contentHeader = document.createElement('div');
        contentHeader.style.padding = '10px 15px';
        contentHeader.style.borderBottom = '1px solid #eee';
        contentHeader.innerHTML = '<strong>Extracted Listing Data</strong> <span style="font-size:11px; color:#666">(Cleaned HTML)</span>';

        const contentArea = document.createElement('div');
        contentArea.className = 'pc-content-area';
        contentArea.contentEditable = true;
        contentArea.innerHTML = content;

        contentSection.appendChild(contentHeader);
        contentSection.appendChild(contentArea);

        /* --- FOOTER --- */
        const footer = document.createElement('div');
        footer.className = 'pc-footer';

        const dlBtn = document.createElement('button');
        dlBtn.textContent = "Download Analysis File";
        dlBtn.className = 'pc-btn success';
        dlBtn.onclick = () => handleDownload(contentArea.innerHTML);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = "Close";
        closeBtn.className = 'pc-btn';
        closeBtn.onclick = () => overlay.remove();

        footer.appendChild(closeBtn);
        footer.appendChild(dlBtn);

        modal.appendChild(header);
        modal.appendChild(promptSection);
        modal.appendChild(contentSection);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        /* --- STYLES --- */
        const style = document.createElement('style');
        style.textContent = `
            #${CONFIG.overlayId} { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999999; display: flex; justify-content: center; align-items: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #${CONFIG.modalId} { background: white; width: 90%; max-width: 800px; height: 90vh; display: flex; flex-direction: column; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
            .pc-header { padding: 15px 20px; background: #fff; border-bottom: 1px solid #ddd; font-size: 16px; color: #333; }
            .pc-section { padding: 15px 20px; border-bottom: 1px solid #eee; }
            .pc-prompt-bg { background: #f8f9fa; }
            .pc-prompt-box { width: 100%; height: 80px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 11px; resize: vertical; display: block; box-sizing: border-box; }
            .pc-content-section { flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; background: white; }
            .pc-content-area { flex-grow: 1; overflow-y: auto; padding: 20px; font-size: 13px; line-height: 1.5; color: #333; }
            .pc-footer { padding: 15px 20px; background: #fff; border-top: 1px solid #ddd; display: flex; justify-content: flex-end; gap: 10px; }
            .pc-btn { padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
            .pc-btn:hover { background: #f0f0f0; }
            .pc-btn.primary { background: #3b82f6; color: white; border: none; }
            .pc-btn.primary:hover { background: #2563eb; }
            .pc-btn.success { background: #10b981; color: white; border: none; }
            .pc-btn.success:hover { background: #059669; }
            .pc-content-area img { max-width: 150px; height: auto; opacity: 0.7; display: block; margin: 10px 0; }
        `;
        overlay.appendChild(style);
    }

    function handleDownload(htmlContent) {
        const title = (document.title || 'Property').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const filename = `${CONFIG.filenamePrefix}${title}_${Date.now()}.html`;
        const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${htmlContent}</body></html>`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([fullHTML], {type: 'text/html'}));
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    init();
})();
