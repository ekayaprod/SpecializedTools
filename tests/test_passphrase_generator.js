const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock BookmarkletUtils
global.window.BookmarkletUtils = {
    getRand: (max) => Math.floor(Math.random() * max)
};

// Mock clipboard
global.navigator.clipboard = {
    writeText: (text) => Promise.resolve()
};

const scriptPath = path.join(__dirname, '../bookmarklets/passphrase-generator.js');

function runTest() {
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Execute the script
    try {
        eval(scriptContent);
        console.log("✅ Script executed successfully.");
    } catch (e) {
        console.error("❌ Script execution failed:", e);
        process.exit(1);
    }

    // Check if UI is rendered
    // The overlay is appended to body
    // In JSDOM, we need to check document.body.children
    const overlay = document.body.lastElementChild;
    if (overlay && overlay.tagName === 'DIV' && overlay.style.position === 'fixed') {
        console.log("✅ Overlay created.");
    } else {
        console.error("❌ Overlay not found.");
        // print body content
        console.log(document.body.innerHTML);
    }

    // Check generated passwords
    // The new UI uses div for password text
    let passwords = Array.from(document.querySelectorAll('div')).filter(d => d.style.fontFamily === 'monospace').map(p => p.textContent);
    console.log(`Generated ${passwords.length} passwords.`);
    if (passwords.length > 0) {
        console.log("Sample:", passwords[0]);
    } else {
        console.error("❌ No passwords generated.");
    }

    // Test Temp Password Mode
    const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Switch'));
    if (toggleBtn) {
        toggleBtn.click();
        passwords = Array.from(document.querySelectorAll('div')).filter(d => d.style.fontFamily === 'monospace').map(p => p.textContent);
        console.log(`Generated ${passwords.length} TEMP passwords.`);
        if (passwords.length > 0) {
            console.log("Sample Temp:", passwords[0]);
        } else {
            console.error("❌ No temp passwords generated.");
        }
    } else {
        console.error("❌ Toggle button not found.");
    }
}

runTest();
