const fs = require('fs');

let content = fs.readFileSync('.jules/scribe.md', 'utf8');
const entry = `## 2024-06-03 - [MsgReader MIME Boundary Parsing]
**Learning:** The fallback MIME text extractor \`_scanBufferForMimeText\` in \`mailto-link-generator/js/msgreader.js\` uses manual string indexing (\`indexOf\`) and slicing (\`substring\`) instead of regular expressions to parse multipart boundaries. This intentional optimization prevents catastrophic backtracking, call stack limits, and excessive memory allocations from array splits on massive email payloads.
**Action:** When parsing large text blobs (like emails or logs) where boundary offsets are predictable, prefer \`indexOf\` and \`substring\` over complex regex splitting. Added JSDoc and \`// WARN:\` to \`_scanBufferForMimeText\` to protect this optimization.
`;

fs.writeFileSync('.jules/scribe.md', entry + '\n' + content);
console.log('Journal updated.');
