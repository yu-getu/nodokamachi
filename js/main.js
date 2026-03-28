// ══════════════════════════════
//  コアCPS計算・アクション・ゲームループ・起動
// ══════════════════════════════

// ── 一括購入モード（0=MAX, 1/10/100）──
let bulkMode = 1;
function setBulkMode(n) {
  bulkMode = n;
  document.querySelectorAll('.bulk-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.mode) === n);
  });
  renderShop();
}

// ── グローバルCPS計算 ──
function getCps() {
  const base = BUILDINGS.reduce((s, b) => s + getBuildingCps(b), 0);
  return base * getAchievCpsBonus() * getPrestigeMult() * (1 + getPrestigeSkillEffect('cps_perm'));
}
function getEffectiveCps() { return getCps() * getEventMult() * getSeasonMult() * getBeautyMult() * getWeekendMult(); }

// ── アクション ──
function buyBuilding(id) {
  const b = BUILDINGS.find(x => x.id === id);
  const { count, totalCost } = getBulkInfo(b);
  if (count === 0) return;

  const wasZero = state.buildings[id].level === 0;
  state.coins -= totalCost;
  state.totalSpent = (state.totalSpent || 0) + totalCost;
  state.buildings[id].level += count;
  const nl = state.buildings[id].level;

  addLog(wasZero && count === 1
    ? `🏗️ ${b.emoji}${b.name}を建設！(Lv.1)`
    : `⬆️ ${b.emoji}${b.name} Lv.${nl}に強化！(+${count})`);
  spawnFloatCoins(`-${fmt(totalCost)}`);
  playBuildSfx();
  checkAchievements();
  renderQuests();
  render();
}

let _harvestTimestamps = [];
function manualHarvest() {
  const clickSec = (2 + getSkillEffect('click_sec')) * getDecoCollectMult();
  const bonus = Math.max(1, getEffectiveCps() * clickSec);
  state.coins += bonus; state.totalEarned += bonus;
  state.totalHarvestCount = (state.totalHarvestCount || 0) + 1;
  spawnFloatCoins(`+${fmt(bonus)}`);
  playHarvestSfx();

  // 嵐中ひと稼ぎ
  if ((state.activeEvents || []).some(ae => ae.eventId === 'storm')) state.stormHarvested = true;

  // 急連打（30秒以内に10回）
  const now = Date.now();
  _harvestTimestamps.push(now);
  _harvestTimestamps = _harvestTimestamps.filter(t => now - t <= 30000);
  if (_harvestTimestamps.length >= 100) state.rapidHarvested = true;

  checkAchievements(); renderQuests(); render();
}

// ── ゲームループ ──
let tickCount = 0;
let _silentTick = 0; // 無音tick数
let _idleStartTick = 0; // 廃村放置tick数
function tick() {
  const now = Date.now(), dt = (now - state.lastTick) / 1000; state.lastTick = now;
  const earned = getEffectiveCps() * dt;
  state.coins += earned; state.totalEarned += earned;
  renderStats();
  document.querySelectorAll('.shop-item').forEach((el, i) => {
    const b = BUILDINGS[i]; if (!b) return;
    const lv = state.buildings[b.id].level, maxLv = getMaxLevel();
    const isMax = lv >= maxLv, cost = getBuildingCost(b);
    el.className = `shop-item ${isMax ? 'maxed' : state.coins >= cost ? 'affordable' : ''} ${getPhase(lv).colorClass}`;
    const btn = el.querySelector('.btn-buy');
    if (btn && !isMax) btn.disabled = state.coins < cost;
  });
  document.querySelectorAll('.deco-item').forEach((el, i) => {
    const d = DECORATIONS[i]; if (!d) return;
    const owned = !!state.decorations[d.id];
    const canAfford = !owned && state.coins >= d.cost;
    el.className = `deco-item ${owned ? 'owned' : canAfford ? 'affordable' : ''}`;
    const btn = el.querySelector('.btn-buy');
    if (btn && !owned) btn.disabled = !canAfford;
  });
  AREAS.forEach(area => {
    const btn = document.getElementById(`areaBtn${area.id}`);
    if (btn) btn.disabled = state.coins < area.unlockCost;
  });
  document.querySelectorAll('.research-item').forEach((el, i) => {
    const r = RESEARCH[i]; if (!r) return;
    const done = !!state.research[r.id];
    const canAfford = !done && state.coins >= r.cost;
    el.className = `research-item ${done ? 'done' : canAfford ? 'affordable' : ''}`;
    const btn = el.querySelector('.btn-research');
    if (btn && !done) btn.disabled = !canAfford;
  });
  // ── ゲーム内時間を進める ──
  state.gameDayProgress = (state.gameDayProgress || 0) + dt / GAME_DAY_REAL_SECS;
  if (state.gameDayProgress >= 1) {
    state.gameDayProgress -= 1;
    const prevSeason = getCurrentSeason();
    state.gameDay = (state.gameDay || 0) + 1;
    const newSeason = getCurrentSeason();
    if (prevSeason.id !== newSeason.id) {
      addLog(`${newSeason.emoji} 季節が変わりました：${newSeason.name}（${newSeason.desc}）`);
      setWeather(getSeasonWeather());
    }
    renderSeason();
  }

  // 統計追跡
  state.totalPlaySecs = (state.totalPlaySecs || 0) + dt;
  const curCps = getEffectiveCps();
  if (curCps > (state.maxCps || 0)) state.maxCps = curCps;
  if (state.coins > (state.maxCoins || 0)) state.maxCoins = state.coins;

  tickCount++;
  updateEventBadge();
  if (document.getElementById('panel-prestige')?.style.display !== 'none') updatePrestigeProgress();
  // 深夜判定（0〜4時）
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 4) state.nightPlayed = true;

  // 無音プレイ追跡（BGM・SFX両方オフ）
  if (!_bgmOn && !_sfxOn) {
    _silentTick++;
    // tick間隔200ms → 5tick/秒 → 300tick=60秒=1分
    if (_silentTick >= 1500) state.silentMinutes = Math.floor(_silentTick / 300);
  } else {
    _silentTick = 0;
  }

  // 廃村放置（何も建てずに1分放置）
  if (getTotalLv() === 0) {
    _idleStartTick++;
    if (_idleStartTick >= 300) state.idledAtStart = true;
  } else {
    _idleStartTick = 0;
  }

  if (tickCount % 150 === 0) { saveGame(); updateSaveStatus(); }
  if (tickCount % 50 === 0) updateSaveStatus();
  if (tickCount % 100 === 0) { checkAchievements(); renderQuests(); }
  if (tickCount % 50 === 0) updateSky();
  const resInterval = Math.max(25, 100 - getTotalLv());
  if (tickCount % resInterval === 0) spawnResident();
}

// ── 起動 ──
const loaded = loadGame();
addLog(loaded ? '💾 セーブデータを読み込みました。' : '🌿 のどかまちへようこそ！最初の建物を建ててみよう。');
if (state.prestigeCount > 0) {
  document.getElementById('prestigeBadge').style.display = 'flex';
  document.getElementById('prestigeCount').textContent = state.prestigeCount;
}
render();
renderDailyBar();
checkQuestRefresh();
initSound();
updateSky();
initWeather();
setInterval(tick, 200);
scheduleNextEvent();

// Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/nodokamachi/sw.js')
      .then(reg => console.log('SW登録成功:', reg.scope))
      .catch(err => console.log('SW登録失敗:', err));
  });
}
