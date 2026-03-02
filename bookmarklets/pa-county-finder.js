(function () {
    /** @require utils.js */

    /**
     * @typedef {[string, number, number, string[]]} CountyData
     */

    /** @type {CountyData[]} */
    const D = [
        [
            'Adams',
            17301,
            17372,
            [
                'gettysburg',
                'littlestown',
                'mcsherrystown',
                'new oxford',
                'bonneauville',
                'carroll valley',
                'east berlin',
                'fairfield',
                'york springs',
                'arendtsville',
                'bendersville',
            ],
        ],
        [
            'Allegheny',
            15101,
            15295,
            [
                'pittsburgh',
                'mckeesport',
                'clairton',
                'duquesne',
                'bethel park',
                'monroeville',
                'mount lebanon',
                'penn hills',
                'west mifflin',
                'baldwin',
                'franklin park',
                'jefferson hills',
                'moon',
                'plum',
                'shaler',
                'upper st. clair',
                'whitehall',
                'allison park',
                'glenshaw',
                'wexford',
                'gibsonia',
                'bridgeville',
                'carnegie',
                'castle shannon',
                'coraopolis',
                'crafton',
                'dormont',
                'edgewood',
                'forest hills',
                'glassport',
                'green tree',
                'ingram',
                'mckees rocks',
                'munhall',
                'oakmont',
                'pitcairn',
                'pleasant hills',
                'sewickley',
                'swissvale',
                'tarentum',
                'verona',
                'west view',
                'wilkinsburg',
                'aspinwall',
                'avalon',
                'bell acres',
                'bellevue',
                'ben avon',
                'braddock',
                'braddock hills',
                'chalfant',
                'churchill',
                'dravosburg',
                'east mckeesport',
                'east pittsburgh',
                'edgeworth',
                'emsworth',
                'etna',
                'fox chapel',
                'heidelberg',
                'homestead',
                'leetsdale',
                'millvale',
                'mount oliver',
                'north braddock',
                'rankin',
                'sharpsburg',
                'springdale',
                'stowe',
                'thornburg',
                'trafford',
                'turtle creek',
                'wall',
                'west homestead',
                'whitaker',
                'wilmerding',
            ],
        ],
        [
            'Armstrong',
            15610,
            15688,
            ['kittanning', 'ford city', 'leechburg', 'apollo', 'freeport', 'parker', 'rural valley', 'south bethlehem'],
        ],
        [
            'Beaver',
            15001,
            15099,
            [
                'beaver falls',
                'aliquippa',
                'ambridge',
                'monaca',
                'new brighton',
                'baden',
                'beaver',
                'bridgewater',
                'conway',
                'darlington',
                'east rochester',
                'eastvale',
                'economy',
                'fallston',
                'freedom',
                'georgetown',
                'glasgow',
                'homewood',
                'hookstown',
                'industry',
                'koppel',
                'midland',
                'new galilee',
                'ohioville',
                'patterson heights',
                'rochester',
                'shippingport',
                'south heights',
                'west mayfield',
            ],
        ],
        [
            'Bedford',
            15522,
            15583,
            [
                'bedford',
                'everett',
                'coaldale',
                'hyndman',
                'manns choice',
                'new paris',
                'pleasantville',
                'rainsburg',
                'saxton',
                'schellsburg',
                'st. clairsville',
                'woodbury',
            ],
        ],
        [
            'Berks',
            19501,
            19640,
            [
                'reading',
                'wyomissing',
                'pottstown',
                'sinking spring',
                'shillington',
                'birdsboro',
                'kutztown',
                'hamburg',
                'boyertown',
                'bally',
                'bechtelsville',
                'bernville',
                'centerport',
                'fleetwood',
                'kenhorst',
                'laureldale',
                'leesport',
                'lenhartsville',
                'lyons',
                'mohnton',
                'mount penn',
                'new morgan',
                'robesonia',
                'shoemakersville',
                'st. lawrence',
                'strausstown',
                'temple',
                'topton',
                'wernersville',
                'west reading',
            ],
        ],
        [
            'Blair',
            16601,
            16693,
            [
                'altoona',
                'hollidaysburg',
                'tyrone',
                'bellwood',
                'duncansville',
                'martinsburg',
                'newry',
                'roaring spring',
                'williamsburg',
            ],
        ],
        [
            'Bradford',
            16901,
            16950,
            [
                'sayre',
                'towanda',
                'athens',
                'troy',
                'alba',
                'burlington',
                'canton',
                'leraysville',
                'monroe',
                'new albany',
                'rome',
                'sylvania',
                'wyalusing',
            ],
        ],
        [
            'Bucks',
            18901,
            19090,
            [
                'levittown',
                'bensalem',
                'bristol',
                'doylestown',
                'quakertown',
                'warminster',
                'newtown',
                'morrisville',
                'perkasie',
                'sellersville',
                'yardley',
                'langhorne',
                'feasterville-trevose',
                'richboro',
                'chalfont',
                'dublin',
                'hulmeville',
                'ivyland',
                'langhorne manor',
                'new britain',
                'new hope',
                'penndel',
                'richlandtown',
                'riegelsville',
                'silverdale',
                'telford',
                'trumbauersville',
                'tullytown',
            ],
        ],
        [
            'Butler',
            16001,
            16137,
            [
                'butler',
                'cranberry',
                'slippery rock',
                'zelienople',
                'mars',
                'seven fields',
                'bruin',
                'callery',
                'cherry valley',
                'chicora',
                'connoquenessing',
                'east butler',
                'eau claire',
                'evans city',
                'fairview',
                'harmony',
                'harrisville',
                'karns city',
                'petrolia',
                'portersville',
                'prospect',
                'saxonburg',
                'valencia',
                'west liberty',
                'west sunbury',
            ],
        ],
        [
            'Cambria',
            15901,
            15958,
            [
                'johnstown',
                'ebensburg',
                'windber',
                'portage',
                'nanty glo',
                'ashville',
                'barnesboro',
                'brownstown',
                'carrolltown',
                'cassandra',
                'chest springs',
                'cresson',
                'daisytown',
                'dale',
                'east conemaugh',
                'ferndale',
                'franklin',
                'gallitzin',
                'geistown',
                'hastings',
                'lilly',
                'lorain',
                'loretto',
                'patton',
                'sankertown',
                'scalp level',
                'south fork',
                'southmont',
                'spangler',
                'summerhill',
                'tunnelhill',
                'vintondale',
                'westmont',
                'wilmore',
            ],
        ],
        [
            'Carbon',
            18210,
            18252,
            [
                'lehighton',
                'jim thorpe',
                'palmerton',
                'lansford',
                'beaver meadows',
                'bowmanstown',
                'east side',
                'nesquehoning',
                'parryville',
                'summit hill',
                'weatherly',
                'weissport',
            ],
        ],
        [
            'Centre',
            16801,
            16877,
            [
                'state college',
                'bellefonte',
                'philipsburg',
                'boalsburg',
                'centre hall',
                'howard',
                'milesburg',
                'millheim',
                'port matilda',
                'snow shoe',
                'unionville',
            ],
        ],
        [
            'Chester',
            19301,
            19395,
            [
                'west chester',
                'phoenixville',
                'coatesville',
                'downingtown',
                'kennett square',
                'paoli',
                'exton',
                'atglen',
                'avondale',
                'elverson',
                'honey brook',
                'malvern',
                'modena',
                'oxford',
                'parkesburg',
                'south coatesville',
                'spring city',
            ],
        ],
        [
            'Clarion',
            16201,
            16374,
            [
                'clarion',
                'new bethlehem',
                'callensburg',
                'east brady',
                'foxburg',
                'hawthorn',
                'knox',
                'rimersburg',
                'shippenville',
                'sligo',
                'st. petersburg',
                'strattanville',
            ],
        ],
        [
            'Clearfield',
            15826,
            16865,
            [
                'dubois',
                'clearfield',
                'philipsburg',
                'curwensville',
                'brisbin',
                'burnside',
                'chester hill',
                'coalport',
                'glen hope',
                'grampian',
                'houtzdale',
                'irvona',
                'lumber city',
                'mahaffey',
                'new washington',
                'newburg',
                'osceola mills',
                'ramey',
                'troutville',
                'wallaceton',
                'westover',
            ],
        ],
        [
            'Clinton',
            17720,
            17779,
            ['lock haven', 'mill hall', 'avis', 'beech creek', 'flemington', 'loganton', 'renovo', 'south renovo'],
        ],
        [
            'Columbia',
            17801,
            17889,
            [
                'bloomsburg',
                'berwick',
                'ashland',
                'benton',
                'briar creek',
                'catawissa',
                'centralia',
                'millville',
                'orangeville',
                'stillwater',
            ],
        ],
        [
            'Crawford',
            16301,
            16436,
            [
                'meadville',
                'titusville',
                'conneaut lake',
                'blooming valley',
                'cambridge springs',
                'canadohta lake',
                'centerville',
                'cochranton',
                'conneautville',
                'geneva',
                'hartstown',
                'hydetown',
                'linesville',
                'saegertown',
                'spartansburg',
                'springboro',
                'townville',
                'venango',
                'woodcock',
            ],
        ],
        [
            'Cumberland',
            17011,
            17070,
            [
                'carlisle',
                'mechanicsburg',
                'camp hill',
                'new cumberland',
                'shippensburg',
                'lemoyne',
                'enola',
                'mount holly springs',
                'newburg',
                'newville',
                'shiremanstown',
                'west fairview',
                'wormleysburg',
            ],
        ],
        [
            'Dauphin',
            17001,
            17113,
            [
                'harrisburg',
                'hershey',
                'middletown',
                'hummelstown',
                'steelton',
                'elizabethville',
                'berrysburg',
                'dauphin',
                'gratz',
                'halifax',
                'highspire',
                'lykens',
                'millersburg',
                'paxtang',
                'penbrook',
                'pillow',
                'royalton',
                'williamstown',
            ],
        ],
        [
            'Delaware',
            19013,
            19094,
            [
                'chester',
                'upper darby',
                'haverford',
                'radnor',
                'drexel hill',
                'media',
                'springfield',
                'ridley park',
                'wayne',
                'aldan',
                'brookhaven',
                'clifton heights',
                'collingdale',
                'colwyn',
                'darby',
                'east lansdowne',
                'eddystone',
                'folcroft',
                'glenolden',
                'lansdowne',
                'marcus hook',
                'millbourne',
                'morton',
                'norwood',
                'parkside',
                'prospect park',
                'rose valley',
                'rutledge',
                'sharon hill',
                'swarthmore',
                'trainer',
                'upland',
                'yeadon',
            ],
        ],
        ['Elk', 15834, 15866, ['st. marys', 'ridgway', 'johnsonburg']],
        [
            'Erie',
            16401,
            16565,
            [
                'erie',
                'corry',
                'edinboro',
                'north east',
                'girard',
                'albion',
                'cranesville',
                'east springfield',
                'elgin',
                'fairview',
                'lake city',
                'mckean',
                'mill village',
                'platea',
                'union city',
                'waterford',
                'wattsburg',
                'wesleyville',
            ],
        ],
        [
            'Fayette',
            15401,
            15490,
            [
                'uniontown',
                'connellsville',
                'brownsville',
                'masontown',
                'belle vernon',
                'dawson',
                'dunbar',
                'everson',
                'fairchance',
                'fayette city',
                'markleysburg',
                'newell',
                'ohiopyle',
                'perryopolis',
                'point marion',
                'smithfield',
                'south connellsville',
                'vanderbilt',
            ],
        ],
        [
            'Franklin',
            17201,
            17268,
            ['chambersburg', 'waynesboro', 'greencastle', 'mercersburg', 'mont alto', 'orrstown'],
        ],
        [
            'Greene',
            15301,
            15370,
            ['waynesburg', 'carmichaels', 'clarksville', 'greensboro', 'jefferson', 'rices landing'],
        ],
        [
            'Huntingdon',
            16652,
            17066,
            [
                'huntingdon',
                'mount union',
                'alexandria',
                'birmingham',
                'broad top city',
                'cassville',
                'coalmont',
                'dudley',
                'mapleton',
                'marklesburg',
                'mill creek',
                'orbisonia',
                'petersburg',
                'rockhill',
                'saltillo',
                'shade gap',
                'shirleysburg',
                'three springs',
            ],
        ],
        [
            'Indiana',
            15701,
            15781,
            [
                'indiana',
                'blairsville',
                'armagh',
                'cherry tree',
                'clarksburg',
                'clymer',
                'creekside',
                'ernest',
                'glen campbell',
                'homer city',
                'jacksonville',
                'marion center',
                'plumville',
                'saltsburg',
                'shelocta',
                'smicksburg',
            ],
        ],
        [
            'Jefferson',
            15831,
            15866,
            [
                'punxsutawney',
                'brookville',
                'reynoldsville',
                'big run',
                'brockway',
                'corsica',
                'falls creek',
                'summerville',
                'sykesville',
                'timblin',
                'worthville',
            ],
        ],
        ['Juniata', 17020, 17099, ['mifflintown', 'mifflin', 'port royal', 'thompsontown']],
        [
            'Lackawanna',
            18401,
            18519,
            [
                'scranton',
                'carbondale',
                'dunmore',
                'old forge',
                'clarks summit',
                'archbald',
                'dickson city',
                'blakely',
                'clarks green',
                'dalton',
                'jermyn',
                'jessup',
                'mayfield',
                'moosic',
                'moscow',
                'olyphant',
                'taylor',
                'throop',
                'vandling',
                'waverly',
            ],
        ],
        [
            'Lancaster',
            17501,
            17608,
            [
                'lancaster',
                'ephrata',
                'elizabethtown',
                'lititz',
                'columbia',
                'manheim',
                'new holland',
                'akron',
                'christiana',
                'denver',
                'east petersburg',
                'marietta',
                'millersville',
                'mount joy',
                'mountville',
                'quarryville',
                'strasburg',
                'terre hill',
            ],
        ],
        [
            'Lawrence',
            16101,
            16160,
            [
                'new castle',
                'ellwood city',
                'new wilmington',
                'bessemer',
                'enon valley',
                'new beaver',
                's.n.p.j.',
                'south new castle',
                'volant',
                'wampum',
            ],
        ],
        [
            'Lebanon',
            17003,
            17099,
            ['lebanon', 'palmyra', 'annville', 'myerstown', 'cleona', 'cornwall', 'jonestown', 'richland'],
        ],
        [
            'Lehigh',
            18001,
            18109,
            [
                'allentown',
                'bethlehem',
                'emmaus',
                'whitehall',
                'macungie',
                'alburtis',
                'catasauqua',
                'coopersburg',
                'coplay',
                'fountain hill',
                'slatington',
            ],
        ],
        [
            'Luzerne',
            18201,
            18709,
            [
                'wilkes-barre',
                'hazleton',
                'kingston',
                'nanticoke',
                'pittston',
                'mountain top',
                'dallas',
                'ashley',
                'avoca',
                'bear creek village',
                'conyngham',
                'courtdale',
                'dupont',
                'duryea',
                'edwardsville',
                'exeter',
                'forty fort',
                'freeland',
                'harveys lake',
                'hughestown',
                'jeddo',
                'laflin',
                'larksville',
                'laurel run',
                'luzerne',
                'new columbus',
                'nuangola',
                'penn lake park',
                'plymouth',
                'pringle',
                'shickshinny',
                'sugar notch',
                'swoyersville',
                'warrior run',
                'west hazleton',
                'west pittston',
                'west wyoming',
                'white haven',
                'wyoming',
                'yatesville',
            ],
        ],
        [
            'Lycoming',
            17701,
            17778,
            [
                'williamsport',
                'montoursville',
                'muncy',
                'jersey shore',
                'duboistown',
                'hughesville',
                'montgomery',
                'picture rocks',
                'salladasburg',
                'south williamsport',
            ],
        ],
        [
            'McKean',
            16701,
            16749,
            ['bradford', 'kane', 'eldred', 'lewis run', 'mount jewett', 'port allegany', 'smethport'],
        ],
        [
            'Mercer',
            16125,
            16173,
            [
                'hermitage',
                'sharon',
                'greenville',
                'grove city',
                'mercer',
                'clark',
                'farrell',
                'fredonia',
                'jackson center',
                'jamestown',
                'new lebanon',
                'sandy lake',
                'sheakleyville',
                'stoneboro',
                'west middlesex',
                'wheatland',
            ],
        ],
        [
            'Mifflin',
            17044,
            17099,
            ['lewistown', 'burnham', 'juniata terrace', 'kistler', 'mcveytown', 'newton hamilton'],
        ],
        [
            'Monroe',
            18301,
            18372,
            ['east stroudsburg', 'stroudsburg', 'mount pocono', 'pocono pines', 'delaware water gap'],
        ],
        [
            'Montgomery',
            19001,
            19490,
            [
                'norristown',
                'pottstown',
                'king of prussia',
                'lansdale',
                'willow grove',
                'horsham',
                'montgomeryville',
                'ardmore',
                'harleysville',
                'ambler',
                'bridgeport',
                'bryn athyn',
                'collegeville',
                'conshohocken',
                'east greenville',
                'green lane',
                'hatboro',
                'hatfield',
                'jenkintown',
                'narberth',
                'north wales',
                'pennsburg',
                'red hill',
                'rockledge',
                'royersford',
                'schwenksville',
                'souderton',
                'trappe',
                'west conshohocken',
            ],
        ],
        ['Montour', 17821, 17889, ['danville', 'washingtonville']],
        [
            'Northampton',
            18013,
            18109,
            [
                'bethlehem',
                'easton',
                'northampton',
                'nazareth',
                'bangor',
                'bath',
                'chapman',
                'east bangor',
                'freemansburg',
                'glendon',
                'hellertown',
                'north catasauqua',
                'pen argyl',
                'portland',
                'roseto',
                'stockertown',
                'tatamy',
                'walnutport',
                'west easton',
                'wilson',
                'wind gap',
            ],
        ],
        [
            'Northumberland',
            17801,
            17889,
            [
                'sunbury',
                'shamokin',
                'mount carmel',
                'milton',
                'herndon',
                'kulpmont',
                'marion heights',
                'mcewensville',
                'northumberland',
                'riverside',
                'snydertown',
                'turbotville',
                'watsontown',
            ],
        ],
        [
            'Perry',
            17013,
            17099,
            ['newport', 'duncannon', 'blain', 'bloomfield', 'landisburg', 'liverpool', 'marysville', 'new buffalo'],
        ],
        ['Philadelphia', 19101, 19155, ['philadelphia']],
        ['Pike', 18324, 18472, ['milford', 'matamoras']],
        ['Potter', 16915, 16950, ['coudersport', 'austin', 'galeton', 'oswayo', 'shinglehouse', 'ulysses']],
        [
            'Schuylkill',
            17901,
            17985,
            [
                'pottsville',
                'tamaqua',
                'schuylkill haven',
                'shenandoah',
                'mahanoy city',
                'ashland',
                'auburn',
                'coaldale',
                'cressona',
                'deer lake',
                'frackville',
                'gilberton',
                'girardville',
                'gordon',
                'landingville',
                'mcadoo',
                'mechanicsville',
                'middleport',
                'minersville',
                'mount carbon',
                'new philadelphia',
                'new ringgold',
                'orwigsburg',
                'palo alto',
                'pine grove',
                'port carbon',
                'port clinton',
                'ringtown',
                'st. clair',
                'tower city',
                'tremont',
            ],
        ],
        ['Snyder', 17837, 17889, ['selinsgrove', 'middleburg', 'beavertown', 'freeburg', 'mcclure', 'shamokin dam']],
        [
            'Somerset',
            15501,
            15563,
            [
                'somerset',
                'windber',
                'meyersdale',
                'addison',
                'benson',
                'berlin',
                'boswell',
                'callimont',
                'casselman',
                'central city',
                'confluence',
                'garrett',
                'hooversville',
                'indian lake',
                'jennerstown',
                'new baltimore',
                'new centerville',
                'paint',
                'rockwood',
                'salisbury',
                'shanksville',
                'stoystown',
                'ursina',
                'wellersburg',
            ],
        ],
        [
            'Susquehanna',
            18801,
            18853,
            [
                'montrose',
                'forest city',
                'friendsville',
                'great bend',
                'hallstead',
                'hop bottom',
                'lanesboro',
                'little meadows',
                'new milford',
                'oakland',
                'susquehanna depot',
                'thompson',
                'union dale',
            ],
        ],
        [
            'Tioga',
            16920,
            16950,
            [
                'wellsboro',
                'mansfield',
                'blossburg',
                'covington',
                'elkland',
                'knoxville',
                'lawrenceville',
                'liberty',
                'middlebury center',
                'millerton',
                'morris',
                'osceola',
                'roseville',
                'tioga',
                'westfield',
            ],
        ],
        ['Union', 17837, 17889, ['lewisburg', 'mifflinburg', 'hartleton', 'new berlin']],
        [
            'Venango',
            16301,
            16374,
            [
                'oil city',
                'franklin',
                'titusville',
                'barkeyville',
                'clintonville',
                'cooperstown',
                'emlenton',
                'pleasantville',
                'polk',
                'rouseville',
                'sugarcreek',
                'utica',
            ],
        ],
        ['Warren', 16301, 16374, ['warren', 'bear lake', 'clarendon', 'sugar grove', 'tidioute', 'youngsville']],
        [
            'Washington',
            15301,
            15370,
            [
                'washington',
                'canonsburg',
                'monongahela',
                'charleroi',
                'mcmurray',
                'allenport',
                'beallsville',
                'bentleyville',
                'burgettstown',
                'california',
                'canton',
                'cecil-bishop',
                'centerville',
                'claysville',
                'coal center',
                'cokeburg',
                'deemston',
                'donora',
                'dunlevy',
                'east washington',
                'elco',
                'ellsworth',
                'finleyville',
                'green hills',
                'houston',
                'long branch',
                'marianna',
                'mcdonald',
                'midway',
                'new eagle',
                'north charleroi',
                'north franklin',
                'roscoe',
                'speers',
                'stockdale',
                'twilight',
                'west brownsville',
                'west middletown',
            ],
        ],
        ['Wayne', 18411, 18472, ['honesdale', 'hawley', 'bethany', 'prompton', 'starrucca', 'waymart']],
        [
            'Westmoreland',
            15601,
            15697,
            [
                'greensburg',
                'murrysville',
                'new kensington',
                'latrobe',
                'lower burrell',
                'jeannette',
                'monessen',
                'irwin',
                'adamsburg',
                'arona',
                'avonmore',
                'bolivar',
                'delmont',
                'derry',
                'donegal',
                'east vandergrift',
                'export',
                'hunker',
                'hyde park',
                'ligonier',
                'madison',
                'manor',
                'mount pleasant',
                'new alexandria',
                'new florence',
                'new stanton',
                'north belle vernon',
                'north irwin',
                'oklahoma',
                'penn',
                'scottdale',
                'seward',
                'smithton',
                'south greensburg',
                'southwest greensburg',
                'sutersville',
                'trafford',
                'vandergrift',
                'west leechburg',
                'west newton',
                'youngstown',
                'youngwood',
            ],
        ],
        ['Wyoming', 18610, 18657, ['tunkhannock', 'factoryville', 'laceyville', 'meshoppen', 'nicholson']],
        [
            'York',
            17401,
            17408,
            [
                'york',
                'hanover',
                'red lion',
                'shrewsbury',
                'dillsburg',
                'cross roads',
                'dallastown',
                'delta',
                'dover',
                'east prospect',
                'fawn grove',
                'felton',
                'franklintown',
                'glen rock',
                'goldsboro',
                'hallam',
                'jacobus',
                'jefferson',
                'lewisberry',
                'loganville',
                'manchester',
                'mount wolf',
                'new freedom',
                'new salem',
                'north york',
                'railroad',
                'seven valleys',
                'spring grove',
                'stewartstown',
                'wellsville',
                'west york',
                'windsor',
                'winterstown',
                'wrightsville',
                'yoe',
                'yorkana',
                'york haven',
            ],
        ],
    ];
    /* Note: Full list extracted from original index.html */

    /**
     * @typedef {Record<string, number[]>} CityOverride
     */

    /**
     * @typedef {Record<string, CityOverride>} OverrideData
     */

    /** @type {OverrideData} */
    const O = {
        bethlehem: { Lehigh: [18015, 18017], Northampton: [18016, 18018, 18020, 18025] },
        trafford: { Allegheny: [15085], Westmoreland: [15085] },
        mcdonald: { Allegheny: [15057], Washington: [15057] },
        'ellwood city': { Beaver: [16117], Lawrence: [16117] },
        adamstown: { Berks: [19501], Lancaster: [19501] },
        shippensburg: { Cumberland: [17257], Franklin: [17257] },
        'seven springs': { Fayette: [15622], Somerset: [15622] },
    };

    /**
     * Finds county information based on ZIP code or city name.
     * @param {string} q - The query string (ZIP or City).
     * @returns {string|null} The formatted result string or null if not found.
     *
     * @example
     * const result = find('17301');
     * console.log(result); // "17301: Adams"
     */
    function find(q) {
        const c = q.trim();
        const results = [];

        /* ZIP SEARCH */
        if (/^\d{5}$/.test(c)) {
            const z = parseInt(c, 10);

            /* O Specifics */
            for (const counties of Object.values(O)) {
                for (const [county, zips] of Object.entries(counties)) {
                    if (zips.includes(z)) {
                        if (!results.includes(county)) results.push(county);
                    }
                }
            }
            // If found in overrides (exact match), return immediately to avoid range false positives
            if (results.length > 0) {
                return c + ': ' + results.join(', ');
            }

            /* D Ranges */
            for (const [county, rangeStart, rangeEnd] of D) {
                if (z >= rangeStart && z <= rangeEnd) {
                    if (!results.includes(county)) results.push(county);
                }
            }

            return results.length ? c + ': ' + results.join(', ') : null;
        }

        /* CITY SEARCH */
        const l = c.toLowerCase();

        /* O Search (Overrides) */
        if (Object.prototype.hasOwnProperty.call(O, l)) {
            const counties = O[l];
            for (const county of Object.keys(counties)) {
                if (!results.includes(county)) results.push(county);
            }
        }

        /* D Search */
        for (const [county, , , cities] of D) {
            for (const city of cities) {
                if (city === l) {
                    if (!results.includes(county)) results.push(county);
                    break;
                }
            }
        }

        return results.length ? c + ': ' + results.join(', ') : null;
    }

    /* UI LOGIC */
    function initUI() {
        /* Inject CSS for Animation & Styling */
        const styleId = 'pa-css';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes pa-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes pa-slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes pa-spin { to { transform: rotate(360deg); } }
            .pa-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 99999; animation: pa-fade-in 0.2s ease-out; backdrop-filter: blur(2px); }
            .pa-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); width: 320px; font-family: system-ui, -apple-system, sans-serif; animation: pa-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); max-width: 90vw; display: flex; flex-direction: column; gap: 12px; }
            .pa-btn { width: 100%; padding: 10px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
            .pa-btn:active { transform: scale(0.98); }
            .pa-btn:disabled { opacity: 0.7; cursor: not-allowed; }
            .pa-btn-primary { background: #2563eb; color: white; }
            .pa-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
            .pa-btn-sec { background: #f1f5f9; color: #475569; }
            .pa-btn-sec:hover { background: #e2e8f0; }
            .pa-input-wrapper { position: relative; width: 100%; }
            .pa-input { width: 100%; padding: 12px; padding-right: 36px; margin: 0; box-sizing: border-box; border: 1px solid #cbd5e1; border-radius: 6px; outline: none; transition: border-color 0.2s; font-size: 14px; }
            .pa-input:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.2); }
            .pa-clear-btn { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 50%; display: none; }
            .pa-clear-btn:hover { background: #f1f5f9; color: #475569; }
            .pa-input:not(:placeholder-shown) + .pa-clear-btn { display: block; }
            .pa-result-card { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; animation: pa-fade-in 0.3s ease-out; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
            .pa-result-text { font-size: 14px; color: #1e293b; line-height: 1.5; flex: 1; }
            .pa-result-error { background: #fee2e2; border-color: #fecaca; color: #991b1b; }
            .pa-copy-btn { background: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; cursor: pointer; color: #64748b; transition: all 0.2s; min-width: 32px; display: flex; align-items: center; justify-content: center; }
            .pa-copy-btn:hover { background: #f1f5f9; color: #334155; }
            .pa-copy-success { color: #166534; border-color: #bbf7d0; background: #dcfce7; }
            .pa-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: pa-spin 0.8s linear infinite; }
            .pa-title { margin: 0; font-size: 18px; font-weight: 700; color: #1e293b; }
        `;
        document.head.appendChild(style);
    }

    /* Accessibility & Focus Management */
    const lastFocus = /** @type {HTMLElement} */ (document.activeElement);

    const close = () => {
        overlay.remove();
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    const overlay = document.createElement('div');
    overlay.className = 'pa-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pa-title');

    const card = document.createElement('div');
    card.className = 'pa-card';
    card.innerHTML = `<h3 id="pa-title" class="pa-title">PA County Finder</h3><div id="pa-content" style="display: flex; flex-direction: column; gap: 12px;"></div>`;
    overlay.appendChild(card);

    // Close on overlay click
    overlay.onclick = (e) => e.target === overlay && close();

    // Close on Escape
    const onKeydown = (/** @type {KeyboardEvent} */ e) => {
        if (!document.body.contains(overlay)) {
            document.removeEventListener('keydown', onKeydown);
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
        // Focus Trap
        if (e.key === 'Tab') {
            const focusable = card.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const first = /** @type {HTMLElement} */ (focusable[0]);
            const last = /** @type {HTMLElement} */ (focusable[focusable.length - 1]);
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    };
    document.addEventListener('keydown', onKeydown);

    const content = /** @type {HTMLElement} */ (card.querySelector('#pa-content'));
    const resultDiv = document.createElement('div');
    resultDiv.id = 'pa-result';
    resultDiv.setAttribute('aria-live', 'polite');

    /**
     * Creates a close button element.
     * @returns {HTMLButtonElement} The button element.
     */
    const createCloseBtn = () => {
        const btn = document.createElement('button');
        btn.textContent = 'Close';
        btn.className = 'pa-btn pa-btn-sec';
        btn.setAttribute('aria-label', 'Close');
        btn.onclick = close;
        return btn;
    };

    /**
     * Updates the result display area.
     * @param {string|null} r - The result string to display.
     * @param {string} q - The original query string for error message.
     */
    const updateResult = (r, q) => {
        resultDiv.innerHTML = '';
        const safeQ = BookmarkletUtils.escapeHtml(q);

        if (!r) {
            const errDiv = document.createElement('div');
            errDiv.className = 'pa-result-card pa-result-error';
            errDiv.innerHTML = `<span class="pa-result-text">No match for "<strong>${safeQ}</strong>"</span>`;
            resultDiv.appendChild(errDiv);
            return;
        }

        const safeR = BookmarkletUtils.escapeHtml(r);
        const resCard = document.createElement('div');
        resCard.className = 'pa-result-card';

        const textDiv = document.createElement('div');
        textDiv.className = 'pa-result-text';
        textDiv.innerHTML = `<strong>Result:</strong><br>${safeR}`;

        const copyBtn = document.createElement('button');
        copyBtn.className = 'pa-copy-btn';
        copyBtn.setAttribute('aria-label', 'Copy result');
        // SVG Icon for Copy
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

        copyBtn.onclick = () => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(r).then(() => {
                    copyBtn.innerHTML = '✓';
                    copyBtn.classList.add('pa-copy-success');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                        copyBtn.classList.remove('pa-copy-success');
                    }, 2000);
                }).catch(err => console.error('Failed to copy', err));
            }
        };

        resCard.appendChild(textDiv);
        resCard.appendChild(copyBtn);
        resultDiv.appendChild(resCard);
    };

    let s = window.getSelection().toString().trim();
    if (s) {
        updateResult(find(s), s);
        content.appendChild(resultDiv);
        const cBtn = createCloseBtn();
        content.appendChild(cBtn);
        // Focus close button if immediate result
        setTimeout(() => cBtn.focus(), 50);
    } else {
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'pa-input-wrapper';

        const inp = document.createElement('input');
        inp.className = 'pa-input';
        inp.placeholder = 'ZIP or City';
        inp.setAttribute('aria-label', 'Enter ZIP code or City name');

        const clearBtn = document.createElement('button');
        clearBtn.className = 'pa-clear-btn';
        clearBtn.innerHTML = '✕';
        clearBtn.setAttribute('aria-label', 'Clear input');
        clearBtn.onclick = () => {
            inp.value = '';
            inp.focus();
        };

        inputWrapper.appendChild(inp);
        inputWrapper.appendChild(clearBtn);

        const btn = document.createElement('button');
        btn.textContent = 'Find';
        btn.className = 'pa-btn pa-btn-primary';

        const performSearch = () => {
            if (btn.disabled) return;
            const val = inp.value.trim();
            if (!val) return;

            // Loading state
            const originalText = btn.textContent;
            btn.innerHTML = '<div class="pa-spinner"></div>';
            btn.disabled = true;

            setTimeout(() => {
                updateResult(find(val), val);
                btn.textContent = originalText;
                btn.disabled = false;
                // Announce for screen readers handled by aria-live on resultDiv
            }, 300);
        };

        btn.onclick = performSearch;
        inp.onkeydown = (/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && performSearch();

        content.append(inputWrapper, btn, resultDiv, createCloseBtn());
        setTimeout(() => inp.focus(), 50);
    }
    document.body.appendChild(overlay);
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { find, initUI };
    } else {
        initUI();
    }
})();
