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
    const targetFile = 'dist/tools.json';

    const dom = new JSDOM(htmlContent, {
        runScripts: "dangerously",
        resources: "usable",
        virtualConsole,
        beforeParse(window) {
            // Mock setTimeout to be immediate
            window.setTimeout = (fn, delay, ...args) => {
                if (typeof fn === 'function') {
                    fn(...args);
                }
                return 1;
            };

            // Mock fetch
            window.fetch = (url) => {
                return Promise.resolve().then(() => {
                    if (url.includes(targetFile)) {
                        fetchCalls++;
                        // Fail the first 3 times with 500
                        if (fetchCalls <= 3) {
                            return {
                                ok: false,
                                status: 500,
                                json: () => Promise.reject(new Error('Server Error')),
                                text: () => Promise.resolve('Server Error')
                            };
                        }
                        // Succeed on 4th try
                        return {
                            ok: true,
                            status: 200,
                            json: () => Promise.resolve([
                                {
                                    id: 'test-tool',
                                    name: 'Test Tool',
                                    desc: 'A test tool',
                                    category: 'content',
                                    color: 'blue',
                                    href: 'javascript:alert(1)'
                                }
                            ])
                        };
                    }
                    // Other fetches succeed immediately (shouldn't happen in new index.html logic but strictly speaking safe to keep)
                    return {
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve([]),
                        text: () => Promise.resolve('')
                    };
                });
            };
        }
    });

    // Wait for async operations to complete
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
