(function(w) {
    w.PropertyClipperLib = w.PropertyClipperLib || {};
    const Lib = w.PropertyClipperLib;

    /* 4. PDF GENERATOR */
    Lib.PDFGenerator = {
        create: async (data, selectedPhotos, statusCb) => {
            await BookmarkletUtils.loadLibrary('jspdf', Lib.CONFIG.jspdfUrl);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });

            const margin = 15;
            let y = 20;
            const pageWidth = 210;
            const contentWidth = pageWidth - (margin * 2);

            // --- PAGE 1 ---
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(data.address, margin, y);
            y += 8;

            doc.setFontSize(14);
            doc.setTextColor(37, 99, 235);
            doc.text(data.price, margin, y);
            doc.setTextColor(0);
            y += 15;

            // HERO IMAGE (Replaces Prompt Box)
            const heroUrl = data.heroUrl || (selectedPhotos.length > 0 ? selectedPhotos[0].url : null);
            if (heroUrl) {
                if(statusCb) statusCb('Processing Hero Image...');
                const heroProcessed = await Lib.ImageProcessor.process(heroUrl);

                if (heroProcessed) {
                    const heroWidth = contentWidth;
                    let heroHeight = contentWidth / heroProcessed.ratio;

                    // Cap max height for Page 1 hero (e.g., 90mm)
                    if (heroHeight > 90) {
                        heroHeight = 90;
                    }

                    doc.addImage(heroProcessed.dataUrl, 'JPEG', margin, y, heroWidth, heroHeight);
                    y += heroHeight + 10;
                }
            }

            // Page Break Check (If hero was huge)
            if (y > 220) { doc.addPage(); y = 20; }

            // --- DATA GRIDS (Page 1) ---

            // Helper to render a grid section
            const renderGrid = (title, items, boxWidth = 43) => {
                if (!items || Object.keys(items).length === 0) return;

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
                    // Check width overflow
                    if (margin + (col * (boxWidth + gap)) + boxWidth > pageWidth - margin) {
                        col = 0;
                        y += boxH + gap;
                    }

                    // Check page overflow
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
                y += boxH + 10; // Space after grid
            };

            // 1. Primary Property Specs
            // "Primary Property Specs": (Price, Beds, Baths, Sq. Ft., Lot Size, Year Built, HOA, Taxes).
            const primarySpecs = {};
            primarySpecs['Price'] = data.price;
            const targetSpecs = ['Beds', 'Baths', 'Sq. Ft.', 'Lot Size', 'Year Built'];
            targetSpecs.forEach(k => { if (data.specs[k]) primarySpecs[k] = data.specs[k]; });
            if (data.financials['HOA Fees']) primarySpecs['HOA Fees'] = data.financials['HOA Fees'];
            if (data.financials['Taxes']) primarySpecs['Taxes'] = data.financials['Taxes'];

            renderGrid("Primary Property Specs", primarySpecs, 43);

            // 2. Market Context & Medians
            // "Market Context & Medians": (Days on Market, Listing Price Median, Sold Price Median, Price/SqFt Median).
            renderGrid("Market Context & Medians", data.market, 43);

            // --- SELLER/LISTING AGENT DESCRIPTION ---
            if (y > 240) { doc.addPage(); y = 20; }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14); // Explicitly requested header size/style
            doc.setTextColor(0, 0, 0);
            doc.text("Seller/Listing Agent Description", margin, y);
            y += 8;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10); // Readable size
            doc.setTextColor(50, 50, 50);

            // "Ensure the line height and paragraph width are comfortable"
            // We use slightly narrower width for better readability if space permits,
            // but here we use contentWidth to maximize space on the page.
            // Using 1.5 line spacing (default is often 1.15 in jsPDF).
            const descLines = doc.splitTextToSize(data.description, contentWidth);
            doc.text(descLines, margin, y, { lineHeightFactor: 1.5 });

            // Calculate height used by description
            const descHeight = descLines.length * 10 * 1.5 * 0.3527777778; // pt to mm approx
            y += descHeight + 15;

            // --- PROPERTY HISTORY ---
            if (data.history && data.history.length > 0) {
                if (y > 220) { doc.addPage(); y = 20; }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text("Property History", margin, y);
                y += 8;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                data.history.forEach(h => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    // Format: [YYYY-MM-DD] - [Event] - [Price]
                    const line = `${h.date || 'N/A'} - ${h.event || 'Event'} - ${h.price || '-'}`;
                    doc.text(line, margin, y);
                    y += 6;
                });
                y += 10;
            }

            // --- PHOTO APPENDIX ---
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
                    const res = await Lib.ImageProcessor.process(photo.url);
                    processedCount++;
                    if (statusCb) statusCb(`Processing photos (${processedCount}/${selectedPhotos.length})...`);
                    return res;
                }));

                for (let i = 0; i < selectedPhotos.length; i++) {
                    const photo = selectedPhotos[i];
                    const processed = processedResults[i];
                    if (!processed) continue;

                    // Calculate dimensions to fit 2 landscape photos per page
                    // Available height per page ~260mm.
                    // Target height per photo block (including caption/gap) ~130mm.
                    // Block overhead: Caption (5mm) + Gap (15mm) = 20mm.
                    // Max Image Height = 130 - 20 = 110mm.
                    // To fit 2 on the first page (with header), we need slightly less:
                    // 280 (limit) - 30 (start y with header) = 250. 250 / 2 = 125 per block.
                    // 125 - 20 overhead = 105mm.

                    const MAX_IMG_HEIGHT = 105;

                    let finalH = contentWidth / processed.ratio;
                    let finalW = contentWidth;

                    if (finalH > MAX_IMG_HEIGHT) {
                        finalH = MAX_IMG_HEIGHT;
                        finalW = finalH * processed.ratio;
                    }

                    // Check if we need a new page
                    // Need space for Caption (5mm) + Image (finalH) + Gap (15mm)
                    if (y + finalH + 20 > 280) {
                        doc.addPage();
                        y = 20;
                    }

                    // Draw Caption
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(50, 50, 50);
                    const label = (photo.label || 'Property Photo').toUpperCase();
                    doc.text(label, margin, y);
                    y += 5;

                    // Center the image if it was scaled down
                    const x = margin + (contentWidth - finalW) / 2;
                    doc.addImage(processed.dataUrl, 'JPEG', x, y, finalW, finalH);
                    y += finalH + 15;
                }
            }

            // --- RAW DATA ---
            if (data.raw) {
                doc.addPage();
                doc.setFont('courier', 'normal');
                doc.setFontSize(8);
                doc.text("RAW PROPERTY DATA (For AI Context)", margin, 15);

                // Minified JSON
                const jsonStr = JSON.stringify(data.raw);
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

            doc.save(`${Lib.generateFilename(data.address)}.pdf`);
        }
    };
})(window);
