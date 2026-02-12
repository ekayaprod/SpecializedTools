(function () {
    const D = [["Adams",17301,17372,["gettysburg","littlestown","mcsherrystown","new oxford","bonneauville","carroll valley","east berlin","fairfield","york springs","arendtsville","bendersville"]],["Allegheny",15101,15295,["pittsburgh","mckeesport","clairton","duquesne","bethel park","monroeville","mount lebanon","penn hills","west mifflin","baldwin","franklin park","jefferson hills","moon","plum","shaler","upper st. clair","whitehall","allison park","glenshaw","wexford","gibsonia","bridgeville","carnegie","castle shannon","coraopolis","crafton","dormont","edgewood","forest hills","glassport","green tree","ingram","mckees rocks","munhall","oakmont","pitcairn","pleasant hills","sewickley","swissvale","tarentum","verona","west view","wilkinsburg","aspinwall","avalon","bell acres","bellevue","ben avon","braddock","braddock hills","chalfant","churchill","dravosburg","east mckeesport","east pittsburgh","edgeworth","emsworth","etna","fox chapel","heidelberg","homestead","leetsdale","millvale","mount oliver","north braddock","rankin","sharpsburg","springdale","stowe","thornburg","trafford","turtle creek","wall","west homestead","whitaker","wilmerding"]],["Armstrong",15610,15688,["kittanning","ford city","leechburg","apollo","freeport","parker","rural valley","south bethlehem"]],["Beaver",15001,15099,["beaver falls","aliquippa","ambridge","monaca","new brighton","baden","beaver","bridgewater","conway","darlington","east rochester","eastvale","economy","fallston","freedom","georgetown","glasgow","homewood","hookstown","industry","koppel","midland","new galilee","ohioville","patterson heights","rochester","shippingport","south heights","west mayfield"]],["Bedford",15522,15583,["bedford","everett","coaldale","hyndman","manns choice","new paris","pleasantville","rainsburg","saxton","schellsburg","st. clairsville","woodbury"]],["Berks",19501,19640,["reading","wyomissing","pottstown","sinking spring","shillington","birdsboro","kutztown","hamburg","boyertown","bally","bechtelsville","bernville","centerport","fleetwood","kenhorst","laureldale","leesport","lenhartsville","lyons","mohnton","mount penn","new morgan","robesonia","shoemakersville","st. lawrence","strausstown","temple","topton","wernersville","west reading"]],["Blair",16601,16693,["altoona","hollidaysburg","tyrone","bellwood","duncansville","martinsburg","newry","roaring spring","williamsburg"]],["Bradford",16901,16950,["sayre","towanda","athens","troy","alba","burlington","canton","leraysville","monroe","new albany","rome","sylvania","wyalusing"]],["Bucks",18901,19090,["levittown","bensalem","bristol","doylestown","quakertown","warminster","newtown","morrisville","perkasie","sellersville","yardley","langhorne","feasterville-trevose","richboro","chalfont","dublin","hulmeville","ivyland","langhorne manor","new britain","new hope","penndel","richlandtown","riegelsville","silverdale","telford","trumbauersville","tullytown"]],["Butler",16001,16137,["butler","cranberry","slippery rock","zelienople","mars","seven fields","bruin","callery","cherry valley","chicora","connoquenessing","east butler","eau claire","evans city","fairview","harmony","harrisville","karns city","petrolia","portersville","prospect","saxonburg","valencia","west liberty","west sunbury"]],["Cambria",15901,15958,["johnstown","ebensburg","windber","portage","nanty glo","ashville","barnesboro","brownstown","carrolltown","cassandra","chest springs","cresson","daisytown","dale","east conemaugh","ferndale","franklin","gallitzin","geistown","hastings","lilly","lorain","loretto","patton","sankertown","scalp level","south fork","southmont","spangler","summerhill","tunnelhill","vintondale","westmont","wilmore"]],["Carbon",18210,18252,["lehighton","jim thorpe","palmerton","lansford","beaver meadows","bowmanstown","east side","nesquehoning","parryville","summit hill","weatherly","weissport"]],["Centre",16801,16877,["state college","bellefonte","philipsburg","boalsburg","centre hall","howard","milesburg","millheim","port matilda","snow shoe","unionville"]],["Chester",19301,19395,["west chester","phoenixville","coatesville","downingtown","kennett square","paoli","exton","atglen","avondale","elverson","honey brook","malvern","modena","oxford","parkesburg","south coatesville","spring city"]],["Clarion",16201,16374,["clarion","new bethlehem","callensburg","east brady","foxburg","hawthorn","knox","rimersburg","shippenville","sligo","st. petersburg","strattanville"]],["Clearfield",15826,16865,["dubois","clearfield","philipsburg","curwensville","brisbin","burnside","chester hill","coalport","glen hope","grampian","houtzdale","irvona","lumber city","mahaffey","new washington","newburg","osceola mills","ramey","troutville","wallaceton","westover"]],["Clinton",17720,17779,["lock haven","mill hall","avis","beech creek","flemington","loganton","renovo","south renovo"]],["Columbia",17801,17889,["bloomsburg","berwick","ashland","benton","briar creek","catawissa","centralia","millville","orangeville","stillwater"]],["Crawford",16301,16436,["meadville","titusville","conneaut lake","blooming valley","cambridge springs","canadohta lake","centerville","cochranton","conneautville","geneva","hartstown","hydetown","linesville","saegertown","spartansburg","springboro","townville","venango","woodcock"]],["Cumberland",17011,17070,["carlisle","mechanicsburg","camp hill","new cumberland","shippensburg","lemoyne","enola","mount holly springs","newburg","newville","shiremanstown","west fairview","wormleysburg"]],["Dauphin",17001,17113,["harrisburg","hershey","middletown","hummelstown","steelton","elizabethville","berrysburg","dauphin","gratz","halifax","highspire","lykens","millersburg","paxtang","penbrook","pillow","royalton","williamstown"]],["Delaware",19013,19094,["chester","upper darby","haverford","radnor","drexel hill","media","springfield","ridley park","wayne","aldan","brookhaven","clifton heights","collingdale","colwyn","darby","east lansdowne","eddystone","folcroft","glenolden","lansdowne","marcus hook","millbourne","morton","norwood","parkside","prospect park","rose valley","rutledge","sharon hill","swarthmore","trainer","upland","yeadon"]],["Elk",15834,15866,["st. marys","ridgway","johnsonburg"]],["Erie",16401,16565,["erie","corry","edinboro","north east","girard","albion","cranesville","east springfield","elgin","fairview","lake city","mckean","mill village","platea","union city","waterford","wattsburg","wesleyville"]],["Fayette",15401,15490,["uniontown","connellsville","brownsville","masontown","belle vernon","dawson","dunbar","everson","fairchance","fayette city","markleysburg","newell","ohiopyle","perryopolis","point marion","smithfield","south connellsville","vanderbilt"]],["Franklin",17201,17268,["chambersburg","waynesboro","greencastle","mercersburg","mont alto","orrstown"]],["Greene",15301,15370,["waynesburg","carmichaels","clarksville","greensboro","jefferson","rices landing"]],["Huntingdon",16652,17066,["huntingdon","mount union","alexandria","birmingham","broad top city","cassville","coalmont","dudley","mapleton","marklesburg","mill creek","orbisonia","petersburg","rockhill","saltillo","shade gap","shirleysburg","three springs"]],["Indiana",15701,15781,["indiana","blairsville","armagh","cherry tree","clarksburg","clymer","creekside","ernest","glen campbell","homer city","jacksonville","marion center","plumville","saltsburg","shelocta","smicksburg"]],["Jefferson",15831,15866,["punxsutawney","brookville","reynoldsville","big run","brockway","corsica","falls creek","summerville","sykesville","timblin","worthville"]],["Juniata",17020,17099,["mifflintown","mifflin","port royal","thompsontown"]],["Lackawanna",18401,18519,["scranton","carbondale","dunmore","old forge","clarks summit","archbald","dickson city","blakely","clarks green","dalton","jermyn","jessup","mayfield","moosic","moscow","olyphant","taylor","throop","vandling","waverly"]],["Lancaster",17501,17608,["lancaster","ephrata","elizabethtown","lititz","columbia","manheim","new holland","akron","christiana","denver","east petersburg","marietta","millersville","mount joy","mountville","quarryville","strasburg","terre hill"]],["Lawrence",16101,16160,["new castle","ellwood city","new wilmington","bessemer","enon valley","new beaver","s.n.p.j.","south new castle","volant","wampum"]],["Lebanon",17003,17099,["lebanon","palmyra","annville","myerstown","cleona","cornwall","jonestown","richland"]],["Lehigh",18001,18109,["allentown","bethlehem","emmaus","whitehall","macungie","alburtis","catasauqua","coopersburg","coplay","fountain hill","slatington"]],["Luzerne",18201,18709,["wilkes-barre","hazleton","kingston","nanticoke","pittston","mountain top","dallas","ashley","avoca","bear creek village","conyngham","courtdale","dupont","duryea","edwardsville","exeter","forty fort","freeland","harveys lake","hughestown","jeddo","laflin","larksville","laurel run","luzerne","new columbus","nuangola","penn lake park","plymouth","pringle","shickshinny","sugar notch","swoyersville","warrior run","west hazleton","west pittston","west wyoming","white haven","wyoming","yatesville"]],["Lycoming",17701,17778,["williamsport","montoursville","muncy","jersey shore","duboistown","hughesville","montgomery","picture rocks","salladasburg","south williamsport"]],["McKean",16701,16749,["bradford","kane","eldred","lewis run","mount jewett","port allegany","smethport"]],["Mercer",16125,16173,["hermitage","sharon","greenville","grove city","mercer","clark","farrell","fredonia","jackson center","jamestown","new lebanon","sandy lake","sheakleyville","stoneboro","west middlesex","wheatland"]],["Mifflin",17044,17099,["lewistown","burnham","juniata terrace","kistler","mcveytown","newton hamilton"]],["Monroe",18301,18372,["east stroudsburg","stroudsburg","mount pocono","pocono pines","delaware water gap"]],["Montgomery",19001,19490,["norristown","pottstown","king of prussia","lansdale","willow grove","horsham","montgomeryville","ardmore","harleysville","ambler","bridgeport","bryn athyn","collegeville","conshohocken","east greenville","green lane","hatboro","hatfield","jenkintown","narberth","north wales","pennsburg","red hill","rockledge","royersford","schwenksville","souderton","trappe","west conshohocken"]],["Montour",17821,17889,["danville","washingtonville"]],["Northampton",18013,18109,["bethlehem","easton","northampton","nazareth","bangor","bath","chapman","east bangor","freemansburg","glendon","hellertown","north catasauqua","pen argyl","portland","roseto","stockertown","tatamy","walnutport","west easton","wilson","wind gap"]],["Northumberland",17801,17889,["sunbury","shamokin","mount carmel","milton","herndon","kulpmont","marion heights","mcewensville","northumberland","riverside","snydertown","turbotville","watsontown"]],["Perry",17013,17099,["newport","duncannon","blain","bloomfield","landisburg","liverpool","marysville","new buffalo"]],["Philadelphia",19101,19155,["philadelphia"]],["Pike",18324,18472,["milford","matamoras"]],["Potter",16915,16950,["coudersport","austin","galeton","oswayo","shinglehouse","ulysses"]],["Schuylkill",17901,17985,["pottsville","tamaqua","schuylkill haven","shenandoah","mahanoy city","ashland","auburn","coaldale","cressona","deer lake","frackville","gilberton","girardville","gordon","landingville","mcadoo","mechanicsville","middleport","minersville","mount carbon","new philadelphia","new ringgold","orwigsburg","palo alto","pine grove","port carbon","port clinton","ringtown","st. clair","tower city","tremont"]],["Snyder",17837,17889,["selinsgrove","middleburg","beavertown","freeburg","mcclure","shamokin dam"]],["Somerset",15501,15563,["somerset","windber","meyersdale","addison","benson","berlin","boswell","callimont","casselman","central city","confluence","garrett","hooversville","indian lake","jennerstown","new baltimore","new centerville","paint","rockwood","salisbury","shanksville","stoystown","ursina","wellersburg"]],["Susquehanna",18801,18853,["montrose","forest city","friendsville","great bend","hallstead","hop bottom","lanesboro","little meadows","new milford","oakland","susquehanna depot","thompson","union dale"]],["Tioga",16920,16950,["wellsboro","mansfield","blossburg","covington","elkland","knoxville","lawrenceville","liberty","middlebury center","millerton","morris","osceola","roseville","tioga","westfield"]],["Union",17837,17889,["lewisburg","mifflinburg","hartleton","new berlin"]],["Venango",16301,16374,["oil city","franklin","titusville","barkeyville","clintonville","cooperstown","emlenton","pleasantville","polk","rouseville","sugarcreek","utica"]],["Warren",16301,16374,["warren","bear lake","clarendon","sugar grove","tidioute","youngsville"]],["Washington",15301,15370,["washington","canonsburg","monongahela","charleroi","mcmurray","allenport","beallsville","bentleyville","burgettstown","california","canton","cecil-bishop","centerville","claysville","coal center","cokeburg","deemston","donora","dunlevy","east washington","elco","ellsworth","finleyville","green hills","houston","long branch","marianna","mcdonald","midway","new eagle","north charleroi","north franklin","roscoe","speers","stockdale","twilight","west brownsville","west middletown"]],["Wayne",18411,18472,["honesdale","hawley","bethany","prompton","starrucca","waymart"]],["Westmoreland",15601,15697,["greensburg","murrysville","new kensington","latrobe","lower burrell","jeannette","monessen","irwin","adamsburg","arona","avonmore","bolivar","delmont","derry","donegal","east vandergrift","export","hunker","hyde park","ligonier","madison","manor","mount pleasant","new alexandria","new florence","new stanton","north belle vernon","north irwin","oklahoma","penn","scottdale","seward","smithton","south greensburg","southwest greensburg","sutersville","trafford","vandergrift","west leechburg","west newton","youngstown","youngwood"]],["Wyoming",18610,18657,["tunkhannock","factoryville","laceyville","meshoppen","nicholson"]],["York",17401,17408,["york","hanover","red lion","shrewsbury","dillsburg","cross roads","dallastown","delta","dover","east prospect","fawn grove","felton","franklintown","glen rock","goldsboro","hallam","jacobus","jefferson","lewisberry","loganville","manchester","mount wolf","new freedom","new salem","north york","railroad","seven valleys","spring grove","stewartstown","wellsville","west york","windsor","winterstown","wrightsville","yoe","yorkana","york haven"]]];
    /* Note: Full list extracted from original index.html */

    const O = {"bethlehem": {"Lehigh": [18015, 18017], "Northampton": [18016, 18018, 18020, 18025]}, "trafford": {"Allegheny": [15085], "Westmoreland": [15085]}, "mcdonald": {"Allegheny": [15057], "Washington": [15057]}, "ellwood city": {"Beaver": [16117], "Lawrence": [16117]}, "adamstown": {"Berks": [19501], "Lancaster": [19501]}, "shippensburg": {"Cumberland": [17257], "Franklin": [17257]}, "seven springs": {"Fayette": [15622], "Somerset": [15622]}};

    function find(q) {
        const c = q.trim();
        const results = [];

        /* ZIP SEARCH */
        if (/^\d{5}$/.test(c)) {
            const z = parseInt(c, 10);

            /* D Ranges */
            for (let i = 0; i < D.length; i++) {
                if (z >= D[i][1] && z <= D[i][2]) {
                    if (!results.includes(D[i][0])) results.push(D[i][0]);
                }
            }

            /* O Specifics */
            for (const city in O) {
                const counties = O[city];
                for (const county in counties) {
                    if (counties[county].includes(z)) {
                        if (!results.includes(county)) results.push(county);
                    }
                }
            }
            return results.length ? c + ': ' + results.join(', ') : null;
        }

        /* CITY SEARCH */
        const l = c.toLowerCase();

        /* D Search */
        for (let i = 0; i < D.length; i++) {
            const cities = D[i][3];
            for (let j = 0; j < cities.length; j++) {
                if (cities[j] === l) {
                    if (!results.includes(D[i][0])) results.push(D[i][0]);
                    break;
                }
            }
        }

        return results.length ? c + ': ' + results.join(', ') : null;
    }

    /* UI LOGIC */
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { find };
        return;
    }

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:99999});
    const card = document.createElement('div');
    Object.assign(card.style, {background:'white',padding:'20px',borderRadius:'8px',boxShadow:'0 10px 25px rgba(0,0,0,0.2)',width:'300px',fontFamily:'system-ui'});
    card.innerHTML = `<h3 style="margin:0 0 15px">PA County Finder</h3><div id="pa-content"></div>`;
    overlay.appendChild(card);
    overlay.onclick = e => e.target === overlay && overlay.remove();

    const content = card.querySelector('#pa-content');
    const resultDiv = document.createElement('div');
    resultDiv.id = 'pa-result';

    const createCloseBtn = (marginTop = '0') => {
        const close = document.createElement('button');
        close.textContent = 'Close';
        Object.assign(close.style, {width:'100%',padding:'8px',background:'#f3f4f6',border:'none',borderRadius:'4px',cursor:'pointer',marginTop});
        close.onclick = () => overlay.remove();
        return close;
    };

    const updateResult = (r, q) => {
        const safeQ = q.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        resultDiv.innerHTML = r ? `<div style="color:#15803d;background:#dcfce7;padding:12px;border-radius:6px;margin-bottom:10px"><strong>Found:</strong><br>${r}</div>`
                                : `<div style="color:#b91c1c;background:#fee2e2;padding:12px;border-radius:6px;margin-bottom:10px">No match for "<strong>${safeQ}</strong>"</div>`;
    };

    let s = window.getSelection().toString().trim();
    if (s) {
        updateResult(find(s), s);
        content.appendChild(resultDiv);
        content.appendChild(createCloseBtn());
    } else {
        const inp = document.createElement('input');
        Object.assign(inp.style, {width:'100%',padding:'10px',marginBottom:'10px',boxSizing:'border-box',border:'1px solid #ccc',borderRadius:'4px'});
        inp.placeholder = "Enter ZIP or City";

        const btn = document.createElement('button');
        btn.textContent = 'Search';
        Object.assign(btn.style, {width:'100%',padding:'10px',background:'#2563eb',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',fontWeight:'bold',marginBottom:'10px'});

        btn.onclick = () => {
            const val = inp.value.trim();
            if(val) updateResult(find(val), val);
        };
        inp.onkeydown = e => e.key === 'Enter' && btn.click();

        content.append(inp, btn, resultDiv, createCloseBtn('10px'));
        setTimeout(() => inp.focus(), 50);
    }
    document.body.appendChild(overlay);
})();