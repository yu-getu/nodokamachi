// ══════════════════════════════
//  建物・エリア・マイルストーンシステム
// ══════════════════════════════

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

function _buildingCostAtLv(b, lv) {
  const maxLv = getMaxLevel();
  if (lv >= maxLv) return Infinity;
  let cost = b.baseCost, remaining = lv, phaseStart = 0;
  for (const p of PHASES) {
    const phaseEnd = Math.min(p.maxLv, maxLv);
    const lvInPhase = Math.max(0, Math.min(remaining, phaseEnd - phaseStart));
    if (lvInPhase <= 0) { phaseStart = phaseEnd; continue; }
    cost *= Math.pow(p.mult, lvInPhase);
    remaining -= lvInPhase;
    phaseStart = phaseEnd;
    if (remaining <= 0) break;
  }
  if (remaining > 0) cost *= Math.pow(PHASES[PHASES.length - 1].mult, remaining);
  // cost_perm 効果：最大90%割引まで・最低でも元コストの10%は保証
  const costPermEffect = getPrestigeSkillEffect('cost_perm');
  const costPerm = Math.max(0.1, 1 - costPermEffect);
  return Math.floor(cost * (state.eventDiscount || 1) * getSkillCostMult() * costPerm);
}

function getBuildingCost(b) {
  return _buildingCostAtLv(b, state.buildings[b.id].level);
}

// 一括購入情報: { count, totalCost }
function getBulkInfo(b) {
  const maxLv = getMaxLevel();
  const startLv = state.buildings[b.id].level;
  const want = bulkMode === 0 ? (maxLv - startLv) : bulkMode;
  const cap = Math.min(want, maxLv - startLv);
  let coins = state.coins, count = 0, totalCost = 0;
  for (let i = 0; i < cap; i++) {
    const c = _buildingCostAtLv(b, startLv + i);
    if (coins < c) break;
    coins -= c;
    totalCost += c;
    count++;
  }
  return { count, totalCost };
}


function getBuildingCps(b) {
  const lv = state.buildings[b.id] ? state.buildings[b.id].level : 0;
  if (lv === 0) return 0;
  const base = b.baseCps * lv * (1 + lv * 0.10);
  return base * getResearchMult(b.id) * getSkillCpsMult(b)
    * getDecoAreaMult(b.area) * getDecoBuildingMult(b.id);
}

function getTotalLv() {
  return BUILDINGS.reduce((s, b) => s + state.buildings[b.id].level, 0);
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
    if (!state.buildings[b.id]) state.buildings[b.id] = { level: 0 };
  });
  checkAchievements();
  render();
}
