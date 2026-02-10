(function () {
    /* CONFIG */
    const C = { count: 5, addSymbol: true, randomNum: true };

    const adjectives = ["Apple", "Blue", "Bright", "Butter", "Cherry", "Cider", "Coffee", "Dragon", "Fire", "Fish", "Flash", "Foot", "Garden", "Gold", "Grand", "Green", "Hand", "Ice", "Iron", "Jelly", "Killer", "Liberty", "Light", "Loud", "Maple", "Marsh", "Mocking", "Motor", "Night", "Paper", "Peace", "Pepper", "Phone", "Photo", "Pine", "Polar", "Power", "Quick", "Rain", "Rattle", "River", "Roller", "Sand", "School", "Silver", "Skate", "Smart", "Snow", "Soft", "Spring", "Stone", "Story", "Sugar", "Sun", "Switch", "Tele", "Tooth", "Type", "Valley", "Water", "Wild", "Wind", "Wood", "Work", "Yellow"];
    const nouns = ["butter", "slicer", "mobile", "packer", "comber", "graphy", "marker", "bonnet", "berry", "keeper", "basket", "street", "cream", "fly", "ground", "stick", "pillar", "maker", "steak", "patch", "tree", "donut", "bean", "house", "print", "fight", "monger", "light", "player", "bridge", "snap", "finch", "apple", "father", "mother", "hopper", "bear", "writer", "copter", "bird", "worker", "whale", "bell", "head", "speaker", "nut", "forest", "mallow", "cycle", "runner", "weight", "grass", "macist", "number", "graph", "needle", "breeze", "house", "school", "stride", "sprint", "bow", "snake", "market", "blade", "mander", "castle", "card", "pad", "driver", "board", "scraper", "pretzel", "water", "teller", "cookie", "rise", "vision", "meter", "stat", "paste", "bottle", "lily", "flower", "pane", "pecker", "bench", "stone"];
    const symbols = ['!', '?', '$', '%', '#', '@', '&', '*'];

    function getRand(m) { const r = new Uint32Array(1); window.crypto.getRandomValues(r); return r[0] % m; }
    function R(a) { return a[getRand(a.length)]; }

    let passes = [];
    for (let i = 0; i < C.count; i++) {
        let p = R(adjectives) + R(nouns);
        p += C.randomNum ? getRand(100) : '1';
        if (C.addSymbol) p += R(symbols);
        passes.push(p);
    }

    /* UI */
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '99998', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const dialog = document.createElement('div');
    Object.assign(dialog.style, { background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', width: 'auto', maxWidth: '90%', fontFamily: 'sans-serif' });

    passes.forEach(p => {
        const item = document.createElement('div');
        Object.assign(item.style, { display: 'flex', alignItems: 'center', marginBottom: '8px' });
        const text = document.createElement('p');
        text.textContent = p;
        Object.assign(text.style, { margin: '0', marginRight: '12px', fontSize: '16px', fontFamily: 'monospace', color: '#333' });
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => { navigator.clipboard.writeText(p); copyBtn.textContent = 'Copied!'; setTimeout(() => copyBtn.textContent = 'Copy', 1000); };
        item.appendChild(text); item.appendChild(copyBtn); dialog.appendChild(item);
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.onclick = () => overlay.remove();
    dialog.appendChild(closeBtn); overlay.appendChild(dialog); document.body.appendChild(overlay);
})();
