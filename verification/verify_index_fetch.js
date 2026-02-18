const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const htmlPath = path.join(__dirname, '../index.html');
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Disable renderTools to prevent execution of dependent logic
htmlContent = htmlContent.replace(/renderTools\(\);/g, '// renderTools();');

async function runTests() {
    console.log('--- Starting Verification of fetchWithRetry ---');

    // Setup JSDOM without external resources
    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        url: "http://localhost/"
    });

    const win = dom.window;

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if fetchWithRetry is exposed
    if (typeof win.fetchWithRetry !== 'function') {
        console.error('FAILED: fetchWithRetry is not defined on window.');

        if (htmlContent.includes('async function fetchWithRetry')) {
            console.log('Source code contains function definition.');
        } else {
            console.error('Source code MISSING function definition!');
        }

        // Debug: Inspect scripts in DOM
        const scripts = win.document.querySelectorAll('script');
        console.log(`Found ${scripts.length} scripts.`);
        scripts.forEach((s, i) => {
            if (!s.src) {
                console.log(`Script ${i} content length: ${s.textContent.length}`);
                // console.log(s.textContent.substring(0, 100) + '...');
            }
        });

        process.exit(1);
    } else {
        console.log('✅ fetchWithRetry is exposed on window.');
    }

    // Mock Fetch State
    let fetchCallCount = 0;
    let fetchMockImplementation = async (url, options) => {
        return { ok: true, status: 200, text: async () => "ok" };
    };

    // Override window.fetch
    win.fetch = async (url, options) => {
        fetchCallCount++;
        return fetchMockImplementation(url, options);
    };

    // --- TEST 1: Success on first try ---
    console.log('\nTest 1: Success on first try');
    fetchCallCount = 0;
    fetchMockImplementation = async () => ({ ok: true, status: 200, text: async () => "ok" });

    await win.fetchWithRetry('http://test.com/success', {}, 3, 10);

    if (fetchCallCount === 1) console.log('✅ Passed (1 call)');
    else console.error(`❌ Failed: Expected 1 call, got ${fetchCallCount}`);


    // --- TEST 2: Retry on 500 (Server Error) ---
    console.log('\nTest 2: Retry on 500');
    fetchCallCount = 0;
    let attempts = 0;
    fetchMockImplementation = async () => {
        attempts++;
        if (attempts < 3) return { ok: false, status: 500, text: async () => "error" };
        return { ok: true, status: 200, text: async () => "ok" };
    };

    // Short backoff for test speed
    await win.fetchWithRetry('http://test.com/fail-then-success', {}, 3, 5);

    if (fetchCallCount === 3) console.log('✅ Passed (3 calls)');
    else console.error(`❌ Failed: Expected 3 calls, got ${fetchCallCount}`);


    // --- TEST 3: Retry on Network Error ---
    console.log('\nTest 3: Retry on Network Error');
    fetchCallCount = 0;
    attempts = 0;
    fetchMockImplementation = async () => {
        attempts++;
        if (attempts < 3) throw new Error('Network Error');
        return { ok: true, status: 200, text: async () => "ok" };
    };

    await win.fetchWithRetry('http://test.com/net-error', {}, 3, 5);

    if (fetchCallCount === 3) console.log('✅ Passed (3 calls)');
    else console.error(`❌ Failed: Expected 3 calls, got ${fetchCallCount}`);


    // --- TEST 4: No retry on 404 ---
    console.log('\nTest 4: No retry on 404');
    fetchCallCount = 0;
    fetchMockImplementation = async () => ({ ok: false, status: 404, text: async () => "not found" });

    const res = await win.fetchWithRetry('http://test.com/404', {}, 3, 5);

    if (fetchCallCount === 1) {
        if (res.status === 404) console.log('✅ Passed (1 call, status 404)');
        else console.error(`❌ Failed: Expected status 404, got ${res.status}`);
    } else {
        console.error(`❌ Failed: Expected 1 call, got ${fetchCallCount}`);
    }

    console.log('\n--- Verification Complete ---');
}

runTests().catch(e => {
    console.error('Unhandled error:', e);
    process.exit(1);
});
