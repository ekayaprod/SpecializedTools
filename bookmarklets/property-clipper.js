(function () {
    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'pc-pdf-modal',
        overlayId: 'pc-pdf-overlay',
        filenamePrefix: 'Property_Report',
        // Libraries required for PDF generation
        jspdfUrl: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        jspdfIntegrity: 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk',
        // Max width for images in PDF (pixels) - ensures manageable file size
        imgMaxWidth: 1000,
        imgQuality: 0.7 // JPEG quality 0-1
    };

    /* PROMPT LIBRARY */
    const STANDARD_OUTPUTS = `
EXPECTED DELIVERABLES:
- **Executive Summary & Verdict**: Investment Grade (Strong Buy / Qualified Buy / Hard Pass).
- **Hidden Insights**: Off-page data, regulations, true costs.
- **Financial Reality Check**: True cash flow, silent costs, CapEx.
- **Visual & Condition Audit**: Analyze the appended Photo Gallery. Look for wear, renovation quality, and layout flow.
`;

    const PROMPT_DATA = {
        str: { label: "Short-Term Rental (STR)", role: "Act as a Senior STR Analyst.", objective: 'Analyze macro/micro location, saturation, regulations, and revenue potential.' },
        ltr: { label: "Long-Term Rental (LTR)", role: "Act as a Senior Buy-and-Hold Analyst.", objective: 'Analyze population growth, tenant demographics, and cash flow stability.' },
        flip: { label: "Fix & Flip", role: "Act as a Fix-and-Flip Project Manager.", objective: 'Estimate ARV, rehab CapEx based on visual condition, and identify structural risks.' },
        househack: { label: "House Hacking", role: "Act as a House Hacking Specialist.", objective: 'Analyze layout for unit-splitting/ADU potential and zoning compliance.' }
    };

    /* UTILITIES */
    const buildElement = (tag, styles = {}, text = '', parent = null, props = {}) => {
        const el = document.createElement(tag);
        if (text) el.textContent = text;
        Object.assign(el.style, styles);
        Object.assign(el, props);
        if (parent) parent.appendChild(el);
        return el;
    };

    const formatCurrency = (val) => (val != null) ? '$' + Number(val).toLocaleString() : 'N/A';

    /* 1. CORE EXTRACTOR */
    const PropertyExtractor = {
        // Helper to extract clean data from the raw property details object
        parseDetails: function(pd, data) {
             data.raw = pd;
                        
            // Basic Info
            const loc = pd.location?.address;
            if (loc) data.address = `${loc.line || ''}, ${loc.city || ''}, ${loc.state_code || ''} ${loc.postal_code || ''}`.replace(/^, | ,/g, '').trim();
            if (pd.list_price) data.price = formatCurrency(pd.list_price);
            
            // Description
            data.description = pd.description?.text || '';

            // Specs
            const desc = pd.description || {};
            if (desc.beds) data.specs['Beds'] = desc.beds;
            if (desc.baths_consolidated) data.specs['Baths'] = desc.baths_consolidated;
            if (desc.sqft) data.specs['Sq. Ft.'] = desc.sqft.toLocaleString();
            if (desc.lot_sqft) data.specs['Lot Size'] = (desc.lot_sqft / 43560).toFixed(2) + ' Acres';
            if (desc.year_built) data.specs['Year Built'] = desc.year_built;

            // Financials
            if (pd.mortgage?.estimate) {
                data.financials['Est. Payment'] = formatCurrency(pd.mortgage.estimate.monthly_payment);
                const tax = pd.mortgage.estimate.monthly_payment_details?.find(d => d.type === 'property_tax');
                if (tax) data.financials['Tax'] = formatCurrency(tax.amount);
                
                const hoa = pd.mortgage.estimate.monthly_payment_details?.find(d => d.type === 'hoa_fees');
                if (hoa) data.financials['HOA'] = formatCurrency(hoa.amount);
            }

            // Features
            if (pd.details && Array.isArray(pd.details)) data.features = pd.details;

            // SMART PHOTO EXTRACTION (Group by Category)
            if (pd.augmented_gallery && Array.isArray(pd.augmented_gallery)) {
                pd.augmented_gallery.forEach(group => {
                    // Skip the "all_photos" duplicate group
                    if (group.key === 'all_photos') return;
                    
                    const categoryName = group.category || group.key || 'Other';
                    const validPhotos = (group.photos || [])
                        .filter(p => p.href)
                        .map(p => ({
                            // Try to grab higher res if available in standard RDCPix format
                            url: p.href.replace('s.jpg', 'od-w1024_h768.webp'), 
                            label: categoryName
                        }));
                    
                    if (validPhotos.length > 0) {
                        data.photoGroups.push({
                            category: categoryName,
                            photos: validPhotos
                        });
                    }
                });
            }

            // Fallback if no groups found but photos exist
            if (data.photoGroups.length === 0 && pd.photos) {
                data.photoGroups.push({
                    category: 'Gallery',
                    photos: pd.photos.map(p => ({ url: p.href, label: 'Property Photo' }))
                });
            }
        },

        getData: function () {
            let data = {
                address: 'Unknown Address', price: 'Unknown Price', specs: {},
                financials: {}, history: {}, agents: [], description: '', features: [],
                photoGroups: [], // { category: string, photos: [] }
                raw: null
            };

            try {
                // 1. Try Realtor.com Live Data (Standard)
                const nextDataNode = document.getElementById('__NEXT_DATA__');
                
                // 2. Try Offline Report Data (Fallback for generated HTML reports)
                const rawPreNode = document.querySelector('.raw-data pre');

                if (nextDataNode) {
                    const jsonData = JSON.parse(nextDataNode.textContent);
                    const pd = jsonData?.props?.pageProps?.initialReduxState?.propertyDetails;
                    if (pd) PropertyExtractor.parseDetails(pd, data);
                } else if (rawPreNode) {
                    // Extract from the pre-generated report's raw data block
                    const pd = JSON.parse(rawPreNode.textContent);
                    if (pd) PropertyExtractor.parseDetails(pd, data);
                }
            } catch (e) {
                console.warn('Extraction Warning:', e);
            }

            // DOM Fallback for essentials if extraction failed
            if (data.address === 'Unknown Address') data.address = document.querySelector('h1')?.innerText || data.address;
            
            return data;
        }
    };

    /* 2. IMAGE PROCESSOR (Resize & Base64) */
    const ImageProcessor = {
        process: async (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize logic
                    if (width > CONFIG.imgMaxWidth) {
                        height = Math.round(height * (CONFIG.imgMaxWidth / width));
                        width = CONFIG.imgMaxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', CONFIG.imgQuality);
                        resolve({ dataUrl, width, height, ratio: width / height });
                    } catch (e) {
                        console.warn('Image processing failed for', url, e);
                        resolve(null); // Canvas tainted (CORS failure)
                    }
                };
                img.onerror = () => resolve(null);
                img.src = url;
            });
        }
    };

    /* 3. PDF GENERATOR */
    const PDFGenerator = {
        loadLib: async () => {
            if (window.jspdf) return;
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = CONFIG.jspdfUrl;
                script.integrity = CONFIG.jspdfIntegrity;
                script.crossOrigin = 'anonymous';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        },

        create: async (data, selectedPhotos, promptData, statusCb) => {
            await PDFGenerator.loadLib();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' }); // 210 x 297 mm
            
            const margin = 15;
            let y = 20;
            const pageWidth = 210;
            const contentWidth = pageWidth - (margin * 2);

            // --- PAGE 1: REPORT HEADER & SPECS ---
            
            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(data.address, margin, y);
            y += 10;

            // Price
            doc.setFontSize(14);
            doc.setTextColor(37, 99, 235); // Blue
            doc.text(data.price, margin, y);
            doc.setTextColor(0); // Reset black
            y += 15;

            // Prompt Box
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y, contentWidth, 35, 'F');
            doc.setFontSize(10);
            doc.setFont('courier', 'normal');
            const splitPrompt = doc.splitTextToSize(`ANALYSIS OBJECTIVE: ${promptData.label}\n\n${promptData.objective}`, contentWidth - 10);
            doc.text(splitPrompt, margin + 5, y + 7);
            y += 45;

            // Specs Grid (Simple text layout)
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text("Property Details", margin, y);
            y += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const specs = { ...data.specs, ...data.financials };
            const keys = Object.keys(specs);
            let xOffset = margin;
            keys.forEach((k, i) => {
                doc.text(`${k}: ${specs[k]}`, xOffset, y);
                // 2 columns
                if (i % 2 === 0) xOffset += 90;
                else {
                    xOffset = margin;
                    y += 6;
                }
            });
            y += 10;

            // Description
            if (y > 250) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text("Description", margin, y);
            y += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(data.description, contentWidth);
            doc.text(descLines, margin, y);
            
            // --- PHOTO APPENDIX (2x3 Grid) ---
            if (selectedPhotos.length > 0) {
                doc.addPage();
                y = 20;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(16);
                doc.text("Photo Appendix", margin, y);
                y += 10;

                const colWidth = 85; 
                const rowHeight = 65; // Fixed height allocated for image + label
                const imgMaxH = 55;   // Max height for actual image
                const gap = 10;

                let col = 0;
                let row = 0; // 0, 1, 2

                for (let i = 0; i < selectedPhotos.length; i++) {
                    const photo = selectedPhotos[i];
                    statusCb(`Processing photo ${i+1}/${selectedPhotos.length}`);
                    
                    const processed = await ImageProcessor.process(photo.url);
                    if (!processed) continue; // Skip broken images

                    // Check page break
                    if (row > 2) {
                        doc.addPage();
                        row = 0;
                        col = 0;
                        y = 20;
                    }

                    const xPos = margin + (col * (colWidth + gap));
                    const yPos = y + (row * (rowHeight + gap));

                    // Label (Room Name)
                    doc.setFontSize(9);
                    doc.setFont('helvetica', 'bold');
                    // Ensure label fits
                    const label = (photo.label || 'Photo').substring(0, 40);
                    doc.text(label, xPos, yPos);

                    // Image placement
                    const imgY = yPos + 3;
                    
                    // Calc dimensions to fit in box
                    let finalW = colWidth;
                    let finalH = colWidth / processed.ratio;

                    if (finalH > imgMaxH) {
                        finalH = imgMaxH;
                        finalW = imgMaxH * processed.ratio;
                    }

                    doc.addImage(processed.dataUrl, 'JPEG', xPos, imgY, finalW, finalH);

                    col++;
                    if (col > 1) {
                        col = 0;
                        row++;
                    }
                }
            }

            // --- RAW DATA ---
            if (data.raw) {
                doc.addPage();
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.text("RAW PROPERTY DATA (For AI Context)", margin, 15);
                
                const jsonStr = JSON.stringify(data.raw, null, 2);
                const lines = doc.splitTextToSize(jsonStr, contentWidth);
                
                // Simple pagination for massive JSON
                let lineIdx = 0;
                let pageY = 20;
                while (lineIdx < lines.length) {
                    if (pageY > 280) {
                        doc.addPage();
                        pageY = 15;
                    }
                    doc.text(lines[lineIdx], margin, pageY);
                    pageY += 4; // Line height
                    lineIdx++;
                }
            }

            doc.save(`${data.address || 'Property_Report'}.pdf`);
        }
    };

    /* 4. WIZARD UI */
    const Wizard = {
        state: {
            data: null,
            prompt: null,
            mode: null, // 'all' or 'manual'
            step: 0,
            selectedPhotos: [] // Flat array of {url, label}
        },

        init: (data, promptKey) => {
            Wizard.state.data = data;
            Wizard.state.prompt = PROMPT_DATA[promptKey];
            Wizard.state.selectedPhotos = [];
            Wizard.state.step = 0;
            Wizard.renderStartScreen();
        },

        renderModalFrame: (title) => {
            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = '';
            
            // Header
            const header = buildElement('div', { 
                borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }, '', container);
            
            buildElement('h3', { margin: 0, fontSize: '18px' }, title, header);
            
            // Content Area
            const content = buildElement('div', { 
                flex: '1', overflowY: 'auto', minHeight: '300px', maxHeight: '500px'
            }, '', container);

            // Footer
            const footer = buildElement('div', { 
                borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px',
                display: 'flex', justifyContent: 'flex-end', gap: '10px'
            }, '', container);

            return { content, footer };
        },

        renderStartScreen: () => {
            const { content, footer } = Wizard.renderModalFrame('Select Photo Strategy');
            
            const totalPhotos = Wizard.state.data.photoGroups.reduce((acc, g) => acc + g.photos.length, 0);
            const groupsCount = Wizard.state.data.photoGroups.length;
            
            // Calculate rooms that actually need review (>1 photo)
            const interactiveCount = Wizard.state.data.photoGroups.filter(g => g.photos.length > 1).length;
            const autoCount = groupsCount - interactiveCount;

            const makeChoice = (title, sub, onClick) => {
                const box = buildElement('div', {
                    border: '1px solid #ddd', borderRadius: '8px', padding: '15px',
                    marginBottom: '10px', cursor: 'pointer', transition: '0.2s', backgroundColor: '#f9f9f9'
                }, '', content);
                box.onmouseover = () => box.style.background = '#eff6ff';
                box.onmouseout = () => box.style.background = '#f9f9f9';
                
                buildElement('div', { fontWeight: 'bold', marginBottom: '4px' }, title, box);
                buildElement('div', { fontSize: '13px', color: '#666' }, sub, box);
                box.onclick = onClick;
            };

            makeChoice(`Include All Photos (${totalPhotos})`, 'Fastest. Includes every available photo in the report.', () => {
                // Flatten all
                Wizard.state.selectedPhotos = Wizard.state.data.photoGroups.flatMap(g => g.photos);
                Wizard.generate();
            });

            makeChoice(`Manual Selection (${interactiveCount} Rooms)`, `Curated. You will review ${interactiveCount} rooms. ${autoCount} single-photo rooms will be added automatically.`, () => {
                Wizard.state.mode = 'manual';
                Wizard.renderStep();
            });
            
            // Footer
            buildElement('button', { padding: '8px 15px', cursor: 'pointer' }, 'Cancel', footer).onclick = closeModal;
        },

        renderStep: () => {
            const groupIndex = Wizard.state.step;
            const groups = Wizard.state.data.photoGroups;

            // Finish Condition
            if (groupIndex >= groups.length) {
                Wizard.generate();
                return;
            }

            const group = groups[groupIndex];

            // AUTO-SKIP: If only 1 photo, add it automatically and skip UI
            if (group.photos.length === 1) {
                Wizard.state.selectedPhotos.push(group.photos[0]);
                Wizard.state.step++;
                Wizard.renderStep(); // Recursively call next step to find next interactive group
                return;
            }

            const { content, footer } = Wizard.renderModalFrame(`Step ${groupIndex + 1} of ${groups.length}: ${group.category}`);

            // Toolbar
            const toolbar = buildElement('div', { marginBottom: '10px', display: 'flex', gap: '10px', fontSize: '12px' }, '', content);
            const btnSelectAll = buildElement('button', {}, 'Select All', toolbar);
            const btnSelectNone = buildElement('button', {}, 'Select None', toolbar);

            // Grid
            const grid = buildElement('div', { 
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px'
            }, '', content);

            // Checkboxes ref
            const checks = [];

            group.photos.forEach(photo => {
                const wrapper = buildElement('div', { position: 'relative', height: '100px' }, '', grid);
                
                const img = buildElement('img', { 
                    width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '2px solid transparent'
                }, '', wrapper, { src: photo.url });

                const check = buildElement('input', { 
                    type: 'checkbox', 
                    position: 'absolute', top: '5px', left: '5px', transform: 'scale(1.2)'
                }, '', wrapper);
                
                // Toggle logic
                const toggle = (force) => {
                    check.checked = (force !== undefined) ? force : !check.checked;
                    img.style.borderColor = check.checked ? '#2563eb' : 'transparent';
                    img.style.opacity = check.checked ? '1' : '0.7';
                };

                // Default: Select first photo of every room automatically? 
                // Let's default to selecting NONE so user actively picks, OR Select ALL.
                // User said "present user with options". Let's Select ALL by default for convenience.
                toggle(true);

                wrapper.onclick = (e) => { if (e.target !== check) toggle(); };
                check.onclick = (e) => e.stopPropagation(); // prevent double toggle
                
                checks.push({ check, photo });
            });

            // Toolbar Actions
            btnSelectAll.onclick = () => checks.forEach(c => { c.check.checked = true; c.check.nextSibling.style.borderColor = '#2563eb'; });
            btnSelectNone.onclick = () => checks.forEach(c => { c.check.checked = false; c.check.nextSibling.style.borderColor = 'transparent'; });

            // Footer Nav
            const saveSelection = () => {
                const selected = checks.filter(c => c.check.checked).map(c => c.photo);
                Wizard.state.selectedPhotos.push(...selected);
            };

            const btnNext = buildElement('button', { 
                backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
            }, 'Next Category >', footer);
            
            btnNext.onclick = () => {
                saveSelection();
                Wizard.state.step++;
                Wizard.renderStep();
            };

            const btnFinish = buildElement('button', { 
                background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', marginRight: 'auto'
            }, 'Finish & Generate Now', footer);
            
            btnFinish.onclick = () => {
                saveSelection();
                Wizard.generate();
            };
        },

        generate: () => {
            const container = document.getElementById(CONFIG.modalId);
            container.innerHTML = '<div style="padding:40px;text-align:center;"><h3>Generating PDF...</h3><div id="pdf-status" style="margin-top:10px;color:#666">Initializing...</div></div>';
            
            const updateStatus = (msg) => {
                const el = document.getElementById('pdf-status');
                if (el) el.innerText = msg;
            };

            // Capture raw output
            console.log('Generating PDF with', Wizard.state.selectedPhotos.length, 'photos');
            
            PDFGenerator.create(Wizard.state.data, Wizard.state.selectedPhotos, Wizard.state.prompt, updateStatus)
                .then(() => {
                    closeModal();
                })
                .catch(err => {
                    updateStatus('Error: ' + err.message);
                    console.error(err);
                });
        }
    };

    /* MAIN UI */
    function createPersonaModal() {
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
            backgroundColor: '#ffffff', padding: '0', borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            zIndex: '999999', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            fontFamily: 'system-ui, sans-serif'
        }, '', fragment);
        modal.id = CONFIG.modalId;

        // Initial Persona Selection Screen
        const pContainer = buildElement('div', { padding: '30px' }, '', modal);
        buildElement('h2', { margin: '0 0 20px 0', textAlign: 'center' }, 'AI Property Analysis', pContainer);
        
        const btnDiv = buildElement('div', { display: 'grid', gap: '10px' }, '', pContainer);
        
        Object.entries(PROMPT_DATA).forEach(([key, prompt]) => {
            const btn = buildElement('button', {
                padding: '12px', border: '1px solid #ddd', borderRadius: '6px',
                background: '#f8f9fa', cursor: 'pointer', textAlign: 'left', fontWeight: '500'
            }, prompt.label, btnDiv);
            
            btn.onclick = () => {
                // Extract Data First
                const data = PropertyExtractor.getData();
                if (!data.raw) {
                     alert("Warning: Could not find raw hidden data. Report will be limited.");
                }
                
                // Launch Wizard
                Wizard.init(data, key);
            };
        });

        const cancel = buildElement('button', { 
            marginTop: '20px', width: '100%', padding: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' 
        }, 'Cancel', pContainer);
        cancel.onclick = closeModal;

        document.body.appendChild(fragment);
    }

    function closeModal() {
        document.getElementById(CONFIG.modalId)?.remove();
        document.getElementById(CONFIG.overlayId)?.remove();
    }

    createPersonaModal();
})();
