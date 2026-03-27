// ══════════════════════════════
//  デコレーションシステム
// ══════════════════════════════
function getBeautyScore() {
  if (!state.decorations) return 0;
  return DECORATIONS.reduce((s, d) => s + (state.decorations[d.id] ? d.beautyPts : 0), 0);
}
function getBeautyMult() { return (1 + getBeautyScore() * 0.01) * getSkillBeautyMult(); }

// エリアシナジー（area_cps + all_cps を合算）
function getDecoAreaMult(areaId) {
  let bonus = 0;
  DECORATIONS.forEach(d => {
    if (!state.decorations[d.id]) return;
    const e = d.effect;
    if (e.type === 'area_cps' && e.area === areaId) bonus += e.value;
    if (e.type === 'all_cps') bonus += e.value;
  });
  return 1 + bonus;
}

// 建物個別シナジー
function getDecoBuildingMult(buildingId) {
  let bonus = 0;
  DECORATIONS.forEach(d => {
    if (!state.decorations[d.id]) return;
    const e = d.effect;
    if (e.type === 'building_cps' && e.targets.includes(buildingId)) bonus += e.value;
  });
  return 1 + bonus;
}

// 手動収穫シナジー
function getDecoCollectMult() {
  let bonus = 0;
  DECORATIONS.forEach(d => {
    if (state.decorations[d.id] && d.effect.type === 'collect') bonus += d.effect.value;
  });
  return 1 + bonus;
}

// イベントシナジー
function getDecoEventBonus() {
  let bonus = 0;
  DECORATIONS.forEach(d => {
    if (state.decorations[d.id] && d.effect.type === 'event_bonus') bonus += d.effect.value;
  });
  return bonus;
}

function buyDecoration(id) {
  const d = DECORATIONS.find(x => x.id === id);
  if (!d || state.decorations[id] || state.coins < d.cost) return;
  state.coins -= d.cost;
  state.decorations[id] = true;
  spawnFloatCoins(`-${fmt(d.cost)}`);
  playUnlockSfx();
  addLog(`🌺 ${d.emoji}${d.name}を設置！美観+${d.beautyPts} / ${d.effectDesc}`);
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
      <div class="deco-effect">✨ 美観 +${d.beautyPts}pt</div>
      <div class="deco-synergy">🔗 ${d.effectDesc}</div>
      <button class="btn-buy ${owned ? 'maxed-btn' : ''}"
        onclick="buyDecoration('${d.id}')"
        ${owned || !canAfford ? 'disabled' : ''}>
        ${owned ? '✅ 設置済み' : `🪙${fmt(d.cost)} 設置`}
      </button>`;
    grid.appendChild(div);
  });
}
