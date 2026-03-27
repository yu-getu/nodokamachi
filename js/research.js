// ══════════════════════════════
//  研究システム
// ══════════════════════════════
function getResearchMult(bid) {
  let m = 1;
  RESEARCH.forEach(r => {
    if (!state.research[r.id]) return;
    if (r.targets.includes('all') || r.targets.includes(bid)) m *= r.mult;
  });
  return m;
}

function buyResearch(id) {
  const r = RESEARCH.find(x => x.id === id);
  if (!r || state.research[id]) return;
  const cost = Math.floor(r.cost * getSkillResearchCostMult());
  if (state.coins < cost) return;
  state.coins -= cost;
  state.research[id] = true;
  spawnFloatCoins(`-${fmt(cost)}`);
  playUnlockSfx();
  addLog(`🔬 研究完了：${r.name}！${r.desc}`);
  checkAchievements();
  renderResearch();
  render();
}

function renderResearch() {
  const grid = document.getElementById('researchGrid'); grid.innerHTML = '';
  RESEARCH.forEach(r => {
    const done = !!state.research[r.id];
    const cost = Math.floor(r.cost * getSkillResearchCostMult());
    const canAfford = !done && state.coins >= cost;
    const discounted = cost < r.cost;
    const div = document.createElement('div');
    div.className = `research-item ${done ? 'done' : canAfford ? 'affordable' : ''}`;
    div.innerHTML = `
      <span class="research-emoji">${r.emoji}</span>
      <div class="research-info">
        <div class="research-name">${r.name}</div>
        <div class="research-desc">${r.desc}</div>
      </div>
      <button class="btn-research ${done ? 'done' : ''}"
        onclick="buyResearch('${r.id}')"
        ${done || !canAfford ? 'disabled' : ''}>
        ${done ? '✅ 完了' : `🪙${fmt(cost)}${discounted ? '<span style="font-size:8px;opacity:.7;text-decoration:line-through;margin-left:2px">' + fmt(r.cost) + '</span>' : ''}`}
      </button>`;
    grid.appendChild(div);
  });
}
