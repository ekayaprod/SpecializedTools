const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runTest() {
    console.log('Running test_index_accessibility.js...');

    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Create a JSDOM instance without running scripts, just parsing HTML
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // --- Check Search Input ---
    const searchInput = document.getElementById('search-input');
    if (!searchInput) {
        throw new Error('TEST FAILED: #search-input element not found.');
    }
    if (!searchInput.hasAttribute('aria-label')) {
        throw new Error('TEST FAILED: #search-input is missing aria-label attribute.');
    }
    if (searchInput.getAttribute('aria-label') !== 'Search tools') {
        throw new Error(`TEST FAILED: #search-input aria-label is incorrect. Expected "Search tools", got "${searchInput.getAttribute('aria-label')}".`);
    }

    // --- Check Search Icon SVG (Asset Optimization) ---
    // The SVG is inside a pointer-events-none container preceding the input
    const searchWrapper = searchInput.parentElement;
    const iconContainer = searchWrapper.querySelector('.pointer-events-none');
    if (!iconContainer) {
        throw new Error('TEST FAILED: Search icon container not found.');
    }
    const svgIcon = iconContainer.querySelector('svg');
    if (!svgIcon) {
        throw new Error('TEST FAILED: Search icon SVG not found.');
    }
    if (svgIcon.getAttribute('aria-hidden') !== 'true') {
        throw new Error('TEST FAILED: Search icon SVG is missing aria-hidden="true" (Asset Optimization).');
    }

    // --- Check Filter Container (UX Tweak) ---
    const filterContainer = document.getElementById('filter-container');
    if (!filterContainer) {
        throw new Error('TEST FAILED: #filter-container element not found.');
    }
    if (filterContainer.getAttribute('role') !== 'group') {
        throw new Error('TEST FAILED: #filter-container is missing role="group".');
    }
    if (filterContainer.getAttribute('aria-label') !== 'Filter tools by category') {
        throw new Error('TEST FAILED: #filter-container is missing or has incorrect aria-label.');
    }

    console.log('TEST PASSED: Accessibility attributes verified.');
}

runTest().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
