const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const defaultFile = 'bookmarklets/web-clipper.js';
const fileToTest = process.argv[2] || defaultFile;

console.log(`Testing file: ${fileToTest}`);

if (!fs.existsSync(fileToTest)) {
    console.error(`File not found: ${fileToTest}`);
    process.exit(1);
}

const code = fs.readFileSync(fileToTest, 'utf8');

function extractFunction(code, functionName) {
    const startIndex = code.indexOf(`function ${functionName}`);
    if (startIndex === -1) throw new Error(`Function ${functionName} not found`);

    let braceCount = 0;
    let endIndex = -1;
    let foundStart = false;

    for (let i = startIndex; i < code.length; i++) {
        if (code[i] === '{') {
            braceCount++;
            foundStart = true;
        } else if (code[i] === '}') {
            braceCount--;
        }

        if (foundStart && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }

    if (endIndex === -1) throw new Error(`Could not find end of function ${functionName}`);
    return code.substring(startIndex, endIndex);
}

const inlineSafeStylesCode = extractFunction(code, 'inlineSafeStyles');

// Create a JSDOM instance with the problematic styles
const dom = new JSDOM(`<!DOCTYPE html>
<body>
    <div id="source" style="position: absolute; top: 50px; left: 100px; transform: rotate(45deg); transform-origin: center;"></div>
    <div id="target"></div>
</body>
`);

global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element; // Ensure Element is available if needed

// Evaluate the extracted function
// We wrap it in a way that it becomes a global function we can call
eval(inlineSafeStylesCode);

const source = document.getElementById('source');
const target = document.getElementById('target');

// Run the function
console.log('Running inlineSafeStyles...');
inlineSafeStyles(source, target);

const targetStyle = target.style;
console.log('Target styles:', targetStyle.cssText);

const requiredProps = ['position', 'top', 'left', 'transform', 'transform-origin'];
const missing = requiredProps.filter(p => !targetStyle[p] && !targetStyle.getPropertyValue(p));

if (missing.length > 0) {
    console.log('❌ Failed to copy styles:', missing.join(', '));
    process.exit(1);
} else {
    console.log('✅ All styles copied successfully.');
    process.exit(0);
}
