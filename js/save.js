// ══════════════════════════════
//  セーブ・ロードシステム
// ══════════════════════════════
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      coins: state.coins, totalEarned: state.totalEarned, buildings: state.buildings,
      savedAt: Date.now(), prestigeCount: state.prestigeCount, activeEvents: state.activeEvents,
      achievements: state.achievements, eventCount: state.eventCount, stormCount: state.stormCount,
      daily: state.daily, decorations: state.decorations,
      unlockedAreas: state.unlockedAreas, research: state.research,
      quests: state.quests, skills: state.skills,
      prestigeSkills: state.prestigeSkills, prestigeSp: state.prestigeSp,
      manualSaveCount: state.manualSaveCount, bgmToggleCount: state.bgmToggleCount,
      stormHarvested: state.stormHarvested, nightPlayed: state.nightPlayed,
      rapidHarvested: state.rapidHarvested, silentMinutes: state.silentMinutes,
      idledAtStart: state.idledAtStart,
      boughtDuringDiscount: state.boughtDuringDiscount, wentBroke: state.wentBroke,
      eventStack3: state.eventStack3, prestigeInWinter: state.prestigeInWinter,
      totalHarvestCount: state.totalHarvestCount, totalSpent: state.totalSpent,
      totalPlaySecs: state.totalPlaySecs, maxCps: state.maxCps, maxCoins: state.maxCoins,
      firstPlayedAt: state.firstPlayedAt,
    }));
    state.lastSaved = Date.now(); updateSaveStatus();
    addLog('💾 セーブしました！');
  } catch (e) { addLog('⚠️ セーブ失敗'); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY); if (!raw) return false;
    const d = JSON.parse(raw);
    state.coins = d.coins || 50; state.totalEarned = d.totalEarned || 0;
    state.buildings = d.buildings || {}; state.prestigeCount = d.prestigeCount || 0;
    state.activeEvents = d.activeEvents || [];
    state.achievements = d.achievements || {}; state.eventCount = d.eventCount || 0;
    state.stormCount = d.stormCount || 0;
    state.daily = d.daily || { lastClaimDate: null, streak: 0, totalClaimed: 0 };
    state.decorations = d.decorations || {};
    state.unlockedAreas = d.unlockedAreas || [1];
    state.research = d.research || {};
    BUILDINGS.forEach(b => {
      if (!state.buildings[b.id]) state.buildings[b.id] = { level: 0 };
    });
    if (!state.unlockedAreas) state.unlockedAreas = [1];
    if (!state.research) state.research = {};
    state.quests = d.quests || null;
    state.skills = d.skills || {};
    state.prestigeSkills = d.prestigeSkills || {};
    state.prestigeSp = d.prestigeSp || 0;
    state.manualSaveCount = d.manualSaveCount || 0;
    state.bgmToggleCount = d.bgmToggleCount || 0;
    state.stormHarvested = d.stormHarvested || false;
    state.nightPlayed = d.nightPlayed || false;
    state.rapidHarvested = d.rapidHarvested || false;
    state.silentMinutes = d.silentMinutes || 0;
    state.idledAtStart = d.idledAtStart || false;
    state.boughtDuringDiscount = d.boughtDuringDiscount || false;
    state.wentBroke = d.wentBroke || false;
    state.eventStack3 = d.eventStack3 || false;
    state.prestigeInWinter = d.prestigeInWinter || false;
    state.totalHarvestCount = d.totalHarvestCount || 0;
    state.totalSpent = d.totalSpent || 0;
    state.totalPlaySecs = d.totalPlaySecs || 0;
    state.maxCps = d.maxCps || 0;
    state.maxCoins = d.maxCoins || 0;
    state.firstPlayedAt = d.firstPlayedAt || Date.now();
    const offSec = Math.min((Date.now() - d.savedAt) / 1000, 24 * 3600);
    if (offSec > 30 && getCps() > 0) {
      // オフライン効率：基本50% + 世代スキル効果（上限100%）
      const baseOffMult = 0.5;
      const offlineSkillEffect = getPrestigeSkillEffect('offline_mult');
      const offMult = Math.max(0.5, Math.min(1.0, baseOffMult + offlineSkillEffect));
      const earned = Math.floor(getEffectiveCps() * offSec * offMult);
      state.coins += earned; state.totalEarned += earned;
      showOfflineModal(offSec, earned);
    }
    return true;
  } catch (e) { return false; }
}

function updateSaveStatus() {
  const el = document.getElementById('saveStatus');
  if (!state.lastSaved) { el.textContent = '未保存'; return; }
  const s = Math.floor((Date.now() - state.lastSaved) / 1000);
  el.textContent = s < 60 ? `${s}秒前に保存` : `${Math.floor(s / 60)}分前に保存`;
}
