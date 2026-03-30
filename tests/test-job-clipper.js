const assert = require('assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Load script
const scriptPath = path.join(__dirname, '../bookmarklets/job-clipper.js');
const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
const utilsContent = fs.readFileSync(utilsPath, 'utf-8');

const regexToReplace = /}\)\(\);\s*$/;

// We need to extract JobExtractor to test it
// Since it's in an IIFE, we'll wrap it slightly or expose it to global
const testableScript = `
    ${utilsContent}
    window.BookmarkletUtils = window.BookmarkletUtils || {};
    window.requestAnimationFrame = window.requestAnimationFrame || function(cb) { return setTimeout(cb, 0); };

    // Strip IIFE to execute in our dom
    ${scriptContent.replace('(function () {', '').replace(regexToReplace, '')}

    window.JobExtractor = JobExtractor;
    window.PromptGenerator = PromptGenerator;
`;

function createDOM(html) {
    const dom = new JSDOM(html, { runScripts: 'dangerously' });
    const el = dom.window.document.createElement('script');
    el.textContent = testableScript;
    dom.window.document.body.appendChild(el);
    return dom.window;
}

function runTests() {
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ ${name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${name}`);
            console.error(e.message);
            failed++;
        }
    }

    // --- TEST SUITE --- //

    test('JobExtractor - extracts title, company, salary from generic DOM', () => {
        const win = createDOM(`
            <h1 class="title">Senior Software Engineer</h1>
            <div class="company-name">Tech Corp Inc.</div>
            <div class="pay-range">$120,000 - $150,000</div>
            <div class="job-description">
                <p>We are looking for a highly motivated and detail-oriented engineer.</p>
                <p>You will be working in a fast-paced agile environment.</p>
            </div>
        `);

        const data = win.JobExtractor.extract();

        assert.strictEqual(data.title, 'Senior Software Engineer');
        assert.strictEqual(data.company, 'Tech Corp Inc.');
        assert.strictEqual(data.salary, '$120,000 - $150,000');
        assert.ok(data.description.includes('We are looking for'));
        assert.ok(data.keywords.includes('detail-oriented'));
        assert.ok(data.keywords.includes('fast-paced'));
        assert.ok(data.keywords.includes('agile'));
    });

    test('JobExtractor - extracts data from LinkedIn-like DOM', () => {
        const win = createDOM(`
            <h1 class="t-24">Product Manager</h1>
            <div class="job-details-jobs-unified-top-card__company-name">Initech</div>
            <div class="job-details-jobs-unified-top-card__job-insight">
                <span>$90,000/yr - $120,000/yr</span>
            </div>
            <div id="job-details">
                Strong communication and leadership skills required. Cross-functional collaboration.
            </div>
        `);

        const data = win.JobExtractor.extract();

        assert.strictEqual(data.title, 'Product Manager');
        assert.strictEqual(data.company, 'Initech');
        assert.ok(data.salary.includes('$90,000'));
        assert.ok(data.keywords.includes('communication'));
        assert.ok(data.keywords.includes('leadership'));
        assert.ok(data.keywords.includes('cross-functional'));
    });

    test('JobExtractor - cleans ratings from company name', () => {
        const win = createDOM(`
            <h1 class="title">Developer</h1>
            <div class="employer">StartupCo 4.5 ★</div>
            <div class="salary">$100,000</div>
            <div class="description">Test description</div>
        `);

        const data = win.JobExtractor.extract();
        assert.strictEqual(data.company, 'StartupCo');
    });

    test('JobExtractor - finds salary in body text if no selector matches', () => {
         const win = createDOM(`
            <h1 class="title">Developer</h1>
            <div class="employer">StartupCo</div>
            <div class="description">We are paying $100,000 - $120,000 for this role.</div>
        `);

        const data = win.JobExtractor.extract();
        assert.strictEqual(data.salary, '$100,000 - $120,000');
    });

    test('PromptGenerator - generates correct prompt', () => {
         const win = createDOM(`<body></body>`);
         const data = {
             title: 'Frontend Engineer',
             company: 'Acme',
             salary: '$100k',
             description: 'Building cool things.',
             keywords: ['collaboration']
         };

         const prompt = win.PromptGenerator.generate(data);
         assert.ok(prompt.includes('**Role:** Expert ATS Optimizer and Senior Technical Recruiter at Acme drafting ATS-optimized resume bullet points.'));
         assert.ok(prompt.includes('Expected Salary Range:** $100k'));
         assert.ok(prompt.includes('collaboration'));
    });

    // Summary
    console.log(`\nTests: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTests();