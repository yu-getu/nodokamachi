// ══════════════════════════════
//  スキルシステム
// ══════════════════════════════
function getTotalSkillPoints() {
  return Math.floor(getTotalLv() / 8)
    + Math.floor((state.quests?.completedTotal || 0) / 5)
    + (state.prestigeCount || 0);
}
function getSpentSkillPoints() {
  return SKILLS.filter(s => state.skills?.[s.id]).reduce((sum, s) => sum + s.cost, 0);
}
function getAvailableSkillPoints() {
  return Math.max(0, getTotalSkillPoints() - getSpentSkillPoints());
}
function canUnlockSkill(sk) {
  if (state.skills?.[sk.id]) return false;
  if (getAvailableSkillPoints() < sk.cost) return false;
  return sk.requires.every(r => state.skills?.[r]);
}
function unlockSkill(id) {
  const sk = SKILLS.find(s => s.id === id);
  if (!sk || !canUnlockSkill(sk)) return;
  if (!state.skills) state.skills = {};
  state.skills[id] = true;
  addLog(`🌟 スキル習得：${sk.emoji}${sk.name}！${sk.desc}`);
  renderSkills();
  renderStats();
}
function getSkillEffect(effect) {
  return SKILLS.filter(s => s.effect === effect && state.skills?.[s.id])
    .reduce((sum, s) => sum + s.value, 0);
}
function getSkillCpsMult(b) {
  let mult = 1;
  const allAdd = getSkillEffect('cps_all');
  mult += allAdd;
  const areaAdd = getSkillEffect(`cps_area${b.area}`);
  mult += areaAdd;
  const mulBonus = getSkillEffect('cps_mult');
  mult *= (1 + mulBonus);
  return mult;
}
function getSkillCostMult() {
  const down = getSkillEffect('cost_down');
  return Math.max(0.1, 1 - down);
}
function getSkillCollectMult() {
  const add = getSkillEffect('collect_mult');
  return 1 + add;
}
function getSkillResearchCostMult() {
  const down = getSkillEffect('research_cost');
  return Math.max(0.1, 1 - down);
}
function getSkillBeautyMult() {
  const add = getSkillEffect('beauty_mult');
  return 1 + add;
}

// ── ツリー型レイアウト設定 ──
// x: コンテナ幅に対する割合（0〜1）、tier: 段（1〜6）
const SKILL_POS = {
  farm_mastery: { x: 0.16, tier: 1 },
  commerce_art: { x: 0.50, tier: 1 },
  quick_hands: { x: 0.84, tier: 1 },
  beauty_power: { x: 0.16, tier: 2 },
  culture_bloom: { x: 0.50, tier: 2 },
  thrift: { x: 0.84, tier: 2 },
  healing_spirit: { x: 0.22, tier: 3 },
  city_dream: { x: 0.50, tier: 3 },
  research_gift: { x: 0.78, tier: 3 },
  town_vitality: { x: 0.34, tier: 4 },
  space_ambition: { x: 0.66, tier: 4 },
  miracle_town: { x: 0.50, tier: 5 },
  galaxy_civ: { x: 0.50, tier: 6 },
};
const SKILL_ROW_H = 100;
const SKILL_TOP_PAD = 10;

function renderSkills() {
  const avail = getAvailableSkillPoints();
  const total = getTotalSkillPoints();
  const spent = getSpentSkillPoints();
  document.getElementById('skillSpAvail').textContent = avail;
  document.getElementById('skillSpTotal').textContent = total;
  document.getElementById('skillSpSpent').textContent = spent;

  const container = document.getElementById('skillTreeContent');
  container.innerHTML = '';

  // 凡例
  const legend = document.createElement('div');
  legend.classList.add('sk-legend');
  legend.innerHTML = `
    <div class="sk-legend-item"><div class="sk-legend-line" style="background:#4caf50"></div>習得済み</div>
    <div class="sk-legend-item"><div class="sk-legend-line" style="background:#9c27b0"></div>習得可能</div>
    <div class="sk-legend-item"><div class="sk-legend-line" style="background:#ccc;border-top:2px dashed #bbb;height:0"></div>前提未達</div>`;
  container.appendChild(legend);

  // ツリーコンテナ
  const wrap = document.createElement('div');
  wrap.className = 'skill-tree-wrap';
  wrap.id = 'skillTreeWrap';
  wrap.style.height = (6 * SKILL_ROW_H + SKILL_TOP_PAD * 2) + 'px';

  // SVGオーバーレイ（コネクター線）
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.className = 'skill-tree-svg';
  svg.id = 'skillTreeSvg';
  wrap.appendChild(svg);

  // Tierラベル（左端）
  for (let t = 1; t <= 6; t++) {
    const lbl = document.createElement('div');
    lbl.className = 'sk-tier-label';
    lbl.textContent = `T${t}`;
    lbl.style.top = (_skillY(t)) + 'px';
    wrap.appendChild(lbl);
  }

  // スキルノード
  SKILLS.forEach(sk => {
    const pos = SKILL_POS[sk.id];
    if (!pos) return;

    const unlocked = !!state.skills?.[sk.id];
    const canUnlock = canUnlockSkill(sk);
    const prereqMet = sk.requires.every(r => state.skills?.[r]);

    let stateClass = 'sk-locked';
    if (unlocked) stateClass = 'sk-unlocked';
    else if (canUnlock) stateClass = 'sk-available';
    else if (prereqMet) stateClass = 'sk-prereq';

    const node = document.createElement('div');
    node.className = `skill-node ${stateClass}`;
    node.dataset.id = sk.id;
    node.style.cssText = `left:${pos.x * 100}%;top:${_skillY(pos.tier)}px`;

    const btnLabel = unlocked ? '✅ 習得済み' : `💎 ${sk.cost} SP`;
    node.innerHTML = `
      <div class="sk-icon">${sk.emoji}</div>
      <div class="sk-name">${sk.name}</div>
      <div class="sk-eff">${sk.desc}</div>
      <button class="sk-btn ${unlocked ? 'sk-done' : ''}"
        onclick="unlockSkill('${sk.id}')"
        ${unlocked || !canUnlock ? 'disabled' : ''}>
        ${btnLabel}
      </button>`;
    wrap.appendChild(node);
  });

  container.appendChild(wrap);

  // DOM確定後にSVG線を描画
  requestAnimationFrame(() => _drawSkillLines());
}

function _skillY(tier) {
  return SKILL_TOP_PAD + (tier - 0.5) * SKILL_ROW_H;
}

function _drawSkillLines() {
  const wrap = document.getElementById('skillTreeWrap');
  const svg = document.getElementById('skillTreeSvg');
  if (!wrap || !svg) return;

  svg.innerHTML = '';
  svg.setAttribute('width', wrap.offsetWidth);
  svg.setAttribute('height', wrap.offsetHeight);

  SKILLS.forEach(sk => {
    const childEl = wrap.querySelector(`.skill-node[data-id="${sk.id}"]`);
    if (!childEl) return;

    // offsetLeft/Top = visual center (transform: translate(-50%,-50%) 考慮済み)
    const cx = childEl.offsetLeft;
    const cy = childEl.offsetTop;
    const ch = childEl.offsetHeight;

    const childUnlocked = !!state.skills?.[sk.id];

    sk.requires.forEach(reqId => {
      const parentEl = wrap.querySelector(`.skill-node[data-id="${reqId}"]`);
      if (!parentEl) return;

      const px = parentEl.offsetLeft;
      const py = parentEl.offsetTop;
      const ph = parentEl.offsetHeight;

      const parentUnlocked = !!state.skills?.[reqId];

      // ベジェ曲線：親ノード底辺 → 子ノード上辺
      const startX = px, startY = py + ph / 2 + 2;
      const endX = cx, endY = cy - ch / 2 - 2;
      const midY = (startY + endY) / 2;

      let color, dash, strokeW;
      if (childUnlocked && parentUnlocked) {
        color = '#4caf50'; dash = ''; strokeW = '3';
      } else if (parentUnlocked) {
        color = '#9c27b0'; dash = ''; strokeW = '2.5';
      } else {
        color = '#bbb'; dash = '5,4'; strokeW = '1.5';
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', strokeW);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      if (dash) path.setAttribute('stroke-dasharray', dash);
      svg.appendChild(path);

      // 矢印（子ノードの直上）
      const aw = 5;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      arrow.setAttribute('points',
        `${endX},${endY} ${endX - aw},${endY - aw * 1.6} ${endX + aw},${endY - aw * 1.6}`);
      arrow.setAttribute('fill', color);
      svg.appendChild(arrow);
    });
  });
}
