const fs = require('fs');
const filePath = '.jules/scribe.md';
let content = '';
if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
}

const newEntry = `
## ${new Date().toISOString().split('T')[0]} - [MsgReader Email Address Parsing Logic]
**Learning:** The \`parseAddress\` function in \`mailto-link-generator/js/msgreader.js\` extracts the name and email from an address string by falling back from explicit \`<email>\` formatting to a raw regex email match. It aggressively strips outer quotes because OLE file artifacts often leave names unquoted or inconsistently formatted.
**Action:** When extracting text structures from loosely-formatted or historically volatile standards (like email headers or OLE data), prefer a cascading approach (try structured format, fall back to regex extraction) and actively strip legacy artifacts rather than expecting strict compliance.
`;

fs.writeFileSync(filePath, content + newEntry);
console.log('Scribe journal updated.');
