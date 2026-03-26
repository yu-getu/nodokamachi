// ═══════════════════════════════════════
//  定数・データ定義・ゲーム状態
// ═══════════════════════════════════════
const SAVE_KEY = 'nodokamachi_v5';

// デイリーボーナス定義
// cpsHours: 現在CPS × 3600秒 × cpsHours 分のコインを支給（最低保証: minCoins）
const DAILY_REWARDS = [
  { day:1, icon:'🌱', label:'初日',    cpsHours:1,  minCoins:100,  multiplier:1 },
  { day:2, icon:'🌿', label:'2日目',   cpsHours:2,  minCoins:200,  multiplier:1 },
  { day:3, icon:'☕', label:'3日目',   cpsHours:3,  minCoins:400,  multiplier:1 },
  { day:4, icon:'🥐', label:'4日目',   cpsHours:5,  minCoins:800,  multiplier:1 },
  { day:5, icon:'⭐', label:'5日目',   cpsHours:8,  minCoins:1500, multiplier:1 },
  { day:6, icon:'🎆', label:'6日目',   cpsHours:12, minCoins:3000, multiplier:1 },
  { day:7, icon:'👑', label:'7日目！', cpsHours:0,  minCoins:0,    multiplier:3, special:'CPS×3（2時間）', duration:7200 },
];

// フェーズ定義: [最大Lv, コスト倍率, フェーズ名, フェーズカラーCSS]
const PHASES = [
  { maxLv: 10,  mult: 1.30, name: '開拓期',   colorClass: 'phase-1', dot: 'dot-p1' },
  { maxLv: 25,  mult: 1.20, name: '成長期',   colorClass: 'phase-2', dot: 'dot-p2' },
  { maxLv: 50,  mult: 1.15, name: '円熟期',   colorClass: 'phase-3', dot: 'dot-p3' },
  { maxLv: 100, mult: 1.10, name: 'レジェンド', colorClass: 'phase-4', dot: 'dot-p4' },
];

const MILESTONES = [10, 25, 50, 100];
const BASE_MAX_LV   = 100;
const PRESTIGE_LV_BONUS = 25;

// 建物定義
const BUILDINGS = [
  // ── 第1区「農村」──
  {id:'field',        name:'畑',               emoji:'🥕', baseCost:30,             baseCps:0.3,          desc:'野菜を育てる小さな畑',      area:1},
  {id:'coop',         name:'鶏小屋',           emoji:'🐓', baseCost:100,            baseCps:1.0,          desc:'卵を産む可愛い鶏たち',      area:1},
  {id:'bakery',       name:'パン屋',           emoji:'🥐', baseCost:320,            baseCps:3.2,          desc:'焼きたてパンの香り',        area:1},
  {id:'farmcoop',     name:'農協',             emoji:'🌾', baseCost:1000,           baseCps:10,           desc:'農家を支える地域組合',      area:1},
  {id:'orchard',      name:'果樹園',           emoji:'🍎', baseCost:3000,           baseCps:30,           desc:'実り豊かな果樹の農園',      area:1},
  {id:'ranch',        name:'牧場',             emoji:'🐄', baseCost:9000,           baseCps:90,           desc:'のどかな草原の牧場',        area:1},
  // ── 第2区「商店街」──
  {id:'candyshop',    name:'駄菓子屋',         emoji:'🍬', baseCost:3500,           baseCps:35,           desc:'懐かしい甘いお菓子',        area:2},
  {id:'cafe',         name:'喫茶店',           emoji:'☕', baseCost:12000,          baseCps:120,          desc:'ゆったりコーヒータイム',    area:2},
  {id:'greengrocer',  name:'八百屋',           emoji:'🥦', baseCost:40000,          baseCps:400,          desc:'新鮮な野菜が並ぶ',          area:2},
  {id:'inn',          name:'旅館',             emoji:'🏨', baseCost:130000,         baseCps:1300,         desc:'旅人を温かくもてなす',      area:2},
  {id:'flowershop',   name:'花屋',             emoji:'💐', baseCost:420000,         baseCps:4200,         desc:'四季折々の花を届ける',      area:2},
  {id:'bookstore',    name:'書店',             emoji:'📖', baseCost:1400000,        baseCps:14000,        desc:'知識と物語が集まる店',      area:2},
  // ── 第3区「文化の丘」──
  {id:'library',      name:'図書館',           emoji:'📚', baseCost:500000,         baseCps:5000,         desc:'知識の宝庫',                area:3},
  {id:'artmuseum',    name:'美術館',           emoji:'🎨', baseCost:1800000,        baseCps:18000,        desc:'芸術が集まる場所',          area:3},
  {id:'shrine',       name:'神社',             emoji:'⛩️', baseCost:6000000,        baseCps:60000,        desc:'古くから守られた社',        area:3},
  {id:'theater',      name:'劇場',             emoji:'🎭', baseCost:20000000,       baseCps:200000,       desc:'感動の舞台',                area:3},
  {id:'museum',       name:'博物館',           emoji:'🏛️', baseCost:65000000,       baseCps:650000,       desc:'歴史と文化の宝庫',          area:3},
  {id:'university',   name:'大学',             emoji:'🎓', baseCost:210000000,      baseCps:2100000,      desc:'未来を担う知の殿堂',        area:3},
  // ── 第4区「いやしの里」──
  {id:'herbgarden',   name:'薬草園',           emoji:'🌿', baseCost:80000000,       baseCps:800000,       desc:'癒やしの香り漂う庭園',      area:4},
  {id:'onsen',        name:'温泉旅館',         emoji:'♨️', baseCost:280000000,      baseCps:2800000,      desc:'名湯が湧き出す宿',          area:4},
  {id:'spa',          name:'スパ',             emoji:'🧖', baseCost:900000000,      baseCps:9000000,      desc:'至高の癒やし体験',          area:4},
  {id:'zengarden',    name:'禅の庭',           emoji:'🪨', baseCost:3000000000,     baseCps:30000000,     desc:'静寂の中の悟り',            area:4},
  {id:'naturepark',   name:'自然公園',         emoji:'🌲', baseCost:9500000000,     baseCps:95000000,     desc:'緑あふれる大自然の憩い',    area:4},
  {id:'meditforest',  name:'瞑想の森',         emoji:'🧘', baseCost:30000000000,    baseCps:300000000,    desc:'深い静寂が心を癒す',        area:4},
  // ── 第5区「夢の都市」──
  {id:'castle',       name:'城',               emoji:'🏯', baseCost:10000000000,    baseCps:100000000,    desc:'街のシンボルたる大城',      area:5},
  {id:'amusement',    name:'遊園地',           emoji:'🎡', baseCost:35000000000,    baseCps:350000000,    desc:'夢と笑顔があふれる',        area:5},
  {id:'stadium',      name:'スタジアム',       emoji:'🏟️', baseCost:120000000000,   baseCps:1200000000,   desc:'熱狂の競技場',              area:5},
  {id:'skyscraper',   name:'摩天楼',           emoji:'🏢', baseCost:400000000000,   baseCps:4000000000,   desc:'空に届く超高層ビル',        area:5},
  {id:'airport',      name:'国際空港',         emoji:'✈️', baseCost:1300000000000,  baseCps:13000000000,  desc:'世界をつなぐ玄関口',        area:5},
  {id:'megaresort',   name:'メガリゾート',     emoji:'🌴', baseCost:4200000000000,  baseCps:42000000000,  desc:'夢のような超大型複合施設',  area:5},
  // ── 第6区「宇宙の夢」──
  {id:'rocket',       name:'宇宙基地',         emoji:'🚀', baseCost:1500000000000,  baseCps:15000000000,  desc:'宇宙へ飛び立つ拠点',        area:6},
  {id:'spaceport',    name:'宇宙港',           emoji:'🛸', baseCost:5500000000000,  baseCps:55000000000,  desc:'銀河をつなぐ港',            area:6},
  {id:'colony',       name:'スペースコロニー', emoji:'🌌', baseCost:20000000000000, baseCps:200000000000, desc:'宇宙に浮かぶ楽園',          area:6},
  {id:'dysonring',    name:'ダイソンリング',   emoji:'💫', baseCost:65000000000000, baseCps:650000000000, desc:'恒星のエネルギーを収穫',    area:6},
  {id:'galaxystation',name:'銀河ステーション', emoji:'🌠', baseCost:210000000000000,baseCps:2100000000000,desc:'銀河の交差点',              area:6},
  {id:'spaceciv',     name:'宇宙文明',         emoji:'🌍', baseCost:680000000000000,baseCps:6800000000000,desc:'宇宙に広がる新文明',        area:6},
];

// エリア定義
// 解放コスト = 当エリア最後の2棟付近で解放できるよう設計（前区6棟目の約1.5倍）
const AREAS = [
  {id:1, name:'第1区', emoji:'🌾', unlockCost:0,               desc:'のどかな農村エリア'},
  {id:2, name:'第2区', emoji:'🏪', unlockCost:15000,           desc:'にぎやかな商店街エリア'},
  {id:3, name:'第3区', emoji:'📚', unlockCost:2000000,         desc:'文化の丘エリア'},
  {id:4, name:'第4区', emoji:'🌿', unlockCost:300000000,       desc:'いやしの里エリア'},
  {id:5, name:'第5区', emoji:'🏙️', unlockCost:45000000000,     desc:'夢の都市エリア'},
  {id:6, name:'第6区', emoji:'🚀', unlockCost:6000000000000,   desc:'宇宙の夢エリア'},
];

// 研究定義
const RESEARCH = [
  {id:'farming',   name:'農業振興',     emoji:'🌾', cost:100000,              desc:'農村エリア全建物のCPS ×1.5',    targets:['field','coop','bakery','farmcoop','orchard','ranch'],                           mult:1.5},
  {id:'commerce',  name:'商業発展',     emoji:'🏪', cost:20000000,            desc:'商店街エリア全建物のCPS ×1.5',  targets:['candyshop','cafe','greengrocer','inn','flowershop','bookstore'],                mult:1.5},
  {id:'all1',      name:'街の活性化',   emoji:'🏙️', cost:50000000,            desc:'全建物のCPS +30%',              targets:['all'],                                                                         mult:1.3},
  {id:'culture',   name:'文化革命',     emoji:'📚', cost:3000000000,          desc:'文化エリア全建物のCPS ×2',      targets:['library','artmuseum','shrine','theater','museum','university'],                 mult:2},
  {id:'nature',    name:'自然の恵み',   emoji:'🌿', cost:400000000000,        desc:'癒やしエリア全建物のCPS ×2',    targets:['herbgarden','onsen','spa','zengarden','naturepark','meditforest'],              mult:2},
  {id:'all2',      name:'奇跡の街',     emoji:'✨', cost:1000000000000,       desc:'全建物のCPS ×2',                targets:['all'],                                                                         mult:2},
  {id:'entertain', name:'エンタメ産業', emoji:'🎡', cost:50000000000000,      desc:'娯楽エリア全建物のCPS ×2',      targets:['castle','amusement','stadium','skyscraper','airport','megaresort'],             mult:2},
  {id:'space',     name:'宇宙開発',     emoji:'🚀', cost:1e16,               desc:'宇宙エリア全建物のCPS ×2',      targets:['rocket','spaceport','colony','dysonring','galaxystation','spaceciv'],           mult:2},
  {id:'hypertech', name:'超技術革新',   emoji:'⚡', cost:3e16,               desc:'全建物のCPS ×1.5',              targets:['all'],                                                                         mult:1.5},
];

// スキルツリー定義
const SKILLS = [
  // Tier 1（前提なし・1SP）
  {id:'farm_mastery',   name:'大地の恵み',   emoji:'🥕', cost:1, tier:1, requires:[], effect:'cps_area1',     value:0.30, desc:'農村エリア全建物のCPS +30%'},
  {id:'commerce_art',   name:'商いの才',     emoji:'🏪', cost:1, tier:1, requires:[], effect:'cps_area2',     value:0.30, desc:'商店街エリア全建物のCPS +30%'},
  {id:'quick_hands',    name:'素早い手',     emoji:'🪙', cost:1, tier:1, requires:[], effect:'collect_mult',  value:2,    desc:'手動ひと稼ぎのボーナス ×3'},
  // Tier 2（2SP）
  {id:'culture_bloom',  name:'文化の花開き', emoji:'📚', cost:2, tier:2, requires:['farm_mastery','commerce_art'], effect:'cps_area3', value:0.40, desc:'文化エリア全建物のCPS +40%'},
  {id:'thrift',         name:'節約の極意',   emoji:'✂️', cost:2, tier:2, requires:['commerce_art'],             effect:'cost_down',  value:0.15, desc:'全建物のコスト -15%'},
  {id:'beauty_power',   name:'美の力',       emoji:'🌺', cost:2, tier:2, requires:['farm_mastery'],             effect:'beauty_mult',value:0.5,  desc:'美観ボーナス ×1.5'},
  // Tier 3（2SP）
  {id:'healing_spirit', name:'癒やしの精神', emoji:'🌿', cost:2, tier:3, requires:['culture_bloom'],                   effect:'cps_area4',     value:0.50, desc:'癒やしエリア全建物のCPS +50%'},
  {id:'city_dream',     name:'都市の夢',     emoji:'🏙️', cost:2, tier:3, requires:['culture_bloom','thrift'],         effect:'cps_area5',     value:0.50, desc:'娯楽エリア全建物のCPS +50%'},
  {id:'research_gift',  name:'研究の才能',   emoji:'🔬', cost:2, tier:3, requires:['culture_bloom'],                   effect:'research_cost', value:0.25, desc:'研究コスト -25%'},
  // Tier 4（3SP）
  {id:'town_vitality',  name:'街の活気',     emoji:'✨', cost:3, tier:4, requires:['healing_spirit','city_dream'],     effect:'cps_all',  value:0.30, desc:'全建物のCPS +30%'},
  {id:'space_ambition', name:'宇宙への野望', emoji:'🚀', cost:3, tier:4, requires:['city_dream'],                      effect:'cps_area6',value:0.80, desc:'宇宙エリア全建物のCPS +80%'},
  // Tier 5（3SP）
  {id:'miracle_town',   name:'奇跡の街',     emoji:'🌟', cost:3, tier:5, requires:['town_vitality','beauty_power'],    effect:'cps_all',  value:0.50, desc:'全建物のCPS +50%'},
  // Tier 6（4SP）
  {id:'galaxy_civ',     name:'銀河文明',     emoji:'🌌', cost:4, tier:6, requires:['miracle_town','space_ambition'],  effect:'cps_mult', value:1.0,  desc:'全建物のCPS ×2'},
];

const EVENTS = [
  {id:'sunny',    type:'great',icon:'☀️', title:'晴天ボーナス！',  desc:'1分間コイン収入2倍！',       mult:2,   dur:60},
  {id:'harvest',  type:'good', icon:'🌟', title:'大繁盛の季節！',  desc:'街が活気づいた！コインを獲得', bonus:'cps30',dur:0},
  {id:'traveler', type:'good', icon:'🧳', title:'旅人が訪れた！',  desc:'旅人がお土産を持ってきた！', bonus:'flat',amt:200,dur:0},
  {id:'festival', type:'great',icon:'🎆', title:'お祭り開催！',    desc:'2分間コイン収入1.5倍！',     mult:1.5, dur:120},
  {id:'storm',    type:'bad',  icon:'⛈️', title:'嵐が来た...',     desc:'30秒間コイン収入半減。',     mult:.5,  dur:30},
  {id:'drought',  type:'bad',  icon:'🏜️', title:'干ばつ発生...',   desc:'45秒間収入0.7倍。',          mult:.7,  dur:45},
  {id:'merchant', type:'info', icon:'🛒', title:'行商人が来た！',  desc:'次の購入が20%引きに！',      discount:.8,dur:60},
  {id:'rain',     type:'good', icon:'🌧️', title:'恵みの雨',        desc:'50秒間収入1.3倍！',          mult:1.3, dur:50},
];

const SEASONS = [
  { id:'spring', name:'春', emoji:'🌸', months:[3,4,5],   cpsMult:1.1, cssClass:'season-spring',
    skyGrad:'linear-gradient(180deg,#fce4ec 0%,#f8bbd0 30%,#e8f5e9 70%,#c8e6c9 100%)', desc:'春風ボーナス +10%' },
  { id:'summer', name:'夏', emoji:'🌻', months:[6,7,8],   cpsMult:1.2, cssClass:'season-summer',
    skyGrad:'linear-gradient(180deg,#87ceeb 0%,#b3e5fc 40%,#e8f5e9 70%,#c8e6c9 100%)', desc:'夏の太陽ボーナス +20%' },
  { id:'autumn', name:'秋', emoji:'🍂', months:[9,10,11], cpsMult:1.0, cssClass:'season-autumn',
    skyGrad:'linear-gradient(180deg,#fff3e0 0%,#ffe0b2 40%,#f1f8e9 70%,#dcedc8 100%)', desc:'実りの秋（等倍）' },
  { id:'winter', name:'冬', emoji:'❄️', months:[12,1,2],  cpsMult:0.9, cssClass:'season-winter',
    skyGrad:'linear-gradient(180deg,#e3f2fd 0%,#bbdefb 40%,#e8eaf6 70%,#b2ebf2 100%)', desc:'冬の静寂 -10%' },
];

const DECORATIONS = [
  { id:'flower',     name:'花壇',           emoji:'🌺', cost:500,      beautyPts:1,  desc:'色とりどりの花' },
  { id:'fountain',   name:'噴水',           emoji:'⛲', cost:2000,     beautyPts:3,  desc:'涼しげな噴水' },
  { id:'lantern',    name:'灯籠',           emoji:'🏮', cost:1500,     beautyPts:2,  desc:'和風の灯り' },
  { id:'park',       name:'公園',           emoji:'🌳', cost:5000,     beautyPts:5,  desc:'憩いの場所' },
  { id:'statue',     name:'銅像',           emoji:'🗿', cost:8000,     beautyPts:6,  desc:'街のシンボル' },
  { id:'lighthouse', name:'灯台',           emoji:'🗼', cost:15000,    beautyPts:10, desc:'高くそびえる灯台' },
  { id:'bandstand',  name:'音楽堂',         emoji:'🎵', cost:30000,    beautyPts:14, desc:'音楽が響く広場' },
  { id:'observatory',name:'展望台',         emoji:'🔭', cost:80000,    beautyPts:20, desc:'街を一望できる高台' },
  { id:'fireworks',  name:'花火台',         emoji:'🎆', cost:250000,   beautyPts:30, desc:'夜空を彩る花火' },
  { id:'beachresort',name:'ビーチリゾート', emoji:'⛱️', cost:1000000,  beautyPts:50, desc:'海辺の癒やしスポット' },
];

const WEATHER_DEFS = {
  clear:  { particles: [] },
  cherry: { particles: ['🌸','🌸','🌺','🌸'] },
  rain:   { particles: ['💧','💧','💧','🌧️'] },
  snow:   { particles: ['❄️','❄️','❄️','⛄'] },
  leaves: { particles: ['🍂','🍁','🍂','🍃'] },
};

const RESIDENT_TYPES = [
  { emoji:'🐰', phrases:['ぴょんぴょん！','今日もいい天気♪','にんじん食べたい','元気いっぱい！'] },
  { emoji:'🦊', phrases:['ふふ、いい街ね','気ままに散歩中','ここが好きよ','秘密の場所がある'] },
  { emoji:'🐸', phrases:['ケロケロ♪','いい散歩コース！','ぴょーん！','のんびり歩いてます'] },
  { emoji:'🐻', phrases:['はちみつほしい','のんびりしてるね','いい散歩道だ','この街大好き！'] },
  { emoji:'🐱', phrases:['にゃあ～','ひなたぼっこ中','居心地いい街','おひるね中だよ'] },
  { emoji:'🐶', phrases:['わんわん！','散歩が楽しい！','いい匂いがする','またきたよ！'] },
  { emoji:'🐨', phrases:['のんびりしてるね','ユーカリほしい','のんびりが一番','ふわふわ～'] },
  { emoji:'🐼', phrases:['笹を食べたい','ころころしたい','のんびり散歩中','いい街だね～'] },
  { emoji:'🦔', phrases:['ちくちく注意！','ゆっくり歩きます','いい天気♪','元気に散歩！'] },
  { emoji:'🐭', phrases:['チュウ！チュウ！','チーズが好き','隅々まで探索中','いろんな場所みたよ'] },
];

const SEASON_PHRASES = {
  spring: ['お花見日和！','春風が気持ちいい','さくらきれい～'],
  summer: ['暑いな～','かき氷食べたい','夏休み最高！'],
  autumn: ['秋の味覚最高','落ち葉がきれい','紅葉がきれいね'],
  winter: ['寒いけど元気！','雪だ雪だ！','あったかくしてね'],
};

const ACHIEVEMENTS = [
  {id:'first_build',   icon:'🏗️', name:'はじめの一歩',    desc:'最初の建物を建設',          reward:'記念',       check:s=>getTotalLv()>=1},
  {id:'lv10',          icon:'🌱', name:'Lv10到達',         desc:'いずれかの建物がLv10に',    reward:'記念称号',   check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=10)},
  {id:'lv25',          icon:'🌿', name:'Lv25到達',         desc:'いずれかの建物がLv25に',    reward:'記念称号',   check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=25)},
  {id:'lv50',          icon:'🌳', name:'Lv50到達',         desc:'いずれかの建物がLv50に',    reward:'CPS+10%',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=50)},
  {id:'lv100',         icon:'🏆', name:'Lv100マスター',    desc:'いずれかの建物がLv100に',   reward:'CPS+20%',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=100)},
  {id:'coins_10k',     icon:'💎', name:'万金持ち',         desc:'累計コイン1万枚を達成',     reward:'CPS+5%',     check:s=>s.totalEarned>=10000},
  {id:'coins_100k',    icon:'👑', name:'百万長者への道',   desc:'累計コイン10万枚を達成',    reward:'CPS+10%',    check:s=>s.totalEarned>=100000},
  {id:'all_buildings', icon:'🌆', name:'まちの設計士',     desc:'全建物を最低1つ建設',        reward:'CPS+15%',    check:s=>BUILDINGS.every(b=>s.buildings[b.id]?.level>=1)},
  {id:'ms_4',          icon:'🌟', name:'マイルストーンコンプ', desc:'Lv100のマイルストーン到達', reward:'CPS+25%', check:s=>BUILDINGS.some(b=>(s.buildings[b.id]?.msReached||[]).length>=4)},
  {id:'prestige_1',    icon:'⭐', name:'転生者',           desc:'初めてプレステージ転生',     reward:'永続CPS×1.2',check:s=>s.prestigeCount>=1},
  {id:'prestige_3',    icon:'🌟', name:'三度の転生',       desc:'3回プレステージ転生',        reward:'永続追加ボーナス',check:s=>s.prestigeCount>=3},
  {id:'lv125',         icon:'💫', name:'転生の恩恵',       desc:'転生後の建物がLv125に',      reward:'特別称号',   check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=125)},
  {id:'area2',     icon:'🏪', name:'商店街開拓',      desc:'第2区を解放した',    reward:'CPS+5%',  check:s=>(s.unlockedAreas||[]).includes(2)},
  {id:'area3',     icon:'📚', name:'文化の丘開拓',    desc:'第3区を解放した',    reward:'CPS+10%', check:s=>(s.unlockedAreas||[]).includes(3)},
  {id:'area4',     icon:'🌿', name:'いやしの里開拓',  desc:'第4区を解放した',    reward:'CPS+15%', check:s=>(s.unlockedAreas||[]).includes(4)},
  {id:'area5',     icon:'🏙️', name:'夢の都市開拓',    desc:'第5区を解放した',    reward:'CPS+20%', check:s=>(s.unlockedAreas||[]).includes(5)},
  {id:'area6',     icon:'🚀', name:'宇宙への夢',      desc:'第6区を解放した',    reward:'CPS+25%', check:s=>(s.unlockedAreas||[]).includes(6)},
  {id:'all_areas', icon:'🗺️', name:'全区制覇',        desc:'全エリアを解放',     reward:'CPS+30%', check:s=>(s.unlockedAreas||[]).length>=6},
  {id:'research_3',    icon:'🔬', name:'研究者',       desc:'3つの研究を完了',    reward:'CPS+5%',  check:s=>Object.keys(s.research||{}).length>=3},
  {id:'research_all',  icon:'🧪', name:'科学の申し子', desc:'全研究を完了',       reward:'CPS+20%', check:s=>Object.keys(s.research||{}).length>=RESEARCH.length},
  {id:'weekend',       icon:'🎉', name:'週末の楽しみ', desc:'週末ボーナス中に遊んだ', reward:'記念称号', check:s=>getWeekendMult()>1&&getTotalLv()>=1},
];

// ゲーム状態
let state = {
  coins:50, totalEarned:0, buildings:{},
  lastTick:Date.now(), lastSaved:null,
  activeEvent:null, eventDiscount:1,
  prestigeCount:0, achievements:{},
  eventCount:0, stormCount:0,
  decorations: {},
  unlockedAreas: [1],
  research: {},
  quests: null,
  skills: {},
  daily: {
    lastClaimDate: null,
    streak: 0,
    totalClaimed: 0,
  },
};
BUILDINGS.forEach(b=>{ state.buildings[b.id]={level:0, msReached:[]}; });
