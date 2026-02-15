(function(w) {
const safeProperties = [
'display', 'visibility', 'opacity', 'z-index',
'margin', 'padding', 'border', 'border-radius', 'box-shadow', 'box-sizing',
'background', 'background-color', 'background-image', 'color',
'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
'list-style', 'vertical-align', 'float', 'clear',
'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-basis',
'justify-content', 'align-items', 'align-content', 'align-self', 'gap', 'order',
'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
'grid-auto-columns', 'grid-auto-rows', 'grid-auto-flow',
'grid-area', 'grid-column', 'grid-row',
'place-content', 'place-items', 'place-self',
'white-space', 'overflow', 'text-overflow', 'word-wrap', 'word-break',
'text-transform', 'text-decoration', 'letter-spacing', 'word-spacing',
'object-fit', 'object-position',
'position', 'top', 'bottom', 'left', 'right',
'transform', 'transform-origin', 'transform-style'
];
w.BookmarkletUtils = {
buildElement(tag, styles = {}, text = '', parent = null, props = {}) {
const el = document.createElement(tag);
if (text) el.textContent = text;
Object.assign(el.style, styles);
Object.assign(el, props);
if (parent) parent.appendChild(el);
return  (el);
},
sanitizeFilename(s) {
return String(s || 'export').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
},
downloadFile(filename, content, type) {
const blob = new Blob([content], { type: type || 'text/html' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
setTimeout(function() { URL.revokeObjectURL(url); }, 100);
},
loadLibrary(globalVar, url, integrity) {
return new Promise(function(resolve, reject) {
if (window[globalVar]) {
resolve();
return;
}
const script = document.createElement('script');
script.src = url;
if (integrity) {
script.integrity = integrity;
script.crossOrigin = 'anonymous';
}
script.onload = function() { resolve(); };
script.onerror = function() { reject(new Error('Failed to load ' + globalVar)); };
document.head.appendChild(script);
});
},
normalizeImages(root, onProgress) {
return new Promise(function(resolve) {
const pictures = Array.prototype.slice.call(root.querySelectorAll('picture'));
const imgs = Array.prototype.slice.call(root.querySelectorAll('img'));
const queue = pictures.concat(imgs);
let count = 0;
const CHUNK_SIZE = 50;
function processChunk() {
const startTime = performance.now();
while (queue.length > 0) {
const el = queue.shift();
if (el.tagName.toLowerCase() === 'picture') {
const pic = el;
const img = pic.querySelector('img');
const source = pic.querySelector('source');
if (source && source.srcset && img) {
const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
if (isPlaceholder) {
img.src = source.srcset.split(',')[0].trim().split(' ')[0];
}
}
} else {
const img = el;
if (img.dataset.src) img.src = img.dataset.src;
if (img.dataset.lazySrc) img.src = img.dataset.lazySrc;
const isPlaceholder = !img.src || img.src.startsWith('data:') || img.src.includes('spacer');
if (isPlaceholder && img.srcset) {
const parts = img.srcset.split(',');
if(parts.length > 0) {
const bestCandidate = parts[parts.length - 1].trim().split(' ')[0];
if(bestCandidate) img.src = bestCandidate;
}
}
img.removeAttribute('loading');
img.removeAttribute('width');
img.removeAttribute('height');
img.style.maxWidth = '100%';
img.style.height = 'auto';
img.style.display = 'block';
}
count++;
if (count % CHUNK_SIZE === 0 || (performance.now() - startTime) > 12) {
if (onProgress) onProgress(count);
setTimeout(processChunk, 0);
return;
}
}
if (onProgress) onProgress(count);
resolve();
}
processChunk();
});
},
sanitizeAttributes(root) {
const process = function(el) {
if (!el.attributes) return;
const attrs = [];
for (let i = 0; i < el.attributes.length; i++) attrs.push(el.attributes[i].name);
for (let i = 0; i < attrs.length; i++) {
const name = attrs[i];
const lowerName = name.toLowerCase();
const val = (el.getAttribute(name) || '').toLowerCase().trim();
if (lowerName.startsWith('on')) {
el.removeAttribute(name);
}
else if (lowerName === 'srcdoc') {
el.removeAttribute(name);
}
else if (['href', 'src', 'action', 'data', 'formaction', 'poster', 'xlink:href', 'srcset'].includes(lowerName)) {
const checkVal = val.replace(/\s+/g, '').toLowerCase();
const isSrcset = lowerName === 'srcset';
if (checkVal.startsWith('javascript:') || checkVal.startsWith('vbscript:') || (isSrcset && (checkVal.includes('javascript:') || checkVal.includes('vbscript:')))) {
el.removeAttribute(name);
}
else if (checkVal.startsWith('data:')) {
const isImageTag = ['img', 'source', 'picture'].includes(el.tagName.toLowerCase());
const isImageMime = checkVal.startsWith('data:image/');
const isSvg = checkVal.includes('svg+xml');
if (!isImageTag || !isImageMime || isSvg) {
el.removeAttribute(name);
}
}
}
else if (lowerName === 'style') {
const checkVal = val.replace(/\s+/g, '');
if (checkVal.includes('javascript:') || checkVal.includes('vbscript:') || checkVal.includes('expression(')) {
el.removeAttribute(name);
}
}
}
};
process(root);
const all = root.querySelectorAll('*');
for (let i = 0; i < all.length; i++) {
process(all[i]);
}
},
inlineStylesAsync(source, target, onProgress) {
return new Promise(function(resolve) {
const queue = [{s: source, t: target}];
let count = 0;
const CHUNK_SIZE = 50;
function processChunk() {
const startTime = performance.now();
while (queue.length > 0) {
const item = queue.shift();
const s = item.s;
const t = item.t;
const computed = window.getComputedStyle(s);
if (computed) {
const styles = [];
for (let i = 0, len = safeProperties.length; i < len; i++) {
const prop = safeProperties[i];
const val = computed.getPropertyValue(prop);
if (val && val !== 'none' && val !== 'normal') {
styles.push(prop + ':' + val);
}
}
if (styles.length > 0) {
t.style.cssText += styles.join('; ') + '; ';
}
}
count++;
const sourceChildren = s.children;
const targetChildren = t.children;
for (let i = 0; i < sourceChildren.length; i++) {
if (targetChildren[i]) {
queue.push({s:  (sourceChildren[i]), t:  (targetChildren[i])});
}
}
if (count % CHUNK_SIZE === 0 || (performance.now() - startTime) > 12) {
if (onProgress) onProgress(count);
setTimeout(processChunk, 0);
return;
}
}
if (onProgress) onProgress(count);
resolve();
}
processChunk();
});
},
htmlToMarkdown(html) {
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');
const parts = [];
function traverse(node) {
if (node.nodeType === 3) {
parts.push(node.nodeValue);
return;
}
if (node.nodeType !== 1) return;
const tag = node.tagName.toLowerCase();
if (tag === 'script' || tag === 'style' || tag === 'noscript') return;
switch(tag) {
case 'h1': parts.push('\n# '); break;
case 'h2': parts.push('\n## '); break;
case 'h3': parts.push('\n### '); break;
case 'h4': parts.push('\n#### '); break;
case 'strong':
case 'b': parts.push('**'); break;
case 'em':
case 'i': parts.push('*'); break;
case 'p': parts.push('\n\n'); break;
case 'br': parts.push('\n'); break;
case 'li':
if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'ol') {
const index = Array.prototype.indexOf.call(node.parentElement.children, node) + 1;
parts.push('\n' + index + '. ');
} else {
parts.push('\n- ');
}
break;
case 'a': parts.push('['); break;
case 'img':
const src = node.getAttribute('src');
const alt = node.getAttribute('alt') || '';
parts.push('![' + alt + '](' + src + ')');
return;
case 'table': parts.push('\n\n'); break;
case 'tr': break;
case 'td':
case 'th': parts.push('| '); break;
}
for (let i = 0; i < node.childNodes.length; i++) {
traverse(node.childNodes[i]);
}
switch(tag) {
case 'strong':
case 'b': parts.push('**'); break;
case 'em':
case 'i': parts.push('*'); break;
case 'a':
const href = node.getAttribute('href');
if (href) parts.push('](' + href + ')');
else parts.push(']');
break;
case 'h1':
case 'h2':
case 'h3':
case 'h4':
case 'p':
parts.push('\n'); break;
case 'tr': parts.push('|\n'); break;
}
}
traverse(doc.body);
return parts.join('').replace(/\n\s+\n/g, '\n\n').trim();
}
};
})(window);