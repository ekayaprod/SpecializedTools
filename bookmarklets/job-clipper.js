(function () {
    /** @require utils.js */

    /* CONFIGURATION */
    const CONFIG = {
        modalId: 'jc-job-modal',
        overlayId: 'jc-job-overlay',
    };

    /* UTILITIES */
    const buildElement = BookmarkletUtils.buildElement;

    /**
     * Injects the necessary CSS styles for the UI.
     */
    const injectStyles = () => {
        const styleId = 'jc-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            :root {
                --jc-primary: #d946ef; /* fuchsia-500 */
                --jc-primary-hover: #c026d3; /* fuchsia-600 */
                --jc-bg: #ffffff;
                --jc-text: #1f2937;
                --jc-border: #e5e7eb;
                --jc-radius: 12px;
                --jc-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            @keyframes jc-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes jc-slide-up { from { transform: translate(-50%, -45%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }

            .jc-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999998;
                backdrop-filter: blur(4px); animation: jc-fade-in 0.2s ease-out;
            }
            .jc-modal {
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: var(--jc-bg); padding: 24px; width: 500px; max-width: 90vw;
                border-radius: var(--jc-radius); z-index: 999999;
                box-shadow: var(--jc-shadow); font-family: system-ui, -apple-system, sans-serif;
                display: flex; flex-direction: column; gap: 16px; color: var(--jc-text);
                animation: jc-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .jc-header { margin: 0; font-size: 20px; font-weight: 700; text-align: center; color: var(--jc-primary); }
            .jc-col { display: flex; flex-direction: column; gap: 6px; flex: 1; }
            .jc-label { font-size: 13px; font-weight: 600; color: #4b5563; }
            .jc-textarea {
                width: 100%; padding: 10px; border: 1px solid var(--jc-border); border-radius: 6px;
                font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;
                resize: vertical; min-height: 250px; font-family: monospace; white-space: pre-wrap;
            }
            .jc-textarea:focus {
                outline: none; border-color: var(--jc-primary); ring: 2px solid rgba(217,70,239,0.1);
            }
            .jc-btn {
                display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                padding: 10px 16px; border-radius: 6px; font-weight: 500; font-size: 14px;
                cursor: pointer; transition: all 0.2s; border: 1px solid transparent;
                text-decoration: none; line-height: 1.2;
            }
            .jc-btn:active { transform: scale(0.98); }
            .jc-btn:disabled { opacity: 0.7; cursor: not-allowed; }

            .jc-btn-primary { background: var(--jc-primary); color: white; border: 1px solid var(--jc-primary); }
            .jc-btn-primary:hover:not(:disabled) { background: var(--jc-primary-hover); border-color: var(--jc-primary-hover); }

            .jc-btn-ghost { background: transparent; color: #6b7280; }
            .jc-btn-ghost:hover:not(:disabled) { background: #f9fafb; color: #374151; }

            .jc-btn-success { background: #10b981; color: white; border-color: #10b981; }
            .jc-btn-success:hover:not(:disabled) { background: #059669; border-color: #059669; }

            .jc-icon { width: 16px; height: 16px; stroke-width: 2px; flex-shrink: 0; }

            @media (prefers-reduced-motion: reduce) {
                .jc-overlay, .jc-modal, .jc-btn { animation: none; transition: none; }
            }
        `;
        document.head.appendChild(style);
    };

    /* ICONS (Feather) */
    const ICONS = {
        copy: '<svg aria-hidden="true" class="jc-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        check: '<svg aria-hidden="true" class="jc-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        x: '<svg aria-hidden="true" class="jc-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    };

    /* EXTRACTOR */
    const JobExtractor = {
        _getText(selectors, context = document) {
            for (const selector of selectors) {
                try {
                    const el = context.querySelector(selector);
                    if (el && el.textContent) {
                        return el.textContent.trim().replace(/\s+/g, ' ');
                    }
                } catch (e) {
                    /* ignore invalid selectors */
                }
            }
            return '';
        },

        extract() {
            const data = {
                title: '[Job Title]',
                company: '[Company]',
                salary: '[Salary Range]',
                description: '',
                keywords: [],
            };

            // 1. Title Extraction
            const titleSelectors = [
                'h1.t-24', // LinkedIn
                'h1.jobsearch-JobInfoHeader-title', // Indeed
                'div[data-test="job-title"]', // Glassdoor
                'h1.job-title',
                'h1.title',
                'h1',
            ];
            const title = this._getText(titleSelectors);
            if (title) data.title = title;

            // 2. Company Extraction
            const companySelectors = [
                '.job-details-jobs-unified-top-card__company-name', // LinkedIn
                'div[data-company-name="true"]', // Indeed
                'div[data-test="employer-name"]', // Glassdoor
                '.company-name',
                '.employer',
                'a.company',
            ];
            const company = this._getText(companySelectors);
            if (company) {
                // Remove ratings often appended to company names (e.g. "Google 4.5")
                data.company = company.replace(/\s*\d+(\.\d+)?\s*★*$/, '');
            }

            // 3. Salary Extraction
            const salarySelectors = [
                '.job-details-jobs-unified-top-card__job-insight:contains("$")', // LinkedIn
                '#salaryInfoAndJobType', // Indeed
                'span[data-test="detailSalary"]', // Glassdoor
                '.salary',
                '.pay-range',
                '.compensation',
            ];

            // Custom approach for Salary since it might not be a direct query selector match
            let salaryStr = '';
            for (const selector of salarySelectors) {
                if (selector.includes(':contains')) continue; // skip complex jquery-like selectors for now
                salaryStr = this._getText([selector]);
                if (salaryStr) break;
            }

            // Fallback for salary: regex match in body text
            if (!salaryStr) {
                 const bodyText = document.body ? (document.body.innerText || document.body.textContent || "") : "";
                 const salaryMatch = bodyText.match(/\$[0-9,]+(\.[0-9]{2})?(\s*[-to]+\s*\$[0-9,]+(\.[0-9]{2})?)?/);
                 if (salaryMatch) salaryStr = salaryMatch[0];
            }

            if (salaryStr) data.salary = salaryStr;

            // 4. Description Extraction
            const descSelectors = [
                '#job-details', // LinkedIn
                '#jobDescriptionText', // Indeed
                'div[data-test="jobDescriptionContent"]', // Glassdoor
                '.job-description',
                '.description',
                'article',
                'main',
            ];
            const descNode = document.querySelector(descSelectors.find(s => document.querySelector(s)) || 'body');

            if (descNode) {
                // Deep clone to not affect actual page
                const clone = descNode.cloneNode(true);
                // Remove tracking pixels / script tags
                const scripts = /** @type {HTMLElement} */ (clone).querySelectorAll('script, noscript, style, img, iframe');
                for (let i = 0; i < scripts.length; i++) {
                    scripts[i].remove();
                }

                data.description = /** @type {HTMLElement} */ (clone).innerText || clone.textContent || '';
            }

            // 5. Keyword analysis (Soft skills / Cultural cues)
            const softSkills = ['leadership', 'collaboration', 'fast-paced', 'mentorship', 'cross-functional', 'agile', 'startup', 'communication', 'self-starter', 'detail-oriented', 'strategic'];
            const lowerDesc = data.description.toLowerCase();
            data.keywords = softSkills.filter(skill => lowerDesc.includes(skill));

            return data;
        }
    };

    /* PROMPT GENERATOR */
    const PromptGenerator = {
        generate(data) {
            return `Act as an Expert ATS Optimizer and Senior Technical Recruiter at ${data.company}.

**Context:** I am applying for the "${data.title}" position.
${data.salary !== '[Salary Range]' ? '**Expected Salary Range:** ' + data.salary + '\n' : ''}
**Task:** Analyze the provided job description to extract the core technical requirements and key competencies. Pay special attention to these detected soft skills/cultural cues: ${data.keywords.length > 0 ? data.keywords.join(', ') : 'Not clearly defined'}.

Then, rewrite my existing resume bullet points (pasted below) to aggressively align with this specific role.

**Tone & Style Rules (CRITICAL):**
- **ATS Optimization:** Maximize exact-match keyword density from the job description without keyword stuffing. Use the exact terminology the company uses.
- **STAR Method:** Enforce the Situation, Task, Action, Result framework. EVERY bullet must start with a strong action verb and end with a quantifiable metric or concrete business impact.
- **Banned Words:** Eliminate passive or cliché phrases (e.g., "Responsible for," "Helped with," "Worked on," "Synergy," "Thought leader").
- **Format:** Output strictly as a Markdown list of bullet points. No conversational filler, introductory remarks, or concluding summaries.

--- JOB DESCRIPTION ---
${data.description.substring(0, 3000)}${data.description.length > 3000 ? '...[Truncated]' : ''}

--- MY RESUME BULLETS ---
[PASTE YOUR RESUME BULLETS HERE]`;
        }
    };


    /* MAIN UI */
    function createJobModal() {
        injectStyles();
        if (document.getElementById(CONFIG.modalId)) return;

        const ov = buildElement('div', {}, '', document.body, { id: CONFIG.overlayId, class: 'jc-overlay' });
        const mo = buildElement('div', {}, '', document.body, { id: CONFIG.modalId, class: 'jc-modal' });

        buildElement('h2', { class: 'jc-header' }, 'Resume Tailoring Prompt', mo);

        const data = JobExtractor.extract();
        if (!data.description || data.description.length < 50) {
            BookmarkletUtils.showToast('Warning: Could not extract full job description.', 'error');
        }

        const row2 = buildElement('div', { class: 'jc-col', flex: '1' }, '', mo);
        const txtArea = /** @type {HTMLTextAreaElement} */ (buildElement('textarea', {}, '', row2, { class: 'jc-textarea' }));
        txtArea.value = PromptGenerator.generate(data);

        // Actions Row
        const row3 = buildElement('div', {
            display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid var(--jc-border)', paddingTop: '15px'
        }, '', mo);

        const leftGroup = buildElement('div', { display: 'flex', gap: '8px' }, '', row3);
        const copyBtn = buildElement('button', {}, '', leftGroup, { class: 'jc-btn jc-btn-primary' });
        copyBtn.innerHTML = `${ICONS.copy} Copy Prompt`;

        copyBtn.onclick = () => {
            navigator.clipboard.writeText(txtArea.value);
            copyBtn.innerHTML = `${ICONS.check} Copied!`;
            copyBtn.classList.replace('jc-btn-primary', 'jc-btn-success');
            setTimeout(() => {
                copyBtn.innerHTML = `${ICONS.copy} Copy Prompt`;
                copyBtn.classList.replace('jc-btn-success', 'jc-btn-primary');
            }, 1500);
        };

        const rightGroup = buildElement('div', { display: 'flex', gap: '8px' }, '', row3);
        const cancelBtn = buildElement('button', {}, '', rightGroup, { class: 'jc-btn jc-btn-ghost' });
        cancelBtn.innerHTML = `${ICONS.x} Close`;
        cancelBtn.onclick = closeModal;
    }

    function closeModal() {
        document.getElementById(CONFIG.modalId)?.remove();
        document.getElementById(CONFIG.overlayId)?.remove();
    }

    createJobModal();
})();