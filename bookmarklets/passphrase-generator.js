(function () {
    /* DEFAULT CONFIGURATION */
    const C = {
        n: 5,      /* Passphrase count */
        w: 4,      /* Words count */
        t: true,   /* Seasonal theme */
        s: '',     /* Separator */
        c: 'caps', /* Capitalization */
        d: 2,      /* Digits */
        y: 1,      /* Symbols */
        m: 16      /* Min length */
    };

    /* TEMP PASSWORD CONFIG */
    const TC = window.TEMP_PASSWORD_CONFIG || { count: 5, addSymbol: true, randomNum: true };

    /* WORD BANK */
    const fullWordBank = {
        "Adjective": ["Able", "Ancient", "Basic", "Bent", "Blank", "Brave", "Bold", "Bumpy", "Busy", "Clever", "Cloudy", "Clumsy", "Cranky", "Curly", "Dapper", "Eager", "Empty", "Even", "Fancy", "Firm", "Foggy", "Fuzzy", "Giant", "Glad", "Grand", "Gritty", "Harsh", "Heavy", "Humble", "Jolly", "Jumbo", "Kind", "Known", "Large", "Lavish", "Lean", "Major", "Minor", "Modern", "Muddy", "Odd", "Plain", "Quick", "Rough", "Royal", "Sharp", "Slim", "Zany", "Bright", "Happy"],
        "Animal": ["Badger", "Bat", "Beaver", "Bison", "Bobcat", "Camel", "Cat", "Clam", "Cobra", "Colt", "Coyote", "Crow", "Dingo", "Dog", "Dolphin", "Dove", "Dragon", "Duck", "Eel", "Elk", "Falcon", "Fawn", "Finch", "Frog", "Gecko", "Goose", "Grizzly", "Guppy", "Heron", "Hornet", "Hound", "Jaguar", "Koala", "Llama", "Mammoth", "Moose", "Moth", "Newt", "Otter", "Panther", "Parrot", "Pony", "Cougar", "Rhino", "Sloth", "Stallion", "Swan", "Tadpole", "Wasp", "Wolf", "Bear", "Fox", "Eagle"],
        "Object": ["Anvil", "Armor", "Armchair", "Backpack", "Balloon", "Banana", "Barrel", "Basket", "Battery", "Bell", "Bench", "Binder", "Blanket", "Bongo", "Book", "Booklet", "Boulder", "Bowl", "Box", "Bracelet", "Bracket", "Brick", "Brush", "Bubble", "Bucket", "Buckle", "Bulb", "Bumper", "Button", "Cabin", "Cable", "Camera", "Candle", "Canoe", "Canvas", "Carton", "Castle", "Harp", "Chalk", "Charger", "Charm", "Chart", "Tool", "Boat", "Cup", "Desk", "Lamp", "Door", "Ball"],
        "Verb": ["Argue", "Arise", "Bake", "Bathe", "Bend", "Blink", "Blush", "Bolt", "Bounce", "Bump", "Carve", "Chase", "Chew", "Clap", "Clash", "Climb", "Cling", "Cough", "Cover", "Cram", "Crawl", "Crouch", "Cuddle", "Dance", "Dare", "Dash", "Daze", "Dig", "Dip", "Dive", "Dodge", "Drain", "Drench", "Drill", "Drip", "Droop", "Drop", "Drum", "Dump", "Dust", "Gasp", "Grab", "Press", "Scold", "Slice", "Thump", "Tussle", "Run", "Jump", "Sing", "Hop", "Spin"],
        "Color": ["Amber", "Blue", "Bronze", "Brown", "Coral", "Cyan", "Emerald", "Gold", "Green", "Indigo", "Jade", "Lavender", "Lime", "Maroon", "Mint", "Navy", "Olive", "Pink", "Plum", "Purple", "Red", "Rose", "Ruby", "Silver", "Teal", "Violet", "White", "Yellow", "Tan", "Gray", "Peach", "Aqua"],
        "Winter": { "Noun": ["Blizzard", "Chill", "Flake", "Frost", "Glacier", "Hearth", "Ice", "Icicle", "Igloo", "Mountain", "Pine", "Skate", "Sled", "Snow", "Storm", "Tundra", "Yule"], "Adjective": ["Barren", "Bitter", "Bleak", "Brisk", "Frigid", "Frozen", "Glacial", "Icy", "Hushed", "Quiet", "Still", "Snowy", "Chilly"], "Verb": ["Drift", "Fall", "Freeze", "Huddle", "Melt", "Nip", "Shiver", "Settle", "Shine"], "Concept": ["Calm", "Peace", "Silence", "Spirit", "Legend", "Mystery"] },
        "Spring": { "Noun": ["April", "Blossom", "Breeze", "Bud", "Bulb", "Butterfly", "Chick", "Clover", "Crocus", "Daffodil", "Egg", "Equinox", "Garden", "Lamb", "Meadow", "Nest", "Rabbit", "Rainbow", "Robin", "Seed", "Tulip", "Rose", "Rain"], "Adjective": ["Alive", "Blooming", "Budding", "Cheerful", "Clean", "Dewy", "Early", "Fresh", "Gentle", "Green", "Growing", "Hopeful", "Lively", "Mild", "New", "Vibrant", "Young"], "Verb": ["Bloom", "Bud", "Burst", "Chirp", "Emerge", "Grow", "Hatch", "Open", "Peep", "Sprout", "Wake"], "Concept": ["Anticipation", "Awakening", "Beginning", "Bloom", "Growth", "Hope", "Freshness", "Youth"] },
        "Summer": { "Noun": ["August", "Beach", "Campfire", "Canoe", "Cicada", "Cricket", "Festival", "Firefly", "Hammock", "Heat", "July", "June", "Lemonade", "Ocean", "Picnic", "Pool", "Sandal", "Solstice", "Sprinkler", "Sunshine", "Tent", "Sun"], "Adjective": ["Balmy", "Bright", "Carefree", "Drowsy", "Golden", "Hazy", "Hot", "Humid", "Light", "Long", "Lush", "Ripe", "Sandy", "Sizzling", "Sunny", "Warm"], "Verb": ["Dive", "Doze", "Explore", "Float", "Grill", "Lounge", "Relax", "Shine", "Sizzle", "Splash", "Swim", "Travel"], "Concept": ["Adventure", "Bliss", "Ease", "Freedom", "Fun", "Glow", "Happiness", "Journey", "Leisure"] },
        "Autumn": { "Noun": ["Acorn", "Apple", "Cider", "Corn", "Fall", "Foliage", "Gourd", "Harvest", "Hay", "Leaf", "Maple", "Orchard", "Pumpkin", "Spice", "Sweater", "Wood"], "Adjective": ["Blustery", "Chilly", "Cool", "Cozy", "Crimson", "Dim", "Dry", "Golden", "Mellow", "Orange", "Quiet", "Rustic", "Leafy"], "Verb": ["Bake", "Change", "Chill", "Cool", "Crunch", "Fade", "Gather", "Glow", "Rustle"], "Concept": ["Calm", "Change", "Comfort", "Cycle", "Dusk", "Memory", "Thought", "Joy"] }
    };

    const PHRASE_STRUCTURES = {
        "standard": { "2": [["Adjective", "Animal"], ["Adjective", "Object"], ["Color", "Object"], ["Color", "Animal"], ["Verb", "Animal"], ["Animal", "Object"], ["Object", "Object"]], "3": [["Adjective", "Color", "Animal"], ["Verb", "Adjective", "Object"], ["Adjective", "Object", "Verb"]], "4": [["Adjective", "Animal", "Color", "Verb"], ["Color", "Adjective", "Object", "Verb"]] },
        "seasonal": { "2": [["SeasonAdjective", "Object"], ["Adjective", "SeasonNoun"], ["SeasonVerb", "Animal"], ["Color", "SeasonNoun"], ["SeasonVerb", "Object"], ["Color", "SeasonConcept"], ["SeasonNoun", "Animal"]], "3": [["Adjective", "Color", "SeasonConcept"], ["SeasonAdjective", "Verb", "Object"], ["Verb", "Adjective", "SeasonNoun"]], "4": [["Adjective", "Verb", "Color", "SeasonNoun"], ["SeasonAdjective", "Adjective", "Object", "Verb"]] }
    };
    const SYMBOL_RULES = { "beforeNum": ["$", "#", "*"], "afterNum": ["%", "+"], "junction": ["=", "@", ".", "-"], "end": ["!", "?"] };

    /* WORD BANK (TEMP PASSWORD) */
    const tpAdjectives = ["Apple", "Blue", "Bright", "Butter", "Cherry", "Cider", "Coffee", "Dragon", "Fire", "Fish", "Flash", "Foot", "Garden", "Gold", "Grand", "Green", "Hand", "Ice", "Iron", "Jelly", "Killer", "Liberty", "Light", "Loud", "Maple", "Marsh", "Mocking", "Motor", "Night", "Paper", "Peace", "Pepper", "Phone", "Photo", "Pine", "Polar", "Power", "Quick", "Rain", "Rattle", "River", "Roller", "Sand", "School", "Silver", "Skate", "Smart", "Snow", "Soft", "Spring", "Stone", "Story", "Sugar", "Sun", "Switch", "Tele", "Tooth", "Type", "Valley", "Water", "Wild", "Wind", "Wood", "Work", "Yellow"];
    const tpNouns = ["butter", "slicer", "mobile", "packer", "comber", "graphy", "marker", "bonnet", "berry", "keeper", "basket", "street", "cream", "fly", "ground", "stick", "pillar", "maker", "steak", "patch", "tree", "donut", "bean", "house", "print", "fight", "monger", "light", "player", "bridge", "snap", "finch", "apple", "father", "mother", "hopper", "bear", "writer", "copter", "bird", "worker", "whale", "bell", "head", "speaker", "nut", "forest", "mallow", "cycle", "runner", "weight", "grass", "macist", "number", "graph", "needle", "breeze", "house", "school", "stride", "sprint", "bow", "snake", "market", "blade", "mander", "castle", "card", "pad", "driver", "board", "scraper", "pretzel", "water", "teller", "cookie", "rise", "vision", "meter", "stat", "paste", "bottle", "lily", "flower", "pane", "pecker", "bench", "stone"];
    const tpSymbols = ['!', '?', '$', '%', '#', '@', '&', '*'];

    /* HELPERS */
    const getRand = window.BookmarkletUtils.getRand;
    function R(a) { return a[getRand(a.length)]; }
    function Cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

    /* LOGIC */
    function generatePassphrases() {
        const season = C.t ? (d => {
            const Y = d.getFullYear();
            function getMemorialDay(y) { const date = new Date(y, 4, 31); date.setDate(date.getDate() - (date.getDay() + 6) % 7); return date; }
            function getLaborDay(y) { const date = new Date(y, 8, 1); const dayOfWeek = date.getDay(); const offset = (dayOfWeek <= 1) ? 1 - dayOfWeek : 8 - dayOfWeek; date.setDate(date.getDate() + offset); return date; }
            const memorialDay = getMemorialDay(Y); const laborDay = getLaborDay(Y); const winterStart = new Date(Y, 11, 1);
            if (d >= new Date(Y, 2, 17) && d < memorialDay) return 'Spring';
            if (d >= memorialDay && d < laborDay) return 'Summer';
            if (d >= laborDay && d < winterStart) return 'Autumn';
            return 'Winter';
        })(new Date()) : null;

        let passes = [];
        for (let i = 0; i < C.n; i++) {
            let words = [];
            let struct = (season && PHRASE_STRUCTURES.seasonal[C.w]) ? R(PHRASE_STRUCTURES.seasonal[C.w]) : R(PHRASE_STRUCTURES.standard[C.w]);
            words = struct.map(cat => {
                if (cat.startsWith('Season')) return R(fullWordBank[season][cat.replace('Season', '')]);
                return R(fullWordBank[cat]);
            });
            if (C.c === 'caps') words = words.map(Cap);
            else if (C.c === 'upper') words = words.map(w => w.toUpperCase());
            else words = words.map(w => w.toLowerCase());

            let wordStr = words.join(C.s);
            let numberBlock = [];
            for (let j = 0; j < C.d; j++) numberBlock.push(getRand(10));

            let symbolsToUse = { beforeNum: '', afterNum: '', junction: '', end: '' };
            let willHaveNumbers = (numberBlock.length > 0);
            if (C.y > 0) {
                let availableTypes = ['end', 'junction'];
                if (willHaveNumbers) availableTypes.push('beforeNum', 'afterNum');
                for (let j = 0; j < C.y; j++) {
                    let type = R(availableTypes);
                    if (type) symbolsToUse[type] = R(SYMBOL_RULES[type]);
                }
            }
            let numberPart = symbolsToUse.beforeNum + numberBlock.join('') + symbolsToUse.afterNum;
            let finalPass = (getRand(2) === 0 && numberPart) ? numberPart + symbolsToUse.junction + wordStr + symbolsToUse.end : wordStr + symbolsToUse.junction + numberPart + symbolsToUse.end;
            passes.push(finalPass);
        }
        return passes;
    }

    function generateTempPasswords() {
        let passes = [];
        for (let i = 0; i < TC.count; i++) {
            let p = R(tpAdjectives) + R(tpNouns);
            p += TC.randomNum ? getRand(100) : '1';
            if (TC.addSymbol) p += R(tpSymbols);
            passes.push(p);
        }
        return passes;
    }

    /* UI */
    const overlay = document.createElement('div');
    Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '99998', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const dialog = document.createElement('div');
    Object.assign(dialog.style, { background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', width: 'auto', maxWidth: '90%', fontFamily: 'sans-serif' });

    // Mode Toggle Header
    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' });

    const title = document.createElement('h3');
    title.textContent = 'Passphrase Generator';
    Object.assign(title.style, { margin: '0', fontSize: '18px', fontWeight: 'bold' });

    const toggleBtn = document.createElement('button');
    Object.assign(toggleBtn.style, { background: '#eee', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' });

    header.appendChild(title);
    header.appendChild(toggleBtn);
    dialog.appendChild(header);

    const listContainer = document.createElement('div');
    dialog.appendChild(listContainer);

    let currentMode = 'passphrase'; // 'passphrase' or 'temp'

    function render() {
        listContainer.innerHTML = '';
        const passes = currentMode === 'passphrase' ? generatePassphrases() : generateTempPasswords();

        passes.forEach(p => {
            const item = document.createElement('div');
            Object.assign(item.style, { display: 'flex', alignItems: 'center', marginBottom: '8px' });
            const text = document.createElement('p');
            text.textContent = p;
            Object.assign(text.style, { margin: '0', marginRight: '12px', fontSize: '16px', fontFamily: 'monospace', color: '#333' });
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = () => { navigator.clipboard.writeText(p); copyBtn.textContent = 'Copied!'; setTimeout(() => copyBtn.textContent = 'Copy', 1000); };
            item.appendChild(text); item.appendChild(copyBtn); listContainer.appendChild(item);
        });

        title.textContent = currentMode === 'passphrase' ? 'Passphrase Generator' : 'Temp Password Generator';
        toggleBtn.textContent = currentMode === 'passphrase' ? 'Switch to Temp Passwords' : 'Switch to Passphrases';
    }

    toggleBtn.onclick = () => {
        currentMode = currentMode === 'passphrase' ? 'temp' : 'passphrase';
        render();
    };

    render();

    const footer = document.createElement('div');
    Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    Object.assign(closeBtn.style, { padding: '8px 16px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' });
    closeBtn.onclick = () => overlay.remove();

    footer.appendChild(closeBtn);
    dialog.appendChild(footer);

    overlay.appendChild(dialog); document.body.appendChild(overlay);
})();
