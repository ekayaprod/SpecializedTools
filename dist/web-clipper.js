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
(function () {
const CONFIG = {
highlightColor: 'rgba(0, 0, 255, 0.1)',
outlineStyle: '2px solid blue',
parentHighlightColor: 'rgba(255, 215, 0, 0.15)',
parentOutlineStyle: '4px dashed #FFD700',
modalId: 'wc-bookmarklet-modal',
overlayId: 'wc-bookmarklet-overlay',
highlightId: 'wc-bookmarklet-highlight',
parentHighlightId: 'wc-bookmarklet-highlight-parent',
ignoreTags: ['HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME']
};
let activeElement = null;
function getOrCreateHighlightEl(id, outline, color, zIndex) {
let el = document.getElementById(id);
if (!el) {
el = document.createElement('div');
el.id = id;
el.style.position = 'fixed';
el.style.pointerEvents = 'none';
el.style.zIndex = zIndex;
el.style.border = outline;
el.style.backgroundColor = color;
el.style.display = 'none';
el.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
document.body.appendChild(el);
}
el.style.border = outline;
el.style.backgroundColor = color;
el.style.zIndex = zIndex;
return el;
}
function startFinder() {
document.body.style.cursor = 'crosshair';
document.addEventListener('mouseover', handleMouseOver);
document.addEventListener('mouseout', handleMouseOut);
document.addEventListener('click', handleClick, { capture: true });
document.addEventListener('keydown', handleEscape);
}
function stopFinder() {
document.body.style.cursor = 'default';
document.removeEventListener('mouseover', handleMouseOver);
document.removeEventListener('mouseout', handleMouseOut);
document.removeEventListener('click', handleClick, { capture: true });
document.removeEventListener('keydown', handleEscape);
clearHighlights();
const h1 = document.getElementById(CONFIG.highlightId);
if (h1) h1.remove();
const h2 = document.getElementById(CONFIG.parentHighlightId);
if (h2) h2.remove();
}
function handleMouseOver(e) {
if (CONFIG.ignoreTags.includes((e.target).tagName) || (e.target).closest('#' + CONFIG.overlayId) || (e.target).closest('#' + CONFIG.highlightId)) return;
activeElement =  (e.target);
const rect = activeElement.getBoundingClientRect();
const highlight = getOrCreateHighlightEl(CONFIG.highlightId, CONFIG.outlineStyle, CONFIG.highlightColor, '1000000');
highlight.style.top = rect.top + 'px';
highlight.style.left = rect.left + 'px';
highlight.style.width = rect.width + 'px';
highlight.style.height = rect.height + 'px';
highlight.style.display = 'block';
const parent = activeElement.parentElement;
if (parent && !CONFIG.ignoreTags.includes(parent.tagName)) {
const parentRect = parent.getBoundingClientRect();
const parentHighlight = getOrCreateHighlightEl(CONFIG.parentHighlightId, CONFIG.parentOutlineStyle, CONFIG.parentHighlightColor, '999999');
let pTop = parentRect.top;
let pLeft = parentRect.left;
let pWidth = parentRect.width;
let pHeight = parentRect.height;
const padding = 6;
pTop -= padding;
pLeft -= padding;
pWidth += (padding * 2);
pHeight += (padding * 2);
parentHighlight.style.top = pTop + 'px';
parentHighlight.style.left = pLeft + 'px';
parentHighlight.style.width = pWidth + 'px';
parentHighlight.style.height = pHeight + 'px';
parentHighlight.style.display = 'block';
} else {
const ph = document.getElementById(CONFIG.parentHighlightId);
if (ph) ph.style.display = 'none';
}
}
function handleMouseOut(e) {
if (e.target === activeElement) {
clearHighlights();
activeElement = null;
}
}
function clearHighlights() {
const h1 = document.getElementById(CONFIG.highlightId);
if (h1) h1.style.display = 'none';
const h2 = document.getElementById(CONFIG.parentHighlightId);
if (h2) h2.style.display = 'none';
}
function handleClick(e) {
if (!activeElement) return;
e.preventDefault();
e.stopPropagation();
const target = activeElement;
stopFinder();
showLoadingOverlay();
setTimeout(function() {
openEditor(target).catch(function(err) {
console.error('Web Clipper editor open failed', {
target: {
tagName: target.tagName,
id: target.id,
className: target.className
},
error: err
});
hideLoadingOverlay();
alert('Error opening editor: ' + err.message);
});
}, 50);
}
function handleEscape(e) {
if (e.key === 'Escape') {
stopFinder();
}
}
function showLoadingOverlay(message) {
const msg = message || 'Capturing styles & layout...';
let div = document.getElementById('wc-loading');
if (!div) {
div = document.createElement('div');
div.id = 'wc-loading';
div.style.position = 'fixed';
div.style.top = '0';
div.style.left = '0';
div.style.width = '100%';
div.style.height = '100%';
div.style.background = 'rgba(255,255,255,0.8)';
div.style.zIndex = '2000000';
div.style.display = 'flex';
div.style.justifyContent = 'center';
div.style.alignItems = 'center';
div.style.fontSize = '20px';
div.style.fontFamily = 'sans-serif';
document.body.appendChild(div);
}
div.innerHTML = '<span>' + msg + '</span>';
}
function hideLoadingOverlay() {
const div = document.getElementById('wc-loading');
if (div) div.remove();
}
async function openEditor(element) {
await BookmarkletUtils.normalizeImages(element);
const clone =  (element.cloneNode(true));
await BookmarkletUtils.inlineStylesAsync(element, clone, function(count) {
showLoadingOverlay('Capturing styles & layout... (' + count + ' elements)');
});
cleanupDOM(clone);
const overlay = document.createElement('div');
overlay.id = CONFIG.overlayId;
const modal = document.createElement('div');
modal.id = CONFIG.modalId;
const header = document.createElement('div');
header.className = 'wc-header';
header.innerHTML = `
<div style="display:flex; justify-content:space-between; align-items:center;">
<div>
<span style="font-weight:700; font-size:16px;">Web Clipper</span>
<span style="font-size:12px; color:#666; margin-left:8px;">(Snapshot Preview)</span>
</div>
<div id="wc-close-icon" role="button" aria-label="Close" tabindex="0" style="cursor:pointer; font-size:20px; color:#999; line-height:1;">&times;</div>
</div>
`;
const contentArea = document.createElement('div');
contentArea.className = 'wc-content';
contentArea.contentEditable = 'true';
contentArea.appendChild(clone);
if (clone.getAttribute('style')) {
const originalStyle = clone.getAttribute('style');
contentArea.setAttribute('style', originalStyle + '; overflow-y: auto !important; height: auto !important; max-height: none !important;');
}
const footer = document.createElement('div');
footer.className = 'wc-footer';
const btnCancel = document.createElement('button');
btnCancel.textContent = 'Cancel';
btnCancel.onclick = closeEditor;
const btnRetry = document.createElement('button');
btnRetry.textContent = 'Select New';
btnRetry.onclick = function() {
closeEditor();
startFinder();
};
const formatSelect = document.createElement('select');
formatSelect.style.marginRight = '10px';
formatSelect.style.padding = '5px';
formatSelect.style.borderRadius = '4px';
formatSelect.style.border = '1px solid #ccc';
const formats = [
{ val: 'html', txt: 'HTML Snapshot (.html)' },
{ val: 'md', txt: 'Markdown (.md)' },
{ val: 'txt', txt: 'Plain Text (.txt)' },
{ val: 'png', txt: 'Image (.png)' }
];
formats.forEach(function(f) {
const opt = document.createElement('option');
opt.value = f.val;
opt.text = f.txt;
formatSelect.appendChild(opt);
});
const btnDownload = document.createElement('button');
btnDownload.textContent = 'Download';
btnDownload.onclick = function() { handleDownload(contentArea, formatSelect.value, btnDownload); };
const btnCopy = document.createElement('button');
btnCopy.textContent = 'Copy to Clipboard';
btnCopy.className = 'primary';
btnCopy.onclick = function() { handleCopy(contentArea); };
footer.appendChild(btnCancel);
footer.appendChild(btnRetry);
footer.appendChild(formatSelect);
footer.appendChild(btnDownload);
footer.appendChild(btnCopy);
modal.appendChild(header);
modal.appendChild(contentArea);
modal.appendChild(footer);
overlay.appendChild(modal);
setTimeout(function() {
const closeIcon = document.getElementById('wc-close-icon');
if(closeIcon) {
closeIcon.onclick = closeEditor;
closeIcon.onkeydown = function(e) {
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
closeEditor();
}
};
}
}, 0);
const style = document.createElement('style');
style.textContent = '#' + CONFIG.overlayId + '{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}' +
'#' + CONFIG.modalId + '{background:white;width:80%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);overflow:hidden;}' +
'.wc-header{padding:16px 24px;border-bottom:1px solid #eee;background:#fff;color:#333;}' +
'.wc-content{padding:24px;overflow-y:auto;flex-grow:1;min-height:200px;outline:none;color:#000;line-height:1.6;background:#fff;}' +
'.wc-content h1,.wc-content h2,.wc-content h3{margin-top:0;}' +
'.wc-content p{margin-bottom:1em;}' +
'.wc-footer{padding:16px 24px;border-top:1px solid #eee;background:#fff;display:flex;justify-content:flex-end;align-items:center;gap:10px;}' +
'#' + CONFIG.modalId + ' button{padding:8px 16px;border:1px solid #d1d5db;background:white;border-radius:6px;cursor:pointer;font-size:14px;color:#374151;transition:all 0.2s;}' +
'#' + CONFIG.modalId + ' button:hover{background:#f3f4f6;}' +
'#' + CONFIG.modalId + ' button.primary{background:#2563eb;color:white;border:none;}' +
'#' + CONFIG.modalId + ' button.primary:hover{background:#1d4ed8;}';
overlay.appendChild(style);
document.body.appendChild(overlay);
hideLoadingOverlay();
contentArea.focus();
}
function closeEditor() {
const overlay = document.getElementById(CONFIG.overlayId);
if (overlay) overlay.remove();
}
function cleanupDOM(node) {
const dangerous = node.querySelectorAll('script, iframe, object, embed, noscript, form, input, button, select, textarea');
dangerous.forEach(function(n) { n.remove(); });
BookmarkletUtils.sanitizeAttributes(node);
}
async function handleCopy(contentArea) {
const html = contentArea.innerHTML;
const text = contentArea.innerText;
const btn =  (document.querySelector('#' + CONFIG.modalId + ' button.primary'));
try {
const data = [new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })];
await navigator.clipboard.write(data);
btn.textContent = "Copied!";
btn.style.background = "#28a745";
setTimeout(function() { closeEditor(); }, 1000);
} catch (err) {
console.error('Clipboard access failed:', err);
btn.textContent = "Error";
btn.style.background = "#dc3545";
setTimeout(function() {
btn.textContent = "Copy to Clipboard";
btn.style.background = "#007bff";
}, 1000);
}
}
function handleDownload(contentArea, format, btn) {
const cleanTitle = BookmarkletUtils.sanitizeFilename(document.title || 'Web_Clip');
if (format === 'md') {
const content = BookmarkletUtils.htmlToMarkdown(contentArea.innerHTML);
BookmarkletUtils.downloadFile(cleanTitle + '_' + Date.now() + '.md', content, 'text/markdown');
} else if (format === 'txt') {
const content = contentArea.innerText;
BookmarkletUtils.downloadFile(cleanTitle + '_' + Date.now() + '.txt', content, 'text/plain');
} else if (format === 'png') {
const originalText = btn ? btn.textContent : 'Download';
if (btn) {
btn.textContent = 'Generating...';
btn.disabled = true;
}
BookmarkletUtils.loadLibrary('html2canvas', 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H')
.then(() => capturePng(contentArea, cleanTitle, btn, originalText))
.catch(() => {
alert('Failed to load html2canvas for PNG export.');
if (btn) {
btn.textContent = 'Error';
btn.style.background = '#dc3545';
btn.style.color = 'white';
setTimeout(() => {
btn.textContent = originalText;
btn.disabled = false;
btn.style.background = '';
btn.style.color = '';
}, 2000);
}
});
} else {
const content = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + cleanTitle + '</title></head><body>' + contentArea.innerHTML + '</body></html>';
BookmarkletUtils.downloadFile(cleanTitle + '_' + Date.now() + '.html', content, 'text/html');
}
}
function capturePng(element, title, btn, originalText) {
const originalBg = element.style.backgroundColor;
element.style.backgroundColor = '#ffffff';
html2canvas(element, { useCORS: true, logging: false }).then(canvas => {
element.style.backgroundColor = originalBg;
const link = document.createElement('a');
link.download = title + '_' + Date.now() + '.png';
link.href = canvas.toDataURL();
link.click();
if (btn) {
btn.textContent = originalText;
btn.disabled = false;
}
}).catch(err => {
console.error('PNG Capture failed:', err);
element.style.backgroundColor = originalBg;
if (btn) {
btn.textContent = 'Error';
btn.style.background = '#dc3545';
btn.style.color = 'white';
setTimeout(() => {
btn.textContent = originalText;
btn.disabled = false;
btn.style.background = '';
btn.style.color = '';
}, 2000);
} else {
alert('PNG export failed. Check console for details.');
}
});
}
startFinder();
})();