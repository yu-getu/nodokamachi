// ══════════════════════════════
//  建物・エリア・マイルストーンシステム
// ══════════════════════════════

function getMaxLevel() {
  return BASE_MAX_LV + state.prestigeCount * PRESTIGE_LV_BONUS;
}

function getPhase(lv) {
  for (const p of PHASES) {
    if (lv <= p.maxLv) return p;
  }
  return PHASES[PHASES.length - 1];
}

function getPhaseLabel(lv) {
  if (lv <= 10) return '開拓期';
  if (lv <= 25) return '成長期';
  if (lv <= 50) return '円熟期';
  if (lv <= 100) return 'レジェンド';
  return `転生拡張(${state.prestigeCount}世代)`;
}

function getBuildingCost(b) {
  const lv = state.buildings[b.id].level;
  const maxLv = getMaxLevel();
  if (lv >= maxLv) return Infinity;

  let cost = b.baseCost;
  let remaining = lv;
  let phaseStart = 0;

  for (const p of PHASES) {
    const phaseEnd = Math.min(p.maxLv, maxLv);
    const lvInPhase = Math.max(0, Math.min(remaining, phaseEnd - phaseStart));
    if (lvInPhase <= 0) { phaseStart = phaseEnd; continue; }
    cost *= Math.pow(p.mult, lvInPhase);
    remaining -= lvInPhase;
    phaseStart = phaseEnd;
    if (remaining <= 0) break;
  }
  if (remaining > 0) {
    cost *= Math.pow(PHASES[PHASES.length - 1].mult, remaining);
  }
  return Math.floor(cost * (state.eventDiscount || 1) * getSkillCostMult());
}

function getBuildingCps(b) {
  const lv = state.buildings[b.id] ? state.buildings[b.id].level : 0;
  if (lv === 0) return 0;
  const msCount = (state.buildings[b.id].msReached || []).length;
  const base = b.baseCps * lv * (1 + lv * 0.15);
  return base * Math.pow(2, msCount) * getResearchMult(b.id) * getSkillCpsMult(b)
    * getDecoAreaMult(b.area) * getDecoBuildingMult(b.id);
}

function getMilestoneCount(bid) {
  const lv = state.buildings[bid].level;
  return MILESTONES.filter(ms => lv >= ms).length;
}

function getNextMilestone(lv, maxLv) {
  for (const ms of MILESTONES) {
    if (lv < ms && ms <= maxLv) return ms;
  }
  return null;
}

function getTotalLv() {
  return BUILDINGS.reduce((s, b) => s + state.buildings[b.id].level, 0);
}

let msToastTimer = null;
function checkMilestones(bid) {
  const b = BUILDINGS.find(x => x.id === bid);
  const lv = state.buildings[bid].level;
  const reached = state.buildings[bid].msReached || [];
  const maxLv = getMaxLevel();

  for (const ms of MILESTONES) {
    if (ms > maxLv) break;
    if (lv >= ms && !reached.includes(ms)) {
      reached.push(ms);
      state.buildings[bid].msReached = reached;
      showMsToast(b, ms);
      addLog(`🌟 ${b.emoji}${b.name} Lv${ms} マイルストーン！CPS×2ボーナス！`);
    }
  }
}

function showMsToast(b, ms) {
  const t = document.getElementById('msToast');
  document.getElementById('msToastIcon').textContent = b.emoji;
  document.getElementById('msToastTitle').textContent = `Lv${ms} マイルストーン！`;
  document.getElementById('msToastBody').textContent = `${b.name}がLv${ms}に到達しました`;
  document.getElementById('msToastBonus').textContent = `✨ ${b.name}のCPS ×2！`;
  t.classList.add('show');
  playMilestoneSfx();
  if (msToastTimer) clearTimeout(msToastTimer);
  msToastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

function unlockArea(areaId) {
  const area = AREAS.find(a => a.id === areaId);
  if (!area || state.coins < area.unlockCost) return;
  if ((state.unlockedAreas || [1]).includes(areaId)) return;
  state.coins -= area.unlockCost;
  state.unlockedAreas = [...(state.unlockedAreas || [1]), areaId];
  spawnFloatCoins(`-${fmt(area.unlockCost)}`);
  playUnlockSfx();
  addLog(`🏙️ ${area.emoji}${area.name}を解放！新しい建物が建てられます！`);
  BUILDINGS.filter(b => b.area === areaId).forEach(b => {
    if (!state.buildings[b.id]) state.buildings[b.id] = { level: 0, msReached: [] };
  });
  checkAchievements();
  render();
}
