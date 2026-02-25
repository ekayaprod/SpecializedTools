(function () {
    /** @require utils.js */

    if (window.__ir_v1) {
        window.__ir_v1.destroy();
        return;
    }
    if (!document.body) return alert('Page has no body.');

    class InteractionRecorder {
        constructor() {
            this.id = 'ir-' + Math.random().toString(36).slice(2);
            this.log = [];
            this.isRecording = false;
            this.cleanupFns = [];
            this.init();
        }

        _log(msg, data, level) {
            BookmarkletUtils.log('InteractionRecorder', msg, data, level);
        }

        init() {
            this._log('Initialized', { id: this.id });
            this.h = document.createElement('div');
            this.h.style.cssText =
                'position:fixed;top:15px;right:15px;z-index:2147483647;font-family:system-ui,sans-serif';
            this.s = this.h.attachShadow({ mode: 'open' });

            this.s.innerHTML =
                '<style>' +
                ':host{all:initial;font-family:system-ui,sans-serif}' +
                '.box{background:#451a03;color:#e2e8f0;width:240px;padding:16px;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.7);border:1px solid #d97706;font-size:13px;box-sizing:border-box}' +
                '.row{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;cursor:move;user-select:none}' +
                'h3{margin:0;color:#fcd34d;font-size:14px;font-weight:700}' +
                'button{width:100%;background:#f59e0b;color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:600;margin-top:8px;transition:0.2s;border:1px solid #d97706}' +
                'button:hover{background:#d97706}' +
                'button.stop{background:#ef4444;border-color:#b91c1c}' +
                'button.stop:hover{background:#b91c1c}' +
                '.status{margin-bottom:10px;text-align:center;font-size:11px;color:#cbd5e1}' +
                '.count{font-size:24px;text-align:center;font-family:monospace;margin:5px 0;color:#fcd34d}' +
                '</style>' +
                '<div class="box">' +
                '<div class="row" id="drag"><h3>Recorder</h3><span id="x" style="cursor:pointer">✕</span></div>' +
                '<div class="status" id="st">Ready</div>' +
                '<div class="count" id="cnt">0 Clicks</div>' +
                '<button id="btn">Start</button>' +
                '</div>';

            this.q = (s) => this.s.querySelector(s);
            this.bind();
            document.body.appendChild(this.h);
        }

        bind() {
            this.q('#x').onclick = () => this.destroy();
            const btn = this.q('#btn');
            btn.onclick = () => {
                if (this.isRecording) this.stop();
                else this.start();
            };
            BookmarkletUtils.makeDraggable(this.q('#drag'), this.h);
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

        start() {
            this._log('Recording started');
            this.isRecording = true;
            this.log = [];
            this.startTime = Date.now();

            const btn = this.q('#btn');
            btn.innerText = 'Stop & Save';
            btn.classList.add('stop');
            this.q('#st').innerText = 'Recording';
            this.q('#cnt').innerText = '0 Clicks';

            const handleClick = (e) => {
                if (this.h.contains(e.target)) return;

                const t = this.getDeepTarget(e);
                const clickData = {
                    timeOffset: Date.now() - this.startTime,
                    tagName: t.tagName,
                    id: t.id,
                    className: t.className,
                    innerText: t.innerText ? t.innerText.substring(0, 50).replace(/\n/g, ' ') : '',
                    ariaLabel: t.getAttribute('aria-label'),
                    role: t.getAttribute('role'),
                    path: this.getPath(t),
                    x: e.clientX,
                    y: e.clientY,
                    windowSize: window.innerWidth + 'x' + window.innerHeight,
                    scrollPosition: window.scrollX + ',' + window.scrollY,
                };

                this.log.push(clickData);
                this._log('Click captured', { tag: t.tagName, id: t.id, path: clickData.path });
                this.q('#cnt').innerText = this.log.length + ' Clicks';
            };

            document.addEventListener('click', handleClick, true);
            this.cleanupFns.push(() => document.removeEventListener('click', handleClick, true));
        }

        getPath(el) {
            const path = [];
            let curr = el;
            while (curr && curr !== document.body && curr !== document.documentElement) {
                let selector = curr.tagName.toLowerCase();
                if (curr.id) {
                    if (window.CSS && window.CSS.escape) {
                        selector += '#' + window.CSS.escape(curr.id);
                    } else {
                        selector += `[id="${curr.id.replace(/"/g, '\\"')}"]`;
                    }
                    path.unshift(selector);
                    break;
                } else {
                    if (curr.className && typeof curr.className === 'string') {
                        const classes = curr.className
                            .trim()
                            .split(/\s+/)
                            .filter((c) => c);
                        if (classes.length) selector += '.' + classes.join('.');
                    }

                    // Disambiguate siblings using nth-of-type if necessary
                    const parent = curr.parentElement;
                    if (parent) {
                        const siblings = Array.from(parent.children).filter((c) => c.tagName === curr.tagName);
                        if (siblings.length > 1) {
                            const index = siblings.indexOf(curr) + 1;
                            selector += `:nth-of-type(${index})`;
                        }
                    }

                    path.unshift(selector);
                    curr = curr.parentElement;
                }
            }
            return path.join(' > ');
        }

        stop() {
            this._log('Recording stopped', { totalClicks: this.log.length });
            this.isRecording = false;
            this.cleanupFns.forEach((fn) => fn());
            this.cleanupFns = [];

            const btn = this.q('#btn');
            btn.innerText = 'Start';
            btn.classList.remove('stop');
            this.q('#st').innerText = 'Saved';

            this.download();
        }

        download() {
            const text = JSON.stringify(this.log, null, 2);
            const filename = 'interaction_log_' + Date.now() + '.txt';
            BookmarkletUtils.downloadFile(filename, text, 'text/plain');
            this._log('Log exported', { filename: filename });
        }

        destroy() {
            if (this.isRecording) this.stop();
            this.h.remove();
            delete window.__ir_v1;
        }
    }
    window.__ir_v1 = new InteractionRecorder();
})();
