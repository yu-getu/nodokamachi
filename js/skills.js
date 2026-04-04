// ══════════════════════════════
//  スキルシステム
// ══════════════════════════════
function getTotalSkillPoints() {
  // 基本SP獲得源：建物Lv10到達 + 実績10件ごと
  const fromBuildings  = BUILDINGS.filter(b => (state.buildings?.[b.id]?.level || 0) >= 100).length;
  const achievCount    = Object.values(state.achievements || {}).filter(Boolean).length;
  const fromAchiev     = Math.floor(achievCount / 10);
  // 先祖の加護スキルによる転生ボーナス
  const spBonus = Math.floor(getPrestigeSkillEffect('prestige_sp_bonus') * (state.prestigeCount || 0));
  return fromBuildings + fromAchiev + spBonus + (state.bonusSp || 0) + (state.debugSkillSp || 0);
}

function getPrestigeSkillEffect(effect) {
  return PRESTIGE_SKILLS
    .filter(s => s.effect === effect && state.prestigeSkills?.[s.id])
    .reduce((sum, s) => sum + s.value, 0);
}
function getSpentSkillPoints() {
  return SKILLS.filter(s => state.skills?.[s.id] && s.id !== state.inheritSkillId)
    .reduce((sum, s) => sum + s.cost, 0);
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

// ── SP変換 ──
function getSpConvertCost() {
  return Math.max(10000000, Math.floor(state.totalEarned * 0.01));
}
function convertCoinsToSp() {
  const cost = getSpConvertCost();
  if (state.coins < cost) return;
  state.coins -= cost;
  state.bonusSp = (state.bonusSp || 0) + 1;
  addLog(`💰 コインをSPに変換！ +1 SP（消費: ${fmt(cost)}コイン）`);
  renderSkills();
  renderStats();
  saveGame();
}

// ── スキル引き継ぎ ──
function setInheritSkill(id) {
  state.inheritSkillId = (state.inheritSkillId === id) ? null : id;
  renderSkills();
  saveGame();
}


const SKILL_POS = {
  // 左列（生産強化）x=0.20
  farm_mastery:    { x: 0.20, tier: 1  },
  commerce_art:    { x: 0.20, tier: 2  },
  culture_mastery: { x: 0.20, tier: 3  },
  healing_spirit:  { x: 0.20, tier: 4  },
  city_dream:      { x: 0.20, tier: 5  },
  space_ambition:  { x: 0.20, tier: 6  },
  deep_sea_power:  { x: 0.20, tier: 7  },
  dim_mastery:     { x: 0.20, tier: 8  },
  galaxy_civ:      { x: 0.20, tier: 9  },
  dim_enlighten:   { x: 0.20, tier: 10 },
  culture_bloom:   { x: 0.20, tier: 11 },
  eternal_creation:{ x: 0.20, tier: 12 },
  // 中列（飾り系）x=0.50
  nature_beauty:   { x: 0.50, tier: 1  },
  foundation_area1:{ x: 0.50, tier: 2  },
  foundation_area2:{ x: 0.50, tier: 3  },
  foundation_area3:{ x: 0.50, tier: 4  },
  foundation_area4:{ x: 0.50, tier: 5  },
  foundation_area5:{ x: 0.50, tier: 6  },
  foundation_area6:{ x: 0.50, tier: 7  },
  beauty_power:    { x: 0.50, tier: 8  },
  event_sense:     { x: 0.50, tier: 9  },
  event_lord:      { x: 0.50, tier: 10 },
  deco_mastery:    { x: 0.50, tier: 11 },
  beauty_feast:    { x: 0.50, tier: 12 },
  // 右列（効率系）x=0.80
  thrift:          { x: 0.80, tier: 1  },
  research_gift:   { x: 0.80, tier: 2  },
  achiev_eye:      { x: 0.80, tier: 3  },
  offline_master:  { x: 0.80, tier: 4  },
  farm_market:     { x: 0.80, tier: 5  },
  culture_heal:    { x: 0.80, tier: 6  },
  city_space:      { x: 0.80, tier: 7  },
  deep_dim:        { x: 0.80, tier: 8  },
  culture_cosmos:  { x: 0.80, tier: 9  },
  minigame_master: { x: 0.80, tier: 10 },
  cost_thrift:     { x: 0.80, tier: 11 },
  cost_mastery:    { x: 0.80, tier: 12 },
};
const SKILL_ROW_H = 110;
const SKILL_TOP_PAD = 30;

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

  const descEl = document.getElementById('skillSpDesc');
  if (descEl) {
    const hasAncestor = !!state.prestigeSkills?.ancestor_grace;
    const bonus = getPrestigeSkillEffect('prestige_sp_bonus');
    const ancestorNote = hasAncestor
      ? `・🙏 先祖の加護：転生ごとに+${bonus}SP（現在 +${Math.floor(bonus * (state.prestigeCount || 0))}SP）`
      : '';
    descEl.textContent = `建物1種がLv100に初到達するごとに+1SP・実績10件ごとに+1SP${ancestorNote}。スキルは転生でリセットされます。`;
  }

  // ── SP変換バー ──
  const convertBar = document.getElementById('spConvertBar');
  if (convertBar) {
    const cost = getSpConvertCost();
    const canConvert = state.coins >= cost;
    convertBar.innerHTML = `
      <div class="sp-convert-inner">
        <span class="sp-convert-label">💰→💎 SP変換</span>
        <span class="sp-convert-cost">${fmt(cost)} コイン / 1SP</span>
        <button class="btn-sp-convert" onclick="convertCoinsToSp()" ${canConvert ? '' : 'disabled'}>変換</button>
      </div>`;
  }

  // ── 引き継ぎスキルバー ──
  const inheritBar = document.getElementById('inheritSkillBar');
  if (inheritBar) {
    if (state.prestigeSkills?.skill_inherit) {
      const inherited = state.inheritSkillId;
      const sk = inherited ? SKILLS.find(s => s.id === inherited) : null;
      inheritBar.style.display = '';
      inheritBar.innerHTML = `
        <div class="inherit-bar-inner">
          <span class="inherit-bar-label">🔖 引き継ぎスキル</span>
          <span class="inherit-bar-current">${sk ? `${sk.emoji} ${sk.name}` : '未選択'}</span>
          <span class="inherit-bar-hint">習得済みスキルをクリックして設定</span>
        </div>`;
    } else {
      inheritBar.style.display = 'none';
    }
  }

  const container = document.getElementById('skillTreeContent');
  container.innerHTML = '';

  const _maxTier = Math.max(...Object.values(SKILL_POS).map(p => p.tier));

  const wrap = document.createElement('div');
  wrap.className = 'skill-tree-wrap';
  wrap.id = 'skillTreeWrap';
  wrap.style.height = (_maxTier * SKILL_ROW_H + SKILL_TOP_PAD * 2) + 'px';

  // 列ヘッダー
  [['🥕 生産強化', 0.20], ['🌺 飾り系', 0.50], ['📋 効率系', 0.80]].forEach(([label, x]) => {
    const hdr = document.createElement('div');
    hdr.className = 'sk-col-header';
    hdr.textContent = label;
    hdr.style.cssText = `left:${x * 100}%;top:6px;transform:translateX(-50%)`;
    wrap.appendChild(hdr);
  });

  for (let t = 1; t <= _maxTier; t++) {
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

    const isInherited = state.inheritSkillId === sk.id;
    const node = document.createElement('div');
    node.className = `skill-node ${stateClass}${isInherited ? ' sk-inherited' : ''}`;
    node.dataset.id = sk.id;
    node.style.cssText = `left:${pos.x * 100}%;top:${_skillY(pos.tier)}px;cursor:pointer`;
    node.innerHTML = `<div class="sk-icon">${sk.emoji}${isInherited ? '<span class="sk-inherit-badge">🔖</span>' : ''}</div><div class="sk-name">${sk.name}</div>`;
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

  // 引き継ぎ設定ボタン
  let inheritBtn = document.getElementById('sdInheritBtn');
  if (!inheritBtn) {
    inheritBtn = document.createElement('button');
    inheritBtn.id = 'sdInheritBtn';
    inheritBtn.className = 'sk-btn sk-inherit-btn';
    panel.appendChild(inheritBtn);
  }
  if (unlocked && state.prestigeSkills?.skill_inherit) {
    const isInherited = state.inheritSkillId === id;
    inheritBtn.style.display = 'block';
    inheritBtn.textContent = isInherited ? '🔖 引き継ぎ解除' : '🔖 引き継ぎスキルに設定';
    inheritBtn.className = `sk-btn sk-inherit-btn${isInherited ? ' active' : ''}`;
    inheritBtn.onclick = () => setInheritSkill(id);
  } else {
    inheritBtn.style.display = 'none';
  }

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
        const bulkSkUnlocked = !!state.prestigeSkills?.unlock_bulk_sk;
        if (bulkSkUnlocked) {
          btnAll.style.display = 'block';
          btnAll.textContent = `⚡ まとめて習得（計 ${totalCost} SP / ${prereqs.length + 1}件）`;
          btnAll.disabled = !canAffordAll;
          btnAll.onclick = () => unlockSkillWithPrereqs(id);
        } else {
          btnAll.style.display = 'none';
        }
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
