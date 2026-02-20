const fs = require('fs');
const path = require('path');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const assert = require('assert');

const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Remove Tailwind
indexHtml = indexHtml.replace('<script src="https://cdn.tailwindcss.com"></script>', '');

// Mock BookmarkletBuilder
indexHtml = indexHtml.replace(
    '<script src="bookmarklets/bookmarklet-builder.js"></script>',
    '<script>window.BookmarkletBuilder = { extractDependencies: () => [], compile: (c) => c };</script>'
);

// Create JSDOM
const dom = new JSDOM(indexHtml, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable",
    beforeParse(window) {
        // Mock fetch with delay
        window.fetch = async (url) => {
            await new Promise(r => setTimeout(r, 100)); // Delay to keep skeleton visible
            return {
                ok: true,
                text: async () => "console.log('mock bookmarklet');",
                status: 200
            };
        };
        window.navigator.clipboard = { writeText: async () => {} };
        window.console = { ...console, log: () => {}, warn: () => {}, error: () => {} };
    }
});

const { window } = dom;
const { document } = window;

async function runTests() {
    console.log("Running Index UI Polish Tests...");

    try {
        // --- 1. PALETTE+ CHECK (Skeleton) ---
        // Should be visible immediately (fetch is delayed 100ms)
        const firstButton = document.querySelector('.bookmarklet-btn');
        if (!firstButton) {
             console.error("❌ Bookmarklet button NOT found.");
             process.exit(1);
        }

        // Check for Pulse animation class (Palette+ requirement)
        const hasPulse = firstButton.innerHTML.includes('animate-pulse') || firstButton.className.includes('animate-pulse');

        if (!hasPulse) {
            console.log("⚠️ Palette+ Check Failed (Expected): No skeleton loader found.");
        } else {
             console.log("✅ Palette+ Check Passed: Skeleton loader present.");
        }

        // --- 2. WORDSMITH CHECK (Microcopy) ---
        const textContent = document.body.textContent;
        if (textContent.includes("Capture any content") || textContent.includes("Capture any web page")) {
             console.log("✅ Wordsmith Check Passed: Description updated.");
        } else {
             console.log("⚠️ Wordsmith Check Failed (Expected): Description not updated yet.");
        }

        const dragText = textContent.includes("Drag to Bookmarks Bar");
        if (dragText) {
             console.log("⚠️ Wordsmith Check Failed (Expected): Found old text 'Drag to Bookmarks Bar'");
        } else if (textContent.includes("Drag to Bookmarks")) {
             console.log("✅ Wordsmith Check Passed: Found new text 'Drag to Bookmarks'");
        }

        // --- 3. CURATOR CHECK (Assets/A11y) ---
        const svgs = document.querySelectorAll('svg');
        let hiddenCount = 0;
        svgs.forEach(svg => {
            if (svg.getAttribute('aria-hidden') === 'true') {
                hiddenCount++;
            }
        });

        // console.log(`Found ${svgs.length} SVGs, ${hiddenCount} hidden.`);
        if (hiddenCount < svgs.length - 2) {
             console.log("⚠️ Curator Check Failed (Expected): Not enough SVGs are aria-hidden.");
        } else {
             console.log("✅ Curator Check Passed.");
        }

        // --- 4. Transition Check ---
        // Wait for fetch to finish (it delays 100ms, so we wait 200ms)
        await new Promise(resolve => setTimeout(resolve, 200));

        if (firstButton.innerHTML.includes('fade-in-text')) {
            console.log("✅ Transition Check Passed: .fade-in-text class applied.");
        } else {
            console.log("⚠️ Transition Check Failed (Expected): .fade-in-text class missing.");
        }

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

// Run immediately (script execution is synchronous)
runTests();
