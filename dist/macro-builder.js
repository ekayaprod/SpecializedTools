(function() {
if(window.__mb_v22){window.__mb_v22.destroy();return}
if(!document.body) return alert('Page has no body.');
class MacroBuilder {
constructor(){
this.id = 'mb-'+Math.random().toString(36).slice(2);
this.steps = [];
this.cleanupFns = [];
this.init();
}
init(){
this.h = document.createElement('div');
this.h.style.cssText = 'position:fixed;top:15px;right:15px;z-index:2147483647;font-family:system-ui,sans-serif';
this.s = this.h.attachShadow({mode:'open'});
this.render();
document.body.appendChild(this.h);
}
render(){
this.s.innerHTML = '<style>' +
':host{all:initial;font-family:system-ui,sans-serif}' +
'.box{background:#1e1b4b;color:#e2e8f0;width:320px;padding:16px;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.7);border:1px solid #4338ca;font-size:13px;box-sizing:border-box}' +
'.row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;cursor:move;user-select:none;padding-bottom:5px;border-bottom:1px solid #334155}' +
'h3,b{margin:0;color:#f8fafc;font-size:14px;font-weight:700}' +
'button{width:100%;background:#4f46e5;color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:600;margin-top:8px;transition:0.2s}' +
'button:hover{background:#4338ca}' +
'button:disabled{background:#334155;color:#64748b;cursor:not-allowed}' +
'button.alt{background:#1e293b;border:1px solid #4f46e5}' +
'input{width:100%;background:#1e293b;color:#fff;border:1px solid #334155;padding:8px;border-radius:6px;box-sizing:border-box;margin-top:5px;outline:none}' +
'input:focus{border-color:#3b82f6}' +
'.hidden{display:none!important}' +
'.list{max-height:200px;overflow-y:auto;margin:15px 0;background:#1e293b;border-radius:6px;padding:5px;border:1px solid #334155}' +
'.step{background:#0f172a;padding:8px;margin-bottom:5px;border-radius:4px;border:1px solid #334155;display:flex;flex-direction:column;gap:5px}' +
'.step-row{display:flex;align-items:center;gap:8px}' +
'.step-idx{background:#4f46e5;color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}' +
'.step-info{flex-grow:1;overflow:hidden}' +
'.step-sel{font-family:monospace;color:#64748b;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.step-del{cursor:pointer;color:#ef4444;font-size:14px}' +
'.export-area{margin-top:15px;border-top:1px solid #334155;padding-top:10px}' +
'.bm-btn{display:block;background:#059669;color:#fff;text-align:center;padding:10px;border-radius:6px;text-decoration:none;font-weight:bold;border:2px dashed #34d399}' +
'.bm-btn:hover{background:#047857}' +
'input.delay{width:40px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:4px;padding:2px;font-size:11px;text-align:center}' +
'.empty-msg{text-align:center;color:#64748b;padding:20px;font-style:italic}' +
'.cfg-grp{margin-bottom:10px;padding:10px;background:#0f172a;border-radius:6px;border:1px solid #334155}' +
'</style>' +
'<div class="box">' +
'<div class="row" id="drag"><h3>MACRO BUILDER V22</h3><span id="x" style="cursor:pointer">✕</span></div>' +
'<div id="view_steps">' +
'<div id="list" class="list"><div class="empty-msg">No steps yet.<br>Click Add Sequence to begin.</div></div>' +
'<button id="add">➕ Add Click Sequence</button>' +
'<button id="exp" style="background:#db2777">⚡ Export Bookmarklet</button>' +
'<div id="out" class="export-area" style="display:none">' +
'<p style="text-align:center;color:#e2e8f0;margin:0 0 10px 0">Drag button to toolbar:</p>' +
'<a id="lnk" href="#" class="bm-btn">🤖 My Macro</a>' +
'</div>' +
'</div>' +
'<div id="preview" class="hidden" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;padding:20px;border-radius:12px;border:2px solid #a855f7;box-shadow:0 25px 50px rgba(0,0,0,0.8);width:80%;text-align:center;z-index:9999">' +
'<div style="font-weight:bold;margin-bottom:10px">Confirm Selection</div>' +
'<div id="prev_tag" style="color:#94a3b8;font-size:12px;margin-bottom:5px"></div>' +
'<div id="prev_sel" style="color:#c7d2fe;font-size:11px;margin-bottom:15px;word-break:break-all"></div>' +
'<button id="prev_yes" style="background:#059669;margin-right:10px;width:auto;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;color:white;">Confirm</button>' +
'<button id="prev_no" style="background:#ef4444;width:auto;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;color:white;">Retry</button>' +
'</div>' +
'</div>';
this.q = s => this.s.querySelector(s);
this.bind();
}
bind(){
this.q('#x').onclick=()=>this.destroy();
this.q('#add').onclick=()=>this.startSequence();
this.q('#exp').onclick=()=>this.compile();
this.makeDraggable(this.q('#drag'));
}
makeDraggable(head){
let pos1=0,pos2=0,pos3=0,pos4=0;
const dragMouseDown = e => {
e = e || window.event;
e.preventDefault();
pos3 = e.clientX;
pos4 = e.clientY;
document.onmouseup = closeDragElement;
document.onmousemove = elementDrag;
};
const elementDrag = e => {
e = e || window.event;
e.preventDefault();
pos1 = pos3 - e.clientX;
pos2 = pos4 - e.clientY;
pos3 = e.clientX;
pos4 = e.clientY;
this.h.style.top = (this.h.offsetTop - pos2) + "px";
this.h.style.left = (this.h.offsetLeft - pos1) + "px";
};
const closeDragElement = () => {
document.onmouseup = null;
document.onmousemove = null;
};
head.onmousedown = dragMouseDown;
}
add(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); this.cleanupFns.push(()=>t.removeEventListener(ev, fn, opt)); }
clearListeners() { this.cleanupFns.forEach(fn=>fn()); this.cleanupFns = []; }
getSel(el){
if(el.matches('button[class*="presence-"]')) {
const match = el.className.match(/presence-(break|meal|available|busy|away)/);
if(match) return 'button.presence-' + match[1];
}
if(el.hasAttribute('aria-label')) {
const label = el.getAttribute('aria-label');
if (!label.match(/On queue|Available|Busy|Away|Break|Meal|Offline/i)) {
if(document.querySelectorAll('[aria-label="'+label+'"]').length === 1) return '[aria-label="'+label+'"]';
}
}
if(el.id && !/\d/.test(el.id)) return '#'+el.id;
if (el.classList.contains('menu-selector')) return '.menu-selector';
if (el.classList.contains('entity-image-button')) return '.entity-image-button';
let path = el.tagName.toLowerCase();
if(el.classList.length) path += '.' + [...el.classList].join('.');
if(document.querySelectorAll(path).length > 1 && el.parentElement){
let i=1, s=el; while(s=s.previousElementSibling)i++;
path += ':nth-child('+i+')';
}
return path;
}
startSequence() {
this.currentSequence = [];
if(!confirm('Starting new sequence. Pick elements one by one. Click "Cancel" on the prompt when done picking.')) return;
this.pick('sequence');
}
getDeepTarget(e) {
let t = e.target;
while (t.shadowRoot && t.shadowRoot.elementFromPoint) {
const nested = t.shadowRoot.elementFromPoint(e.clientX, e.clientY);
if (!nested || nested === t) break;
t = nested;
}
return t;
}
getTarget(e) {
let t = this.getDeepTarget(e);
let targetEl = t.closest('button, a, [role="button"], [role="radio"], label');
if (!targetEl) targetEl = t.closest('.menu-selector, .entity-image-button');
if (!targetEl && ['IMG', 'SVG', 'PATH', 'SPAN', 'I', 'GUX-ICON'].includes(t.tagName)) targetEl = t.parentElement;
if (!targetEl) targetEl = t;
if (targetEl.tagName === 'BODY' || targetEl.tagName === 'HTML') return null;
const r = targetEl.getBoundingClientRect();
if (r.width >= window.innerWidth * 0.95 && r.height >= window.innerHeight * 0.95) return null;
return targetEl;
}
pick(mode){
this.h.style.display='none';
const hl=document.createElement('div');
hl.style.cssText='position:absolute;border:2px solid #a855f7;background:rgba(168,85,247,0.2);pointer-events:none;z-index:999999';
document.body.appendChild(hl);
const stopPicking = () => {
hl.remove();
this.h.style.display='block';
this.clearListeners();
};
const mv=e=>{
if(e.shiftKey){ hl.style.display='none'; return; }
const t = this.getTarget(e);
if(!t) { hl.style.display='none'; return; }
hl.style.display='block';
const r=t.getBoundingClientRect();
hl.style.top=(r.top + window.scrollY)+'px';
hl.style.left=(r.left + window.scrollX)+'px';
hl.style.width=r.width+'px';
hl.style.height=r.height+'px';
};
const stopEvent = (e) => {
if(e.shiftKey) return;
if(this.h.contains(e.target)) return;
e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
};
const cl=e=>{
if(e.shiftKey) return;
if(this.h.contains(e.target)) return;
stopEvent(e);
let targetEl = this.getTarget(e);
if(!targetEl) return;
const sel = this.getSel(targetEl);
const txt = targetEl.innerText ? targetEl.innerText.substring(0, 20).trim() : '';
hl.remove();
this.h.style.display='block';
this.q('#prev_tag').innerText = targetEl.tagName;
this.q('#prev_sel').innerText = sel;
this.q('#preview').classList.remove('hidden');
this.q('#prev_yes').onclick = () => {
this.q('#preview').classList.add('hidden');
this.clearListeners();
if(mode === 'sequence') {
let val = null;
let enter = false;
const tag = targetEl.tagName;
if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'){
val = prompt('Enter text to type (leave empty to just click):');
if(val) enter = confirm('Press Enter after typing?');
}
this.currentSequence.push({ sel: sel, txt: txt, val: val, enter: enter });
setTimeout(() => {
if(!confirm('Element added! Pick another for this sequence? Click Cancel to finish this group.')) {
this.steps.push({ actions: this.currentSequence, delay: 1 });
this.refreshList();
} else {
this.pick('sequence');
}
}, 100);
}
};
this.q('#prev_no').onclick = () => {
this.q('#preview').classList.add('hidden');
this.h.style.display='none';
document.body.appendChild(hl);
};
return false;
};
this.add(document, 'mousemove', mv);
this.add(document, 'mousedown', stopEvent, true);
this.add(document, 'mouseup', stopEvent, true);
this.add(document, 'click', cl, true);
}
refreshList(){
const l = this.q('#list');
if(this.steps.length===0) { l.innerHTML = '<div class="empty-msg">No steps yet.</div>'; return; }
l.innerHTML = '';
this.steps.forEach((s, i) => {
const d = document.createElement('div');
d.className = 'step';
let actionHtml = '';
s.actions.forEach((act, ai) => {
let desc = act.val ? 'Type "'+act.val+'"' : (act.txt ? 'Click "'+act.txt+'"' : 'Click');
actionHtml += '<div class="action-item">'+desc+'</div>';
});
d.innerHTML = `
<div class="step-row">
<div class="step-idx">${i+1}</div>
<div class="step-info">
<div style="font-weight:bold;font-size:11px">Sequence ${i+1}</div>
</div>
<div style="font-size:10px;color:#a5b4fc">Wait(s)</div>
<input type="number" class="delay" value="${s.delay}" data-idx="${i}">
<div class="step-del" data-idx="${i}">✕</div>
</div>
<div class="action-list">${actionHtml}</div>
`;
l.appendChild(d);
});
l.querySelectorAll('.delay').forEach(ip => {
ip.onchange = (e) => this.steps[e.target.dataset.idx].delay = parseFloat(e.target.value);
});
l.querySelectorAll('.step-del').forEach(btn => {
btn.onclick = (e) => {
this.steps.splice(e.target.dataset.idx, 1);
this.refreshList();
};
});
}
compile(){
if(this.steps.length===0) return alert('Add steps first');
this.steps.forEach(step => {
step.actions.forEach(action => {
if(action.sel && action.sel.includes('presence-')) {
const match = action.sel.match(/presence-(break|meal|available|busy|away)/);
if(match) action.sel = 'button.presence-' + match[1];
}
});
});
const jsonSteps = JSON.stringify(this.steps).replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
const runtime = `(async function(){
if(window.__mb_run){window.__mb_run.destroy();return}
const steps = ${jsonSteps};
class MacroRuntime {
constructor() {
this.id = 'run-'+Math.random().toString(36).slice(2);
this.init();
}
init(){
this.h = document.createElement('div');
this.h.id = this.id;
this.h.style.cssText = 'position:fixed;top:15px;right:15px;z-index:2147483647;font-family:system-ui,sans-serif';
this.s = this.h.attachShadow({mode:'open'});
this.s.innerHTML = '<style>:host{all:initial;font-family:system-ui,sans-serif}.box{background:#1e1b4b;color:#e2e8f0;width:240px;padding:16px;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.7);border:1px solid #4338ca;font-size:13px}.row{display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;padding-bottom:5px;border-bottom:1px solid #334155;margin-bottom:10px}.timer{font-size:32px;text-align:center;color:#a5b4fc;margin:10px 0;font-family:monospace}button{width:100%;background:#ef4444;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer}</style><div class="box"><div class="row" id="drag"><b>RUNNING MACRO</b><span id="x" style="cursor:pointer">✕</span></div><div style="text-align:center;color:#c7d2fe;font-size:11px" id="st">Initializing...</div><div class="timer" id="tm">00:00</div><button id="cn">Stop</button></div>';
this.q = s => this.s.querySelector(s);
this.q('#x').onclick = () => this.destroy();
this.q('#cn').onclick = () => this.destroy();
this.makeDraggable(this.q('#drag'));
document.body.appendChild(this.h);
this.run();
}
makeDraggable(head){
let pos1=0,pos2=0,pos3=0,pos4=0;
const dragMouseDown = e => { e = e || window.event; e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; };
const elementDrag = e => { e = e || window.event; e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; this.h.style.top = (this.h.offsetTop - pos2) + "px"; this.h.style.left = (this.h.offsetLeft - pos1) + "px"; };
const closeDragElement = () => { document.onmouseup = null; document.onmousemove = null; };
head.onmousedown = dragMouseDown;
}
async run(){
try { if('wakeLock' in navigator) await navigator.wakeLock.request('screen'); } catch(e){}
const wait = ms => new Promise(r => setTimeout(r, ms));
const queryDeep = (selector, root = document) => {
let el = root.querySelector(selector);
if (el) return el;
const allElements = root.querySelectorAll('*');
for (let i = 0; i < allElements.length; i++) {
if (allElements[i].shadowRoot) {
el = queryDeep(selector, allElements[i].shadowRoot);
if (el) return el;
}
}
return null;
};
const find = async (sel, txt) => {
const end = Date.now() + 15000;
while(Date.now() < end) {
let el = null;
if(txt) {
const spans = document.querySelectorAll('.presence-label-text, span');
const found = Array.from(spans).find(s => s.textContent.trim() === txt);
el = found ? found.closest('button') : null;
}
if(!el) {
el = queryDeep(sel);
}
if(el && el.isConnected && el.offsetParent !== null) return el;
await wait(300);
}
return null;
};
const ensureTopLevel = async () => {
let attempts = 0;
while(attempts < 3) {
const backBtn = document.querySelector('[aria-label="Navigate back to primary presences"]');
if(!backBtn || !backBtn.isConnected || backBtn.offsetParent === null) break;
this.q('#st').innerText = 'Resetting Menu...';
backBtn.click();
await wait(1000);
attempts++;
}
};
for(let i=0; i<steps.length; i++){
const group = steps[i];
this.q('#st').innerText = 'Sequence '+(i+1)+'/'+steps.length;
let rem = group.delay * 1000;
while(rem > 0) {
if(!document.body.contains(this.h)) return;
const sec = Math.ceil(rem/1000);
const mins = Math.floor(sec/60);
const sMod = sec % 60;
this.q('#tm').innerText = (mins<10?'0':'') + mins + ':' + (sMod<10?'0':'') + sMod;
await wait(1000);
rem -= 1000;
}
this.q('#tm').innerText = 'Action...';
for(let j=0; j<group.actions.length; j++) {
const action = group.actions[j];
if(j === 1) {
await ensureTopLevel();
}
const el = await find(action.sel, action.txt);
if(!el) { alert('Step '+(i+1)+' Sub-action '+(j+1)+' Failed: Not found ('+action.sel+')'); return; }
if(action.val !== null){
el.focus(); el.value = action.val;
el.dispatchEvent(new Event('input',{bubbles:true}));
el.dispatchEvent(new Event('change',{bubbles:true}));
if(action.enter){
const k={key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true};
el.dispatchEvent(new KeyboardEvent('keydown',k));
el.dispatchEvent(new KeyboardEvent('keyup',k));
}
}
['mousedown','mouseup','click'].forEach(evt => {
el.dispatchEvent(new MouseEvent(evt, {bubbles:true,cancelable:true,view:window}));
});
await wait(2500);
}
}
this.q('#tm').innerText = 'DONE';
this.q('#st').innerText = 'Complete';
setTimeout(()=>this.destroy(), 3000);
}
destroy(){ this.h.remove(); delete window.__mb_run; }
}
window.__mb_run = new MacroRuntime();
})();`;
const href = "javascript:" + encodeURIComponent(runtime.replace(/\s+/g,' ').trim());
const area = this.q('#out');
const link = this.q('#lnk');
link.href = href;
area.style.display = 'block';
}
destroy(){ this.clearListeners(); this.h.remove(); delete window.__mb_v22; }
}
window.__mb_v22 = new MacroBuilder();
})();