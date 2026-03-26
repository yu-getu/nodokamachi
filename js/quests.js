// ══════════════════════════════
//  クエストシステム
// ══════════════════════════════
function generateQuests() {
  const pool = [];
  const unlockedAreas = state.unlockedAreas || [1];

  BUILDINGS.filter(b => unlockedAreas.includes(b.area)).forEach(b => {
    const lv = state.buildings[b.id]?.level || 0;
    const targets = b.area <= 2 ? [1, 5, 10, 25, 50]
                  : b.area <= 4 ? [1, 5, 10, 25]
                  :               [1, 5, 10];
    targets.forEach(target => {
      if (lv < target) pool.push({
        id:`${b.id}_lv${target}`, emoji:b.emoji,
        label:`${b.name}をLv${target}にする`,
        type:'building_level', buildingId:b.id, target,
        reward: Math.min(Math.floor(b.baseCost * target * 0.08), b.baseCost),
      });
    });
  });

  [5, 15, 30, 60, 100, 150, 230, 350, 500].forEach(t => {
    if (getTotalLv() < t) pool.push({
      id:`total_${t}`, emoji:'🏘️', label:`建物の総レベルを${t}にする`,
      type:'total_level', target:t,
      reward: Math.floor(t * 500 * Math.pow(1.5, Math.log10(t + 1))),
    });
  });

  [1000, 50000, 1000000, 50000000, 1000000000, 50000000000, 1000000000000].forEach(t => {
    if (state.totalEarned < t) pool.push({
      id:`earn_${t}`, emoji:'💰', label:`累計${fmt(t)}コインを稼ぐ`,
      type:'earn', target:t, reward: Math.floor(t * 0.08),
    });
  });

  const decoCount = Object.values(state.decorations || {}).filter(Boolean).length;
  [1, 3, 5, 8, 10].forEach(t => {
    if (decoCount < t) pool.push({
      id:`deco_${t}`, emoji:'🌺', label:`デコレーションを${t}個設置する`,
      type:'deco', target:t, reward: t * 5000,
    });
  });

  const resCount = Object.keys(state.research || {}).length;
  [1, 3, 5, 9].forEach(t => {
    if (resCount < t) pool.push({
      id:`res_${t}`, emoji:'🔬', label:`研究を${t}件完了する`,
      type:'research', target:t, reward: t * 20000,
    });
  });

  const skillCount = Object.keys(state.skills || {}).length;
  [1, 3, 5, 8, 13].forEach(t => {
    if (skillCount < t) pool.push({
      id:`skill_${t}`, emoji:'🌟', label:`スキルを${t}個習得する`,
      type:'skill', target:t, reward: t * 50000,
    });
  });

  [2, 3, 4, 5, 6].forEach(areaId => {
    if (!(state.unlockedAreas || [1]).includes(areaId)) {
      const area = AREAS.find(a => a.id === areaId);
      if (!area) return;
      pool.push({
        id:`unlock_area${areaId}`, emoji:area.emoji,
        label:`${area.name}（${area.desc}）を解放する`,
        type:'unlock_area', areaId, target:1,
        reward: Math.max(Math.floor(area.unlockCost * 0.05), 1000),
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
    case 'total_level':    return Math.min(getTotalLv(), q.target);
    case 'earn':           return Math.min(state.totalEarned, q.target);
    case 'deco':           return Math.min(Object.values(state.decorations||{}).filter(Boolean).length, q.target);
    case 'research':       return Math.min(Object.keys(state.research||{}).length, q.target);
    case 'skill':          return Math.min(Object.keys(state.skills||{}).length, q.target);
    case 'unlock_area':    return (state.unlockedAreas || [1]).includes(q.areaId) ? 1 : 0;
    default: return 0;
  }
}

function claimQuest(i) {
  const q = (state.quests?.active || [])[i];
  if (!q || q.claimed || getQuestProgress(q) < q.target) return;
  q.claimed = true;
  state.coins += q.reward; state.totalEarned += q.reward;
  state.quests.completedTotal = (state.quests.completedTotal || 0) + 1;
  spawnFloatCoins(`+${fmt(q.reward)}`);
  addLog(`🎯 クエスト完了：${q.label} +${fmt(q.reward)}コイン！`);
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
        <button class="btn-quest" onclick="claimQuest(${i})" ${q.claimed||!done?'disabled':''}>
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
