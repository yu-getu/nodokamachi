// ═══════════════════════════════════════
//  定数・データ定義・ゲーム状態
// ═══════════════════════════════════════
const SAVE_KEY = 'nodokamachi_v6';

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
  { maxLv: 10,  mult: 1.15, name: '開拓期',   colorClass: 'phase-1', dot: 'dot-p1' },
  { maxLv: 25,  mult: 1.15, name: '成長期',   colorClass: 'phase-2', dot: 'dot-p2' },
  { maxLv: 50,  mult: 1.15, name: '円熟期',   colorClass: 'phase-3', dot: 'dot-p3' },
  { maxLv: 100, mult: 1.15, name: 'レジェンド', colorClass: 'phase-4', dot: 'dot-p4' },
  { maxLv: 150, mult: 1.18, name: '転生拡張I',  colorClass: 'phase-4', dot: 'dot-p4' },
  { maxLv: 250, mult: 1.20, name: '転生拡張II', colorClass: 'phase-4', dot: 'dot-p4' },
  { maxLv: 9999,mult: 1.22, name: '転生拡張III',colorClass: 'phase-4', dot: 'dot-p4' },
];

const BASE_MAX_LV   = 100;
const PRESTIGE_LV_BONUS = 20;


// ゲーム内時間定数
const GAME_DAY_REAL_SECS = 600; // 10リアル分 = 1ゲーム日
const GAME_SEASON_DAYS   = 30;  // 30ゲーム日 = 1シーズン

// 建物定義
const BUILDINGS = [
  // ── 第1区「農村」（×4比、ranch=30,720）──
  {id:'field',        name:'畑',               emoji:'🥕', baseCost:30,                baseCps:0.3,           desc:'野菜を育てる小さな畑',      area:1},
  {id:'coop',         name:'鶏小屋',           emoji:'🐓', baseCost:120,               baseCps:1.0,           desc:'卵を産む可愛い鶏たち',      area:1},
  {id:'bakery',       name:'パン屋',           emoji:'🥐', baseCost:480,               baseCps:3.2,           desc:'焼きたてパンの香り',        area:1},
  {id:'farmcoop',     name:'農協',             emoji:'🌾', baseCost:1920,              baseCps:10,            desc:'農家を支える地域組合',      area:1},
  {id:'orchard',      name:'果樹園',           emoji:'🍎', baseCost:7680,              baseCps:30,            desc:'実り豊かな果樹の農園',      area:1},
  {id:'ranch',        name:'牧場',             emoji:'🐄', baseCost:30720,             baseCps:90,            desc:'のどかな草原の牧場',        area:1},
  // ── 第2区「商店街」（×3比、candyshop=40,000 > ranch）──
  {id:'candyshop',    name:'駄菓子屋',         emoji:'🍬', baseCost:40000,             baseCps:39,            desc:'懐かしい甘いお菓子',        area:2},
  {id:'cafe',         name:'喫茶店',           emoji:'☕', baseCost:120000,            baseCps:133,           desc:'ゆったりコーヒータイム',    area:2},
  {id:'greengrocer',  name:'八百屋',           emoji:'🥦', baseCost:360000,            baseCps:444,           desc:'新鮮な野菜が並ぶ',          area:2},
  {id:'inn',          name:'旅館',             emoji:'🏨', baseCost:1080000,           baseCps:1444,          desc:'旅人を温かくもてなす',      area:2},
  {id:'flowershop',   name:'花屋',             emoji:'💐', baseCost:3240000,           baseCps:4667,          desc:'四季折々の花を届ける',      area:2},
  {id:'bookstore',    name:'書店',             emoji:'📖', baseCost:9720000,           baseCps:15556,         desc:'知識と物語が集まる店',      area:2},
  // ── 第3区「文化の丘」（×3比、library=13,000,000 > bookstore）──
  {id:'library',      name:'図書館',           emoji:'📚', baseCost:13000000,          baseCps:6250,          desc:'知識の宝庫',                area:3},
  {id:'artmuseum',    name:'美術館',           emoji:'🎨', baseCost:39000000,          baseCps:22500,         desc:'芸術が集まる場所',          area:3},
  {id:'shrine',       name:'神社',             emoji:'⛩️', baseCost:117000000,         baseCps:75000,         desc:'古くから守られた社',        area:3},
  {id:'theater',      name:'劇場',             emoji:'🎭', baseCost:351000000,         baseCps:250000,        desc:'感動の舞台',                area:3},
  {id:'museum',       name:'博物館',           emoji:'🏛️', baseCost:1053000000,        baseCps:812500,        desc:'歴史と文化の宝庫',          area:3},
  {id:'university',   name:'大学',             emoji:'🎓', baseCost:3159000000,        baseCps:2625000,       desc:'未来を担う知の殿堂',        area:3},
  // ── 第4区「いやしの里」（×3比、herbgarden=4.5B > university）──
  {id:'herbgarden',   name:'薬草園',           emoji:'🌿', baseCost:4500000000,        baseCps:1066667,       desc:'癒やしの香り漂う庭園',      area:4},
  {id:'onsen',        name:'温泉旅館',         emoji:'♨️', baseCost:13500000000,       baseCps:3733333,       desc:'名湯が湧き出す宿',          area:4},
  {id:'spa',          name:'スパ',             emoji:'🧖', baseCost:40500000000,       baseCps:12000000,      desc:'至高の癒やし体験',          area:4},
  {id:'zengarden',    name:'禅の庭',           emoji:'🪨', baseCost:121500000000,      baseCps:40000000,      desc:'静寂の中の悟り',            area:4},
  {id:'naturepark',   name:'自然公園',         emoji:'🌲', baseCost:364500000000,      baseCps:127000000,     desc:'緑あふれる大自然の憩い',    area:4},
  {id:'meditforest',  name:'瞑想の森',         emoji:'🧘', baseCost:1093500000000,     baseCps:400000000,     desc:'深い静寂が心を癒す',        area:4},
  // ── 第5区「夢の都市」（×3比、castle=1.5T > meditforest）──
  {id:'castle',       name:'城',               emoji:'🏯', baseCost:1500000000000,     baseCps:143000000,     desc:'街のシンボルたる大城',      area:5},
  {id:'amusement',    name:'遊園地',           emoji:'🎡', baseCost:4500000000000,     baseCps:500000000,     desc:'夢と笑顔があふれる',        area:5},
  {id:'stadium',      name:'スタジアム',       emoji:'🏟️', baseCost:13500000000000,    baseCps:1714000000,    desc:'熱狂の競技場',              area:5},
  {id:'skyscraper',   name:'摩天楼',           emoji:'🏢', baseCost:40500000000000,    baseCps:5714000000,    desc:'空に届く超高層ビル',        area:5},
  {id:'airport',      name:'国際空港',         emoji:'✈️', baseCost:121500000000000,   baseCps:18600000000,   desc:'世界をつなぐ玄関口',        area:5},
  {id:'megaresort',   name:'メガリゾート',     emoji:'🌴', baseCost:364500000000000,   baseCps:60000000000,   desc:'夢のような超大型複合施設',  area:5},
  // ── 第6区「宇宙の夢」（×3比、rocket=500T > megaresort）──
  {id:'rocket',       name:'宇宙基地',         emoji:'🚀', baseCost:500000000000000,   baseCps:23000000000,   desc:'宇宙へ飛び立つ拠点',        area:6},
  {id:'spaceport',    name:'宇宙港',           emoji:'🛸', baseCost:1500000000000000,  baseCps:85000000000,   desc:'銀河をつなぐ港',            area:6},
  {id:'colony',       name:'スペースコロニー', emoji:'🌌', baseCost:4500000000000000,  baseCps:308000000000,  desc:'宇宙に浮かぶ楽園',          area:6},
  {id:'dysonring',    name:'ダイソンリング',   emoji:'💫', baseCost:1.35e16,          baseCps:1000000000000, desc:'恒星のエネルギーを収穫',    area:6},
  {id:'galaxystation',name:'銀河ステーション', emoji:'🌠', baseCost:4.05e16,          baseCps:3230000000000, desc:'銀河の交差点',              area:6},
  {id:'spaceciv',     name:'宇宙文明',         emoji:'🌍', baseCost:1.215e17,         baseCps:10500000000000,desc:'宇宙に広がる新文明',        area:6},
  // ── 第7区「深海都市」（×3比、aquarium=1.8e17 > spaceciv）──
  {id:'aquarium',     name:'水族館',           emoji:'🐠', baseCost:1.8e17,           baseCps:1e13,          desc:'幻想的な深海の生き物たち',  area:7},
  {id:'deepseasub',   name:'深海調査船',       emoji:'🦈', baseCost:5.4e17,           baseCps:3.5e13,        desc:'未知の深海を調査する船',    area:7},
  {id:'seabase',      name:'海底基地',         emoji:'🐙', baseCost:1.62e18,          baseCps:1.2e14,        desc:'深海に建設された研究拠点',  area:7},
  {id:'tidalpower',   name:'潮力発電所',       emoji:'🌊', baseCost:4.86e18,          baseCps:4e14,          desc:'海の力でエネルギーを生む',  area:7},
  {id:'oceancity',    name:'海洋都市',         emoji:'🐋', baseCost:1.458e19,         baseCps:1.3e15,        desc:'海に浮かぶ巨大都市',        area:7},
  {id:'deepkingdom',  name:'深海王国',         emoji:'🔱', baseCost:4.374e19,         baseCps:4.2e15,        desc:'深海を支配する神秘の王国',  area:7},
  // ── 第8区「異次元世界」（×3比、magicircle=6e19 > deepkingdom）──
  {id:'magicircle',   name:'魔法陣',           emoji:'🪄', baseCost:6e19,             baseCps:4.5e15,        desc:'異次元への扉を開く紋様',    area:8},
  {id:'dimgate',      name:'次元の扉',         emoji:'🌀', baseCost:1.8e20,           baseCps:1.5e16,        desc:'異世界をつなぐ神秘の門',    area:8},
  {id:'otherworld',   name:'異界の塔',         emoji:'🗼', baseCost:5.4e20,           baseCps:5e16,          desc:'異次元エネルギーを集める塔',area:8},
  {id:'illpalace',    name:'幻月の宮殿',       emoji:'🌙', baseCost:1.62e21,          baseCps:1.65e17,       desc:'夢と現実の狭間に浮かぶ宮殿',area:8},
  {id:'eyeofall',     name:'万象の眼',         emoji:'👁️', baseCost:4.86e21,          baseCps:5.5e17,        desc:'あらゆる次元を見通す巨大な眼',area:8},
  {id:'dimempire',    name:'異次元帝国',       emoji:'💎', baseCost:1.458e22,         baseCps:1.8e18,        desc:'無数の次元を統べる帝国',    area:8},
];

// エリア定義
// 解放コスト = 当エリア最後の2棟付近で解放できるよう設計（前区6棟目の約1.5倍）
const AREAS = [
  {id:1, name:'第1区', emoji:'🌾', unlockCost:0,        desc:'のどかな農村エリア'},
  {id:2, name:'第2区', emoji:'🏪', unlockCost:100000,   desc:'にぎやかな商店街エリア'},
  {id:3, name:'第3区', emoji:'📚', unlockCost:34000000, desc:'文化の丘エリア'},
  {id:4, name:'第4区', emoji:'🌿', unlockCost:1.1e10,   desc:'いやしの里エリア'},
  {id:5, name:'第5区', emoji:'🏙️', unlockCost:3.8e12,   desc:'夢の都市エリア'},
  {id:6, name:'第6区', emoji:'🚀', unlockCost:1.28e15,  desc:'宇宙の夢エリア'},
  {id:7, name:'第7区', emoji:'🌊', unlockCost:4.3e17,   desc:'深海都市エリア'},
  {id:8, name:'第8区', emoji:'🔮', unlockCost:1.5e20,   desc:'異次元世界エリア'},
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
  {id:'deepsea',   name:'深海開拓',     emoji:'🌊', cost:1.5e19,             desc:'深海エリア全建物のCPS ×2',      targets:['aquarium','deepseasub','seabase','tidalpower','oceancity','deepkingdom'],        mult:2},
  {id:'dimension', name:'異次元探索',   emoji:'🔮', cost:5e20,               desc:'異次元エリア全建物のCPS ×2',    targets:['magicircle','dimgate','otherworld','illpalace','eyeofall','dimempire'],           mult:2},
];

// 世代スキルツリー定義（転生専用・永続）
const PRESTIGE_SKILLS = [
  // Tier 1（各1PSP・前提なし）
  {id:'legacy_memory',  name:'遺産の記憶', emoji:'📜', cost:1, tier:1, requires:[],                            effect:'offline_mult',      value:0.15, desc:'オフライン効率 +15%'},
  {id:'ancestor_grace', name:'先祖の加護', emoji:'🙏', cost:1, tier:1, requires:[],                            effect:'prestige_sp_bonus', value:1,    desc:'転生ごとに通常SP +1'},
  // Tier 2（各2PSP）
  {id:'gen_bond',       name:'世代の絆',   emoji:'🔗', cost:2, tier:2, requires:['legacy_memory'],             effect:'cps_perm',          value:0.20, desc:'全CPS +20% 永続'},
  {id:'history_mark',   name:'歴史の刻印', emoji:'⚖️', cost:2, tier:2, requires:['ancestor_grace'],            effect:'cps_perm',          value:0.25, desc:'全CPS +25% 永続'},
  // Tier 3（各3PSP）
  {id:'legend_grace',   name:'伝説の加護', emoji:'⭐', cost:3, tier:3, requires:['gen_bond'],                  effect:'prestige_cps_rate', value:0.2,  desc:'転生ごとのCPS増加率 +0.2'},
  {id:'gods_will',      name:'神々の意志', emoji:'🌟', cost:3, tier:3, requires:['history_mark'],              effect:'cost_perm',         value:0.15, desc:'全建物コスト -15% 永続'},
  // Tier 4（4PSP）
  {id:'genesis_power',  name:'創世の力',   emoji:'🌌', cost:4, tier:4, requires:['legend_grace','gods_will'], effect:'cps_perm',          value:0.50, desc:'全CPS +50% 永続'},
];
const PRESTIGE_SKILL_POS = {
  legacy_memory:  { x: 0.25, tier: 1 },
  ancestor_grace: { x: 0.75, tier: 1 },
  gen_bond:       { x: 0.25, tier: 2 },
  history_mark:   { x: 0.75, tier: 2 },
  legend_grace:   { x: 0.25, tier: 3 },
  gods_will:      { x: 0.75, tier: 3 },
  genesis_power:  { x: 0.50, tier: 4 },
};

// スキルツリー定義
const SKILLS = [
  // Tier 1（前提なし・1SP）
  {id:'farm_mastery',   name:'大地の恵み',   emoji:'🥕', cost:1, tier:1, requires:[], effect:'cps_area1',     value:0.30, desc:'農村エリア全建物のCPS +30%'},
  {id:'commerce_art',   name:'商いの才',     emoji:'🏪', cost:1, tier:1, requires:[], effect:'cps_area2',     value:0.30, desc:'商店街エリア全建物のCPS +30%'},
  {id:'quick_hands',    name:'素早い手',     emoji:'🪙', cost:1, tier:1, requires:[], effect:'click_sec',     value:4,    desc:'ひと稼ぎ +4秒分（合計6秒）'},
  // Tier 2（2SP）
  {id:'master_hands',   name:'名人の手さばき', emoji:'⚡', cost:2, tier:2, requires:['quick_hands'],            effect:'click_sec',     value:4,    desc:'ひと稼ぎ +4秒分（合計10秒）'},
  {id:'beauty_power',   name:'美の力',       emoji:'🌺', cost:2, tier:2, requires:['farm_mastery'],           effect:'beauty_mult',   value:0.5,  desc:'美観ボーナス ×1.5'},
  {id:'culture_bloom',  name:'文化の花開き', emoji:'📚', cost:2, tier:2, requires:['commerce_art'],           effect:'cps_area3',     value:0.40, desc:'文化エリア全建物のCPS +40%'},
  {id:'thrift',         name:'節約の極意',   emoji:'✂️', cost:2, tier:2, requires:['quick_hands'],            effect:'cost_down',     value:0.15, desc:'全建物のコスト -15%'},
  {id:'farm_market',    name:'農商連携',     emoji:'🤝', cost:2, tier:2, requires:['farm_mastery','commerce_art'], effect:'cps_synergy', areas:[1,2], value:0.25, desc:'農村・商店街エリアが互いに+25%（両区解放時）'},
  // Tier 3（2SP）
  {id:'healing_spirit', name:'癒やしの精神', emoji:'🌿', cost:2, tier:3, requires:['beauty_power'],           effect:'cps_area4',     value:0.50, desc:'癒やしエリア全建物のCPS +50%'},
  {id:'city_dream',     name:'都市の夢',     emoji:'🏙️', cost:2, tier:3, requires:['culture_bloom'],          effect:'cps_area5',     value:0.50, desc:'娯楽エリア全建物のCPS +50%'},
  {id:'research_gift',  name:'研究の才能',   emoji:'🔬', cost:2, tier:3, requires:['thrift'],                 effect:'research_cost', value:0.25, desc:'研究コスト -25%'},
  {id:'culture_healing',name:'文癒融合',     emoji:'🌿', cost:3, tier:3, requires:['farm_market'],            effect:'cps_synergy', areas:[3,4], value:0.30, desc:'文化・癒やしエリアが互いに+30%（両区解放時）'},
  // Tier 4（3SP）
  {id:'town_vitality',  name:'街の活気',     emoji:'✨', cost:3, tier:4, requires:['healing_spirit','city_dream'], effect:'cps_all',  value:0.30, desc:'全建物のCPS +30%'},
  {id:'space_ambition', name:'宇宙への野望', emoji:'🚀', cost:3, tier:4, requires:['research_gift'],              effect:'cps_area6', value:0.80, desc:'宇宙エリア全建物のCPS +80%'},
  {id:'city_space',     name:'都宙連帯',     emoji:'🌌', cost:3, tier:4, requires:['culture_healing'],            effect:'cps_synergy', areas:[5,6], value:0.35, desc:'都市・宇宙エリアが互いに+35%（両区解放時）'},
  // Tier 5（3SP / 4SP）
  {id:'miracle_town',   name:'奇跡の街',     emoji:'🌟', cost:3, tier:5, requires:['town_vitality','space_ambition'], effect:'cps_all', value:0.50, desc:'全建物のCPS +50%'},
  {id:'deep_sea_power', name:'深海の覇権',   emoji:'🌊', cost:3, tier:5, requires:['space_ambition'],         effect:'cps_area7',   value:0.60, desc:'深海エリア全建物のCPS +60%'},
  {id:'all_harmony',    name:'全区調和',     emoji:'🌐', cost:4, tier:5, requires:['city_space'],              effect:'cps_synergy', areas:[1,2,3,4,5,6,7,8], value:0.20, desc:'全エリアが互いに+20%（全区解放時）'},
  // Tier 6（3SP / 4SP）
  {id:'achiev_eye',     name:'実績の目',     emoji:'👁️', cost:3, tier:6, requires:['miracle_town'],           effect:'achiev_cps',  value:0.02, desc:'実績1件ごとに全CPS +2%'},
  {id:'dim_mastery',    name:'異次元の理',   emoji:'🔮', cost:3, tier:6, requires:['deep_sea_power'],         effect:'cps_area8',   value:0.70, desc:'異次元エリア全建物のCPS +70%'},
  {id:'galaxy_civ',     name:'銀河文明',     emoji:'🌌', cost:4, tier:6, requires:['achiev_eye'],             effect:'cps_mult',    value:1.0,  desc:'全建物のCPS ×2'},
];

const EVENTS = [
  {id:'sunny',    type:'great',icon:'☀️', title:'晴天ボーナス！',        desc:'90秒間コイン収入2倍！',           mult:2,   dur:90},
  {id:'harvest',  type:'good', icon:'🌟', title:'大繁盛の季節！',        desc:'45秒分のコインをまとめて獲得！',  bonus:'cps', bonusSec:45, dur:0},
  {id:'traveler', type:'good', icon:'🧳', title:'旅人が訪れた！',        desc:'1分分のコインを落としていった！', bonus:'cps', bonusSec:60, dur:0},
  {id:'festival', type:'great',icon:'🎆', title:'お祭り開催！',          desc:'3分間コイン収入1.5倍！',          mult:1.5, dur:180},
  {id:'storm',    type:'bad',  icon:'⛈️', title:'嵐が来た…',            desc:'30秒間コイン収入が半減する。',    mult:.5,  dur:30},
  {id:'drought',  type:'bad',  icon:'🏜️', title:'干ばつ発生…',          desc:'45秒間収入が0.7倍になる。',       mult:.7,  dur:45},
  {id:'merchant', type:'info', icon:'🛒', title:'行商人が来た！',        desc:'次の購入が20%引きに！',           discount:.8, dur:60},
  {id:'rain',     type:'good', icon:'🌧️', title:'恵みの雨',              desc:'60秒間収入1.3倍！',               mult:1.3, dur:60},
  {id:'rainbow',  type:'great',icon:'🌈', title:'虹の恵み！',            desc:'30秒間コイン収入3倍！',           mult:3,   dur:30},
  {id:'clover',   type:'great',icon:'🍀', title:'四つ葉のクローバー！', desc:'90秒分のコインをまとめて獲得！',  bonus:'cps', bonusSec:90, dur:0},
  {id:'lightning',type:'bad',  icon:'⚡', title:'落雷発生！',            desc:'10秒間ほぼ収入が止まる！',        mult:.1,  dur:10},
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

// effect.type: 'area_cps'|'building_cps'|'all_cps'|'collect'|'event_bonus'
const DECORATIONS = [
  // ── 農村シナジー ──
  { id:'flower',      name:'花壇',             emoji:'🌺', cost:500,              beautyPts:2,  desc:'色とりどりの花が農村を彩る',     effect:{type:'area_cps',     area:1,                              value:0.10}, effectDesc:'農村エリア CPS +10%' },
  { id:'windmill',    name:'風車',             emoji:'🌬️', cost:3000,             beautyPts:4,  desc:'のどかな農村に映える風車',       effect:{type:'area_cps',     area:1,                              value:0.20}, effectDesc:'農村エリア CPS +20%' },
  // ── 商店街シナジー ──
  { id:'fountain',    name:'噴水',             emoji:'⛲', cost:2000,             beautyPts:3,  desc:'涼しげな噴水が人を呼ぶ',         effect:{type:'area_cps',     area:2,                              value:0.10}, effectDesc:'商店街エリア CPS +10%' },
  { id:'market',      name:'朝市広場',         emoji:'🏪', cost:12000,            beautyPts:6,  desc:'にぎわう朝市が商いを盛んに',     effect:{type:'area_cps',     area:2,                              value:0.20}, effectDesc:'商店街エリア CPS +20%' },
  // ── 文化の丘シナジー ──
  { id:'lantern',     name:'灯籠',             emoji:'🏮', cost:1500,             beautyPts:3,  desc:'和風の灯りが社を照らす',         effect:{type:'building_cps', targets:['shrine'],                  value:0.30}, effectDesc:'神社 CPS +30%' },
  { id:'statue',      name:'銅像',             emoji:'🗿', cost:8000,             beautyPts:6,  desc:'街のシンボルが文化を育む',       effect:{type:'area_cps',     area:3,                              value:0.15}, effectDesc:'文化エリア CPS +15%' },
  { id:'shrinegate',  name:'鳥居',             emoji:'⛩️', cost:50000,            beautyPts:10, desc:'神聖な鳥居が場を清める',         effect:{type:'area_cps',     area:3,                              value:0.25}, effectDesc:'文化エリア CPS +25%' },
  // ── いやしの里シナジー ──
  { id:'park',        name:'公園',             emoji:'🌳', cost:5000,             beautyPts:5,  desc:'緑あふれる憩いの場所',           effect:{type:'area_cps',     area:4,                              value:0.15}, effectDesc:'癒やしエリア CPS +15%' },
  { id:'beachresort', name:'ビーチリゾート',   emoji:'⛱️', cost:1000000,          beautyPts:20, desc:'海辺の癒やしスポット',           effect:{type:'area_cps',     area:4,                              value:0.25}, effectDesc:'癒やしエリア CPS +25%' },
  { id:'japangarden', name:'日本庭園',         emoji:'🪷', cost:5000000,          beautyPts:30, desc:'静謐な和の庭が心を癒す',         effect:{type:'area_cps',     area:4,                              value:0.35}, effectDesc:'癒やしエリア CPS +35%' },
  // ── 夢の都市シナジー ──
  { id:'lighthouse',  name:'灯台',             emoji:'🗼', cost:15000,            beautyPts:8,  desc:'高くそびえ旅人を呼び込む',       effect:{type:'building_cps', targets:['inn','skyscraper'],        value:0.20}, effectDesc:'旅館・摩天楼 CPS +20%' },
  { id:'bandstand',   name:'音楽堂',           emoji:'🎵', cost:30000,            beautyPts:12, desc:'音楽が響き娯楽を盛り上げる',     effect:{type:'building_cps', targets:['theater','amusement'],     value:0.25}, effectDesc:'劇場・遊園地 CPS +25%' },
  { id:'observatory', name:'展望台',           emoji:'🔭', cost:80000,            beautyPts:16, desc:'街を一望する高台',               effect:{type:'area_cps',     area:5,                              value:0.20}, effectDesc:'娯楽エリア CPS +20%' },
  // ── 宇宙の夢シナジー ──
  { id:'telescope',   name:'大型望遠鏡',       emoji:'🌌', cost:5000000000,       beautyPts:35, desc:'宇宙の神秘を覗く大望遠鏡',       effect:{type:'area_cps',     area:6,                              value:0.25}, effectDesc:'宇宙エリア CPS +25%' },
  { id:'spacelift',   name:'宇宙エレベーター', emoji:'🛗', cost:2000000000000,    beautyPts:50, desc:'宇宙へ続く架け橋',               effect:{type:'area_cps',     area:6,                              value:0.40}, effectDesc:'宇宙エリア CPS +40%' },
  // ── 全体効果 ──
  { id:'cherrytree',  name:'桜並木',           emoji:'🌸', cost:20000,            beautyPts:10, desc:'春風に舞う花びらが元気をくれる', effect:{type:'collect',                                           value:1.0},  effectDesc:'手動収穫ボーナス ×2' },
  { id:'fireworks',   name:'花火台',           emoji:'🎆', cost:250000,           beautyPts:15, desc:'夜空を彩る花火がイベントを盛大に',effect:{type:'event_bonus',                                      value:0.50}, effectDesc:'イベント効果 +50%' },
  { id:'solarpanel',  name:'太陽光パネル',     emoji:'☀️', cost:500000,           beautyPts:8,  desc:'再生エネルギーで街全体を底上げ', effect:{type:'all_cps',                                           value:0.05}, effectDesc:'全建物 CPS +5%' },
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
  {id:'lv50',          icon:'🌳', name:'Lv50到達',         desc:'いずれかの建物がLv50に',    reward:'称号',       check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=50)},
  {id:'lv100',         icon:'🏆', name:'Lv100マスター',    desc:'いずれかの建物がLv100に',   reward:'称号',       check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=100)},
  {id:'coins_10k',     icon:'💎', name:'万金持ち',         desc:'累計コイン1万枚を達成',     reward:'称号',       check:s=>s.totalEarned>=10000},
  {id:'coins_100k',    icon:'👑', name:'百万長者への道',   desc:'累計コイン10万枚を達成',    reward:'称号',       check:s=>s.totalEarned>=100000},
  {id:'all_buildings', icon:'🌆', name:'まちの設計士',     desc:'全建物を最低1つ建設',       reward:'称号',       check:s=>BUILDINGS.every(b=>s.buildings[b.id]?.level>=1)},
  {id:'total_lv_500',  icon:'🔗', name:'街の成長',         desc:'全建物の合計Lvが500に到達', reward:'称号',       check:_s=>getTotalLv()>=500},
  {id:'prestige_1',    icon:'⭐', name:'転生者',           desc:'初めてプレステージ転生',    reward:'称号',       check:s=>s.prestigeCount>=1},
  {id:'prestige_3',    icon:'🌟', name:'三度の転生',       desc:'3回プレステージ転生',       reward:'称号',       check:s=>s.prestigeCount>=3},
  {id:'lv125',         icon:'💫', name:'転生の恩恵',       desc:'転生後の建物がLv125に',     reward:'称号',       check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=125)},
  {id:'area2',     icon:'🏪', name:'商店街開拓',      desc:'第2区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(2)},
  {id:'area3',     icon:'📚', name:'文化の丘開拓',    desc:'第3区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(3)},
  {id:'area4',     icon:'🌿', name:'いやしの里開拓',  desc:'第4区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(4)},
  {id:'area5',     icon:'🏙️', name:'夢の都市開拓',    desc:'第5区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(5)},
  {id:'area6',     icon:'🚀', name:'宇宙への夢',      desc:'第6区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(6)},
  {id:'area7',     icon:'🌊', name:'深海への潜行',    desc:'第7区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(7)},
  {id:'area8',     icon:'🔮', name:'異次元の扉',      desc:'第8区を解放した',    reward:'称号',    check:s=>(s.unlockedAreas||[]).includes(8)},
  {id:'all_areas', icon:'🗺️', name:'全区制覇',        desc:'全エリアを解放',     reward:'称号',    check:s=>(s.unlockedAreas||[]).length>=8},
  {id:'research_3',    icon:'🔬', name:'研究者',       desc:'3つの研究を完了',    reward:'称号',    check:s=>Object.keys(s.research||{}).length>=3},
  {id:'research_all',  icon:'🧪', name:'科学の申し子', desc:'全研究を完了',       reward:'称号',    check:s=>Object.keys(s.research||{}).length>=RESEARCH.length},
  {id:'weekend',       icon:'🎉', name:'週末の楽しみ', desc:'週末ボーナス中に遊んだ', reward:'記念称号', check:s=>getWeekendMult()>1&&getTotalLv()>=1},
  // CPS
  {id:'cps_1',         icon:'⏱️', name:'コイン生産開始',   desc:'CPS 1/秒を達成',          reward:'称号', check:s=>(s.maxCps||0)>=1},
  {id:'cps_100',       icon:'⚡', name:'高速生産',          desc:'CPS 100/秒を達成',        reward:'称号', check:s=>(s.maxCps||0)>=100},
  {id:'cps_10k',       icon:'🌊', name:'怒涛の生産力',      desc:'CPS 1万/秒を達成',        reward:'称号', check:s=>(s.maxCps||0)>=10000},
  {id:'cps_1m',        icon:'🌌', name:'宇宙的生産速度',    desc:'CPS 100万/秒を達成',      reward:'称号', check:s=>(s.maxCps||0)>=1000000},
  // コイン
  {id:'coins_1m',      icon:'💰', name:'百万長者',          desc:'累計100万コインを達成',   reward:'称号', check:s=>s.totalEarned>=1000000},
  {id:'coins_1b',      icon:'🏦', name:'億万長者',          desc:'累計10億コインを達成',    reward:'称号', check:s=>s.totalEarned>=1000000000},
  {id:'coins_1t',      icon:'💎', name:'兆を超えた者',      desc:'累計1兆コインを達成',     reward:'称号', check:s=>s.totalEarned>=1000000000000},
  // 総レベル
  {id:'total_lv_100',  icon:'🏘️', name:'成長する街',        desc:'建物の総Lvが100に到達',   reward:'称号', check:_s=>getTotalLv()>=100},
  {id:'total_lv_1000', icon:'🌆', name:'大都市',            desc:'建物の総Lvが1000に到達',  reward:'称号', check:_s=>getTotalLv()>=1000},
  // クエスト
  {id:'quest_10',      icon:'🎯', name:'クエスト達成者',    desc:'クエストを10件完了',      reward:'称号', check:s=>(s.quests?.completedTotal||0)>=10},
  {id:'quest_50',      icon:'🎖️', name:'クエストマスター',  desc:'クエストを50件完了',      reward:'称号', check:s=>(s.quests?.completedTotal||0)>=50},
  // イベント
  {id:'events_10',     icon:'🎪', name:'イベント好き',      desc:'イベントを10回経験',      reward:'称号', check:s=>(s.eventCount||0)>=10},
  {id:'events_50',     icon:'🎆', name:'イベント常連',      desc:'イベントを50回経験',      reward:'称号', check:s=>(s.eventCount||0)>=50},
  // 転生
  {id:'prestige_5',    icon:'💫', name:'五世代目',          desc:'5回プレステージ転生',     reward:'称号', check:s=>s.prestigeCount>=5},
  {id:'prestige_10',   icon:'🌠', name:'十世代の末裔',      desc:'10回プレステージ転生',    reward:'称号', check:s=>s.prestigeCount>=10},
  // ひと稼ぎ
  {id:'harvest_100',   icon:'👆', name:'ひと稼ぎ職人',      desc:'ひと稼ぎを100回した',     reward:'称号', check:s=>(s.totalHarvestCount||0)>=100},
  {id:'harvest_1000',  icon:'💪', name:'ひと稼ぎの達人',    desc:'ひと稼ぎを1000回した',    reward:'称号', check:s=>(s.totalHarvestCount||0)>=1000},
  // プレイ時間
  {id:'playtime_1h',   icon:'⏰', name:'1時間プレイヤー',   desc:'累計1時間プレイした',     reward:'称号', check:s=>(s.totalPlaySecs||0)>=3600},
  {id:'playtime_10h',  icon:'🕰️', name:'10時間プレイヤー',  desc:'累計10時間プレイした',    reward:'称号', check:s=>(s.totalPlaySecs||0)>=36000},
  // スキル
  {id:'skill_5',       icon:'🌟', name:'スキル磨き',        desc:'スキルを5個習得した',     reward:'称号', check:s=>Object.keys(s.skills||{}).length>=5},
  // 隠し実績
  {id:'storm_harvest', icon:'⚡', name:'嵐チェイサー',    desc:'嵐の中でひと稼ぎした',              reward:'称号', hidden:true, check:s=>s.stormHarvested},
  {id:'save_maniac',   icon:'💾', name:'過保護セーバー',  desc:'手動保存ボタンを20回押した',         reward:'称号', hidden:true, check:s=>(s.manualSaveCount||0)>=20},
  {id:'dj_farmer',     icon:'🎵', name:'DJ農家',          desc:'BGMを10回切り替えた',                reward:'称号', hidden:true, check:s=>(s.bgmToggleCount||0)>=10},
  {id:'night_farmer',  icon:'🌙', name:'夜型農家',        desc:'深夜0〜4時にプレイした',             reward:'称号', hidden:true, check:s=>s.nightPlayed},
  {id:'lv1_collector', icon:'🏗️', name:'一期一会',        desc:'全建物をちょうどLv1にした',          reward:'称号', hidden:true, check:s=>BUILDINGS.every(b=>(s.buildings[b.id]?.level||0)===1)},
  {id:'rapid_harvest', icon:'⚡', name:'落ち着きのない人', desc:'30秒以内にひと稼ぎを100回押した',    reward:'称号', hidden:true, check:s=>s.rapidHarvested},
  {id:'silent_town',   icon:'🗑️', name:'消えた音',        desc:'BGMとSFXを両方オフにして5分プレイした', reward:'称号', hidden:true, check:s=>(s.silentMinutes||0)>=5},
  {id:'idle_start',    icon:'🏚️', name:'廃村の夢',        desc:'何も建てないまま1分間放置した',      reward:'称号', hidden:true, check:s=>s.idledAtStart},
  {id:'buy_discount',  icon:'🛒', name:'お買い得ハンター', desc:'行商人の値引き中に建物を購入した',    reward:'称号', hidden:true, check:s=>s.boughtDuringDiscount},
  {id:'went_broke',    icon:'💸', name:'一文無し',         desc:'所持コインが一桁まで減った',          reward:'称号', hidden:true, check:s=>s.wentBroke},
  {id:'event_stack_3', icon:'🌀', name:'嵐の目の中で',     desc:'3種類のイベントを同時に重ねた',       reward:'称号', hidden:true, check:s=>s.eventStack3},
  {id:'winter_prestige',icon:'❄️',name:'冬の決断',         desc:'冬の季節にプレステージ転生した',      reward:'称号', hidden:true, check:s=>s.prestigeInWinter},
];

// ゲーム状態
let state = {
  coins:50, totalEarned:0, buildings:{},
  lastTick:Date.now(), lastSaved:null,
  activeEvents:[], eventDiscount:1,
  prestigeCount:0, achievements:{},
  eventCount:0, stormCount:0,
  decorations: {},
  unlockedAreas: [1],
  research: {},
  quests: null,
  skills: {},
  prestigeSkills: {},
  prestigeSp: 0,
  daily: {
    lastClaimDate: null,
    streak: 0,
    totalClaimed: 0,
  },
  manualSaveCount: 0,
  bgmToggleCount: 0,
  stormHarvested: false,
  nightPlayed: false,
  rapidHarvested: false,
  silentMinutes: 0,
  idledAtStart: false,
  boughtDuringDiscount: false,
  wentBroke: false,
  eventStack3: false,
  prestigeInWinter: false,
  // ゲーム内時間（0=春の1日目 朝8時スタート）
  gameDay: 0,
  gameDayProgress: 8 / 24,
  // 統計
  totalHarvestCount: 0,
  totalSpent: 0,
  totalPlaySecs: 0,
  maxCps: 0,
  maxCoins: 0,
  firstPlayedAt: Date.now(),
};
BUILDINGS.forEach(b=>{ state.buildings[b.id]={level:0}; });

// ── ユーティリティ関数 ──
function getMaxLevel() {
  return BASE_MAX_LV + state.prestigeCount * PRESTIGE_LV_BONUS;
}
