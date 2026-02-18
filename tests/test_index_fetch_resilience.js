const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Mock console to avoid noise
const virtualConsole = new (require('jsdom').VirtualConsole)();
// virtualConsole.on('log', console.log); // Uncomment to debug
// virtualConsole.on('error', console.error);

async function runTest() {
    console.log('Running test_index_fetch_resilience.js...');

    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    let fetchCalls = 0;
    const targetFile = 'bookmarklets/web-clipper.js';

    // We use a promise to wait for the test completion inside JSDOM context if needed,
    // but since we are observing side effects (fetchCalls), we can just wait.

    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole,
        beforeParse(window) {
            // Mock setTimeout to be immediate
            // The signature is setTimeout(callback, delay, ...args)
            window.setTimeout = (fn, delay, ...args) => {
                if (typeof fn === 'function') {
                    fn(...args);
                } else {
                    // If string (eval), ignore or handle? MDN says code string.
                    // Assuming function here.
                }
                return 1; // dummy timer id
            };

            // Mock BookmarkletBuilder
            window.BookmarkletBuilder = {
                extractDependencies: () => [],
                compile: (code) => code
            };

            // Mock fetch
            window.fetch = (url) => {
                // Return a promise that resolves immediately
                return Promise.resolve().then(() => {
                    if (url.includes(targetFile)) { // specific file
                        fetchCalls++;
                        // Fail the first 3 times with 500
                        if (fetchCalls <= 3) {
                            return {
                                ok: false,
                                status: 500,
                                text: () => Promise.resolve('Server Error')
                            };
                        }
                        // Succeed on 4th try
                        return {
                            ok: true,
                            status: 200,
                            text: () => Promise.resolve('console.log("Success");')
                        };
                    }
                    // Other fetches succeed immediately
                    return {
                        ok: true,
                        status: 200,
                        text: () => Promise.resolve('')
                    };
                });
            };
        }
    });

    // Wait for async operations to complete
    // Since everything is mocked to be immediate (promises resolve microtask),
    // a small timeout should suffice.
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`Fetch calls for ${targetFile}: ${fetchCalls}`);

    if (fetchCalls >= 4) {
        console.log('TEST PASSED: Resilience verified.');
        process.exit(0);
    } else {
        console.error('TEST FAILED: Resilience NOT verified. Expected >= 4 calls, got ' + fetchCalls);
        process.exit(1);
    }
}

runTest();
