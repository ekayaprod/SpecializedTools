// @ts-nocheck
(function () {
    /** @require utils.js */

    if (window.__dc_v27) {
        window.__dc_v27.destroy();
        return;
    }
    if (!document.body) return console.error('Page has no body.', { url: window.location.href });

    /**
     * @typedef {Object} QuickClickerState
     * @property {HTMLElement|null} t1 - The target element to click.
     * @property {string|null} t1Val - The value to type into the target input (if applicable).
     * @property {boolean} pressEnter - Whether to press Enter after typing.
     * @property {WakeLockSentinel|null} wakeLock - The Screen Wake Lock sentinel to prevent sleep.
     * @property {'delay'|'clock'} timeMode - The timing mode: 'delay' (countdown) or 'clock' (specific time).
     */

    /**
     * Quick Clicker V27
     * A powerful bookmarklet for automating clicks on a single target element.
     * Supports delayed execution, scheduled clock time, text input, and wake lock.
     */
    class DC27 {
        constructor() {
            this.id = 'dc27-' + Math.random().toString(36).slice(2);
            /** @type {QuickClickerState} */
            this.state = { t1: null, t1Val: null, pressEnter: false, wakeLock: null, timeMode: 'delay' };
            this.cleanupFns = [];
            this.init();
        }

        /**
         * Initializes the UI and injects it into the DOM.
         */
        init() {
            const cssText =
                'position:fixed;top:15px;right:15px;z-index:2147483647;font-family:system-ui,sans-serif';
            const { h, s } = BookmarkletUtils.createShadowRoot(this.id, cssText);
            this.h = h;
            this.s = s;

            this.s.innerHTML =
                '<style>' +
                ':host{all:initial;font-family:system-ui,sans-serif}' +
                '.box{background:#0f172a;color:#e2e8f0;width:260px;padding:16px;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.6);border:1px solid #334155;font-size:13px;box-sizing:border-box;transition:height 0.3s ease}' +
                '.row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;cursor:move;user-select:none;padding-bottom:5px;border-bottom:1px solid #334155}' +
                'h3,b{margin:0;color:#f8fafc;font-size:14px;font-weight:700}' +
                'button{width:100%;background:#2563eb;color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:600;margin-top:8px;transition:all 0.2s}' +
                'button:hover{background:#1d4ed8;transform:scale(1.02)}' +
                'button:active{transform:scale(0.98)}' +
                'button:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
                'button:disabled{background:#334155;color:#64748b;cursor:not-allowed;transform:none}' +
                'input{width:100%;background:#1e293b;color:#fff;border:1px solid #334155;padding:8px;border-radius:6px;box-sizing:border-box;margin-top:5px;outline:none;transition:border-color 0.2s}' +
                'input:focus{border-color:#3b82f6}' +
                '.hidden{display:none!important}' +
                '.view{opacity:1;transition:opacity 0.2s ease-in-out}' +
                '.view.fade-out{opacity:0}' +
                '.timer{font-size:32px;text-align:center;color:#60a5fa;margin:15px 0;font-family:monospace}' +
                '.warn{background:#713f12;color:#fef08a;padding:8px;border-radius:4px;margin-top:10px;font-size:11px;border:1px solid #ca8a04}' +
                '.toast{position:absolute;bottom:70px;left:50%;transform:translateX(-50%);background:#334155;color:white;padding:6px 12px;border-radius:6px;font-size:12px;white-space:nowrap;opacity:0;transition:opacity 0.3s,transform 0.3s;pointer-events:none;z-index:100}' +
                '.toast.visible{opacity:1;transform:translateX(-50%) translateY(0)}' +
                '.toast.hidden{opacity:0;transform:translateX(-50%) translateY(10px)}' +
                '.toast.error{background:#ef4444}' +
                '.toast.success{background:#10b981}' +
                '.toast.info{background:#3b82f6}' +
                '@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); } 70% { box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); } 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); } }' +
                '.pulse { animation: pulse 2s infinite; }' +
                '.mode-switch{display:flex;gap:10px;margin-top:10px;font-size:11px;color:#94a3b8}' +
                '.mode-opt{cursor:pointer;display:flex;align-items:center;gap:4px}' +
                '</style>' +
                '<div class="box">' +
                '<div class="row" id="drag"><b>QUICK CLICKER V27</b><button id="x" aria-label="Close" style="background:transparent;border:none;color:#e2e8f0;font-size:14px;cursor:pointer;padding:0;">✕</button></div>' +
                '<div id="v1" class="view">' +
                '<button id="pk">🎯 Select Element</button>' +
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
                '<div id="v2" class="view hidden">' +
                '<div class="timer" id="tm">00:00</div>' +
                '<button id="cn" style="background:#ef4444">Stop</button>' +
                '<div id="toast" class="toast hidden" role="alert" aria-live="assertive">No Sleep Active</div>' +
                '</div>' +
                '</div>';

            /** @type {(s:string)=>HTMLElement} */
            this.q = (s) => /** @type {HTMLElement} */ (this.s.querySelector(s));
            this.bind();
            setTimeout(() => this.q('#pk').focus(), 50);
        }

        /**
         * Shows a toast notification.
         * @param {string} msg - Message to display.
         * @param {'info'|'success'|'error'} [type='info'] - Type of toast.
         */
        showToast(msg, type = 'info') {
            const t = this.q('#toast');
            t.innerText = msg;
            t.className = 'toast visible ' + type;

            if (this.toastTimer) clearTimeout(this.toastTimer);
            this.toastTimer = setTimeout(() => {
                t.className = 'toast hidden ' + type;
            }, 3000);
        }

        /**
         * Binds event listeners to UI elements.
         */
        bind() {
            this.q('#x').onclick = () => this.destroy();
            this.q('#pk').onclick = () => this.pick();
            this.q('#go').onclick = () => this.start();
            this.q('#cn').onclick = () => this.reset();
            // @ts-ignore
            const valInp = /** @type {HTMLInputElement} */ (/** @type {unknown} */ (this.q('#val')));
            valInp.onchange = (e) => (this.state.t1Val = /** @type {HTMLInputElement} */ (e.target).value);
            // @ts-ignore
            const entInp = /** @type {HTMLInputElement} */ (/** @type {unknown} */ (this.q('#ent')));
            entInp.onchange = (e) => (this.state.pressEnter = /** @type {HTMLInputElement} */ (e.target).checked);
            BookmarkletUtils.makeDraggable(this.q('#drag'), this.h);

            this.h.onkeydown = (e) => {
                if (e.key === 'Escape') this.destroy();
            };

            const radios = this.s.querySelectorAll('input[name="tm_mode"]');
            radios.forEach(
                (r) =>
                    /** @type {HTMLInputElement} */ ((r).onchange = (e) => {
                        this.state.timeMode =
                            /** @type {HTMLInputElement} */ (e.target).value === 'delay' ? 'delay' : 'clock';
                        if (this.state.timeMode === 'delay') {
                            this.q('#box_delay').classList.remove('hidden');
                            this.q('#box_clock').classList.add('hidden');
                        } else {
                            this.q('#box_delay').classList.add('hidden');
                            this.q('#box_clock').classList.remove('hidden');
                        }
                    })
            );
        }

        /**
         * Adds an event listener with cleanup tracking.
         */
        add(t, ev, fn, opt) {
            t.addEventListener(ev, fn, opt);
            this.cleanupFns.push(() => t.removeEventListener(ev, fn, opt));
        }

        /**
         * Checks the target element for visibility issues and warns the user.
         * @param {HTMLElement} el - The element to audit.
         */
        audit(el) {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            let issues = [];
            if (style.display === 'none') issues.push('Display is None');
            if (style.visibility === 'hidden') issues.push('Visibility is Hidden');
            if (style.opacity === '0') issues.push('Opacity is 0');
            if (rect.width === 0 || rect.height === 0) issues.push('Size is 0px');
            if (!el.isConnected) issues.push('Detached from DOM');

            const w = this.q('#warn');
            if (issues.length > 0) {
                w.innerText = '⚠️ Target hidden. May fail.';
                w.classList.remove('hidden');
            } else {
                w.classList.add('hidden');
            }
        }

        /**
         * Starts the element picker mode.
         */
        pick() {
            this.h.style.display = 'none';
            const hl = document.createElement('div');
            hl.style.cssText =
                'position:absolute;border:2px solid #0078d4;background:rgba(0,120,212,0.2);pointer-events:none;z-index:2147483646';
            document.body.appendChild(hl);

            const s = document.createElement('style');
            s.id = 'dc-cur';
            s.innerHTML = '*{cursor:crosshair!important}';
            document.head.appendChild(s);

            this.showToast('Click an element to target it...', 'info');

            const mv = (e) => {
                if (e.shiftKey) {
                    hl.style.display = 'none';
                    return;
                }
                const t = BookmarkletUtils.getTarget(e);
                if (!t) {
                    hl.style.display = 'none';
                    return;
                }

                hl.style.display = 'block';
                const r = t.getBoundingClientRect();
                hl.style.top = r.top + window.scrollY + 'px';
                hl.style.left = r.left + window.scrollX + 'px';
                hl.style.width = r.width + 'px';
                hl.style.height = r.height + 'px';
            };

            const stopEvent = (e) => {
                if (e.shiftKey) return;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            };

            const cl = (e) => {
                if (e.shiftKey) return;
                stopEvent(e);
                if (e.target.tagName === 'IFRAME') return this.showToast('Cannot click inside IFrame', 'error');

                let targetEl = BookmarkletUtils.getTarget(e);
                if (!targetEl) return;

                this.state.t1 = targetEl;
                this.audit(targetEl);

                const t = targetEl.tagName;
                const inp = this.q('#inp');
                if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') {
                    inp.classList.remove('hidden');
                    setTimeout(() => this.q('#val').focus(), 100);
                } else inp.classList.add('hidden');

                const goBtn = /** @type {HTMLButtonElement} */ (this.q('#go'));
                goBtn.disabled = false;
                goBtn.classList.add('pulse');

                this.q('#pk').style.background = '#059669';
                this.q('#pk').innerText = 'Target: ' + t;

                hl.remove();
                s.remove();
                this.clearListeners();
                this.h.style.display = 'block';
                return false;
            };

            this.add(document, 'mousemove', mv);
            this.add(document, 'mousedown', stopEvent, true);
            this.add(document, 'mouseup', stopEvent, true);
            this.add(document, 'click', cl, true);
        }

        clearListeners() {
            this.cleanupFns.forEach((fn) => fn());
            this.cleanupFns = [];
        }

        /**
         * Switches the active view.
         * @param {string} fromId - The ID of the view to hide.
         * @param {string} toId - The ID of the view to show.
         * @param {string} focusId - The ID of the element to focus after switch.
         */
        switchView(fromId, toId, focusId) {
            const fromEl = this.q('#' + fromId);
            const toEl = this.q('#' + toId);

            fromEl.classList.add('fade-out');

            setTimeout(() => {
                fromEl.classList.add('hidden');
                fromEl.classList.remove('fade-out');

                toEl.classList.add('fade-out');
                toEl.classList.remove('hidden');

                requestAnimationFrame(() => {
                    toEl.classList.remove('fade-out');
                    if (focusId) {
                        const el = this.q('#' + focusId);
                        if (el) el.focus();
                    }
                });
            }, 200);
        }

        /**
         * Starts the countdown or waits for the scheduled time.
         */
        async start() {
            const MS_PER_MINUTE = 60000;
            const MS_PER_HOUR = 3600000;
            const MS_PER_SECOND = 1000;

            let targetTimestamp;

            if (this.state.timeMode === 'delay') {
                const minutesInput = parseFloat(/** @type {HTMLInputElement} */ (this.q('#mn')).value) || 0;
                if (minutesInput <= 0) return this.showToast('Invalid Time', 'error');
                targetTimestamp = Date.now() + minutesInput * MS_PER_MINUTE;
            } else {
                const clockTimeStr = /** @type {HTMLInputElement} */ (this.q('#clk')).value;
                if (!clockTimeStr) return this.showToast('Please set a clock time', 'error');
                const [hoursStr, minutesStr] = clockTimeStr.split(':');
                const now = new Date();
                const scheduledDate = new Date();
                scheduledDate.setHours(parseInt(hoursStr), parseInt(minutesStr), 0, 0);
                if (scheduledDate < now) {
                    scheduledDate.setDate(scheduledDate.getDate() + 1);
                }
                targetTimestamp = scheduledDate.getTime();
            }

            try {
                if ('wakeLock' in navigator) {
                    this.state.wakeLock = await navigator.wakeLock.request('screen');
                    this.showToast('No Sleep Active', 'success');
                }
            } catch (e) {
                console.warn('Wake Lock failed:', { error: e.message, type: e.name });
                this.showToast('Wake Lock Failed', 'error');
            }

            this.switchView('v1', 'v2', 'cn');

            const timerElement = this.q('#tm');

            this.iv = setInterval(() => {
                const remainingMs = targetTimestamp - Date.now();
                if (remainingMs <= 0) {
                    clearInterval(this.iv);
                    this.exec(timerElement);
                    return;
                }

                const hours = Math.floor(remainingMs / MS_PER_HOUR);
                const minutes = Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE);
                const seconds = Math.floor((remainingMs % MS_PER_MINUTE) / MS_PER_SECOND);

                const format = (n) => n.toString().padStart(2, '0');

                timerElement.innerText = `${format(hours)}:${format(minutes)}:${format(seconds)}`;
                document.title = `⏳ ${hours}:${minutes}:${seconds}`;
            }, MS_PER_SECOND);
        }

        /**
         * Executes the action (click or type) on the target element.
         */
        exec(elTm) {
            const el = this.state.t1;
            const display = elTm || this.q('#tm');

            if (!el || !el.isConnected) {
                this.showToast('FAILED: Target detached', 'error');
                display.innerText = 'Error';
                return;
            }

            if (this.state.t1Val && el.matches('input,textarea,select')) {
                const inputEl = /** @type {HTMLInputElement} */ (el);
                inputEl.focus();
                inputEl.value = this.state.t1Val;
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                if (this.state.pressEnter) {
                    const k = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
                    inputEl.dispatchEvent(new KeyboardEvent('keydown', k));
                    inputEl.dispatchEvent(new KeyboardEvent('keyup', k));
                }
            }
            ['mousedown', 'mouseup', 'click'].forEach((e) =>
                el.dispatchEvent(new MouseEvent(e, { bubbles: true, cancelable: true }))
            );
            display.innerText = 'DONE';
            this.showToast('Automation Complete!', 'success');
        }

        /**
         * Resets the timer and UI to the initial state.
         */
        reset() {
            clearInterval(this.iv);
            if (this.state.wakeLock) this.state.wakeLock.release();
            this.clearListeners();
            document.title = 'Stopped';

            // Focus Start button if valid, otherwise Pick button
            const goBtn = /** @type {HTMLButtonElement} */ (this.q('#go'));
            const focusTarget = goBtn && !goBtn.disabled ? 'go' : 'pk';

            this.switchView('v2', 'v1', focusTarget);
        }

        /**
         * Completely removes the tool from the DOM.
         */
        destroy() {
            this.reset();
            this.h.remove();
            delete window.__dc_v27;
        }
    }
    window.__dc_v27 = new DC27();
})();
