const fs = require('fs');
const path = require('path');

const mailtoPath = path.join(__dirname, '../mailto-link-generator/js/mailto.js');
const mailtoCode = fs.readFileSync(mailtoPath, 'utf8');

// Expanded Mock DOM Environment to handle querySelectorAll and el.remove()
class MockElement {
    constructor(tagName) {
        this.tagName = tagName.toUpperCase();
        this.attributes = [];
        this.children = [];
        this.textContent = '';
        this.innerHTML = '';
        this.className = '';
        this.style = {};
        this.classList = {
            add: (c) => { this.className += ' ' + c; },
            remove: (c) => { this.className = this.className.replace(c, '').trim(); }
        };
    }

    setAttribute(name, value) {
        const attr = this.attributes.find(a => a.name === name);
        if (attr) attr.value = value;
        else this.attributes.push({ name, value });
        if (name === 'id') this.id = value;
    }

    getAttribute(name) {
        const attr = this.attributes.find(a => a.name === name);
        return attr ? attr.value : null;
    }

    hasAttribute(name) {
        return this.attributes.some(a => a.name === name);
    }

    removeAttribute(name) {
        this.attributes = this.attributes.filter(a => a.name !== name);
    }

    appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
    }

    remove() {
        if (this.parentElement) {
            this.parentElement.children = this.parentElement.children.filter(c => c !== this);
        }
    }

    querySelectorAll(selector) {
        const results = [];
        const traverse = (node) => {
            if (node.tagName.toLowerCase() === selector.toLowerCase() || selector === '*') {
                if (node !== this) results.push(node);
            }
            node.children.forEach(traverse);
        };
        traverse(this);
        return results;
    }

    set innerHTML(val) {
        this._innerHTML = val;
        // Mock parsing for the reproduction: create child elements for script/img tags
        if (/<script/i.test(val)) {
            const script = new MockElement('script');
            this.appendChild(script);
        }
        if (/<img\s+[^>]*onerror/i.test(val)) {
            const img = new MockElement('img');
            img.setAttribute('src', 'x');
            img.setAttribute('onerror', 'alert(1)');
            this.appendChild(img);
        }
    }

    get innerHTML() {
        // Simple serialization mock
        return this.children.map(c => {
            if (c.tagName === 'SCRIPT') return '<script></script>';
            if (c.tagName === 'IMG') {
                let attrs = '';
                c.attributes.forEach(a => attrs += ` ${a.name}="${a.value}"`);
                return `<img${attrs}>`;
            }
            return '';
        }).join('') || this._innerHTML;
    }
}

const mockDocument = {
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
        if (id === 'modal-overlay') return overlay;
        if (id === 'modal-body') return body;
        if (id === 'toast') return toast;
        return null;
    },
    body: new MockElement('body'),
    readyState: 'complete',
    addEventListener: () => {}
};

const overlay = new MockElement('div');
const body = new MockElement('div');
const toast = new MockElement('div');

const mockWindow = {
    document: mockDocument,
    navigator: { clipboard: { writeText: () => Promise.resolve(true) } },
    localStorage: { getItem: () => null, setItem: () => {} },
    HTMLElement: class {},
    Node: class {},
    crypto: { randomUUID: () => '123' },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    console: console,
    decodeURIComponent: decodeURIComponent,
    encodeURIComponent: encodeURIComponent,
    URLSearchParams: URLSearchParams,
    addEventListener: () => {}
};

const codeWithExports = mailtoCode + '\nwindow.UI = UI; window.Utils = Utils;';
const fn = new Function('window', 'document', 'navigator', 'localStorage', 'HTMLElement', 'Node', 'crypto', 'setTimeout', 'clearTimeout', 'console', 'decodeURIComponent', 'encodeURIComponent', 'URLSearchParams', codeWithExports);
fn.call(mockWindow, mockWindow, mockDocument, mockWindow.navigator, mockWindow.localStorage, mockWindow.HTMLElement, mockWindow.Node, mockWindow.crypto, mockWindow.setTimeout, mockWindow.clearTimeout, mockWindow.console, mockWindow.decodeURIComponent, mockWindow.encodeURIComponent, mockWindow.URLSearchParams);

const UI = mockWindow.UI;

console.log('Verifying XSS fix in UI.showModal...');
const xssPayload = '<img src="x" onerror="alert(1)"><script>alert(1)</script>';
UI.showModal('Test Title', xssPayload);

const allNodes = body.querySelectorAll('*');
const hasScript = allNodes.some(n => n.tagName === 'SCRIPT');
const hasOnerror = allNodes.some(n => n.hasAttribute('onerror'));

if (hasScript || hasOnerror) {
    console.log('❌ FIX FAILED: Malicious payload still present.');
    process.exit(1);
} else {
    console.log('✅ FIX VERIFIED: Malicious payload neutralized.');
    // Check if safe content remains (the title)
    const titleNode = body.children.find(c => c.tagName === 'H3');
    if (titleNode && titleNode.textContent === 'Test Title') {
        console.log('✅ Title preserved.');
    } else {
        console.log('❌ Title missing or incorrect.');
        process.exit(1);
    }
    process.exit(0);
}
