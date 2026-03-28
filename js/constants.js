// ═══════════════════════════════════════
//  定数・データ定義（全ゲームデータ）
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
  { maxLv: 25,  mult: 1.40, name: '開拓期',   colorClass: 'phase-1', dot: 'dot-p1' },
  { maxLv: 50,  mult: 1.20, name: '成長期',   colorClass: 'phase-2', dot: 'dot-p2' },
  { maxLv: 100,  mult: 1.15, name: '円熟期',   colorClass: 'phase-3', dot: 'dot-p3' },
  { maxLv: 200, mult: 1.12, name: 'レジェンド', colorClass: 'phase-4', dot: 'dot-p4' },
  { maxLv: 500, mult: 1.10, name: '転生拡張I',  colorClass: 'phase-4', dot: 'dot-p4' },
  { maxLv: 1000, mult: 1.10, name: '転生拡張II', colorClass: 'phase-4', dot: 'dot-p4' },
  { maxLv: 9999,mult: 1.05, name: '転生拡張III',colorClass: 'phase-4', dot: 'dot-p4' },
];

const BASE_MAX_LV   = 100;
const PRESTIGE_LV_BONUS = 20;

// ゲーム内時間定数
const GAME_DAY_REAL_SECS = 600; // 10リアル分 = 1ゲーム日
const GAME_SEASON_DAYS   = 30;  // 30ゲーム日 = 1シーズン

// 建物定義
const BUILDINGS = [
  // ── 第1区「農村」（×4比、ranch=46,080）──
  {id:'field',        name:'畑',               emoji:'🥕', baseCost:45,                baseCps:0.3,           desc:'野菜を育てる小さな畑',      area:1},
  {id:'coop',         name:'鶏小屋',           emoji:'🐓', baseCost:180,               baseCps:1.0,           desc:'卵を産む可愛い鶏たち',      area:1},
  {id:'bakery',       name:'パン屋',           emoji:'🥐', baseCost:720,               baseCps:3.2,           desc:'焼きたてパンの香り',        area:1},
  {id:'farmcoop',     name:'農協',             emoji:'🌾', baseCost:2880,              baseCps:10,            desc:'農家を支える地域組合',      area:1},
  {id:'orchard',      name:'果樹園',           emoji:'🍎', baseCost:11520,             baseCps:30,            desc:'実り豊かな果樹の農園',      area:1},
  {id:'ranch',        name:'牧場',             emoji:'🐄', baseCost:46080,             baseCps:60,            desc:'のどかな草原の牧場',        area:1},
  // ── 第2区「商店街」（×3比、candyshop=80,000 > ranch）──
  {id:'candyshop',    name:'駄菓子屋',         emoji:'🍬', baseCost:80000,             baseCps:39,            desc:'懐かしい甘いお菓子',        area:2},
  {id:'cafe',         name:'喫茶店',           emoji:'☕', baseCost:240000,            baseCps:133,           desc:'ゆったりコーヒータイム',    area:2},
  {id:'greengrocer',  name:'八百屋',           emoji:'🥦', baseCost:720000,            baseCps:444,           desc:'新鮮な野菜が並ぶ',          area:2},
  {id:'inn',          name:'旅館',             emoji:'🏨', baseCost:2160000,           baseCps:1444,          desc:'旅人を温かくもてなす',      area:2},
  {id:'flowershop',   name:'花屋',             emoji:'💐', baseCost:6480000,           baseCps:4667,          desc:'四季折々の花を届ける',      area:2},
  {id:'bookstore',    name:'書店',             emoji:'📖', baseCost:19440000,          baseCps:15556,         desc:'知識と物語が集まる店',      area:2},
  // ── 第3区「文化の丘」（×3比、library=39,000,000 > bookstore）──
  {id:'library',      name:'図書館',           emoji:'📚', baseCost:39000000,          baseCps:6250,          desc:'知識の宝庫',                area:3},
  {id:'artmuseum',    name:'美術館',           emoji:'🎨', baseCost:117000000,         baseCps:22500,         desc:'芸術が集まる場所',          area:3},
  {id:'shrine',       name:'神社',             emoji:'⛩️', baseCost:351000000,         baseCps:75000,         desc:'古くから守られた社',        area:3},
  {id:'theater',      name:'劇場',             emoji:'🎭', baseCost:1053000000,        baseCps:250000,        desc:'感動の舞台',                area:3},
  {id:'museum',       name:'博物館',           emoji:'🏛️', baseCost:3159000000,        baseCps:812500,        desc:'歴史と文化の宝庫',          area:3},
  {id:'university',   name:'大学',             emoji:'🎓', baseCost:9477000000,        baseCps:2625000,       desc:'未来を担う知の殿堂',        area:3},
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
  {id:2, name:'第2区', emoji:'🏪', unlockCost:200000,   desc:'にぎやかな商店街エリア'},
  {id:3, name:'第3区', emoji:'📚', unlockCost:100000000, desc:'文化の丘エリア'},
  {id:4, name:'第4区', emoji:'🌿', unlockCost:3.5e10,   desc:'いやしの里エリア'},
  {id:5, name:'第5区', emoji:'🏙️', unlockCost:3.8e12,   desc:'夢の都市エリア'},
  {id:6, name:'第6区', emoji:'🚀', unlockCost:1.28e15,  desc:'宇宙の夢エリア'},
  {id:7, name:'第7区', emoji:'🌊', unlockCost:4.3e17,   desc:'深海都市エリア'},
  {id:8, name:'第8区', emoji:'🔮', unlockCost:1.5e20,   desc:'異次元世界エリア'},
];

// 研究定義
// 施設別研究ティア定義
const RESEARCH_TIERS = [
  { tier: 1, mult: 1.20, costMult: 150,     label: '基礎研究', emoji: '🔬' },
  { tier: 2, mult: 1.25, costMult: 1500,    label: '応用研究', emoji: '⚗️' },
  { tier: 3, mult: 1.30, costMult: 15000,   label: '高等研究', emoji: '🧬' },
  { tier: 4, mult: 2.00, costMult: 150000,  label: '地域振興', emoji: '🏗️', advancedOnly: true },
  { tier: 5, mult: 5.00, costMult: 1500000, label: '街の誇り', emoji: '🏅', advancedOnly: true },
];

// 世代スキルツリー定義（3列×8段）
const PRESTIGE_SKILLS = [
  // ── 左列：CPS永続強化 ──
  {id:'legacy_memory',  name:'遺産の記憶', emoji:'📜', cost:1, tier:1, requires:[],               effect:'offline_mult',      value:0.15, desc:'オフライン効率 +15%'},
  {id:'gen_bond',       name:'世代の絆',   emoji:'🔗', cost:2, tier:2, requires:['legacy_memory'],effect:'cps_perm',          value:0.20, desc:'全CPS +20% 永続'},
  {id:'history_mark',   name:'歴史の刻印', emoji:'⚖️', cost:2, tier:3, requires:['gen_bond'],     effect:'cps_perm',          value:0.25, desc:'全CPS +25% 永続'},
  {id:'legend_grace',   name:'伝説の加護', emoji:'⭐', cost:3, tier:4, requires:['history_mark'], effect:'prestige_cps_rate', value:0.2,  desc:'転生ごとのCPS増加率 +0.2'},
  {id:'genesis_power',  name:'創世の力',   emoji:'🌌', cost:4, tier:5, requires:['legend_grace'],  effect:'cps_perm',          value:0.50, desc:'全CPS +50% 永続'},
  {id:'eternal_bond',   name:'永遠の絆',   emoji:'💫', cost:5, tier:6, requires:['genesis_power'], effect:'cps_perm',          value:0.75, desc:'全CPS +75% 永続'},
  {id:'world_soul',     name:'世界の魂',   emoji:'🌏', cost:5, tier:7, requires:['eternal_bond'],  effect:'prestige_cps_rate', value:0.3,  desc:'転生ごとのCPS増加率 さらに+0.3'},
  {id:'divine_heritage',name:'神代の遺産', emoji:'👑', cost:6, tier:8, requires:['world_soul'],    effect:'cps_perm',          value:1.0,  desc:'全CPS +100% 永続'},
  // ── 中列：アンロック・特殊 ──
  {id:'unlock_bulk_lv', name:'一括強化',   emoji:'⬆️', cost:1, tier:1, requires:[],               effect:'unlock_feature',    value:0,    desc:'建物の一括レベルアップを解放（×10・×100・MAX）'},
  {id:'unlock_bulk_sk', name:'まとめ習得', emoji:'📚', cost:1, tier:2, requires:['unlock_bulk_lv'],effect:'unlock_feature',    value:0,    desc:'スキル・世代スキルのまとめて習得を解放'},
  {id:'unlock_bulk_res',name:'一括研究',   emoji:'🔬', cost:1, tier:3, requires:['unlock_bulk_sk'],effect:'unlock_feature',    value:0,    desc:'施設の全Tier一括研究を解放'},
  {id:'gods_will',      name:'神々の意志', emoji:'🌟', cost:3, tier:4, requires:['unlock_bulk_res'],effect:'cost_perm',         value:0.15, desc:'全建物コスト -15% 永続'},
  {id:'deco_focus',     name:'飾りの極意', emoji:'🎯', cost:2, tier:5, requires:['gods_will'],     effect:'unlock_feature',    value:0,    desc:'施設特化飾りを解放。特定の施設を集中強化できる飾りが購入可能になる'},
  {id:'wisdom_bond',    name:'知恵の絆',   emoji:'📖', cost:3, tier:6, requires:['deco_focus'],    effect:'prestige_sp_bonus', value:2,    desc:'転生ごとに通常SP +2（追加）'},
  {id:'eternal_economy',name:'永遠の経済', emoji:'💰', cost:4, tier:7, requires:['wisdom_bond'],   effect:'cost_perm',         value:0.15, desc:'全建物コスト さらに-15% 永続（計-30%）'},
  {id:'cosmic_archive', name:'宇宙の記録', emoji:'🗂️', cost:5, tier:8, requires:['eternal_economy'],effect:'offline_mult',     value:0.30, desc:'オフライン効率 +30% 永続'},
  // ── 右列：稼ぎ強化 ──
  {id:'ancestor_grace', name:'先祖の加護', emoji:'🙏', cost:1, tier:1, requires:[],               effect:'prestige_sp_bonus', value:1,    desc:'転生ごとに通常SP +1'},
  {id:'harvest_gift',   name:'稼ぎの才覚', emoji:'🪙', cost:2, tier:2, requires:['ancestor_grace'],effect:'click_sec',         value:2,    desc:'ひと稼ぎ +2秒分'},
  {id:'harvest_art',    name:'稼ぎの奥義', emoji:'⚡', cost:3, tier:3, requires:['harvest_gift'],  effect:'click_sec',         value:4,    desc:'ひと稼ぎ +4秒分'},
  {id:'harvest_legend', name:'稼ぎの伝説', emoji:'🌾', cost:4, tier:4, requires:['harvest_art'],   effect:'click_mult',        value:1.0,  desc:'ひと稼ぎ量 ×2（永続）'},
  {id:'harvest_master', name:'稼ぎの極み', emoji:'🎯', cost:4, tier:5, requires:['harvest_legend'],effect:'click_sec',         value:6,    desc:'ひと稼ぎ +6秒分'},
  {id:'harvest_god',    name:'稼ぎの神',   emoji:'🌟', cost:5, tier:6, requires:['harvest_master'],effect:'click_mult',        value:1.0,  desc:'ひと稼ぎ量 さらに×2（永続）'},
  {id:'legacy_harvest', name:'遺産の恵み', emoji:'✨', cost:5, tier:7, requires:['harvest_god'],   effect:'click_sec',         value:10,   desc:'ひと稼ぎ +10秒分'},
  {id:'eternal_fortune',name:'永遠の幸運', emoji:'🍀', cost:6, tier:8, requires:['legacy_harvest'],effect:'click_mult',        value:2.0,  desc:'ひと稼ぎ量 さらに×3（永続）'},
];

const PRESTIGE_SKILL_POS = {
  // 左列（x=0.20）
  legacy_memory:   { x: 0.20, tier: 1 },
  gen_bond:        { x: 0.20, tier: 2 },
  history_mark:    { x: 0.20, tier: 3 },
  legend_grace:    { x: 0.20, tier: 4 },
  genesis_power:   { x: 0.20, tier: 5 },
  eternal_bond:    { x: 0.20, tier: 6 },
  world_soul:      { x: 0.20, tier: 7 },
  divine_heritage: { x: 0.20, tier: 8 },
  // 中列（x=0.50）
  unlock_bulk_lv:  { x: 0.50, tier: 1 },
  unlock_bulk_sk:  { x: 0.50, tier: 2 },
  unlock_bulk_res: { x: 0.50, tier: 3 },
  gods_will:       { x: 0.50, tier: 4 },
  deco_focus:      { x: 0.50, tier: 5 },
  wisdom_bond:     { x: 0.50, tier: 6 },
  eternal_economy: { x: 0.50, tier: 7 },
  cosmic_archive:  { x: 0.50, tier: 8 },
  // 右列（x=0.80）
  ancestor_grace:  { x: 0.80, tier: 1 },
  harvest_gift:    { x: 0.80, tier: 2 },
  harvest_art:     { x: 0.80, tier: 3 },
  harvest_legend:  { x: 0.80, tier: 4 },
  harvest_master:  { x: 0.80, tier: 5 },
  harvest_god:     { x: 0.80, tier: 6 },
  legacy_harvest:  { x: 0.80, tier: 7 },
  eternal_fortune: { x: 0.80, tier: 8 },
};

// スキルツリー定義（3列×10段）
const SKILLS = [
  // ── 左列：生産強化 ──
  {id:'farm_mastery',   name:'大地の恵み',   emoji:'🥕', cost:1, tier:1,  requires:[],                 effect:'cps_area1',       value:0.20,  desc:'農村エリア全建物のCPS +20%'},
  {id:'culture_bloom',  name:'文化の花開き', emoji:'📚', cost:2, tier:2,  requires:['farm_mastery'],    effect:'cps_all',         value:0.10,  desc:'全建物のCPS +10%'},
  {id:'town_vitality',  name:'街の活気',     emoji:'✨', cost:2, tier:3,  requires:['culture_bloom'],   effect:'cps_all',         value:0.15,  desc:'全建物のCPS +15%'},
  {id:'miracle_town',   name:'奇跡の街',     emoji:'🌟', cost:3, tier:4,  requires:['town_vitality'],   effect:'cps_all',         value:0.20,  desc:'全建物のCPS +20%'},
  {id:'galaxy_civ',     name:'銀河文明',     emoji:'🌌', cost:4, tier:5,  requires:['miracle_town'],    effect:'cps_mult',        value:0.50,  desc:'全建物のCPS ×1.5'},
  {id:'healing_spirit', name:'癒やしの精神', emoji:'🌿', cost:3, tier:6,  requires:['galaxy_civ'],      effect:'cps_area4',       value:0.30,  desc:'癒やしエリア全建物のCPS +30%'},
  {id:'city_dream',     name:'都市の夢',     emoji:'🏙️', cost:3, tier:7,  requires:['healing_spirit'],  effect:'cps_area5',       value:0.30,  desc:'娯楽エリア全建物のCPS +30%'},
  {id:'deep_sea_power', name:'深海の覇権',   emoji:'🌊', cost:4, tier:8,  requires:['city_dream'],      effect:'cps_area7',       value:0.35,  desc:'深海エリア全建物のCPS +35%'},
  {id:'dim_mastery',    name:'異次元の理',   emoji:'🔮', cost:4, tier:9,  requires:['deep_sea_power'],  effect:'cps_area8',       value:0.40,  desc:'異次元エリア全建物のCPS +40%'},
  {id:'dim_enlighten',  name:'異次元の悟り', emoji:'💎', cost:5, tier:10, requires:['dim_mastery'],     effect:'cps_mult',        value:0.50,  desc:'全建物のCPS ×1.5'},
  // ── 中列：飾り・礎 ──
  {id:'commerce_art',   name:'商いの才',     emoji:'🏪', cost:1, tier:1,  requires:[],                 effect:'cps_area2',       value:0.20,  desc:'商店街エリア全建物のCPS +20%'},
  {id:'nature_beauty',  name:'自然の美',     emoji:'🌿', cost:2, tier:2,  requires:['commerce_art'],   effect:'deco_mult',       value:0.15,  desc:'全デコレーション効果 +15%'},
  {id:'foundation_1',   name:'礎の目覚め',   emoji:'🏡', cost:2, tier:3,  requires:['nature_beauty'],  effect:'foundation_rate', value:0.002, desc:'農村各建物Lv×0.2%を全建物CPS強化（農村全Lv100で全体×3）'},
  {id:'foundation_2',   name:'礎の力',       emoji:'🏯', cost:3, tier:4,  requires:['foundation_1'],   effect:'foundation_rate', value:0.003, desc:'礎レート +0.3%/Lv → 計0.5%（農村全Lv100で全体×11倍）'},
  {id:'foundation_3',   name:'礎の真髄',     emoji:'🌍', cost:5, tier:5,  requires:['foundation_2'],   effect:'foundation_rate', value:0.005, desc:'礎レート +0.5%/Lv → 計1.0%（農村全Lv100で全体×64倍）'},
  {id:'beauty_power',   name:'美の力',       emoji:'🌺', cost:3, tier:6,  requires:['foundation_3'],   effect:'beauty_mult',     value:0.30,  desc:'美観ボーナス ×1.3'},
  {id:'event_sense',    name:'イベント感知', emoji:'🎪', cost:3, tier:7,  requires:['beauty_power'],   effect:'event_mult',      value:0.20,  desc:'イベント効果倍率 +20%'},
  {id:'event_lord',     name:'祭典の主',     emoji:'🎆', cost:4, tier:8,  requires:['event_sense'],    effect:'event_dur',       value:0.30,  desc:'イベント継続時間 +30%'},
  {id:'beauty_all',     name:'美と力の融合', emoji:'💫', cost:4, tier:9,  requires:['event_lord'],     effect:'cps_all',         value:0.15,  desc:'全建物のCPS +15%'},
  {id:'all_harmony',    name:'全区調和',     emoji:'🌐', cost:5, tier:10, requires:['beauty_all'],     effect:'cps_all',         value:0.20,  desc:'全建物のCPS +20%'},
  // ── 右列：効率・特殊 ──
  {id:'thrift',         name:'知恵の報酬',   emoji:'📜', cost:1, tier:1,  requires:[],                 effect:'quest_reward',    value:0.30,  desc:'クエスト報酬 +30%'},
  {id:'research_gift',  name:'研究の才能',   emoji:'🔬', cost:2, tier:2,  requires:['thrift'],          effect:'research_cost',   value:0.20,  desc:'研究コスト -20%'},
  {id:'space_ambition', name:'宇宙への野望', emoji:'🚀', cost:3, tier:3,  requires:['research_gift'],   effect:'cps_area6',       value:0.40,  desc:'宇宙エリア全建物のCPS +40%'},
  {id:'achiev_eye',     name:'実績の目',     emoji:'👁️', cost:3, tier:4,  requires:['space_ambition'],  effect:'achiev_cps',      value:0.01,  desc:'実績1件ごとに全CPS +1%'},
  {id:'cosmos_wisdom',  name:'宇宙の全知',   emoji:'🌠', cost:5, tier:5,  requires:['achiev_eye'],      effect:'cps_mult',        value:0.30,  desc:'全建物のCPS ×1.3'},
  {id:'offline_master', name:'倹約の境地',   emoji:'💤', cost:3, tier:6,  requires:['cosmos_wisdom'],   effect:'offline_mult',    value:0.20,  desc:'オフライン効率 +20%'},
  {id:'quest_wisdom',   name:'クエストの極意',emoji:'📋',cost:3, tier:7,  requires:['offline_master'],  effect:'quest_reward',    value:0.30,  desc:'クエスト報酬 +30%'},
  {id:'farm_market',    name:'農商連携',     emoji:'🤝', cost:4, tier:8,  requires:['quest_wisdom'],    effect:'cps_synergy', areas:[1,2], value:0.15, desc:'農村・商店街エリアが互いに+15%（両区解放時）'},
  {id:'city_space',     name:'都宙連帯',     emoji:'🌌', cost:4, tier:9,  requires:['farm_market'],     effect:'cps_synergy', areas:[5,6], value:0.20, desc:'娯楽・宇宙エリアが互いに+20%（両区解放時）'},
  {id:'all_sync',       name:'全区同調',     emoji:'⚡', cost:5, tier:10, requires:['city_space'],      effect:'cps_mult',        value:0.50,  desc:'全建物のCPS ×1.5'},
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

// effect.type: 'self_cps' | 'area_cps' | 'global_cps'
// self_cps: 設置した施設のCPSを強化
// area_cps: 設置した施設と同じエリアの全施設CPSを強化
// global_cps: 設置場所に関わらず全施設CPSを強化
const DECORATIONS = [
  // ─ 自己強化（self_cps）─
  { id:'potted_plant', name:'花鉢',           emoji:'🪴', cost:300,       desc:'玄関先を彩る小さな鉢植え',           effect:{type:'self_cps',   value:0.20}, effectDesc:'設置施設 CPS +20%' },
  { id:'scarecrow',    name:'かかし',         emoji:'🪆', cost:1200,      desc:'畑を見守る愛嬌のあるかかし',         effect:{type:'self_cps',   value:0.30}, effectDesc:'設置施設 CPS +30%' },
  { id:'lantern',      name:'提灯',           emoji:'🏮', cost:5000,      desc:'夜道を照らす温かな灯り',             effect:{type:'self_cps',   value:0.40}, effectDesc:'設置施設 CPS +40%' },
  { id:'windmill',     name:'風車',           emoji:'🌬️', cost:25000,     desc:'のどかに回る風車小屋',               effect:{type:'self_cps',   value:0.60}, effectDesc:'設置施設 CPS +60%' },
  { id:'bell',         name:'釣鐘',           emoji:'🔔', cost:150000,    desc:'清らかな音が施設に活力を与える',     effect:{type:'self_cps',   value:0.50}, effectDesc:'設置施設 CPS +50%' },
  { id:'shrinegate',   name:'鳥居',           emoji:'⛩️', cost:600000,    desc:'聖域の入り口を示す赤い鳥居',         effect:{type:'self_cps',   value:0.80}, effectDesc:'設置施設 CPS +80%' },
  { id:'zen_stone',    name:'石灯籠',         emoji:'🪨', cost:8000000,   desc:'庭を静謐に彩る石の灯籠',             effect:{type:'self_cps',   value:1.00}, effectDesc:'設置施設 CPS ×2' },
  { id:'satellite',    name:'アンテナ',       emoji:'📡', cost:1e10,      desc:'信号を受け取る最新アンテナ',         effect:{type:'self_cps',   value:1.20}, effectDesc:'設置施設 CPS ×2.2' },
  { id:'coral_deco',   name:'珊瑚の飾り',    emoji:'🐚', cost:3e15,      desc:'深海から持ち帰った珊瑚の置き物',     effect:{type:'self_cps',   value:1.50}, effectDesc:'設置施設 CPS ×2.5' },
  { id:'dim_crystal',  name:'次元の水晶',    emoji:'🔮', cost:3e21,      desc:'異次元エネルギーを閉じ込めた水晶',   effect:{type:'self_cps',   value:2.00}, effectDesc:'設置施設 CPS ×3' },
  // ─ エリア強化（area_cps）─
  { id:'flower_bed',   name:'花壇',           emoji:'🌼', cost:2500,      desc:'色とりどりの花が咲く花壇',           effect:{type:'area_cps',   value:0.10}, effectDesc:'同エリア全施設 CPS +10%' },
  { id:'fountain',     name:'噴水',           emoji:'⛲', cost:60000,     desc:'涼しげな噴水が人を集める',           effect:{type:'area_cps',   value:0.15}, effectDesc:'同エリア全施設 CPS +15%' },
  { id:'statue',       name:'銅像',           emoji:'🗿', cost:500000,    desc:'街のシンボルとなる立派な銅像',       effect:{type:'area_cps',   value:0.18}, effectDesc:'同エリア全施設 CPS +18%' },
  { id:'bamboo',       name:'竹林',           emoji:'🎋', cost:20000000,  desc:'風にそよぐ静かな竹林',               effect:{type:'area_cps',   value:0.22}, effectDesc:'同エリア全施設 CPS +22%' },
  { id:'observatory',  name:'展望台',         emoji:'🔭', cost:300000000, desc:'街を一望する高い展望台',             effect:{type:'area_cps',   value:0.25}, effectDesc:'同エリア全施設 CPS +25%' },
  { id:'space_lift',   name:'宇宙エレベーター',emoji:'🛗', cost:5e12,      desc:'宇宙へと続く巨大な架け橋',           effect:{type:'area_cps',   value:0.30}, effectDesc:'同エリア全施設 CPS +30%' },
  { id:'coral_reef',   name:'珊瑚礁',         emoji:'🪸', cost:1e18,      desc:'幻想的な珊瑚の海',                   effect:{type:'area_cps',   value:0.35}, effectDesc:'同エリア全施設 CPS +35%' },
  { id:'galaxy_mon',   name:'銀河の碑',       emoji:'🌌', cost:8e23,      desc:'銀河の歴史を刻んだ記念碑',           effect:{type:'area_cps',   value:0.40}, effectDesc:'同エリア全施設 CPS +40%' },
  // ─ 全体強化（global_cps）─
  { id:'cherrytree',   name:'桜並木',         emoji:'🌸', cost:30000,     desc:'春風に舞う桜の花びら',               effect:{type:'global_cps', value:0.03}, effectDesc:'全施設 CPS +3%' },
  { id:'solar_panel',  name:'太陽光パネル',   emoji:'☀️', cost:2000000,   desc:'再生エネルギーで街を底上げ',         effect:{type:'global_cps', value:0.05}, effectDesc:'全施設 CPS +5%' },
  { id:'rainbow',      name:'虹のアーチ',     emoji:'🌈', cost:80000000,  desc:'虹がかかる神秘的な門',               effect:{type:'global_cps', value:0.08}, effectDesc:'全施設 CPS +8%' },
  { id:'cosmic_tree',  name:'宇宙の大樹',     emoji:'🌳', cost:8e21,      desc:'宇宙の力を宿した伝説の大樹',         effect:{type:'global_cps', value:0.10}, effectDesc:'全施設 CPS +10%' },
  { id:'mystic_gate',  name:'神秘の門',       emoji:'🌀', cost:3e25,      desc:'異世界への扉が全てを加速する',       effect:{type:'global_cps', value:0.15}, effectDesc:'全施設 CPS +15%' },
  // ─ 施設特化（focusOnly: 転生スキル「飾りの極意」解放後に購入可・target施設に設置時のみ効果発動）─
  { id:'focus_badge',  name:'名工の認定証',   emoji:'🏅', cost:300000,    desc:'農協に認定された施設だけに授けられる証',   effect:{type:'self_cps', value:1.5},  effectDesc:'農協に設置時 CPS ×2.5', focusOnly:true, target:'farmcoop'  },
  { id:'focus_crown',  name:'施設の王冠',     emoji:'👑', cost:3000000,   desc:'城に掲げられてこそ輝く黄金の王冠',        effect:{type:'self_cps', value:3.0},  effectDesc:'城に設置時 CPS ×4',     focusOnly:true, target:'castle'    },
  { id:'focus_gem',    name:'秘宝の宝珠',     emoji:'💠', cost:50000000,  desc:'神社の御神体として祀られる秘宝',           effect:{type:'self_cps', value:6.0},  effectDesc:'神社に設置時 CPS ×7',   focusOnly:true, target:'shrine'    },
  { id:'focus_star',   name:'星の加護石',     emoji:'🌟', cost:5e12,      desc:'宇宙基地の礎となる星のエネルギー石',      effect:{type:'self_cps', value:12.0}, effectDesc:'宇宙基地に設置時 CPS ×13', focusOnly:true, target:'rocket'    },
  { id:'focus_core',   name:'エーテルコア',   emoji:'⚗️', cost:5e18,      desc:'魔法陣の核として召喚されたエーテルの塊', effect:{type:'self_cps', value:30.0}, effectDesc:'魔法陣に設置時 CPS ×31', focusOnly:true, target:'magicircle'},
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

// エリア別住人プール
const AREA_RESIDENTS = {
  1: [
    { emoji:'🐰', phrases:['ぴょんぴょん！','にんじん食べたい','元気いっぱい！'] },
    { emoji:'🐻', phrases:['はちみつほしい','この街大好き！','いい散歩道だ'] },
    { emoji:'🐱', phrases:['にゃあ～','ひなたぼっこ中','おひるね中だよ'] },
    { emoji:'🐶', phrases:['わんわん！','散歩が楽しい！','またきたよ！'] },
    { emoji:'🐸', phrases:['ケロケロ♪','のんびり歩いてます','ぴょーん！'] },
    { emoji:'🐭', phrases:['チュウ！チュウ！','チーズが好き','隅々まで探索中'] },
  ],
  2: [
    { emoji:'👩‍💼', phrases:['いらっしゃいませ！','今日も繁盛！','お買い物中～'] },
    { emoji:'👨‍🍳', phrases:['今日のランチは？','美味しいお店多い！','腕が鳴るな～'] },
    { emoji:'🧑‍🛒', phrases:['お買い得品をゲット！','バーゲン中！','全部買っちゃおう'] },
    { emoji:'👒', phrases:['ウィンドウショッピング♪','新しいお店できた！','可愛い雑貨発見'] },
    { emoji:'🧑‍💼', phrases:['商談中です','取引成立！','利益は大事ですよ'] },
    { emoji:'🎠', phrases:['賑やかでいいね','お祭りみたい！','また来よう'] },
  ],
  3: [
    { emoji:'🎨', phrases:['インスピレーション！','芸術の街だ～','素晴らしい！'] },
    { emoji:'📚', phrases:['知識は力なり','本を読もう','歴史を学ぼう'] },
    { emoji:'🎻', phrases:['音楽が流れてる♪','演奏したい！','心が洗われる'] },
    { emoji:'🧑‍🎤', phrases:['ライブしたい！','この街で歌いたい','観客集まれ～'] },
    { emoji:'👩‍🎨', phrases:['絵を描きたい','素敵な風景ね','アトリエほしい'] },
    { emoji:'🏛️', phrases:['歴史を感じる','文化財を守ろう','伝統は大切に'] },
  ],
  4: [
    { emoji:'🧘', phrases:['心が落ち着く…','深呼吸～','瞑想中…'] },
    { emoji:'💆', phrases:['癒やされる～','ここは天国','ゆったりしよう'] },
    { emoji:'🌿', phrases:['自然がいいね','草の匂いが好き','森林浴最高'] },
    { emoji:'🏊', phrases:['水が気持ちいい！','泳ぎたい！','リフレッシュ！'] },
    { emoji:'👩‍⚕️', phrases:['健康が一番！','元気ですか？','お体に気をつけて'] },
    { emoji:'🦋', phrases:['ひらひら～','花から花へ','平和な里だ'] },
  ],
  5: [
    { emoji:'👩‍💻', phrases:['コードを書こう！','バグが直らない…','デプロイ完了！'] },
    { emoji:'🏗️', phrases:['建設中！','設計図通り！','もっと高く！'] },
    { emoji:'👔', phrases:['ビジネスチャンス！','会議に遅刻！','交渉成立！'] },
    { emoji:'🚕', phrases:['急いで！','渋滞だ…','目的地まで安全に'] },
    { emoji:'🎯', phrases:['目標達成！','夢を追いかけて','チャレンジあるのみ'] },
    { emoji:'☕', phrases:['コーヒーが美味い','一息つこう','都会のカフェ最高'] },
  ],
  6: [
    { emoji:'👨‍🚀', phrases:['宇宙は広い…','無重力って楽しい！','地球が見える！'] },
    { emoji:'🛸', phrases:['通りすがりの宇宙人','この星面白い','また来るよ～'] },
    { emoji:'🤖', phrases:['処理中…','計算完了','エラーなし！'] },
    { emoji:'🔭', phrases:['新星発見！','宇宙は神秘だ','銀河が見える'] },
    { emoji:'👾', phrases:['ピポパポ！','接触を試みる','友好的です'] },
  ],
  7: [
    { emoji:'🐠', phrases:['ぷくぷく～','深海は静かだ','光がきれい'] },
    { emoji:'🐙', phrases:['墨を吐くぞ！','8本腕は便利','深海探検中'] },
    { emoji:'🦑', phrases:['ぬるぬる～','深海は俺の庭','光る光る！'] },
    { emoji:'🐡', phrases:['ふくらんじゃった','のんびり泳ぐ','深海は居心地いい'] },
    { emoji:'🦀', phrases:['横歩きが楽しい','カニカニ！','はさみに注意！'] },
    { emoji:'🐬', phrases:['キュキュ！','ジャンプするよ！','仲間はどこ？'] },
  ],
  8: [
    { emoji:'🌀', phrases:['次元が歪んでる…','時空を超えた','ここはどこ？'] },
    { emoji:'✨', phrases:['不思議な光だ','魔法みたい！','煌めいてる'] },
    { emoji:'🫧', phrases:['ふわふわ～','現実感がない','夢の中みたい'] },
    { emoji:'🔮', phrases:['未来が見える…','謎が深まる','神秘的な世界'] },
    { emoji:'🌈', phrases:['色が溢れてる！','七色の世界','異次元は美しい'] },
  ],
};

const AREA_VISITORS_GOOD = {
  1: ['🧙','🎪','👑','🔮','🎭','🌟','🧝','🦊'],
  2: ['🎩','👒','🎁','🎊','🎶','🌟','🧁','💐'],
  3: ['🎨','🎭','🎵','📜','🌟','🎤','🏅','🎪'],
  4: ['🌿','🧚','🦋','🌸','💫','🌈','🍀','✨'],
  5: ['🚀','💡','🏆','🎯','💎','⭐','🎉','🌟'],
  6: ['👨‍🚀','🛸','🌌','🔭','💫','⭐','🌟','🪐'],
  7: ['🐬','🦭','🐳','🐠','🌊','💙','🔵','🐟'],
  8: ['🌀','✨','🔮','🌈','💫','🌟','🫧','🪄'],
};

const AREA_VISITORS_BAD = {
  1: ['👹','👿','🦇','🌪️','☠️'],
  2: ['🦹','💀','🌩️','🐀','👻'],
  3: ['🎃','👹','💀','🌪️','😈'],
  4: ['🦠','🌧️','💀','👿','🌪️'],
  5: ['🤖','💀','🌪️','👾','😈'],
  6: ['☄️','👾','💀','🌑','😈'],
  7: ['🦈','🦑','☠️','🌊','👿'],
  8: ['👾','☠️','🌑','😈','💀'],
};

const SEASON_PHRASES = {
  spring: ['お花見日和！','春風が気持ちいい','さくらきれい～'],
  summer: ['暑いな～','かき氷食べたい','夏休み最高！'],
  autumn: ['秋の味覚最高','落ち葉がきれい','紅葉がきれいね'],
  winter: ['寒いけど元気！','雪だ雪だ！','あったかくしてね'],
};

const ACHIEV_CATEGORIES = [
  { id:'build',       label:'🏗️ 建設',       },
  { id:'coins',       label:'💰 コイン',      },
  { id:'cps',         label:'⚡ CPS',         },
  { id:'area',        label:'🗺️ エリア開拓',  },
  { id:'research',    label:'🔬 研究',        },
  { id:'prestige',    label:'⭐ 転生',        },
  { id:'quest',       label:'🎯 クエスト',    },
  { id:'event',       label:'🎪 イベント',    },
  { id:'harvest',     label:'👆 ひと稼ぎ',    },
  { id:'playtime',    label:'⏰ プレイ時間',  },
  { id:'skill',       label:'🌟 スキル',      },
  { id:'building_lv', label:'🏢 施設レベル',  },
  { id:'hidden',      label:'🔍 隠し実績',    },
];

const ACHIEVEMENTS = [
  {id:'first_build',   icon:'🏗️', name:'はじめの一歩',    desc:'最初の建物を建設',          reward:'記念',       cat:'build',    check:s=>getTotalLv()>=1},
  {id:'lv10',          icon:'🌱', name:'Lv10到達',         desc:'いずれかの建物がLv10に',    reward:'記念称号',   cat:'build',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=10)},
  {id:'lv25',          icon:'🌿', name:'Lv25到達',         desc:'いずれかの建物がLv25に',    reward:'記念称号',   cat:'build',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=25)},
  {id:'lv50',          icon:'🌳', name:'Lv50到達',         desc:'いずれかの建物がLv50に',    reward:'称号',       cat:'build',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=50)},
  {id:'lv100',         icon:'🏆', name:'Lv100マスター',    desc:'いずれかの建物がLv100に',   reward:'称号',       cat:'build',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=100)},
  {id:'lv125',         icon:'💫', name:'転生の恩恵',       desc:'転生後の建物がLv125に',     reward:'称号',       cat:'build',    check:s=>BUILDINGS.some(b=>s.buildings[b.id]?.level>=125)},
  {id:'all_buildings', icon:'🌆', name:'まちの設計士',     desc:'全建物を最低1つ建設',       reward:'称号',       cat:'build',    check:s=>BUILDINGS.every(b=>s.buildings[b.id]?.level>=1)},
  {id:'total_lv_100',  icon:'🏘️', name:'成長する街',        desc:'建物の総Lvが100に到達',   reward:'称号',       cat:'build',    check:_s=>getTotalLv()>=100},
  {id:'total_lv_500',  icon:'🔗', name:'街の成長',         desc:'全建物の合計Lvが500に到達', reward:'称号',       cat:'build',    check:_s=>getTotalLv()>=500},
  {id:'total_lv_1000', icon:'🌆', name:'大都市',            desc:'建物の総Lvが1000に到達',  reward:'称号',       cat:'build',    check:_s=>getTotalLv()>=1000},
  // コイン
  {id:'coins_1k',      icon:'🪙', name:'千の始まり',        desc:'累計1千コインを達成',           reward:'称号', cat:'coins', check:s=>s.totalEarned>=1000},
  {id:'coins_10k',     icon:'💎', name:'万金持ち',          desc:'累計1万コインを達成',           reward:'称号', cat:'coins', check:s=>s.totalEarned>=10000},
  {id:'coins_100k',    icon:'👑', name:'百万長者への道',    desc:'累計10万コインを達成',          reward:'称号', cat:'coins', check:s=>s.totalEarned>=100000},
  {id:'coins_1m',      icon:'💰', name:'百万長者',          desc:'累計100万コインを達成',         reward:'称号', cat:'coins', check:s=>s.totalEarned>=1000000},
  {id:'coins_10m',     icon:'💵', name:'一千万の男',        desc:'累計1千万コインを達成',         reward:'称号', cat:'coins', check:s=>s.totalEarned>=10000000},
  {id:'coins_100m',    icon:'💸', name:'億の仲間入り',      desc:'累計1億コインを達成',           reward:'称号', cat:'coins', check:s=>s.totalEarned>=100000000},
  {id:'coins_1b',      icon:'🏦', name:'億万長者',          desc:'累計10億コインを達成',          reward:'称号', cat:'coins', check:s=>s.totalEarned>=1000000000},
  {id:'coins_10b',     icon:'🏧', name:'百億の大富豪',      desc:'累計100億コインを達成',         reward:'称号', cat:'coins', check:s=>s.totalEarned>=10000000000},
  {id:'coins_1t',      icon:'💎', name:'兆を超えた者',      desc:'累計1兆コインを達成',           reward:'称号', cat:'coins', check:s=>s.totalEarned>=1000000000000},
  {id:'coins_10t',     icon:'🌟', name:'十兆の領主',        desc:'累計10兆コインを達成',          reward:'称号', cat:'coins', check:s=>s.totalEarned>=10000000000000},
  {id:'coins_100t',    icon:'✨', name:'百兆の彼方へ',      desc:'累計100兆コインを達成',         reward:'称号', cat:'coins', check:s=>s.totalEarned>=100000000000000},
  {id:'coins_1q',      icon:'🌌', name:'京の領域',          desc:'累計1京コインを達成',           reward:'称号', cat:'coins', check:s=>s.totalEarned>=1000000000000000},
  {id:'coins_10q',     icon:'♾️', name:'限界突破',          desc:'累計10京コインを達成',          reward:'称号', cat:'coins', check:s=>s.totalEarned>=1e16},
  // CPS
  {id:'cps_1',         icon:'⏱️', name:'コイン生産開始',   desc:'CPS 1/秒を達成',          reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=1},
  {id:'cps_10',        icon:'🌱', name:'芽吹く生産力',      desc:'CPS 10/秒を達成',         reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=10},
  {id:'cps_100',       icon:'⚡', name:'高速生産',          desc:'CPS 100/秒を達成',        reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=100},
  {id:'cps_1k',        icon:'🔥', name:'千の火花',          desc:'CPS 1千/秒を達成',        reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=1000},
  {id:'cps_10k',       icon:'🌊', name:'怒涛の生産力',      desc:'CPS 1万/秒を達成',        reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=10000},
  {id:'cps_100k',      icon:'🌀', name:'嵐の生産者',        desc:'CPS 10万/秒を達成',       reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=100000},
  {id:'cps_1m',        icon:'🌌', name:'宇宙的生産速度',    desc:'CPS 100万/秒を達成',      reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=1000000},
  {id:'cps_10m',       icon:'☄️', name:'流星の如く',        desc:'CPS 1千万/秒を達成',      reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=10000000},
  {id:'cps_100m',      icon:'🌠', name:'銀河の鼓動',        desc:'CPS 1億/秒を達成',        reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=100000000},
  {id:'cps_1b',        icon:'💫', name:'宇宙の律動',        desc:'CPS 10億/秒を達成',       reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=1000000000},
  {id:'cps_1t',        icon:'🔮', name:'次元を超えた生産',  desc:'CPS 1兆/秒を達成',        reward:'称号', cat:'cps', check:s=>(s.maxCps||0)>=1000000000000},
  // エリア
  {id:'area2',     icon:'🏪', name:'商店街開拓',      desc:'第2区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(2)},
  {id:'area3',     icon:'📚', name:'文化の丘開拓',    desc:'第3区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(3)},
  {id:'area4',     icon:'🌿', name:'いやしの里開拓',  desc:'第4区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(4)},
  {id:'area5',     icon:'🏙️', name:'夢の都市開拓',    desc:'第5区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(5)},
  {id:'area6',     icon:'🚀', name:'宇宙への夢',      desc:'第6区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(6)},
  {id:'area7',     icon:'🌊', name:'深海への潜行',    desc:'第7区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(7)},
  {id:'area8',     icon:'🔮', name:'異次元の扉',      desc:'第8区を解放した',    reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).includes(8)},
  {id:'all_areas', icon:'🗺️', name:'全区制覇',        desc:'全エリアを解放',     reward:'称号',    cat:'area',      check:s=>(s.unlockedAreas||[]).length>=8},
  // 研究
  {id:'research_3',    icon:'🔬', name:'研究者',       desc:'3つの研究を完了',    reward:'称号',    cat:'research',  check:s=>Object.keys(s.research||{}).length>=3},
  {id:'research_all',  icon:'🧪', name:'科学の申し子', desc:'全研究を完了',       reward:'称号',    cat:'research',  check:s=>Object.keys(s.research||{}).length>=BUILDINGS.length*RESEARCH_TIERS.length},
  // 転生
  {id:'prestige_1',    icon:'⭐', name:'転生者',           desc:'初めてプレステージ転生',    reward:'称号',       cat:'prestige',  check:s=>s.prestigeCount>=1},
  {id:'prestige_3',    icon:'🌟', name:'三度の転生',       desc:'3回プレステージ転生',       reward:'称号',       cat:'prestige',  check:s=>s.prestigeCount>=3},
  {id:'prestige_5',    icon:'💫', name:'五世代目',          desc:'5回プレステージ転生',     reward:'称号',       cat:'prestige',  check:s=>s.prestigeCount>=5},
  {id:'prestige_10',   icon:'🌠', name:'十世代の末裔',      desc:'10回プレステージ転生',    reward:'称号',       cat:'prestige',  check:s=>s.prestigeCount>=10},
  // クエスト
  {id:'quest_10',      icon:'🎯', name:'クエスト達成者',    desc:'クエストを10件完了',      reward:'称号',       cat:'quest',     check:s=>(s.quests?.completedTotal||0)>=10},
  {id:'quest_50',      icon:'🎖️', name:'クエストマスター',  desc:'クエストを50件完了',      reward:'称号',       cat:'quest',     check:s=>(s.quests?.completedTotal||0)>=50},
  // イベント
  {id:'events_10',     icon:'🎪', name:'イベント好き',      desc:'イベントを10回経験',      reward:'称号',       cat:'event',     check:s=>(s.eventCount||0)>=10},
  {id:'events_50',     icon:'🎆', name:'イベント常連',      desc:'イベントを50回経験',      reward:'称号',       cat:'event',     check:s=>(s.eventCount||0)>=50},
  {id:'weekend',       icon:'🎉', name:'週末の楽しみ', desc:'週末ボーナス中に遊んだ', reward:'記念称号',       cat:'event',     check:s=>getWeekendMult()>1&&getTotalLv()>=1},
  // ひと稼ぎ
  {id:'harvest_100',   icon:'👆', name:'ひと稼ぎ職人',      desc:'ひと稼ぎを100回した',     reward:'称号',       cat:'harvest',   check:s=>(s.totalHarvestCount||0)>=100},
  {id:'harvest_1000',  icon:'💪', name:'ひと稼ぎの達人',    desc:'ひと稼ぎを1000回した',    reward:'称号',       cat:'harvest',   check:s=>(s.totalHarvestCount||0)>=1000},
  // プレイ時間
  {id:'playtime_1h',   icon:'⏰', name:'1時間プレイヤー',   desc:'累計1時間プレイした',     reward:'称号',       cat:'playtime',  check:s=>(s.totalPlaySecs||0)>=3600},
  {id:'playtime_10h',  icon:'🕰️', name:'10時間プレイヤー',  desc:'累計10時間プレイした',    reward:'称号',       cat:'playtime',  check:s=>(s.totalPlaySecs||0)>=36000},
  // スキル
  {id:'skill_5',       icon:'🌟', name:'スキル磨き',        desc:'スキルを5個習得した',     reward:'称号',       cat:'skill',     check:s=>Object.keys(s.skills||{}).length>=5},
  // 隠し実績
  {id:'storm_harvest', icon:'⚡', name:'嵐チェイサー',    desc:'嵐の中でひと稼ぎした',              reward:'称号', hidden:true, cat:'hidden',    check:s=>s.stormHarvested},
  {id:'save_maniac',   icon:'💾', name:'過保護セーバー',  desc:'手動保存ボタンを20回押した',         reward:'称号', hidden:true, cat:'hidden',    check:s=>(s.manualSaveCount||0)>=20},
  {id:'dj_farmer',     icon:'🎵', name:'DJ農家',          desc:'BGMを10回切り替えた',                reward:'称号', hidden:true, cat:'hidden',    check:s=>(s.bgmToggleCount||0)>=10},
  {id:'night_farmer',  icon:'🌙', name:'夜型農家',        desc:'深夜0〜4時にプレイした',             reward:'称号', hidden:true, cat:'hidden',    check:s=>s.nightPlayed},
  {id:'lv1_collector', icon:'🏗️', name:'一期一会',        desc:'全建物をちょうどLv1にした',          reward:'称号', hidden:true, cat:'hidden',    check:s=>BUILDINGS.every(b=>(s.buildings[b.id]?.level||0)===1)},
  {id:'rapid_harvest', icon:'⚡', name:'落ち着きのない人', desc:'30秒以内にひと稼ぎを100回押した',    reward:'称号', hidden:true, cat:'hidden',    check:s=>s.rapidHarvested},
  {id:'silent_town',   icon:'🗑️', name:'消えた音',        desc:'BGMとSFXを両方オフにして5分プレイした', reward:'称号', hidden:true, cat:'hidden',    check:s=>(s.silentMinutes||0)>=5},
  {id:'idle_start',    icon:'🏚️', name:'廃村の夢',        desc:'何も建てないまま1分間放置した',      reward:'称号', hidden:true, cat:'hidden',    check:s=>s.idledAtStart},
  {id:'buy_discount',  icon:'🛒', name:'お買い得ハンター', desc:'行商人の値引き中に建物を購入した',    reward:'称号', hidden:true, cat:'hidden',    check:s=>s.boughtDuringDiscount},
  {id:'went_broke',    icon:'💸', name:'一文無し',         desc:'所持コインが一桁まで減った',          reward:'称号', hidden:true, cat:'hidden',    check:s=>s.wentBroke},
  {id:'event_stack_3', icon:'🌀', name:'嵐の目の中で',     desc:'3種類のイベントを同時に重ねた',       reward:'称号', hidden:true, cat:'hidden',    check:s=>s.eventStack3},
  // 転生・季節実績
  {id:'winter_prestige',      icon:'❄️', name:'冬の決断',          desc:'冬の季節に転生した',                 reward:'称号', cat:'prestige', check:s=>s.prestigeInWinter},
  {id:'spring_prestige',      icon:'🌸', name:'春の決断',          desc:'春の季節に転生した',                 reward:'称号', cat:'prestige', check:s=>s.prestigeInSpring},
  {id:'summer_prestige',      icon:'☀️', name:'夏の決断',          desc:'夏の季節に転生した',                 reward:'称号', cat:'prestige', check:s=>s.prestigeInSummer},
  {id:'autumn_prestige',      icon:'🍂', name:'実りの決断',        desc:'秋の季節に転生した',                 reward:'称号', cat:'prestige', check:s=>s.prestigeInAutumn},
  {id:'night_prestige',       icon:'🌃', name:'深夜の転生',        desc:'深夜0〜4時に転生した',               reward:'称号', cat:'prestige', check:s=>s.nightPrestige},
  {id:'max_bonus_prestige',   icon:'💎', name:'完全燃焼',          desc:'ボーナスPSPが最大の状態で転生した',  reward:'称号', cat:'prestige', check:s=>s.gotMaxPrestigeBonus},
  {id:'total_prestige_sp_10', icon:'🌟', name:'世代の継承者',      desc:'累計PSPを10以上獲得した',            reward:'称号', cat:'prestige', check:s=>(s.prestigeSp||0)>=10},
  // コイン
  {id:'rich_pocket',          icon:'🤑', name:'金満農家',          desc:'手元に1億コインを持った',            reward:'称号', cat:'coins',    check:s=>s.coins>=100000000},
  // 隠し実績
  {id:'morning_farmer',  icon:'🌅', name:'朝型農家',      desc:'朝5〜8時にプレイした',               reward:'称号', hidden:true, cat:'hidden', check:s=>s.morningPlayed},
  {id:'evening_farmer',  icon:'🌆', name:'夕暮れの農家',  desc:'夕方17〜20時にプレイした',           reward:'称号', hidden:true, cat:'hidden', check:s=>s.eveningPlayed},
  {id:'skill_complete',  icon:'✨', name:'スキルコンプリート', desc:'通常スキルをすべて習得した',     reward:'称号', hidden:true, cat:'hidden', check:s=>SKILLS.every(sk=>s.skills?.[sk.id])},
  {id:'research_spender',icon:'🔬', name:'研究狂い',      desc:'累計研究費1億コインを超えた',        reward:'称号', hidden:true, cat:'hidden', check:s=>(s.totalResearchSpent||0)>=100000000},
  {id:'lucky7777',       icon:'🍀', name:'幸運の数字',   desc:'所持コインがちょうど7,777枚になった', reward:'称号', hidden:true, cat:'hidden', check:s=>s.lucky7777},
  {id:'zorome_coins',    icon:'🎰', name:'ゾロ目',       desc:'所持コインの下4桁がゾロ目になった',   reward:'称号', hidden:true, cat:'hidden', check:s=>s.zoromeCoins},
  // プレイ系
  {id:'long_offline',    icon:'💤', name:'大放置',       desc:'8時間以上放置してオフライン収入を受け取った', reward:'称号', cat:'playtime', check:s=>s.longOffline},
  {id:'hourly_play',     icon:'⏰', name:'時報農家',     desc:'毎時0分ちょうどにゲームが動いていた', reward:'称号', cat:'playtime', check:s=>s.hourlyPlay},
  {id:'playtime_24h',    icon:'🌍', name:'24時間農家',   desc:'累計24時間プレイした',                reward:'称号', cat:'playtime', check:s=>(s.totalPlaySecs||0)>=86400},
  // 収穫
  {id:'harvest_10k',     icon:'🤲', name:'一万回収穫',   desc:'ひと稼ぎを10,000回達成',              reward:'称号', cat:'harvest', check:s=>(s.totalHarvestCount||0)>=10000},
  // 転生
  {id:'perfect_prestige',icon:'💯', name:'完璧な旅立ち', desc:'全建物Lv100以上の状態で転生した',     reward:'称号', cat:'prestige', check:s=>s.perfectPrestige},
  {id:'prestige_20',     icon:'🌌', name:'転生の覇者',   desc:'転生を20回達成',                      reward:'称号', cat:'prestige', check:s=>s.prestigeCount>=20},
  // 研究
  {id:'research_god',    icon:'🧫', name:'研究の神',     desc:'累計研究費10億コインを超えた',         reward:'称号', cat:'research', check:s=>(s.totalResearchSpent||0)>=1000000000},
  // 施設別レベル実績
  ...BUILDINGS.flatMap(b => [
    {id:`${b.id}_lv10`,  icon:b.emoji, name:`${b.name} Lv10`,  desc:`${b.name}をLv10に強化`,  reward:'称号', cat:'building_lv', check:s=>(s.buildings?.[b.id]?.level||0)>=10},
    {id:`${b.id}_lv50`,  icon:b.emoji, name:`${b.name} Lv50`,  desc:`${b.name}をLv50に強化`,  reward:'称号', cat:'building_lv', check:s=>(s.buildings?.[b.id]?.level||0)>=50},
    {id:`${b.id}_lv100`, icon:b.emoji, name:`${b.name} Lv100`, desc:`${b.name}をLv100に強化`, reward:'称号', cat:'building_lv', check:s=>(s.buildings?.[b.id]?.level||0)>=100},
    {id:`${b.id}_lv500`, icon:b.emoji, name:`${b.name} Lv500`, desc:`${b.name}をLv500に強化`, reward:'称号', cat:'building_lv', check:s=>(s.buildings?.[b.id]?.level||0)>=500},
  ]),
];
