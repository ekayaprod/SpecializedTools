(function (w) {
    /** @require utils.js */
    /** @require property-clipper-prompts.js */
    /** @require property-clipper-core.js */
    /** @require property-clipper-pdf.js */

    const Lib = w.PropertyClipperLib;

    // Shortcuts for convenience
    const { CONFIG, PropertyExtractor, ImageProcessor, PDFGenerator, formatCurrency, generateFilename, getFullPrompt } = Lib;
    const buildElement = BookmarkletUtils.buildElement;

    /* PROMPT LIBRARY (Loaded from property-clipper-prompts.js) */
    const { PROMPT_DATA } = (window.BookmarkletUtils && window.BookmarkletUtils.Prompts) || { PROMPT_DATA: {} };

    /* 3. HTML GENERATOR */
    const HTMLGenerator = {
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

    /* 5. WIZARD UI */
    const Wizard = {
        state: { data: null, step: 0, selectedPhotos: [], format: 'pdf' },
        
        init: (data, format) => {
            Wizard.state.data = data;
            Wizard.state.format = format;
            Wizard.state.selectedPhotos = [];
            Wizard.state.step = 0;
            Wizard.renderStart();
        },

        renderStart: () => {
            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = `<h3 style="margin-top:0">Select Photo Strategy (${Wizard.state.format.toUpperCase()})</h3>`;
            const total = Wizard.state.data.photoGroups.reduce((a, g) => a + g.photos.length, 0);
            
            const btnAll = buildElement('button', { width: '100%', padding: '15px', marginBottom: '10px', cursor: 'pointer', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', textAlign: 'left' }, `Include All Photos (${total})`, container);
            btnAll.onclick = () => {
                Wizard.state.selectedPhotos = Wizard.state.data.photoGroups.flatMap(g => g.photos);
                Wizard.generate();
            };

            const btnManual = buildElement('button', { width: '100%', padding: '15px', cursor: 'pointer', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'left' }, `Manual Selection`, container);
            btnManual.onclick = () => { Wizard.renderStep(); };
        },

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

            const nextBtn = buildElement('button', { marginTop: '15px', width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }, 'Next >', container);
            nextBtn.onclick = () => {
                Wizard.state.selectedPhotos.push(...checks.filter(c => c.chk.checked).map(c => c.p));
                Wizard.state.step++;
                Wizard.renderStep();
            };
        },

        generate: () => {
            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = '<div style="text-align:center;padding:20px"><h3>Generating...</h3><div id="pdf-status">Processing...</div></div>';
            
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
    function createPersonaModal() {
        if (document.getElementById(CONFIG.modalId)) return;
        const ov = buildElement('div', { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: '999998' }, '', document.body, { id: CONFIG.overlayId });
        const mo = buildElement('div', { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', padding: '25px', width: '500px', borderRadius: '12px', zIndex: '999999', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: '15px' }, '', document.body, { id: CONFIG.modalId });
        
        buildElement('h2', { margin: '0', textAlign: 'center', fontSize: '20px' }, 'Property Analysis Studio', mo);

        // Data Pre-fetch for Prompt Placeholders
        const data = PropertyExtractor.getData();
        if (!data.raw) BookmarkletUtils.showToast('Warning: Raw data not found. Report limited.', 'error');

        // 1. Dropdown
        const row1 = buildElement('div', { display: 'flex', flexDirection: 'column', gap: '5px' }, '', mo);
        buildElement('label', { fontSize: '12px', fontWeight: 'bold', color: '#555' }, 'Select Persona / Analysis Type:', row1);
        const select = buildElement('select', { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }, '', row1, { 'aria-label': 'Select Persona / Analysis Type' });
        
        Object.entries(PROMPT_DATA).forEach(([k, v]) => {
            const opt = buildElement('option', {}, v.label, select);
            opt.value = k;
        });

        // 2. Text Area
        const row2 = buildElement('div', { display: 'flex', flexDirection: 'column', gap: '5px', flex: '1' }, '', mo);
        buildElement('label', { fontSize: '12px', fontWeight: 'bold', color: '#555' }, 'Edit Prompt (Context for AI):', row2);
        const txtArea = buildElement('textarea', { width: '100%', height: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical' }, '', row2);
        
        // Update text area on change
        const updateText = () => { txtArea.value = getFullPrompt(select.value, data); };
        select.onchange = updateText;
        updateText(); // Init

        // 3. Actions Row
        const row3 = buildElement('div', { display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }, '', mo);
        
        const leftGroup = buildElement('div', { display: 'flex', gap: '5px' }, '', row3);
        const copyBtn = buildElement('button', { padding: '8px 12px', background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }, 'Copy Prompt', leftGroup);
        copyBtn.onclick = () => { navigator.clipboard.writeText(txtArea.value); copyBtn.innerText = 'Copied!'; setTimeout(() => copyBtn.innerText = 'Copy Prompt', 1500); };

        const rightGroup = buildElement('div', { display: 'flex', gap: '10px' }, '', row3);
        const cancelBtn = buildElement('button', { padding: '8px 12px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }, 'Cancel', rightGroup);
        
        const htmlBtn = buildElement('button', { padding: '10px 15px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }, 'Generate HTML', rightGroup);
        const pdfBtn = buildElement('button', { padding: '10px 15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }, 'Generate PDF', rightGroup);

        // Handlers
        const launchWizard = (fmt) => {
            Wizard.init(data, fmt);
        };

        cancelBtn.onclick = closeModal;
        htmlBtn.onclick = () => launchWizard('html');
        pdfBtn.onclick = () => launchWizard('pdf');
    }

    function closeModal() {
        document.getElementById(CONFIG.modalId)?.remove();
        document.getElementById(CONFIG.overlayId)?.remove();
    }

    createPersonaModal();
})(window);
