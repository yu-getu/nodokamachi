// ══════════════════════════════
//  転生システム
// ══════════════════════════════
let _prestigeReadyNotified = false;

function checkPrestigeNotify() {
  const can = state.totalEarned >= getPrestigeRequired();
  const tabBtn = document.getElementById('tab-prestige');
  if (can) {
    if (!_prestigeReadyNotified) {
      _prestigeReadyNotified = true;
      addLog('⭐ 転生できるようになりました！転生タブを確認しよう！');
      playAchievSfx();
    }
    if (tabBtn) tabBtn.classList.add('tab-notify');
  } else {
    if (tabBtn) tabBtn.classList.remove('tab-notify');
  }
  updatePrestigeProgress();
}

function getPrestigeBonusSp() {
  const req = getPrestigeRequired();
  if (state.totalEarned < req) return 0;
  const ratio = state.totalEarned / req;
  if (ratio >= 30) return 3;
  if (ratio >= 10) return 2;
  if (ratio >= 3)  return 1;
  return 0;
}

function getPrestigeMult() {
  const rate = 0.15 + getPrestigeSkillEffect('prestige_cps_rate');
  return 1 + state.prestigeCount * rate;
}
function getPrestigeRequired() { return 5000000000 * Math.pow(5, state.prestigeCount); }

function confirmPrestige() {
  renderPrestige();
  document.getElementById('prestigeModal').classList.add('show');
}

function doPrestige() {
  closeModal('prestigeModal');
  _prestigeReadyNotified = false;
  if (getCurrentSeason().id === 'winter') state.prestigeInWinter = true;
  const bonusSp = getPrestigeBonusSp();
  const seasonId = getCurrentSeason().id;
  const hourNow = new Date().getHours();
  if (seasonId === 'spring') state.prestigeInSpring = true;
  if (seasonId === 'summer') state.prestigeInSummer = true;
  if (seasonId === 'autumn') state.prestigeInAutumn = true;
  if (hourNow >= 0 && hourNow < 4) state.nightPrestige = true;
  if (!_bgmOn && !_sfxOn) state.silentPrestige = true;
  if (bonusSp >= 3) state.gotMaxPrestigeBonus = true;
  if (BUILDINGS.every(b => (state.buildings[b.id]?.level || 0) >= 100)) state.perfectPrestige = true;
  state.prestigeCount++;
  state.prestigeSp = (state.prestigeSp || 0) + 1 + bonusSp;
  state.allTimeTotalEarned = (state.allTimeTotalEarned || 0) + (state.totalEarned || 0);
  state.coins = 0; state.totalEarned = 0;
  BUILDINGS.forEach(b => { state.buildings[b.id] = { level: 0 }; });
  state.activeEvents = []; state.eventDiscount = 1; state.skills = {}; state.research = {};
  const prevQuestTotal = state.quests?.completedTotal || 0;
  state.quests = null;
  const newMax = getMaxLevel();
  const curMult = getPrestigeMult().toFixed(1);
  const spGain = 1 + bonusSp;
  addLog(`⭐ 転生(${state.prestigeCount}回目)！Lv上限→${newMax}、CPS倍率×${curMult}、世代SP+${spGain}${bonusSp > 0 ? `（ボーナス+${bonusSp}）` : ''}`);
  saveGame(); checkAchievements(); render(); renderPrestige();
  checkQuestRefresh();
  if (state.quests) state.quests.completedTotal = prevQuestTotal;
  renderQuests();
  document.getElementById('prestigeBadge').style.display = 'flex';
  document.getElementById('prestigeCount').textContent = state.prestigeCount;
  for (let i = 0; i < 10; i++) setTimeout(() => spawnFloatCoins('⭐'), i * 100);
}

function renderPrestige() {
  const newMax = BASE_MAX_LV + (state.prestigeCount + 1) * PRESTIGE_LV_BONUS;
  const rate = 0.15 + getPrestigeSkillEffect('prestige_cps_rate');
  const nextMult = (1 + (state.prestigeCount + 1) * rate).toFixed(1);
  const curMult = getPrestigeMult().toFixed(1);
  document.getElementById('prestigeInfo').innerHTML =
    `現在の永続CPS倍率：<strong style="color:var(--prestige2)">×${curMult}</strong><br>
     現在のレベル上限：<strong style="color:var(--prestige2)">Lv${getMaxLevel()}</strong>`;
  const bonusSp = getPrestigeBonusSp();
  const spLabel = bonusSp > 0 ? `+${1 + bonusSp} PSP獲得（ボーナス+${bonusSp}）` : '+1 PSP獲得';
  document.getElementById('prestigeBonusList').innerHTML =
    `<div class="prestige-bonus-item"><span class="pb-icon">⭐</span>永続CPS倍率 → ×<strong>${nextMult}</strong></div>
     <div class="prestige-bonus-item"><span class="pb-icon">📈</span>レベル上限 → <strong>Lv${newMax}</strong>（+${PRESTIGE_LV_BONUS}）</div>
     <div class="prestige-bonus-item"><span class="pb-icon">💎</span>世代SP → ${spLabel}</div>
     <div class="prestige-bonus-item"><span class="pb-icon">📌</span>実績・転生回数・世代スキルは引き継ぎ</div>
     <div class="prestige-bonus-item"><span class="pb-icon">🔄</span>コイン・建物・研究・通常スキル・マイルストーンはリセット</div>`;
  document.getElementById('prestigeHistory').innerHTML =
    state.prestigeCount > 0 ? '⭐'.repeat(Math.min(state.prestigeCount, 10)) + ` ${state.prestigeCount}回転生済み` : 'まだ転生したことがありません';
  updatePrestigeProgress();
  renderPrestigeSkillTree();
}

function updatePrestigeProgress() {
  const req = getPrestigeRequired();
  const can = state.totalEarned >= req;
  const prog = Math.min(100, (state.totalEarned / req) * 100);
  const reqEl      = document.getElementById('prestigeReq');
  const barEl      = document.getElementById('prestigeProgressBar');
  const bonusBarEl = document.getElementById('prestigeBonusBar');
  const btnEl      = document.getElementById('btnPrestigeConfirm');
  const bonusEl    = document.getElementById('prestigeBonusSpInfo');
  if (!reqEl) return;
  reqEl.innerHTML =
    `転生条件：累計コイン <strong style="color:var(--prestige2)">${fmt(req)}</strong> 以上<br>
     現在：${fmt(state.totalEarned)} ${can ? '✅ 転生可能！' : '（あと ' + fmt(req - state.totalEarned) + '）'}`;
  if (barEl) barEl.style.width = `${prog}%`;
  if (btnEl) btnEl.disabled = !can;
  const mainBtnEl = document.getElementById('btnPrestige');
  if (mainBtnEl) mainBtnEl.disabled = false;  // 転生タブのボタンは常に有効（リワード確認用）
  if (bonusBarEl) {
    if (!can) {
      bonusBarEl.style.display = 'none';
    } else {
      bonusBarEl.style.display = 'block';
      const ratio = state.totalEarned / req;
      let bonusProg;
      if (ratio >= 30)      bonusProg = 100;
      else if (ratio >= 10) bonusProg = 66 + ((ratio - 10) / 20) * 34;
      else if (ratio >= 3)  bonusProg = 33 + ((ratio - 3)  /  7) * 33;
      else                  bonusProg =       ((ratio - 1)  /  2) * 33;
      bonusBarEl.style.width = `${Math.min(100, bonusProg).toFixed(1)}%`;
    }
  }
  if (bonusEl) {
    if (!can) {
      bonusEl.style.display = 'none';
    } else {
      bonusEl.style.display = 'block';
      const bonusSp = getPrestigeBonusSp();
      const ratio = state.totalEarned / req;
      const milestones = [3, 10, 30];
      const next = milestones.find(m => ratio < m);
      let html = `<span class="prestige-bonus-sp-label">💎 ボーナスPSP：<strong>+${bonusSp}</strong>　`;
      if (next) {
        html += `条件×${next}（${fmt(req * next)}）達成で +${bonusSp + 1}PSP`;
      } else {
        html += `🏅 最大ボーナス達成！`;
      }
      html += `</span>`;
      bonusEl.innerHTML = html;
    }
  }
}

// ── 世代スキルツリー ──
function getAvailablePrestigeSp() {
  const spent = PRESTIGE_SKILLS
    .filter(s => state.prestigeSkills?.[s.id])
    .reduce((sum, s) => sum + s.cost, 0);
  return Math.max(0, (state.prestigeSp || 0) - spent);
}

function canUnlockPrestigeSkill(sk) {
  if (state.prestigeSkills?.[sk.id]) return false;
  if (getAvailablePrestigeSp() < sk.cost) return false;
  return sk.requires.every(r => state.prestigeSkills?.[r]);
}

function unlockPrestigeSkill(id) {
  const sk = PRESTIGE_SKILLS.find(s => s.id === id);
  if (!sk || !canUnlockPrestigeSkill(sk)) return;
  if (!state.prestigeSkills) state.prestigeSkills = {};
  state.prestigeSkills[id] = true;
  playUnlockSfx();
  addLog(`🌌 世代スキル習得：${sk.emoji}${sk.name}！${sk.desc}`);
  saveGame();
  renderPrestige();
  render();
}

function _getUnlearnedPrestigePrereqsInOrder(id) {
  const ancestors = _getPrestigeSkillAncestors(id);
  const unlearned = [...ancestors].filter(rid => !state.prestigeSkills?.[rid]);
  const sorted = [];
  const visited = new Set();
  function visit(sid) {
    if (visited.has(sid)) return;
    visited.add(sid);
    const s = PRESTIGE_SKILLS.find(x => x.id === sid);
    if (s) s.requires.forEach(r => { if (unlearned.includes(r)) visit(r); });
    if (unlearned.includes(sid)) sorted.push(sid);
  }
  unlearned.forEach(visit);
  return sorted;
}

function unlockPrestigeSkillWithPrereqs(id) {
  const prereqs = _getUnlearnedPrestigePrereqsInOrder(id);
  const sk = PRESTIGE_SKILLS.find(s => s.id === id);
  if (!sk) return;
  const allIds = [...prereqs, id];
  const totalCost = allIds.reduce((sum, sid) => {
    const s = PRESTIGE_SKILLS.find(x => x.id === sid);
    return sum + (s && !state.prestigeSkills?.[sid] ? s.cost : 0);
  }, 0);
  if (getAvailablePrestigeSp() < totalCost) return;
  if (!state.prestigeSkills) state.prestigeSkills = {};
  allIds.forEach(sid => {
    const s = PRESTIGE_SKILLS.find(x => x.id === sid);
    if (s && !state.prestigeSkills[sid]) state.prestigeSkills[sid] = true;
  });
  playUnlockSfx();
  addLog(`🌌 世代スキル習得（${allIds.length}件）：${sk.emoji}${sk.name} まで一括取得！`);
  saveGame(); renderPrestige(); render();
  showPrestigeSkillDetail(id);
}

function renderPrestigeSkillTree() {
  const avail = getAvailablePrestigeSp();
  const total = state.prestigeSp || 0;
  document.getElementById('pskSpAvail').textContent = avail;
  document.getElementById('pskSpTotal').textContent = total;

  const container = document.getElementById('prestigeSkillTree');
  container.innerHTML = '';

  const TIER_H = 110, TOP_PAD = 30;
  const wrap = document.createElement('div');
  wrap.className = 'skill-tree-wrap';
  wrap.id = 'pskTreeWrap';
  wrap.style.height = (8 * TIER_H + TOP_PAD * 2) + 'px';

  // 列ヘッダー
  [['📜 CPS永続強化', 0.20], ['⬆️ アンロック・特殊', 0.50], ['🙏 稼ぎ強化', 0.80]].forEach(([label, x]) => {
    const hdr = document.createElement('div');
    hdr.className = 'sk-col-header';
    hdr.textContent = label;
    hdr.style.cssText = `left:${x * 100}%;top:6px;transform:translateX(-50%)`;
    wrap.appendChild(hdr);
  });

  for (let t = 1; t <= 8; t++) {
    const lbl = document.createElement('div');
    lbl.className = 'sk-tier-label';
    lbl.textContent = `T${t}`;
    lbl.style.top = (TOP_PAD + (t - 0.5) * TIER_H) + 'px';
    wrap.appendChild(lbl);
  }

  PRESTIGE_SKILLS.forEach(sk => {
    const pos = PRESTIGE_SKILL_POS[sk.id];
    if (!pos) return;
    const unlocked  = !!state.prestigeSkills?.[sk.id];
    const canUnlock = canUnlockPrestigeSkill(sk);
    const prereqMet = sk.requires.every(r => state.prestigeSkills?.[r]);

    let stateClass = 'sk-locked';
    if (unlocked)       stateClass = 'psk-unlocked';
    else if (canUnlock) stateClass = 'psk-available';
    else if (prereqMet) stateClass = 'sk-prereq';

    const topY = TOP_PAD + (pos.tier - 0.5) * TIER_H;
    const node = document.createElement('div');
    node.className = `skill-node ${stateClass}`;
    node.dataset.id = sk.id;
    node.style.cssText = `left:${pos.x * 100}%;top:${topY}px;cursor:pointer`;
    node.innerHTML = `
      <div class="sk-icon">${sk.emoji}</div>
      <div class="sk-name">${sk.name}</div>`;
    node.addEventListener('click', e => { e.stopPropagation(); showPrestigeSkillDetail(sk.id); });
    wrap.appendChild(node);
  });

  // 詳細パネルをツリー上部エリアに配置
  const prevOpen = document.getElementById('pskDetailPanel')?.dataset.openId;
  const detailArea = document.getElementById('pskDetailArea');
  if (detailArea) {
    detailArea.innerHTML = '';
    const detail = document.createElement('div');
    detail.id = 'pskDetailPanel';
    detail.className = 'skill-detail-panel';
    detail.style.display = 'none';
    detail.innerHTML = `
      <button class="skill-detail-close" onclick="closePskDetail()">✕</button>
      <div class="skill-detail-header">
        <span class="skill-detail-emoji" id="psdEmoji"></span>
        <div>
          <div class="skill-detail-name" id="psdName"></div>
          <div class="skill-detail-cost" id="psdCost"></div>
        </div>
      </div>
      <div class="skill-detail-desc" id="psdDesc"></div>
      <button class="sk-btn" id="psdBtn"></button>
      <button class="sk-btn sk-btn-all" id="psdBtnAll" style="display:none"></button>`;
    detailArea.appendChild(detail);
  }

  container.appendChild(wrap);

  if (prevOpen) showPrestigeSkillDetail(prevOpen);
}

function showPrestigeSkillDetail(id) {
  const sk = PRESTIGE_SKILLS.find(s => s.id === id);
  const panel = document.getElementById('pskDetailPanel');
  if (!sk || !panel) return;

  const unlocked  = !!state.prestigeSkills?.[sk.id];
  const canUnlock = canUnlockPrestigeSkill(sk);
  const prereqMet = sk.requires.every(r => state.prestigeSkills?.[r]);
  const avail = getAvailablePrestigeSp();

  panel.dataset.openId = id;
  document.getElementById('psdEmoji').textContent = sk.emoji;
  document.getElementById('psdName').textContent  = sk.name;
  document.getElementById('psdDesc').textContent  = sk.desc;
  document.getElementById('psdCost').textContent  =
    unlocked ? '✅ 習得済み' : `必要PSP: ${sk.cost}（残り ${avail} PSP）`;

  const btn    = document.getElementById('psdBtn');
  const btnAll = document.getElementById('psdBtnAll');

  if (unlocked) {
    btn.textContent = '✅ 習得済み';
    btn.className = 'sk-btn sk-done';
    btn.disabled = true;
    if (btnAll) btnAll.style.display = 'none';
  } else if (canUnlock) {
    btn.textContent = `💎 習得する（${sk.cost} PSP）`;
    btn.className = 'sk-btn';
    btn.disabled = false;
    btn.onclick = () => { unlockPrestigeSkill(id); showPrestigeSkillDetail(id); };
    if (btnAll) btnAll.style.display = 'none';
  } else {
    if (!prereqMet) {
      const prereqs = _getUnlearnedPrestigePrereqsInOrder(id);
      const totalCost = [...prereqs, id].reduce((sum, sid) => {
        const s = PRESTIGE_SKILLS.find(x => x.id === sid);
        return sum + (s && !state.prestigeSkills?.[sid] ? s.cost : 0);
      }, 0);
      btn.textContent = '🔒 前提スキル未習得';
      btn.className = 'sk-btn';
      btn.disabled = true;
      if (btnAll) {
        const bulkSkUnlocked = !!state.prestigeSkills?.unlock_bulk_sk;
        if (bulkSkUnlocked) {
          btnAll.style.display = 'block';
          btnAll.textContent = `⚡ まとめて習得（計 ${totalCost} PSP / ${prereqs.length + 1}件）`;
          btnAll.disabled = avail < totalCost;
          btnAll.onclick = () => unlockPrestigeSkillWithPrereqs(id);
        } else {
          btnAll.style.display = 'none';
        }
      }
    } else {
      btn.textContent = '💎 PSP不足';
      btn.className = 'sk-btn';
      btn.disabled = true;
      if (btnAll) btnAll.style.display = 'none';
    }
  }

  panel.style.display = 'block';
  _highlightPrestigeSkillChain(id);
}

function closePskDetail() {
  const panel = document.getElementById('pskDetailPanel');
  if (panel) { panel.style.display = 'none'; delete panel.dataset.openId; }
  _highlightPrestigeSkillChain(null);
}

function _getPrestigeSkillAncestors(id) {
  const ancestors = new Set();
  function traverse(skillId) {
    const sk = PRESTIGE_SKILLS.find(s => s.id === skillId);
    if (!sk) return;
    sk.requires.forEach(reqId => {
      if (!ancestors.has(reqId)) { ancestors.add(reqId); traverse(reqId); }
    });
  }
  if (id) traverse(id);
  return ancestors;
}

function _highlightPrestigeSkillChain(selectedId) {
  const wrap = document.getElementById('pskTreeWrap');
  if (!wrap) return;
  const ancestors = _getPrestigeSkillAncestors(selectedId);
  wrap.querySelectorAll('.skill-node').forEach(node => {
    const nid = node.dataset.id;
    node.classList.remove('sk-highlight-selected', 'sk-highlight-chain', 'sk-highlight-dim');
    if (!selectedId) return;
    if (nid === selectedId)       node.classList.add('sk-highlight-selected');
    else if (ancestors.has(nid))  node.classList.add('sk-highlight-chain');
    else                          node.classList.add('sk-highlight-dim');
  });
}
