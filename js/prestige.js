// ══════════════════════════════
//  プレステージ転生システム
// ══════════════════════════════
function getPrestigeMult() {
  const rate = 0.15 + getPrestigeSkillEffect('prestige_cps_rate');
  return 1 + state.prestigeCount * rate;
}
function getPrestigeRequired() { return 5000000000 * Math.pow(5, state.prestigeCount); }

function confirmPrestige() {
  const req = getPrestigeRequired();
  if (state.totalEarned < req) return;
  const newMax = BASE_MAX_LV + (state.prestigeCount + 1) * PRESTIGE_LV_BONUS;
  const rate = 0.15 + getPrestigeSkillEffect('prestige_cps_rate');
  const nextMult = (1 + (state.prestigeCount + 1) * rate).toFixed(1);
  document.getElementById('prestigeConfirmList').innerHTML =
    `✅ 転生後のCPS永続倍率：×${nextMult}<br>` +
    `✅ レベル上限が <strong>Lv${newMax}</strong> に拡張<br>` +
    `✅ 世代SP +3 獲得<br>` +
    `✅ 実績・転生回数・世代スキルは引き継ぎ<br>` +
    `❌ コイン・建物レベルがリセット<br>` +
    `❌ 研究・通常スキル・マイルストーン達成状況もリセット`;
  document.getElementById('prestigeModal').classList.add('show');
}

function doPrestige() {
  closeModal('prestigeModal');
  state.prestigeCount++;
  state.prestigeSp = (state.prestigeSp || 0) + 3;
  state.coins = 50; state.totalEarned = 0;
  BUILDINGS.forEach(b => { state.buildings[b.id] = { level: 0 }; });
  state.activeEvent = null; state.eventDiscount = 1; state.skills = {}; state.research = {};
  const newMax = getMaxLevel();
  const curMult = getPrestigeMult().toFixed(1);
  addLog(`⭐ プレステージ転生(${state.prestigeCount}回目)！Lv上限→${newMax}、CPS倍率×${curMult}、世代SP+3`);
  saveGame(); checkAchievements(); render(); renderPrestige();
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
  document.getElementById('prestigeBonusList').innerHTML =
    `<div class="prestige-bonus-item"><span class="pb-icon">⭐</span>永続CPS倍率 → ×<strong>${nextMult}</strong></div>
     <div class="prestige-bonus-item"><span class="pb-icon">📈</span>レベル上限 → <strong>Lv${newMax}</strong>（+${PRESTIGE_LV_BONUS}）</div>
     <div class="prestige-bonus-item"><span class="pb-icon">💎</span>世代SP → +3 PSP獲得</div>
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
  const reqEl  = document.getElementById('prestigeReq');
  const barEl  = document.getElementById('prestigeProgressBar');
  const btnEl  = document.getElementById('btnPrestige');
  if (!reqEl) return;
  reqEl.innerHTML =
    `転生条件：累計コイン <strong style="color:var(--prestige2)">${fmt(req)}</strong> 以上<br>
     現在：${fmt(state.totalEarned)} ${can ? '✅ 転生可能！' : '（あと ' + fmt(req - state.totalEarned) + '）'}`;
  barEl.style.width = `${prog}%`;
  btnEl.disabled = !can;
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
  renderStats();
}

function renderPrestigeSkillTree() {
  const avail = getAvailablePrestigeSp();
  const total = state.prestigeSp || 0;
  document.getElementById('pskSpAvail').textContent = avail;
  document.getElementById('pskSpTotal').textContent = total;

  const container = document.getElementById('prestigeSkillTree');
  container.innerHTML = '';

  const TIER_H = 170, TOP_PAD = 24;
  const wrap = document.createElement('div');
  wrap.className = 'skill-tree-wrap';
  wrap.id = 'pskTreeWrap';
  wrap.style.height = (4 * TIER_H + TOP_PAD * 2) + 'px';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.className = 'skill-tree-svg';
  svg.id = 'pskTreeSvg';
  wrap.appendChild(svg);

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

  container.appendChild(wrap);

  // 詳細パネル（ツリー下部にsticky）
  const prevOpen = document.getElementById('pskDetailPanel')?.dataset.openId;
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
    <button class="sk-btn" id="psdBtn"></button>`;
  container.appendChild(detail);

  if (prevOpen) showPrestigeSkillDetail(prevOpen);

  requestAnimationFrame(() => {
    _drawPrestigeSkillLines();
    if (window._pskTreeRO) window._pskTreeRO.disconnect();
    window._pskTreeRO = new ResizeObserver(() => _drawPrestigeSkillLines());
    window._pskTreeRO.observe(wrap);
  });
}

function showPrestigeSkillDetail(id) {
  const sk = PRESTIGE_SKILLS.find(s => s.id === id);
  const panel = document.getElementById('pskDetailPanel');
  if (!sk || !panel) return;

  const unlocked  = !!state.prestigeSkills?.[sk.id];
  const canUnlock = canUnlockPrestigeSkill(sk);
  const avail = getAvailablePrestigeSp();

  panel.dataset.openId = id;
  document.getElementById('psdEmoji').textContent = sk.emoji;
  document.getElementById('psdName').textContent  = sk.name;
  document.getElementById('psdDesc').textContent  = sk.desc;
  document.getElementById('psdCost').textContent  =
    unlocked ? '✅ 習得済み' : `必要PSP: ${sk.cost}（残り ${avail} PSP）`;

  const btn = document.getElementById('psdBtn');
  if (unlocked) {
    btn.textContent = '✅ 習得済み';
    btn.className = 'sk-btn sk-done';
    btn.disabled = true;
  } else if (canUnlock) {
    btn.textContent = `💎 習得する（${sk.cost} PSP）`;
    btn.className = 'sk-btn';
    btn.disabled = false;
    btn.onclick = () => { unlockPrestigeSkill(id); showPrestigeSkillDetail(id); };
  } else {
    btn.textContent = !sk.requires.every(r => state.prestigeSkills?.[r])
      ? '🔒 前提スキル未習得' : '💎 PSP不足';
    btn.className = 'sk-btn';
    btn.disabled = true;
  }

  panel.style.display = 'block';
}

function closePskDetail() {
  const panel = document.getElementById('pskDetailPanel');
  if (panel) { panel.style.display = 'none'; delete panel.dataset.openId; }
}

function _drawPrestigeSkillLines() {
  const wrap = document.getElementById('pskTreeWrap');
  const svg  = document.getElementById('pskTreeSvg');
  if (!wrap || !svg) return;
  svg.innerHTML = '';
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('width',  wrapRect.width);
  svg.setAttribute('height', wrap.offsetHeight);

  PRESTIGE_SKILLS.forEach(sk => {
    const childEl = wrap.querySelector(`.skill-node[data-id="${sk.id}"]`);
    if (!childEl) return;
    const cr = childEl.getBoundingClientRect();
    const cx     = cr.left - wrapRect.left + cr.width  / 2;
    const cy_top = cr.top  - wrapRect.top;
    const childUnlocked = !!state.prestigeSkills?.[sk.id];

    sk.requires.forEach(reqId => {
      const parentEl = wrap.querySelector(`.skill-node[data-id="${reqId}"]`);
      if (!parentEl) return;
      const pr = parentEl.getBoundingClientRect();
      const px     = pr.left - wrapRect.left + pr.width  / 2;
      const py_bot = pr.top  - wrapRect.top  + pr.height;
      const parentUnlocked = !!state.prestigeSkills?.[reqId];

      let color, dash, strokeW;
      if (childUnlocked && parentUnlocked) { color = '#f5c430'; dash = '';    strokeW = 3;   }
      else if (parentUnlocked)             { color = '#9c27b0'; dash = '';    strokeW = 2.5; }
      else                                 { color = '#bbb';    dash = '5,4'; strokeW = 1.5; }

      const midY = (py_bot + cy_top) / 2;
      const d = `M ${px} ${py_bot} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cy_top}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', strokeW);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      if (dash) path.setAttribute('stroke-dasharray', dash);
      svg.appendChild(path);

      const aw = 5;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      arrow.setAttribute('points', `${cx},${cy_top} ${cx-aw},${cy_top-aw*1.6} ${cx+aw},${cy_top-aw*1.6}`);
      arrow.setAttribute('fill', color);
      svg.appendChild(arrow);
    });
  });
}
