// ═══════════════════════════════════════
//  ゲーム状態（mutable state）
//  定数データは js/constants.js を参照
// ═══════════════════════════════════════

let state = {
  coins:0, totalEarned:0, buildings:{},
  lastTick:Date.now(), lastSaved:null,
  activeEvents:[], eventDiscount:1,
  prestigeCount:0, achievements:{},
  eventCount:0, stormCount:0,
  decoOwned: {},
  decoSlots: {},
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
  prestigeInSpring: false,
  prestigeInSummer: false,
  prestigeInAutumn: false,
  nightPrestige: false,
  silentPrestige: false,
  gotMaxPrestigeBonus: false,
  morningPlayed: false,
  eveningPlayed: false,
  totalResearchSpent: 0,
  lucky7777: false,
  zoromeCoins: false,
  longOffline: false,
  hourlyPlay: false,
  perfectPrestige: false,
  // ゲーム内時間（0=春の1日目 朝8時スタート）
  gameDay: 0,
  gameDayProgress: 8 / 24,
  // ミニゲーム
  bakeryGameLastDate: '',     bakeryGamePlaysToday: 0,
  cafeGameLastDate: '',       cafeGamePlaysToday: 0,
  shrineGameLastDate: '',     shrineGamePlaysToday: 0,
  onsenGameLastDate: '',      onsenGamePlaysToday: 0,
  amusementGameLastDate: '',  amusementGamePlaysToday: 0,
  rocketGameLastDate: '',     rocketGamePlaysToday: 0,
  deepseasubGameLastDate: '', deepseasubGamePlaysToday: 0,
  dimgateGameLastDate: '',    dimgateGamePlaysToday: 0,
  // ミニゲーム累計
  bakeryTotalPlays: 0,
  cafeTotalPlays: 0,
  shrineTotalPlays: 0,
  onsenTotalPlays: 0,
  mgGotPerfect: false,
  bakeryBurntOnce: false,
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
