(function() {
if(window.__dc_v27){window.__dc_v27.destroy();return}
if(!document.body) return alert('Page has no body.');
class DC27 {
constructor(){
this.id = 'dc27-'+Math.random().toString(36).slice(2);
this.state = { t1: null, t1Val: null, loop: false, pressEnter: false, wakeLock: null, timeMode: 'delay' };
this.cleanupFns = [];
this.init();
}
init(){
this.h = document.createElement('div');
this.h.id = this.id;
this.h.style.cssText = 'position:fixed;top:15px;right:15px;z-index:2147483647;font-family:system-ui,sans-serif';
this.s = this.h.attachShadow({mode:'open'});
this.s.innerHTML = '<style>' +
':host{all:initial;font-family:system-ui,sans-serif}' +
'.box{background:#0f172a;color:#e2e8f0;width:260px;padding:16px;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.6);border:1px solid #334155;font-size:13px;box-sizing:border-box}' +
'.row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;cursor:move;user-select:none;padding-bottom:5px;border-bottom:1px solid #334155}' +
'h3,b{margin:0;color:#f8fafc;font-size:14px;font-weight:700}' +
'button{width:100%;background:#2563eb;color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:600;margin-top:8px;transition:0.2s}' +
'button:hover{background:#1d4ed8}' +
'button:disabled{background:#334155;color:#64748b;cursor:not-allowed}' +
'input{width:100%;background:#1e293b;color:#fff;border:1px solid #334155;padding:8px;border-radius:6px;box-sizing:border-box;margin-top:5px;outline:none}' +
'input:focus{border-color:#3b82f6}' +
'.hidden{display:none!important}' +
'.timer{font-size:32px;text-align:center;color:#60a5fa;margin:15px 0;font-family:monospace}' +
'.warn{background:#713f12;color:#fef08a;padding:8px;border-radius:4px;margin-top:10px;font-size:11px;border:1px solid #ca8a04}' +
'.toast{position:absolute;bottom:70px;left:50%;transform:translateX(-50%);background:#059669;color:white;padding:5px 10px;border-radius:4px;font-size:11px;white-space:nowrap;opacity:0;transition:opacity 0.5s}' +
'.mode-switch{display:flex;gap:10px;margin-top:10px;font-size:11px;color:#94a3b8}' +
'.mode-opt{cursor:pointer;display:flex;align-items:center;gap:4px}' +
'</style>' +
'<div class="box">' +
'<div class="row" id="drag"><b>QUICK CLICKER V27</b><span id="x" style="cursor:pointer">✕</span></div>' +
'<div id="v1">' +
'<button id="pk">🎯 Pick Target</button>' +
'<div id="warn" class="hidden warn"></div>' +
'<div id="inp" class="hidden">' +
'<div style="font-size:11px;color:#94a3b8;margin-top:8px">Input Text</div>' +
'<input type="text" id="val">' +
'<div style="margin-top:5px"><input type="checkbox" id="ent" style="width:auto;margin-right:5px"> Press Enter</div>' +
'</div>' +
'<div class="mode-switch">' +
'<label class="mode-opt"><input type="radio" name="tm_mode" value="delay" checked style="width:auto"> Delay (Min)</label>' +
'<label class="mode-opt"><input type="radio" name="tm_mode" value="clock" style="width:auto"> Clock Time</label>' +
'</div>' +
'<div id="box_delay">' +
'<input type="number" id="mn" value="30" placeholder="Minutes">' +
'</div>' +
'<div id="box_clock" class="hidden">' +
'<input type="time" id="clk">' +
'</div>' +
'<button id="go" disabled>Start</button>' +
'</div>' +
'<div id="v2" class="hidden">' +
'<div class="timer" id="tm">00:00</div>' +
'<button id="cn" style="background:#ef4444">Stop</button>' +
'<div id="toast" class="toast">Wake Lock Active 🔒</div>' +
'</div>' +
'</div>';
this.q = s =>  (this.s.querySelector(s));
this.bind();
document.body.appendChild(this.h);
}
bind(){
this.q('#x').onclick=()=>this.destroy();
this.q('#pk').onclick=()=>this.pick();
this.q('#go').onclick=()=>this.start();
this.q('#cn').onclick=()=>this.reset();
(this.q('#val')).onchange=e=>this.state.t1Val= (e.target).value;
(this.q('#ent')).onchange=e=>this.state.pressEnter= (e.target).checked;
this.makeDraggable(this.q('#drag'));
const radios = this.s.querySelectorAll('input[name="tm_mode"]');
radios.forEach(r =>  (r).onchange = (e) => {
this.state.timeMode =  (e.target).value === 'delay' ? 'delay' : 'clock';
if(this.state.timeMode === 'delay') {
this.q('#box_delay').classList.remove('hidden');
this.q('#box_clock').classList.add('hidden');
} else {
this.q('#box_delay').classList.add('hidden');
this.q('#box_clock').classList.remove('hidden');
}
});
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
audit(el){
const style = window.getComputedStyle(el);
const rect = el.getBoundingClientRect();
let issues = [];
if(style.display === 'none') issues.push('Display is None');
if(style.visibility === 'hidden') issues.push('Visibility is Hidden');
if(style.opacity === '0') issues.push('Opacity is 0');
if(rect.width === 0 || rect.height === 0) issues.push('Size is 0px');
if(!el.isConnected) issues.push('Detached from DOM');
const w = this.q('#warn');
if(issues.length > 0) {
w.innerText = '⚠️ Warning: Target is hidden (' + issues[0] + '). Automation may fail.';
w.classList.remove('hidden');
} else {
w.classList.add('hidden');
}
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
pick(){
this.h.style.display='none';
const hl=document.createElement('div');
hl.style.cssText='position:absolute;border:2px solid #0078d4;background:rgba(0,120,212,0.2);pointer-events:none;z-index:2147483646';
document.body.appendChild(hl);
const s=document.createElement('style');
s.id='dc-cur'; s.innerHTML='*{cursor:crosshair!important}';
document.head.appendChild(s);
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
e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
};
const cl=e=>{
if(e.shiftKey) return;
stopEvent(e);
if(e.target.tagName==='IFRAME') alert('Cannot click inside IFrame');
let targetEl = this.getTarget(e);
if(!targetEl) return;
this.state.t1=targetEl;
this.audit(targetEl);
const t=targetEl.tagName;
const inp = this.q('#inp');
if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT') inp.classList.remove('hidden');
else inp.classList.add('hidden');
(this.q('#go')).disabled=false;
this.q('#pk').style.background='#059669';
this.q('#pk').innerText = 'Target: '+t;
hl.remove(); s.remove();
this.clearListeners();
this.h.style.display='block';
return false;
};
this.add(document, 'mousemove', mv);
this.add(document, 'mousedown', stopEvent, true);
this.add(document, 'mouseup', stopEvent, true);
this.add(document, 'click', cl, true);
}
clearListeners() { this.cleanupFns.forEach(fn=>fn()); this.cleanupFns = []; }
async start(){
let targetTime;
if(this.state.timeMode === 'delay') {
const m = parseFloat( (this.q('#mn')).value)||0;
if(m<=0) return alert('Invalid Time');
targetTime = Date.now() + (m*60000);
} else {
const timeStr =  (this.q('#clk')).value;
if(!timeStr) return alert('Please set a clock time');
const [h, m] = timeStr.split(':');
const now = new Date();
const d = new Date();
d.setHours(parseInt(h), parseInt(m), 0, 0);
if(d < now) {
d.setDate(d.getDate() + 1);
}
targetTime = d.getTime();
}
try {
if('wakeLock' in navigator) {
this.state.wakeLock = await navigator.wakeLock.request('screen');
const t = this.q('#toast');
t.style.opacity = '1';
setTimeout(()=>t.style.opacity='0', 3000);
}
} catch(e){
console.warn('Wake Lock failed:', e);
}
this.q('#v1').classList.add('hidden');
this.q('#v2').classList.remove('hidden');
const elTm = this.q('#tm');
this.iv = setInterval(()=>{
const r = targetTime - Date.now();
if(r<=0) { clearInterval(this.iv); this.exec(elTm); return; }
const hours = Math.floor(r / 3600000);
const minutes = Math.floor((r % 3600000) / 60000);
const seconds = Math.floor((r % 60000) / 1000);
elTm.innerText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
document.title = `⏳ ${hours}:${minutes}:${seconds}`;
},1000);
}
exec(elTm){
const el = this.state.t1;
const display = elTm || this.q('#tm');
if(!el || !el.isConnected) {
alert('FAILED: Target detached (Page refreshed?).');
display.innerText='FAIL'; return;
}
if(this.state.t1Val && (el.matches('input,textarea,select'))){
const inputEl =  (el);
inputEl.focus(); inputEl.value=this.state.t1Val;
inputEl.dispatchEvent(new Event('input',{bubbles:true}));
inputEl.dispatchEvent(new Event('change',{bubbles:true}));
if(this.state.pressEnter){
const k={key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true};
inputEl.dispatchEvent(new KeyboardEvent('keydown',k));
inputEl.dispatchEvent(new KeyboardEvent('keyup',k));
}
}
['mousedown','mouseup','click'].forEach(e=>el.dispatchEvent(new MouseEvent(e,{bubbles:true, cancelable:true})));
display.innerText='DONE';
}
reset(){
clearInterval(this.iv);
if(this.state.wakeLock) this.state.wakeLock.release();
this.clearListeners();
document.title = 'Stopped';
this.q('#v1').classList.remove('hidden');
this.q('#v2').classList.add('hidden');
}
destroy(){ this.reset(); this.h.remove(); delete window.__dc_v27; }
}
window.__dc_v27 = new DC27();
})();