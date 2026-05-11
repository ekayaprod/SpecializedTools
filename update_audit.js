const fs = require('fs');
const filePath = '.jules/AGENTS_AUDIT.md';
if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('- [ ] mailto-link-generator/js/msgreader.js')) {
        content = content.replace(
            '- [ ] mailto-link-generator/js/msgreader.js',
            '- [x] mailto-link-generator/js/msgreader.js'
        );
        fs.writeFileSync(filePath, content);
        console.log('Audit updated.');
    } else {
        console.log('No matching entry found in audit.');
    }
}
