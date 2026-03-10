const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runTest() {
    console.log('🚀 Starting XSS reproduction test for Macro Builder...');

    const dom = new JSDOM(
        `<!DOCTYPE html><body>
        <div id="test-container">
            <button id="target-btn">Click Me</button>
        </div>
    </body>`,
        {
            url: 'http://localhost/',
            pretendToBeVisual: true,
        }
    );

    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
    global.Event = dom.window.Event;
    global.MouseEvent = dom.window.MouseEvent;
    global.KeyboardEvent = dom.window.KeyboardEvent;

    global.alert = (msg) => {
        console.log('Alert:', msg);
    };

    const maliciousInput = '<img src=x onerror=console.log("XSS_EXECUTED")>';

    global.confirm = (msg) => {
        if (msg.includes('Pick another')) return false;
        if (msg.includes('Sensitive?')) return false;
        return true;
    };

    global.prompt = (msg) => {
        return maliciousInput;
    };

    // Load and execute script
    const utilsPath = path.join(__dirname, '../bookmarklets/utils.js');
    const utilsContent = fs.readFileSync(utilsPath, 'utf8');
    const scriptPath = path.join(__dirname, '../bookmarklets/macro-builder.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    try {
        eval(utilsContent);
        if (window.BookmarkletUtils) {
            global.BookmarkletUtils = window.BookmarkletUtils;
        }
        eval(scriptContent);
    } catch (e) {
        console.error('Script execution failed:', e);
        process.exit(1);
    }

    const app = global.window.__mb_v22;
    const host = app.h;
    const shadow = host.shadowRoot;
    const addBtn = shadow.querySelector('#add');

    console.log('Testing XSS in Action Display...');

    // Trigger recording
    addBtn.click();

    // Pick element
    const targetBtn = document.getElementById('target-btn');
    targetBtn.innerText = maliciousInput; // Also test act.txt
    targetBtn.getBoundingClientRect = () => ({
        top: 10, left: 10, width: 100, height: 20, bottom: 30, right: 110, x: 10, y: 10
    });

    const clickEvent = new dom.window.MouseEvent('click', {
        bubbles: true, cancelable: true, view: window, clientX: 15, clientY: 15
    });
    targetBtn.dispatchEvent(clickEvent);

    // Confirm in preview
    const confirmBtn = shadow.querySelector('#prev_yes');
    confirmBtn.click();

    await new Promise(resolve => setTimeout(resolve, 200));

    // Check if the malicious input is rendered as HTML (VULNERABLE) or escaped (SAFE)
    const actionList = shadow.querySelector('.action-list');
    const actionHtml = actionList.innerHTML;

    console.log('Rendered Action HTML:', actionHtml);

    if (actionHtml.includes('<img src="x"')) {
        console.error('❌ VULNERABILITY CONFIRMED: Malicious HTML was rendered unsanitized.');
        process.exit(1);
    } else if (actionHtml.includes('&lt;img src=x')) {
        console.log('✅ PASS: Malicious HTML was escaped.');
    } else {
        console.warn('⚠️ Could not find expected content in action list.');
    }

    app.destroy();
}

runTest();
