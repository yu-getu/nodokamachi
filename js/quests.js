// ══════════════════════════════
//  クエストシステム
// ══════════════════════════════
function generateQuests() {
  const pool = [];
  const unlockedAreas = state.unlockedAreas || [1];
  const cps = Math.max(1, getEffectiveCps());
  // CPS秒数とコスト基準フロアの大きい方を報酬にする
  const reward = (cpsSecs, costFloor = 0) => Math.max(Math.floor(cps * cpsSecs), Math.floor(costFloor));

  BUILDINGS.filter(b => unlockedAreas.includes(b.area)).forEach(b => {
    const lv = state.buildings[b.id]?.level || 0;
    const targets = b.area <= 2 ? [1, 5, 10, 25, 50]
      : b.area <= 4 ? [1, 5, 10, 25]
        : [1, 5, 10];
    const secs = { 1: 30, 5: 60, 10: 120, 25: 240, 50: 480 };
    // フロア: そのレベルに到達するまでの建物コストの約15%
    const costFloors = { 1: b.baseCost * 0.5, 5: b.baseCost * 2, 10: b.baseCost * 5, 25: b.baseCost * 15, 50: b.baseCost * 40 };
    targets.forEach(target => {
      if (lv < target) pool.push({
        id: `${b.id}_lv${target}`, emoji: b.emoji,
        label: `${b.name}をLv${target}にする`,
        type: 'building_level', buildingId: b.id, target,
        reward: reward(secs[target] || 60, costFloors[target]),
      });
    });
  });

  const totalSecs = { 5: 60, 15: 90, 30: 120, 60: 180, 100: 240, 150: 300, 230: 420, 350: 600, 500: 900 };
  const curTotalLv = getTotalLv();
  [5, 15, 30, 60, 100, 150, 230, 350, 500].forEach(t => {
    if (curTotalLv < t && t <= curTotalLv + 80) pool.push({
      id: `total_${t}`, emoji: '🏘️', label: `建物の総レベルを${t}にする`,
      type: 'total_level', target: t,
      reward: reward(totalSecs[t] || 120),
    });
  });

  [1000, 50000, 1000000, 50000000, 1000000000, 50000000000, 1000000000000].forEach(t => {
    if (state.totalEarned < t && t <= Math.max(1000, state.totalEarned * 100)) pool.push({
      id: `earn_${t}`, emoji: '💰', label: `累計${fmt(t)}コインを稼ぐ`,
      type: 'earn', target: t,
      // フロア: 目標額の5%
      reward: reward(120, t * 0.05),
    });
  });

  const decoCount = Object.values(state.decorations || {}).filter(Boolean).length;
  const decoSecs = { 1: 60, 3: 120, 5: 180, 8: 300, 10: 420 };
  // デコのコストフロア: 該当個数目のデコ購入コストの10%（概算）
  const decoFloors = { 1: 500, 3: 2000, 5: 8000, 8: 50000, 10: 200000 };
  [1, 3, 5, 8, 10].forEach(t => {
    if (decoCount < t) pool.push({
      id: `deco_${t}`, emoji: '🌺', label: `デコレーションを${t}個設置する`,
      type: 'deco', target: t,
      reward: reward(decoSecs[t] || 120, decoFloors[t]),
    });
  });

  const resCount = Object.keys(state.research || {}).length;
  const resSecs = { 1: 120, 3: 240, 5: 360, 9: 600 };
  // 研究コストフロア: 研究コストの10%（概算）
  const resFloors = { 1: 5000, 3: 50000, 5: 500000, 9: 5000000 };
  [1, 3, 5, 9].forEach(t => {
    if (resCount < t) pool.push({
      id: `res_${t}`, emoji: '🔬', label: `研究を${t}件完了する`,
      type: 'research', target: t,
      reward: reward(resSecs[t] || 180, resFloors[t]),
    });
  });

  const skillCount = Object.keys(state.skills || {}).length;
  const skillSecs = { 1: 120, 3: 240, 5: 360, 8: 540, 13: 900 };
  [1, 3, 5, 8, 13].forEach(t => {
    if (skillCount < t) pool.push({
      id: `skill_${t}`, emoji: '🌟', label: `スキルを${t}個習得する`,
      type: 'skill', target: t,
      reward: reward(skillSecs[t] || 240),
    });
  });

  const curMaxCps = state.maxCps || 0;
  [1, 5, 10, 50, 100, 500, 1000, 5000, 1e4, 5e4, 1e5, 5e5, 1e6, 5e6, 1e7, 5e7, 1e8, 5e8].forEach(t => {
    if (curMaxCps < t && t <= Math.max(5, curMaxCps * 100)) pool.push({
      id: `cps_${t}`, emoji: '⚡',
      label: `CPS ${fmt(t)}/秒 を達成する`,
      type: 'cps', target: t,
      // フロア: 目標CPS × 30秒分
      reward: reward(300, t * 30),
    });
  });

  const maxUnlockedArea = Math.max(...(state.unlockedAreas || [1]));
  [2, 3, 4, 5, 6].forEach(areaId => {
    if (!(state.unlockedAreas || [1]).includes(areaId) && areaId <= maxUnlockedArea + 1) {
      const area = AREAS.find(a => a.id === areaId);
      if (!area) return;
      pool.push({
        id: `unlock_area${areaId}`, emoji: area.emoji,
        label: `${area.name}（${area.desc}）を解放する`,
        type: 'unlock_area', areaId, target: 1,
        // フロア: 解放コストの10%
        reward: reward(300, area.unlockCost * 0.1),
      });
    }
  });

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4).map(q => ({ ...q, claimed: false }));
}

function isQuestsValid(quests) {
  if (!Array.isArray(quests) || quests.length === 0) return false;
  const validIds = new Set(BUILDINGS.map(b => b.id));
  return quests.every(q => q.type !== 'building_level' || validIds.has(q.buildingId));
}

function getQuestProgress(q) {
  switch (q.type) {
    case 'building_level': return Math.min(state.buildings[q.buildingId]?.level || 0, q.target);
    case 'total_level': return Math.min(getTotalLv(), q.target);
    case 'earn': return Math.min(state.totalEarned, q.target);
    case 'deco': return Math.min(Object.values(state.decorations || {}).filter(Boolean).length, q.target);
    case 'research': return Math.min(Object.keys(state.research || {}).length, q.target);
    case 'skill': return Math.min(Object.keys(state.skills || {}).length, q.target);
    case 'unlock_area': return (state.unlockedAreas || [1]).includes(q.areaId) ? 1 : 0;
    case 'cps': return Math.min(state.maxCps || 0, q.target);
    default: return 0;
  }
}

function claimQuest(i) {
  const q = (state.quests?.active || [])[i];
  if (!q || q.claimed || getQuestProgress(q) < q.target) return;
  q.claimed = true;
  const actualReward = Math.floor(q.reward * getSkillQuestMult());
  state.coins += actualReward; state.totalEarned += actualReward;
  state.quests.completedTotal = (state.quests.completedTotal || 0) + 1;
  spawnFloatCoins(`+${fmt(actualReward)}`);
  addLog(`🎯 クエスト完了：${q.label} +${fmt(actualReward)}コイン！`);
  playQuestSfx();
  checkAchievements(); renderQuests(); render(); saveGame();
}

function refreshQuests() {
  const prev = state.quests?.completedTotal || 0;
  state.quests = { active: generateQuests(), lastRefresh: getTodayStr(), completedTotal: prev };
  renderQuests(); addLog('🎯 クエストが更新されました！'); saveGame();
}

function checkQuestRefresh() {
  const quests = state.quests?.active;
  const dateChanged = state.quests?.lastRefresh !== getTodayStr();
  const invalid = !isQuestsValid(quests);
  if (!quests?.length || dateChanged || invalid) refreshQuests();
}

function renderQuests() {
  const container = document.getElementById('questContainer');
  if (!container) return;
  const quests = state.quests?.active || [];
  const allClaimed = quests.length > 0 && quests.every(q => q.claimed);
  const total = state.quests?.completedTotal || 0;
  const el = document.getElementById('questCompleted');
  if (el) el.textContent = `累計${total}件完了`;

  container.innerHTML = quests.map((q, i) => {
    const prog = getQuestProgress(q), pct = Math.min(100, (prog / q.target) * 100);
    const done = prog >= q.target;
    return `<div class="quest-item ${q.claimed ? 'claimed' : done ? 'done' : ''}">
      <span class="quest-emoji">${q.emoji}</span>
      <div class="quest-info">
        <div class="quest-label">${q.label}</div>
        <div class="quest-progress-bar"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
        <div class="quest-count">${fmt(prog)} / ${fmt(q.target)}</div>
      </div>
      <div class="quest-right">
        <div class="quest-reward">🪙${fmt(q.reward)}</div>
        <button class="btn-quest" onclick="claimQuest(${i})" ${q.claimed || !done ? 'disabled' : ''}>
          ${q.claimed ? '✅' : done ? '受け取る' : '未達成'}
        </button>
      </div>
    </div>`;
  }).join('');

  if (allClaimed) {
    container.innerHTML += `<div style="text-align:center;margin-top:10px">
      <button class="btn-save" onclick="refreshQuests()" style="background:var(--prestige);font-size:12px;padding:8px 20px;border-radius:10px">🎯 次のクエストへ</button>
    </div>`;
  }
}
