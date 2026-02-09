(function () {
    /* CONFIG */
    const C = { count: 5, addSymbol: true, randomNum: true };

    const wordList = ["Applebutter", "Appleslicer", "Automobiles", "Backpackers", "Beachcomber", "Biographies", "Blackmarker", "Bluebonnets", "Blueberries", "Bluehorizon", "Bookkeepers", "Breadbasket", "Brightlight", "Broadstreet", "Brotherhood", "Buttercream", "Butterflies", "Calculators", "Campgrounds", "Candlestick", "Caterpillar", "Cheesemaker", "Cheesesteak", "Cherrycider", "Cherrypatch", "Cherrytrees", "Ciderdonuts", "Coffeebeans", "Coffeehouse", "Dragonflies", "Fingerprint", "Firefighter", "Firestation", "Fishmongers", "Flashlights", "Fluteplayer", "Footbridges", "Gardenhouse", "Gingersnaps", "Goldfinches", "Goldenapple", "Grandfather", "Grandmother", "Grasshopper", "Greenhouses", "Grizzlybear", "Handwriting", "Helicopters", "Hummingbird", "Icecreamery", "Instruments", "Ironworkers", "Jellydonuts", "Killerwhale", "Libertybell", "Lightheaded", "Lighthouses", "Loudspeaker", "Mapledonuts", "Mapleforest", "Marshmallow", "Mockingbird", "Motorcycles", "Nightrunner", "Paperbridge", "Papermakers", "Paperweight", "Peacemakers", "Peppergrass", "Pharmacists", "Phonenumber", "Photographs", "Pineneedles", "Polarbreeze", "Powerhouses", "Preschooler", "Quickstride", "Quicksprint", "Rainbowfish", "Rattlesnake", "Refrigerate", "Restaurants", "Rivermarket", "Rivervalley", "Rollerblade", "Salamanders", "Sandcastles", "Schoolhouse", "Scratchcard", "Scratchpads", "Screwdriver", "Silvermaple", "Skateboards", "Skyscrapers", "Smartphones", "Snowleopard", "Softpretzel", "Springwater", "Stonebridge", "Storyteller", "Sugarcookie", "Sunrisepark", "Switchboard", "Televisions", "Thermometer", "Thermostats", "Toothpastes", "Typewriters", "Valleyparks", "Waterbottle", "Waterlilies", "Wildflowers", "Windowpanes", "Woodpeckers", "Workbenches", "Yellowfinch", "Yellowstone"];
    const symbols = ['!', '?', '$', '%'];

    function getRand(m) { const r = new Uint32Array(1); window.crypto.getRandomValues(r); return r[0] % m; }
    function R(a) { return a[getRand(a.length)]; }

    let passes = [];
    for (let i = 0; i < C.count; i++) {
        let p = R(wordList);
        p += C.randomNum ? getRand(10) : '1';
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
