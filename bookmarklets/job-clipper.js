// @ts-nocheck
(async function () {
    const mId = "jc-job-modal";
    const oId = "jc-job-overlay";

    // --- DOM Utility ---
    const escapeHtml = (unsafe) => {
        return (unsafe || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const el = (tag, html, parent, attributes) => {
        const e = document.createElement(tag);
        if (html) e.innerHTML = html;
        if (attributes) {
            for (const [k, v] of Object.entries(attributes)) {
                k === "class" ? (e.className = v) : e.setAttribute(k, v);
            }
        }
        if (parent) parent.appendChild(e);
        return e;
    };

    const getT = (selectors, context = document) => {
        for (const s of selectors) {
            try {
                const n = context.querySelector(s);
                if (n && n.textContent) return n.textContent.replace(/\s+/g, " ").trim();
            } catch { /* ignore */ }
        }
        return "";
    };

    // --- CSS Injection ---
    const css = `:root {
    --jc-primary: #d946ef;
    --jc-primary-hover: #c026d3;
    --jc-primary-focus: rgba(217, 70, 239, 0.3);
    --jc-primary-focus-strong: rgba(217, 70, 239, 0.4);
    --jc-bg: #fff;
    --jc-bg-alt: #f9fafb;
    --jc-bg-hover: #f3f4f6;
    --jc-text: #1f2937;
    --jc-text-muted: #6b7280;
    --jc-text-sub: #4b5563;
    --jc-border: #e5e7eb;
    --jc-success: #10b981;
    --jc-overlay: rgba(15, 23, 42, 0.6);
    --jc-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    --jc-shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --jc-radius-xl: 16px;
    --jc-radius-md: 8px;
    --jc-radius-sm: 6px;
    --jc-link: #0284c7;
    --jc-link-hover: #0369a1;
    --jc-snippet-bg: #f1f5f9;
    --jc-snippet-text: #334155;
    --jc-highlight-bg: #dcfce7;
    --jc-highlight-text: #166534;
}
@keyframes jc-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes jc-slide-up { from { transform: translate(-50%, -45%); opacity: 0; } to { transform: translate(-50%, -50%); opacity: 1; } }
@keyframes jc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
.jc-overlay { position: fixed; inset: 0; background: var(--jc-overlay); z-index: 99998; backdrop-filter: blur(4px); animation: jc-fade-in 0.2s ease-out; }
.jc-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--jc-bg); padding: 24px; width: 650px; max-width: 90vw; border-radius: var(--jc-radius-xl); z-index: 99999; box-shadow: var(--jc-shadow); font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; gap: 16px; color: var(--jc-text); animation: jc-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); max-height: 90vh; }
.jc-header { margin: 0; font-size: 20px; font-weight: 700; text-align: center; color: var(--jc-primary); }
.jc-subheader { font-size: 13px; text-align: center; color: var(--jc-text-sub); font-weight: 600; }
.jc-toggles { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.jc-pill { padding: 6px 14px; border-radius: 99px; border: 1px solid var(--jc-border); cursor: pointer; font-size: 13px; font-weight: 600; user-select: none; transition: all 0.2s ease; }
.jc-pill:hover { border-color: var(--jc-primary); }
.jc-pill[data-active="true"] { background: var(--jc-primary); color: #fff; border-color: var(--jc-primary); box-shadow: var(--jc-shadow-sm); }
.jc-textarea { width: 100%; padding: 12px; border: 1px solid var(--jc-border); border-radius: var(--jc-radius-sm); font-size: 13px; box-sizing: border-box; resize: vertical; min-height: 280px; font-family: monospace; background: var(--jc-bg-alt); transition: all 0.3s ease; }
.jc-textarea:focus { outline: none; border-color: var(--jc-primary); box-shadow: 0 0 0 2px var(--jc-primary-focus); }
.jc-textarea:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--jc-primary-focus-strong); }
.jc-actions { display: flex; gap: 10px; justify-content: space-between; border-top: 1px solid var(--jc-border); padding-top: 16px; }
.jc-btn { padding: 10px 16px; border-radius: var(--jc-radius-sm); font-weight: 600; font-size: 14px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s ease-in-out; display: inline-flex; align-items: center; justify-content: center; }
.jc-btn:active { transform: scale(0.95); }
.jc-btn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--jc-bg), 0 0 0 4px var(--jc-primary); }
.jc-btn-primary { background: var(--jc-primary); color: #fff; }
.jc-btn-primary:hover { background: var(--jc-primary-hover); }
.jc-btn-ghost { background: transparent; color: var(--jc-text-muted); }
.jc-btn-ghost:hover { background: var(--jc-bg-hover); color: var(--jc-text); }
.jc-btn-success { background: var(--jc-success); color: #fff; }
.jc-scroll-list { overflow-y: auto; flex: 1; min-height: 200px; border: 1px solid var(--jc-border); border-radius: var(--jc-radius-md); background: var(--jc-bg-alt); padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.jc-list-item { background: var(--jc-bg); border: 1px solid var(--jc-border); border-radius: var(--jc-radius-sm); padding: 14px; transition: all 0.3s ease-in-out; }
.jc-list-item:hover { transform: translateY(-2px); box-shadow: var(--jc-shadow-sm); border-color: var(--jc-primary); }
.jc-item-title { font-size: 15px; font-weight: 700; color: var(--jc-link); text-decoration: none; display: block; margin-bottom: 4px; transition: color 0.2s ease; }
.jc-item-title:hover { color: var(--jc-link-hover); text-decoration: underline; }
.jc-item-meta { font-size: 11px; font-weight: 600; color: var(--jc-text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.jc-item-snippet { font-size: 13px; color: var(--jc-snippet-text); line-height: 1.6; padding: 10px; background: var(--jc-snippet-bg); border-left: 3px solid var(--jc-primary); border-radius: 4px; }
.jc-highlight { background: var(--jc-highlight-bg); color: var(--jc-highlight-text); padding: 0 4px; border-radius: 3px; font-weight: 600; }
.jc-progress { font-size: 16px; font-weight: 600; text-align: center; color: var(--jc-primary); padding: 40px; animation: jc-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center; }
.jc-progress span { font-size: 13px; font-weight: 400; color: var(--jc-text-muted); }
.jc-empty-state { text-align: center; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.jc-empty-icon { font-size: 32px; opacity: 0.5; }
.jc-empty-title { font-weight: 600; color: var(--jc-text-sub); font-size: 15px; }
.jc-empty-desc { font-size: 13px; color: var(--jc-text-muted); }`;

    // --- UI Builder ---
    const initUI = (title, headerText, contentNode, getCopyPayload) => {
        if (!document.getElementById("jc-styles")) {
            el("style", css, document.head, { id: "jc-styles" });
        }
        document.getElementById(mId)?.remove();
        document.getElementById(oId)?.remove();
        
        el("div", "", document.body, { id: oId, class: "jc-overlay" });
        const mo = el("div", "", document.body, { id: mId, class: "jc-modal" });
        
        el("h2", title, mo, { class: "jc-header" });
        if (headerText) el("div", headerText, mo, { class: "jc-subheader" }); // Intentionally allow HTML here for bolding/etc, since it's passed from safe internal strings. If it contains user input, it should be escaped at the call site.
        
        mo.appendChild(contentNode);
        
        const act = el("div", "", mo, { class: "jc-actions" });
        const cp = el("button", "Copy Payload", act, { class: "jc-btn jc-btn-primary" });
        
        cp.onclick = () => {
            navigator.clipboard.writeText(getCopyPayload());
            cp.innerHTML = "Copied!";
            cp.classList.add("jc-btn-success");
            setTimeout(() => (cp.innerHTML = "Copy Payload"), 1500);
        };
        
        el("button", "Close", act, { class: "jc-btn jc-btn-ghost" }).onclick = () => {
            mo.remove();
            document.getElementById(oId)?.remove();
        };
        
        return mo;
    };

    // --- Core Extraction Engine ---
    const Ext = {
        cln(h) {
            let c = h.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>|<\/div>|<\/h[1-6]>/gi, "\n\n").replace(/<\/li>/gi, "\n");
            const t = document.createElement("div");
            t.innerHTML = c;
            return (t.textContent || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
        },
        
        q() {
            const a = [];
            // This selector accurately targets both static job postings and the SPA application wizard
            document.querySelectorAll(".question-item").forEach(q => {
                const nEl = q.querySelector(".question-index, .span2");
                const n = nEl ? nEl.textContent.replace(/\s+/g, " ").trim() : "";
                
                const tEl = q.querySelector(".question-container > span, .question-text span, .question-text label");
                const t = tEl ? tEl.textContent.replace(/\s+/g, " ").trim() : "";
                
                if (!t) return;
                
                const ops = [...q.querySelectorAll("ul > li, .radio-set label, .checkbox-set label, select option")]
                    .map(l => l.textContent.replace(/\s+/g, " ").trim())
                    .filter(x => x && !x.includes("Select one"));
                    
                a.push(`Q${n ? n : ''}: ${t}` + (ops.length ? `\n  - ${ops.join("\n  - ")}` : ""));
            });
            return a.join("\n\n");
        },
        
        d() {
            let t = getT(["h1.t-24", ".jobsearch-JobInfoHeader-title", ".entity-title", "h1.title", "h1"]) || "[Title]";
            let c = getT([".job-details-jobs-unified-top-card__company-name", ".agency-name dd", ".company-name"]) || "[Company]";
            let s = getT([".job-details-jobs-unified-top-card__job-insight:contains('$')", ".salary", ".pay-range"]);
            
            if (!s) {
                const m = (document.body.textContent || "").match(/\$[0-9,]+(\.[0-9]{2})?(\s*[-to]+\s*\$[0-9,]+(\.[0-9]{2})?)?\s*(Annually|per year|\/yr|\/hour|per hour)?/i);
                if (m) s = m[0].trim();
            }
            
            let ds = document.querySelector("#details-info");
            ds = ds ? this.cln(ds.innerHTML) : "";
            
            let pr = "";
            const wx = [...document.querySelectorAll(".box-container dl")];
            if (wx.length) {
                pr = wx.map(dl => {
                    let o = {};
                    dl.querySelectorAll("dt").forEach(dt => {
                        const l = (dt.textContent || "").replace(/\s+/g, " ").trim();
                        const dd = dt.nextElementSibling;
                        if (dd && dd.tagName === "DD") {
                            const v = (dd.textContent || "").replace(/\s+/g, " ").trim();
                            if (l.includes("Company")) o.c = v;
                            if (l.includes("Position")) o.p = v;
                            if (l.includes("Dates")) o.d = v;
                            if (l.includes("Summary")) o.s = v;
                        }
                    });
                    return o.c || o.p ? `**Company:** ${o.c || ""}\n**Position:** ${o.p || ""}\n**Dates:** ${o.d || ""}\n**Summary:**\n${o.s || ""}` : "";
                }).filter(Boolean).join("\n\n");
            }
            return { t, c, s, ds, q: this.q(), pr };
        },
        
        async l(cb) {
            const it = [...document.querySelectorAll(".list-item")];
            const rx = /telework|remote|hybrid|work from home|wfh/i;
            const m = [];
            
            for (let i = 0; i < it.length; i++) {
                const lA = it[i].querySelector(".item-details-link");
                const ti = lA?.textContent.replace(/\s+/g, " ").trim() || "Unknown";
                const hr = lA?.getAttribute("href") || "";
                const ln = hr.startsWith("http") ? hr : window.location.origin + hr;
                const me = it[i].querySelector(".list-meta")?.textContent.replace(/\s+/g, " ").trim() || "";
                
                cb(i + 1, it.length, ti);
                
                try {
                    const rs = await fetch(ln);
                    const ht = await rs.text();
                    const dc = new DOMParser().parseFromString(ht, "text/html");
                    let tp = "";
                    dc.querySelectorAll(".tab-pane").forEach(p => { 
                        if (p.id !== "details-questions" && p.id !== "details-benefits") {
                            tp += p.innerHTML + "<br><br>"; 
                        }
                    });
                    const cln = this.cln(tp);
                    if (rx.test(cln)) {
                        const mt = cln.split("\n").filter(x => rx.test(x)).map(x => x.trim()).join(" [...] ");
                        m.push({ ti, ln, me, s: mt.length > 800 ? mt.substring(0, 800) + "..." : mt });
                    }
                } catch { /* ignore */ }
            }
            return { tot: it.length, m };
        }
    };

    // --- Routing & Initialization ---
    const isL = document.querySelector(".list-item");
    const u = window.location.href;

    if (u.includes("/apply/questions")) {
        const q = Ext.q();
        if (!q) return alert("No application questions detected on this page.");
        
        const c = el("div");
        const ta = el("textarea", "", c, { class: "jc-textarea", readonly: true });
        ta.value = `### APPLICATION QUESTIONS\n\n${q}`;
        
        initUI("Questionnaire Extractor", "Paste these into the Gem for Phase 3 Triage.", c, () => ta.value);

    } else if (document.querySelector("#details-info") || document.querySelector(".box-container dl") || u.includes("/apply/work")) {
        const d = Ext.d();
        const st = { 
            m: !!d.t && d.t !== "[Title]", 
            d: !!d.ds, 
            q: !!d.q, 
            p: !!d.pr 
        };
        
        if (!st.m && !st.d && !st.q && !st.p) return alert("Operation aborted: No job data detected.");
        
        const c = el("div");
        const rw = el("div", "", c, { class: "jc-toggles" });
        const ta = el("textarea", "", c, { class: "jc-textarea", readonly: true });
        
        const gTxt = () => {
            let p = [];
            if (st.m) p.push(`### JOB METADATA\n**Title:** ${d.t}\n**Company:** ${d.c}\n**Salary:** ${d.s}`);
            if (st.d) p.push(`### DESCRIPTION\n${d.ds}`);
            if (st.q) p.push(`### APPLICATION QUESTIONS\n${d.q}`);
            if (st.p) p.push(`### MY WORK EXPERIENCE\n${d.pr}`);
            return p.join("\n\n---\n\n");
        };
        
        const mkP = (k, l) => {
            if (!st[k]) return;
            const p = el("div", l, rw, { class: "jc-pill", "data-active": !0 });
            p.onclick = () => { 
                st[k] = !st[k]; 
                p.setAttribute("data-active", st[k]); 
                ta.value = gTxt(); 
            };
        };
        
        mkP("m", "Metadata"); 
        mkP("d", "Description"); 
        mkP("q", "Questions"); 
        mkP("p", "Profile");
        
        ta.value = gTxt();
        initUI("Data Extractor", null, c, gTxt);

    } else if (isL) {
        if (!document.getElementById("jc-styles")) el("style", css, document.head, { id: "jc-styles" });
        el("div", "", document.body, { id: oId, class: "jc-overlay" });
        const mo = el("div", "", document.body, { id: mId, class: "jc-modal" });
        el("h2", "Telework Scanner", mo, { class: "jc-header" });
        
        const pe = el("div", "Initializing scan...", mo, { class: "jc-progress" });
        const dt = await Ext.l((c, t, n) => { 
            pe.innerHTML = `Fetching Job ${escapeHtml(c)} of ${escapeHtml(t)}...<br><span>${escapeHtml(n)}</span>`;
        });
        
        mo.remove();
        
        const c = el("div", "", null, { class: "jc-scroll-list" });
        if (!dt.m.length) {
            c.innerHTML = "<div class=\"jc-empty-state\"><div class=\"jc-empty-icon\">🔍</div><div class=\"jc-empty-title\">No matches detected.</div><div class=\"jc-empty-desc\">Try expanding your search or checking a different page.</div></div>";
        } else {
            dt.m.forEach(m => {
                const i = el("div", "", c, { class: "jc-list-item" });
                el("a", escapeHtml(m.ti), i, { class: "jc-item-title", href: m.ln, target: "_blank" });
                el("div", escapeHtml(m.me), i, { class: "jc-item-meta" });
                const hs = escapeHtml(m.s).replace(/(telework|remote|hybrid|work from home|wfh)/gi, "<span class=\"jc-highlight\">$1</span>");
                el("div", `"...${hs}..."`, i, { class: "jc-item-snippet" });
            });
        }
        
        const hd = dt.m.length ? `Found ${dt.m.length} Remote/Hybrid jobs (out of ${dt.tot})` : `No Telework/Hybrid jobs found (out of ${dt.tot}).`;
        initUI("Telework Scanner", hd, c, () => {
            return "### TELEWORK / HYBRID SCAN\nFound " + dt.m.length + " matching jobs out of " + dt.tot + " scanned.\n\n" + 
            dt.m.map((m, i) => `**${i + 1}. ${m.ti}**\n**Link:** ${m.ln}\n**Details:** ${m.me}\n**Policy:**\n> "...${m.s}..."`).join("\n\n---\n\n");
        });
    } else {
        alert("Abort: No supported data structures detected on page.");
    }
})();
