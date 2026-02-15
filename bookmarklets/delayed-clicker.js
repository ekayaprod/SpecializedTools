(function(){
        if(window.dc_running){window.dc_running.toggle();return;}

        /* Check if we can run here */
        if(window.location.protocol === 'about:' || window.location.protocol === 'chrome:'){
            alert('Bookmarklets cannot run on this browser page. Please try on a real website.');
            return;
        }

        class DC {
            constructor(){
                this.id = 'dc-' + Math.random().toString(36).substr(2,5);
                this.el = null;
                this.val = null;
                this.tm = null;
                this.init();
            }

            init(){
                this.h = document.createElement('div');
                this.h.id = this.id;
                this.h.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;display:block;font-family:sans-serif';
                this.s = this.h.attachShadow({mode:'open'});
                this.s.innerHTML = `
                <style>
                    :host{all:initial;font-family:sans-serif}
                    .b{background:#222;color:#fff;padding:15px;width:260px;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.5);border:1px solid #444;font-size:13px;box-sizing:border-box}
                    button{width:100%;padding:8px;margin-top:8px;cursor:pointer;background:#0078d4;color:#fff;border:none;border-radius:4px;font-weight:600}
                    button:disabled{background:#444;color:#888}
                    button.r{background:#d13438}
                    input,select{width:100%;padding:6px;background:#333;color:#fff;border:1px solid #555;border-radius:3px;box-sizing:border-box;margin-top:5px}
                    .hd{display:none!important}
                    .tm{font-size:28px;text-align:center;color:#4af;margin:15px 0;font-family:monospace}
                </style>
                <div class="b">
                    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                        <strong>⏳ Timer Click V5</strong>
                        <span id="x" style="cursor:pointer;padding:0 5px">✕</span>
                    </div>
                    <div id="p1">
                        <button id="pk">🎯 Pick Target</button>
                        <div id="so" class="hd" style="margin-top:10px;border-left:2px solid #0078d4;padding-left:8px">
                            <label>Option:</label><select id="sd"></select>
                        </div>
                        <div style="margin-top:15px;border-top:1px solid #444;padding-top:10px">
                            <label>Delay (Minutes):</label>
                            <input type="number" id="mn" value="30" min="0.1" step="0.1">
                        </div>
                        <button id="go" disabled>Start</button>
                    </div>
                    <div id="p2" class="hd">
                        <div class="tm" id="cd">00:00:00</div>
                        <button id="cn" class="r">Cancel</button>
                    </div>
                </div>`;
                document.body.appendChild(this.h);
                this.bind();
            }

            bind(){
                const q=s=>this.s.querySelector(s);
                q('#x').onclick=()=>this.h.remove();
                q('#pk').onclick=()=>this.pick();
                q('#go').onclick=()=>this.start();
                q('#cn').onclick=()=>this.reset();
            }

            pick(){
                this.h.style.display='none';
                const hl = document.createElement('div');
                hl.style.cssText = 'position:absolute;border:2px solid #0078d4;background:rgba(0,120,212,0.2);pointer-events:none;z-index:2147483646';
                document.body.appendChild(hl);

                const mv = e => {
                    const r = e.target.getBoundingClientRect();
                    hl.style.top = (r.top + window.scrollY) + 'px';
                    hl.style.left = (r.left + window.scrollX) + 'px';
                    hl.style.width = r.width + 'px';
                    hl.style.height = r.height + 'px';
                };

                const cl = e => {
                    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
                    this.el = e.target;
                    hl.remove();
                    document.removeEventListener('mousemove', mv);
                    document.removeEventListener('click', cl, true);
                    this.h.style.display='block';
                    this.anl();
                    return false;
                };

                document.addEventListener('mousemove', mv);
                document.addEventListener('click', cl, true);
            }

            anl(){
                const q=s=>this.s.querySelector(s);
                q('#pk').innerText = 'Target: ' + this.el.tagName;
                q('#pk').style.background = '#2ea44f';
                q('#go').disabled = false;

                if(this.el.tagName === 'SELECT'){
                    q('#so').classList.remove('hd');
                    const sd=q('#sd');
                    sd.innerHTML='';
                    Array.from(this.el.options).forEach(o=>sd.add(new Option(o.text,o.value)));
                    sd.value=this.el.value;
                    this.val=this.el.value;
                    sd.onchange=e=>this.val=e.target.value;
                } else {
                    q('#so').classList.add('hd');
                }
            }

            start(){
                const min = parseFloat(/** @type {HTMLInputElement} */ (this.s.querySelector('#mn')).value)||0;
                const end = Date.now() + (min*60000);
                this.s.querySelector('#p1').classList.add('hd');
                this.s.querySelector('#p2').classList.remove('hd');

                this.tm = setInterval(()=>{
                    const r = end - Date.now();
                    if(r<=0) { this.exec(); return; }
                    const m = Math.floor(r/60000).toString().padStart(2,'0');
                    const s = Math.floor((r%60000)/1000).toString().padStart(2,'0');
                    /** @type {HTMLElement} */ (this.s.querySelector('#cd')).innerText = m+':'+s;
                }, 1000);
            }

            reset(){
                clearInterval(this.tm);
                this.s.querySelector('#p1').classList.remove('hd');
                this.s.querySelector('#p2').classList.add('hd');
                /** @type {HTMLElement} */ (this.s.querySelector('#cd')).innerText='00:00:00';
            }

            exec(){
                clearInterval(this.tm);
                /** @type {HTMLElement} */ (this.s.querySelector('#cd')).innerText='DONE';
                try {
                    if(this.el.tagName==='SELECT'){
                        this.el.value=this.val;
                        this.el.dispatchEvent(new Event('input',{bubbles:true}));
                        this.el.dispatchEvent(new Event('change',{bubbles:true}));
                    } else {
                        ['mousedown','mouseup','click'].forEach(ev=>{
                            this.el.dispatchEvent(new MouseEvent(ev,{view:window,bubbles:true,cancelable:true}));
                        });
                    }
                } catch(e){
                    console.error("Delayed click execution failed", {
                        tagName: this.el ? this.el.tagName : 'null',
                        id: this.el ? this.el.id : 'null',
                        className: this.el ? this.el.className : 'null',
                        val: this.val,
                        error: e
                    });
                }
                setTimeout(()=>this.h.remove(), 2000);
            }

            toggle(){
                this.h.style.display = this.h.style.display==='none'?'block':'none';
            }
        }
        window.dc_running = new DC();
    })();
