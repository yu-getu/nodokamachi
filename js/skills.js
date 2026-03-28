// ══════════════════════════════
//  スキルシステム
// ══════════════════════════════
function getTotalSkillPoints() {
  // 基本SP獲得源：建物Lv10到達 + 実績10件ごと
  const fromBuildings  = BUILDINGS.filter(b => (state.buildings?.[b.id]?.level || 0) >= 10).length;
  const achievCount    = Object.values(state.achievements || {}).filter(Boolean).length;
  const fromAchiev     = Math.floor(achievCount / 10);
  // 転生ボーナス：基本 +1 SP/転生 + 先祖の加護による追加（複数世代スキルがある場合は合算）
  const basePrestigeBonus = Math.max(0, state.prestigeCount || 0);
  const extraBonus = getPrestigeSkillEffect('prestige_sp_bonus');
  const spBonus = Math.floor(basePrestigeBonus + extraBonus * (state.prestigeCount || 0));
  return fromBuildings + fromAchiev + spBonus + (state.debugSkillSp || 0);
}

function getPrestigeSkillEffect(effect) {
  return PRESTIGE_SKILLS
    .filter(s => s.effect === effect && state.prestigeSkills?.[s.id])
    .reduce((sum, s) => sum + s.value, 0);
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
  playUnlockSfx();
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
  // シナジースキル：対象エリアが全て解放済みの場合のみ発動
  const unlockedAreas = state.unlockedAreas || [1];
  SKILLS.forEach(s => {
    if (s.effect !== 'cps_synergy') return;
    if (!state.skills?.[s.id]) return;
    if (!s.areas.includes(b.area)) return;
    if (!s.areas.every(a => unlockedAreas.includes(a))) return;
    mult += s.value;
  });
  return mult;
}
function getSkillCostMult() {
  const down = getSkillEffect('cost_down');
  return Math.max(0.1, 1 - down);
}
function getSkillResearchCostMult() {
  const down = getSkillEffect('research_cost');
  return Math.max(0.1, 1 - down);
}
function getSkillBeautyMult() {
  const add = getSkillEffect('beauty_mult');
  return 1 + add;
}
function getSkillClickMult() {
  return 1 + getSkillEffect('click_mult');
}
function getSkillQuestMult() {
  return 1 + getSkillEffect('quest_reward');
}


const SKILL_POS = {
  // ── Tier 1 ──
  farm_mastery:    { x: 0.17, tier: 1 },
  commerce_art:    { x: 0.50, tier: 1 },
  quick_hands:     { x: 0.83, tier: 1 },
  // ── Tier 2 ──
  beauty_power:    { x: 0.06, tier: 2 },
  nature_beauty:   { x: 0.20, tier: 2 },
  farm_market:     { x: 0.34, tier: 2 },
  culture_bloom:   { x: 0.50, tier: 2 },
  master_hands:    { x: 0.64, tier: 2 },
  event_sense:     { x: 0.78, tier: 2 },
  thrift:          { x: 0.92, tier: 2 },
  // ── Tier 3 ──
  healing_spirit:  { x: 0.06, tier: 3 },
  culture_healing: { x: 0.22, tier: 3 },
  city_dream:      { x: 0.42, tier: 3 },
  harvest_master:  { x: 0.60, tier: 3 },
  offline_master:  { x: 0.76, tier: 3 },
  research_gift:   { x: 0.92, tier: 3 },
  // ── Tier 4 ──
  town_vitality:   { x: 0.08, tier: 4 },
  beauty_all:      { x: 0.24, tier: 4 },
  city_space:      { x: 0.40, tier: 4 },
  event_lord:      { x: 0.56, tier: 4 },
  space_ambition:  { x: 0.74, tier: 4 },
  quest_wisdom:    { x: 0.90, tier: 4 },
  // ── Tier 5 ──
  miracle_town:    { x: 0.14, tier: 5 },
  harvest_limit:   { x: 0.36, tier: 5 },
  deep_sea_power:  { x: 0.62, tier: 5 },
  all_harmony:     { x: 0.84, tier: 5 },
  // ── Tier 6 ──
  achiev_eye:      { x: 0.20, tier: 6 },
  dim_mastery:     { x: 0.50, tier: 6 },
  galaxy_civ:      { x: 0.80, tier: 6 },
  // ── Tier 7 ──
  cosmos_wisdom:   { x: 0.35, tier: 7 },
  dim_enlighten:   { x: 0.65, tier: 7 },
};
const SKILL_ROW_H = 130;
const SKILL_TOP_PAD = 16;

function _skillY(tier) {
  return SKILL_TOP_PAD + (tier - 0.5) * SKILL_ROW_H;
}

function renderSkills() {
  const avail = getAvailableSkillPoints();
  const total = getTotalSkillPoints();
  const spent = getSpentSkillPoints();
  document.getElementById('skillSpAvail').textContent = avail;
  document.getElementById('skillSpTotal').textContent = total;
  document.getElementById('skillSpSpent').textContent = spent;

  const container = document.getElementById('skillTreeContent');
  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'skill-tree-wrap';
  wrap.id = 'skillTreeWrap';
  wrap.style.height = (7 * SKILL_ROW_H + SKILL_TOP_PAD * 2) + 'px';

  for (let t = 1; t <= 7; t++) {
    const lbl = document.createElement('div');
    lbl.className = 'sk-tier-label';
    lbl.textContent = `T${t}`;
    lbl.style.top = _skillY(t) + 'px';
    wrap.appendChild(lbl);
  }

  SKILLS.forEach(sk => {
    const pos = SKILL_POS[sk.id];
    if (!pos) return;
    const unlocked  = !!state.skills?.[sk.id];
    const canUnlock = canUnlockSkill(sk);
    const prereqMet = sk.requires.every(r => state.skills?.[r]);

    let stateClass = 'sk-locked';
    if (unlocked)       stateClass = 'sk-unlocked';
    else if (canUnlock) stateClass = 'sk-available';
    else if (prereqMet) stateClass = 'sk-prereq';

    const node = document.createElement('div');
    node.className = `skill-node ${stateClass}`;
    node.dataset.id = sk.id;
    node.style.cssText = `left:${pos.x * 100}%;top:${_skillY(pos.tier)}px;cursor:pointer`;
    node.innerHTML = `<div class="sk-icon">${sk.emoji}</div><div class="sk-name">${sk.name}</div>`;
    node.addEventListener('click', e => { e.stopPropagation(); showSkillDetail(sk.id); });
    wrap.appendChild(node);
  });

  container.appendChild(wrap);

  const prevOpen = document.getElementById('skillDetailPanel')?.dataset.openId;
  const detailArea = document.getElementById('skillDetailArea');
  if (detailArea) {
    detailArea.innerHTML = '';
    const detail = document.createElement('div');
    detail.id = 'skillDetailPanel';
    detail.className = 'skill-detail-panel';
    detail.style.display = 'none';
    detail.innerHTML = `
      <button class="skill-detail-close" onclick="closeSkillDetail()">✕</button>
      <div class="skill-detail-header">
        <span class="skill-detail-emoji" id="sdEmoji"></span>
        <div>
          <div class="skill-detail-name" id="sdName"></div>
          <div class="skill-detail-cost" id="sdCost"></div>
        </div>
      </div>
      <div class="skill-detail-desc" id="sdDesc"></div>
      <button class="sk-btn" id="sdBtn"></button>
      <button class="sk-btn sk-btn-all" id="sdBtnAll" style="display:none"></button>`;
    detailArea.appendChild(detail);
  }

  if (prevOpen) showSkillDetail(prevOpen);
}

// 未習得の前提スキルをトポロジカル順で返す
function _getUnlearnedPrereqsInOrder(id) {
  const ancestors = _getSkillAncestors(id);
  const unlearned = [...ancestors].filter(rid => !state.skills?.[rid]);
  // 依存関係を考慮した順序でソート（前提を先に）
  const sorted = [];
  const visited = new Set();
  function visit(sid) {
    if (visited.has(sid)) return;
    visited.add(sid);
    const s = SKILLS.find(x => x.id === sid);
    if (s) s.requires.forEach(r => { if (unlearned.includes(r)) visit(r); });
    if (unlearned.includes(sid)) sorted.push(sid);
  }
  unlearned.forEach(visit);
  return sorted;
}

function unlockSkillWithPrereqs(id) {
  const prereqs = _getUnlearnedPrereqsInOrder(id);
  const sk = SKILLS.find(s => s.id === id);
  if (!sk) return;
  const allIds = [...prereqs, id];
  const totalCost = allIds.reduce((sum, sid) => {
    const s = SKILLS.find(x => x.id === sid);
    return sum + (s && !state.skills?.[sid] ? s.cost : 0);
  }, 0);
  if (getAvailableSkillPoints() < totalCost) return;
  if (!state.skills) state.skills = {};
  allIds.forEach(sid => {
    const s = SKILLS.find(x => x.id === sid);
    if (s && !state.skills[sid]) { state.skills[sid] = true; }
  });
  playUnlockSfx();
  addLog(`🌟 スキル習得（${allIds.length}件）：${sk.emoji}${sk.name} まで一括取得！`);
  renderSkills();
  renderStats();
  showSkillDetail(id);
}

function showSkillDetail(id) {
  const sk = SKILLS.find(s => s.id === id);
  const panel = document.getElementById('skillDetailPanel');
  if (!sk || !panel) return;

  const unlocked = !!state.skills?.[sk.id];
  const canUnlock = canUnlockSkill(sk);
  const avail = getAvailableSkillPoints();
  const prereqMet = sk.requires.every(r => state.skills?.[r]);

  panel.dataset.openId = id;
  document.getElementById('sdEmoji').textContent = sk.emoji;
  document.getElementById('sdName').textContent = sk.name;
  document.getElementById('sdDesc').textContent = sk.desc;
  document.getElementById('sdCost').textContent =
    unlocked ? '✅ 習得済み' : `必要SP: ${sk.cost}（残り ${avail} SP）`;

  const btn = document.getElementById('sdBtn');
  const btnAll = document.getElementById('sdBtnAll');

  if (unlocked) {
    btn.textContent = '✅ 習得済み';
    btn.className = 'sk-btn sk-done';
    btn.disabled = true;
    if (btnAll) btnAll.style.display = 'none';
  } else if (canUnlock) {
    btn.textContent = `💎 習得する（${sk.cost} SP）`;
    btn.className = 'sk-btn';
    btn.disabled = false;
    btn.onclick = () => { unlockSkill(id); showSkillDetail(id); };
    if (btnAll) btnAll.style.display = 'none';
  } else {
    if (!prereqMet) {
      // 前提未習得 → まとめて習得ボタンを表示
      const prereqs = _getUnlearnedPrereqsInOrder(id);
      const totalCost = [...prereqs, id].reduce((sum, sid) => {
        const s = SKILLS.find(x => x.id === sid);
        return sum + (s && !state.skills?.[sid] ? s.cost : 0);
      }, 0);
      const canAffordAll = avail >= totalCost;
      btn.textContent = '🔒 前提スキル未習得';
      btn.className = 'sk-btn';
      btn.disabled = true;
      if (btnAll) {
        btnAll.style.display = 'block';
        btnAll.textContent = `⚡ まとめて習得（計 ${totalCost} SP / ${prereqs.length + 1}件）`;
        btnAll.disabled = !canAffordAll;
        btnAll.onclick = () => unlockSkillWithPrereqs(id);
      }
    } else {
      btn.textContent = '💎 SP不足';
      btn.className = 'sk-btn';
      btn.disabled = true;
      if (btnAll) btnAll.style.display = 'none';
    }
  }

  panel.style.display = 'block';
  _highlightSkillChain(id);
}

function closeSkillDetail() {
  const panel = document.getElementById('skillDetailPanel');
  if (panel) { panel.style.display = 'none'; delete panel.dataset.openId; }
  _highlightSkillChain(null);
}

// 選択スキルの全祖先IDを再帰的に取得
function _getSkillAncestors(id) {
  const ancestors = new Set();
  function traverse(skillId) {
    const sk = SKILLS.find(s => s.id === skillId);
    if (!sk) return;
    sk.requires.forEach(reqId => {
      if (!ancestors.has(reqId)) { ancestors.add(reqId); traverse(reqId); }
    });
  }
  if (id) traverse(id);
  return ancestors;
}

// ノードの枠を強調・減光してチェーンを視覚化
function _highlightSkillChain(selectedId) {
  const wrap = document.getElementById('skillTreeWrap');
  if (!wrap) return;

  const ancestors = _getSkillAncestors(selectedId);

  wrap.querySelectorAll('.skill-node').forEach(node => {
    const nid = node.dataset.id;
    node.classList.remove('sk-highlight-selected', 'sk-highlight-chain', 'sk-highlight-dim');
    if (!selectedId) return;
    if (nid === selectedId)       node.classList.add('sk-highlight-selected');
    else if (ancestors.has(nid))  node.classList.add('sk-highlight-chain');
    else                          node.classList.add('sk-highlight-dim');
  });
}
