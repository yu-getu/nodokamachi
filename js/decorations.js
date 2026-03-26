// ══════════════════════════════
//  デコレーションシステム
// ══════════════════════════════
function getBeautyScore() {
  if (!state.decorations) return 0;
  return DECORATIONS.reduce((s, d) => s + (state.decorations[d.id] ? d.beautyPts : 0), 0);
}
function getBeautyMult() { return (1 + getBeautyScore() * 0.01) * getSkillBeautyMult(); }

function buyDecoration(id) {
  const d = DECORATIONS.find(x => x.id === id);
  if (!d || state.decorations[id] || state.coins < d.cost) return;
  state.coins -= d.cost;
  state.decorations[id] = true;
  spawnFloatCoins(`-${fmt(d.cost)}`);
  addLog(`🌺 ${d.emoji}${d.name}を設置！美観+${d.beautyPts}`);
  renderDeco();
  renderTown();
  render();
}

function renderDeco() {
  const grid = document.getElementById('decoGrid'); grid.innerHTML = '';
  const score = getBeautyScore();
  document.getElementById('beautyScore').textContent = score;
  document.getElementById('beautyBonus').textContent = score;

  DECORATIONS.forEach(d => {
    const owned = !!state.decorations[d.id];
    const canAfford = !owned && state.coins >= d.cost;
    const div = document.createElement('div');
    div.className = `deco-item ${owned ? 'owned' : canAfford ? 'affordable' : ''}`;
    div.innerHTML = `
      <div class="deco-item-top">
        <span class="deco-emoji">${d.emoji}</span>
        <div>
          <div class="deco-name">${d.name}</div>
          <div class="deco-desc">${d.desc}</div>
        </div>
      </div>
      <div class="deco-effect">✨ 美観 +${d.beautyPts} pt → CPS +${d.beautyPts}%</div>
      <button class="btn-buy ${owned ? 'maxed-btn' : ''}"
        onclick="buyDecoration('${d.id}')"
        ${owned || !canAfford ? 'disabled' : ''}>
        ${owned ? '✅ 設置済み' : `🪙${fmt(d.cost)} 設置`}
      </button>`;
    grid.appendChild(div);
  });
}
