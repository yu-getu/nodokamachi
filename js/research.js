// ══════════════════════════════
//  研究システム（施設別Tier制）
// ══════════════════════════════
function getResearchMult(bid) {
  let m = 1;
  RESEARCH_TIERS.forEach(t => {
    if (state.research[`${bid}_${t.tier}`]) m *= t.mult;
  });
  return m;
}

function getResearchCost(bid, tier) {
  const b = BUILDINGS.find(x => x.id === bid);
  const t = RESEARCH_TIERS.find(x => x.tier === tier);
  if (!b || !t) return Infinity;
  return Math.floor(b.baseCost * t.costMult * getSkillResearchCostMult());
}

// Tier4/5は「最大解放区 - 2」以下のエリアの施設のみ解放
function isAdvancedResearchAvailable(b) {
  const maxArea = Math.max(...(state.unlockedAreas || [1]));
  return b.area <= maxArea - 2;
}

function buyResearch(bid, tier) {
  const key = `${bid}_${tier}`;
  if (state.research[key]) return;
  if (tier > 1 && !state.research[`${bid}_${tier - 1}`]) return;
  const t = RESEARCH_TIERS.find(x => x.tier === tier);
  const b = BUILDINGS.find(x => x.id === bid);
  if (!b || !t) return;
  if (t.advancedOnly && !isAdvancedResearchAvailable(b)) return;
  const cost = getResearchCost(bid, tier);
  if (state.coins < cost) return;
  state.coins -= cost;
  state.research[key] = true;
  state.totalSpent = (state.totalSpent || 0) + cost;
  spawnFloatCoins(`-${fmt(cost)}`);
  playUnlockSfx();
  addLog(`🔬 研究完了：${b.emoji}${b.name} ${t.label}（CPS ×${t.mult}）`);
  checkAchievements();
  render();
  renderResearch();
}

function buyResearchAll(bid) {
  if (!state.prestigeSkills?.unlock_bulk_res) return;
  const b = BUILDINGS.find(x => x.id === bid);
  if (!b) return;
  const unlockedTiers = RESEARCH_TIERS.filter(t => {
    if (state.research[`${bid}_${t.tier}`]) return false;
    if (t.advancedOnly && !isAdvancedResearchAvailable(b)) return false;
    return true;
  });
  const totalCost = unlockedTiers.reduce((sum, t) => sum + getResearchCost(bid, t.tier), 0);
  if (state.coins < totalCost) return;
  state.coins -= totalCost;
  state.totalSpent = (state.totalSpent || 0) + totalCost;
  unlockedTiers.forEach(t => { state.research[`${bid}_${t.tier}`] = true; });
  spawnFloatCoins(`-${fmt(totalCost)}`);
  playUnlockSfx();
  addLog(`🔬 一括研究完了：${b.emoji}${b.name} 全Tier！`);
  checkAchievements();
  render();
  renderResearch();
}

function renderResearch() {
  const grid = document.getElementById('researchGrid');
  grid.innerHTML = '';
  const unlockedAreas = state.unlockedAreas || [1];
  const areaIds = [...new Set(BUILDINGS.map(b => b.area))];

  areaIds.forEach(areaId => {
    const area = AREAS.find(a => a.id === areaId);
    const isUnlocked = unlockedAreas.includes(areaId);
    const buildings = BUILDINGS.filter(b => b.area === areaId);

    if (!isUnlocked) return;

    const section = document.createElement('div');
    section.className = 'research-area-section';

    const header = document.createElement('div');
    header.className = 'research-area-header';
    header.innerHTML = `${area.emoji} ${area.name}`;
    section.appendChild(header);

    buildings.forEach(b => {
      if (!state.buildings[b.id] || state.buildings[b.id].level === 0) return;
      const row = document.createElement('div');
      row.className = 'research-building-row';

      const advAvail = isAdvancedResearchAvailable(b);

      const tierBtns = RESEARCH_TIERS.map(t => {
        // advancedOnlyティアは解放条件未達時は非表示
        if (t.advancedOnly && !advAvail) return '';

        const key = `${b.id}_${t.tier}`;
        const done = !!state.research[key];
        const prevDone = t.tier === 1 || !!state.research[`${b.id}_${t.tier - 1}`];
        const cost = getResearchCost(b.id, t.tier);
        const canAfford = !done && prevDone && state.coins >= cost;
        const available = !done && prevDone;

        let cls = 'btn-research-tier';
        if (done) cls += ' done';
        else if (t.advancedOnly) cls += ' advanced';
        if (!done) {
          if (!available) cls += ' locked';
          else if (canAfford) cls += ' affordable';
        }

        const label = done
          ? `${t.emoji}<br>✅`
          : `${t.emoji}<br><span class="rt-cost">${fmt(cost)}</span>`;

        return `<button class="${cls}"
          title="${t.label}（CPS ×${t.mult}）"
          onclick="buyResearch('${b.id}',${t.tier})"
          ${(done || !canAfford) ? 'disabled' : ''}>
          ${label}
        </button>`;
      }).join('');

      const bulkResUnlocked = !!state.prestigeSkills?.unlock_bulk_res;
      const allDone = RESEARCH_TIERS.filter(t => !t.advancedOnly || advAvail)
        .every(t => !!state.research[`${b.id}_${t.tier}`]);
      const bulkCost = RESEARCH_TIERS
        .filter(t => !state.research[`${b.id}_${t.tier}`] && (!t.advancedOnly || advAvail))
        .reduce((sum, t) => sum + getResearchCost(b.id, t.tier), 0);
      const bulkBtn = bulkResUnlocked && !allDone
        ? `<button class="btn-research-all${state.coins >= bulkCost ? ' affordable' : ''}"
            onclick="buyResearchAll('${b.id}')"
            ${state.coins < bulkCost ? 'disabled' : ''}
            title="全Tier一括研究">⚡<br><span class="rt-cost">${fmt(bulkCost)}</span></button>`
        : '';

      // 上位ティア解放ヒント
      const advHint = !advAvail
        ? `<span class="rb-adv-hint">🏗️ ${b.area + 2}区解放で地域振興・街の誇り解放</span>`
        : '';

      row.innerHTML = `
        <span class="rb-emoji">${b.emoji}</span>
        <span class="rb-name">${b.name}${advHint}</span>
        <div class="rb-tiers">${tierBtns}${bulkBtn}</div>`;
      section.appendChild(row);
    });

    grid.appendChild(section);
  });
}
