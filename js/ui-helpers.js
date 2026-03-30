// ══════════════════════════════
//  UIヘルパー・共通ユーティリティ
//  （全ファイルから参照される関数群）
// ══════════════════════════════

// ── 数値フォーマット ──
function fmt(n){
  if(n>=1e44) return (n/1e44).toFixed(2)+'載';
  if(n>=1e40) return (n/1e40).toFixed(2)+'正';
  if(n>=1e36) return (n/1e36).toFixed(2)+'澗';
  if(n>=1e32) return (n/1e32).toFixed(2)+'溝';
  if(n>=1e28) return (n/1e28).toFixed(2)+'穰';
  if(n>=1e24) return (n/1e24).toFixed(2)+'秭';
  if(n>=1e20) return (n/1e20).toFixed(2)+'垓';
  if(n>=1e16) return (n/1e16).toFixed(2)+'京';
  if(n>=1e12) return (n/1e12).toFixed(2)+'兆';
  if(n>=1e8)  return (n/1e8).toFixed(2)+'億';
  if(n>=1e4)  return (n/1e4).toFixed(1)+'万';
  return Math.floor(n).toLocaleString();
}

// ── タブ切り替え ──
function switchTab(name) {
  ['shop','research','deco','achiev','prestige','skill','record'].forEach(t=>{
    document.getElementById(`panel-${t}`).style.display=t===name?'':'none';
    document.getElementById(`tab-${t}`).classList.toggle('active',t===name);
  });
  if(name==='research') renderResearch();
  if(name==='deco') renderDeco();
  if(name==='achiev') renderAchiev();
  if(name==='prestige') renderPrestige();
  if(name==='skill') renderSkills();
  if(name==='record') renderRecord();
}

// ── 週末ボーナス ──
function getWeekendMult() {
  const d = new Date().getDay();
  return (d === 0 || d === 6) ? 1.3 : 1;
}

function renderWeekendBadge() {
  const badge = document.getElementById('weekendBadge');
  badge.style.display = getWeekendMult() > 1 ? 'flex' : 'none';
}

// ── 統計表示 ──
function renderStats() {
  document.getElementById('coinCount').textContent=fmt(state.coins);
  const cps=getEffectiveCps();
  const fmtCps = n => n>=1e4 ? fmt(n) : n.toFixed(2);
  document.getElementById('cps').textContent=fmtCps(cps);
  document.getElementById('totalEarned').textContent=fmt(state.totalEarned);
  document.getElementById('maxLvCap').textContent=getMaxLevel();
  if (document.getElementById('cpsDetailBar')?.classList.contains('open')) renderCpsDetail();
}

// ── CPS詳細バー ──
let _cpsDetailOpen = false;
function toggleCpsDetail() {
  _cpsDetailOpen = !_cpsDetailOpen;
  const bar = document.getElementById('cpsDetailBar');
  const hint = document.getElementById('cpsDetailHint');
  bar.classList.toggle('open', _cpsDetailOpen);
  if (hint) hint.textContent = _cpsDetailOpen ? '▲' : '▼';
  if (_cpsDetailOpen) renderCpsDetail();
}

function renderCpsDetail() {
  const fmtMult = v => v >= 10 ? `×${v.toFixed(1)}` : `×${v.toFixed(2)}`;
  const baseCps = getCps() / getAchievCpsBonus() / getPrestigeMult() / (1 + getPrestigeSkillEffect('cps_perm'));

  const buffs = [];

  buffs.push({ icon:'🏗️', label:'建物CPS', raw: baseCps >= 1e4 ? fmt(baseCps) : baseCps.toFixed(2), type:'base' });

  const pm = getPrestigeMult();
  if (pm > 1) buffs.push({ icon:'⭐', label:'転生', raw: fmtMult(pm), type:'buff' });

  const cpsPerm = getPrestigeSkillEffect('cps_perm');
  if (cpsPerm > 0) buffs.push({ icon:'🌌', label:'転生スキル', raw:`+${(cpsPerm*100).toFixed(0)}%`, type:'buff' });

  const am = getAchievCpsBonus();
  if (am > 1) buffs.push({ icon:'🏅', label:'実績の目', raw: fmtMult(am), type:'buff' });

  const season = getCurrentSeason();
  const sm = season.cpsMult;
  buffs.push({ icon: season.emoji, label: season.name, raw: fmtMult(sm), type: sm >= 1 ? 'buff' : 'debuff' });

  const bm = getBeautyMult();
  if (bm > 1.001) buffs.push({ icon:'✨', label:'美観', raw: fmtMult(bm), type:'buff' });

  const wm = getWeekendMult();
  if (wm > 1) buffs.push({ icon:'🎉', label:'週末', raw: fmtMult(wm), type:'buff' });

  const now_ev = Date.now();
  (state.activeEvents || []).filter(ae => now_ev <= ae.endsAt && (ae.mult || 1) !== 1).forEach(ae => {
    const ev = EVENTS.find(e => e.id === ae.eventId);
    const m = ae.mult || 1;
    buffs.push({ icon: ev?.icon || '🎪', label: ev?.title?.replace(/[！。]/g,'') || 'イベント', raw: fmtMult(m), type: m >= 1 ? 'buff' : 'debuff' });
  });

  const total = getEffectiveCps();

  const el = document.getElementById('cpsDetailContent');
  el.innerHTML = buffs.map(b => `
    <div class="cps-buff-pill cps-buff-${b.type}">
      <span class="cps-buff-icon">${b.icon}</span>
      <span class="cps-buff-label">${b.label}</span>
      <span class="cps-buff-val">${b.raw}</span>
    </div>`).join('') +
    `<div class="cps-buff-pill cps-buff-total">
      <span class="cps-buff-icon">⏱️</span>
      <span class="cps-buff-label">合計</span>
      <span class="cps-buff-val">${total >= 1e4 ? fmt(total) : total.toFixed(2)}/秒</span>
    </div>`;
}

// ── 町エリアナビゲーション ──
let _townViewArea = 0;

function _updateTownMeta(area) {
  const label = document.getElementById('townAreaLabel');
  const icon  = document.getElementById('townCenterIcon');
  if (label) label.textContent = `${area.emoji} ${area.name}`;
  if (icon)  icon.textContent  = area.emoji;
}

let _townSliding = false;
function changeTownArea(dir) {
  if (_townSliding) return;
  const unlocked = AREAS.filter(a => (state.unlockedAreas || [1]).includes(a.id));
  const newIdx = Math.max(0, Math.min(unlocked.length - 1, _townViewArea + dir));
  if (newIdx === _townViewArea) return;

  _townSliding = true;
  const content = document.getElementById('townContent');
  const outClass = dir > 0 ? 'tc-out-left'  : 'tc-out-right';
  const inClass  = dir > 0 ? 'tc-in-right'  : 'tc-in-left';

  _townViewArea = newIdx;
  document.getElementById('townArea').dataset.area = unlocked[newIdx].id;
  _updateTownMeta(unlocked[newIdx]);

  content.classList.add(outClass);
  setTimeout(() => {
    content.classList.remove(outClass);
    renderTown();
    content.classList.add(inClass);
    setTimeout(() => {
      content.classList.remove(inClass);
      _townSliding = false;
    }, 240);
  }, 180);
}

// ── ログ・モーダル・フローティングコイン ──
function addLog(msg) {
  const log=document.getElementById('log'), now=new Date();
  const t=`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
  const e=document.createElement('div'); e.className='log-entry';
  e.textContent=`[${t}] ${msg}`; log.insertBefore(e,log.firstChild);
  while(log.children.length>20) log.removeChild(log.lastChild);
}

function showOfflineModal(sec,coins) {
  const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60);
  document.getElementById('offlineMsg').textContent=`${h>0?h+'時間':''} ${m}分の間、街が働き続けました（効率50%）`;
  document.getElementById('offlineCoins').textContent=`+${fmt(coins)} 🪙`;
  document.getElementById('offlineModal').classList.add('show');
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function spawnFloatCoins(text) {
  const btn=document.getElementById('harvestSpot'), r=btn.getBoundingClientRect();
  const el=document.createElement('div'); el.className='float-coin';
  el.textContent=`🪙${text}`; el.style.left=(r.left+r.width/2-20)+'px'; el.style.top=(r.top-10)+'px';
  document.body.appendChild(el); setTimeout(()=>el.remove(),1300);
}

// ── マイルストーン演出 ──
let _msToastTimer = null;
function showMilestoneToast(icon, title, body, bonus = '') {
  const el = document.getElementById('msToast');
  document.getElementById('msToastIcon').textContent = icon;
  document.getElementById('msToastTitle').textContent = title;
  document.getElementById('msToastBody').textContent = body;
  const bonusEl = document.getElementById('msToastBonus');
  bonusEl.textContent = bonus;
  bonusEl.style.display = bonus ? '' : 'none';
  if (_msToastTimer) clearTimeout(_msToastTimer);
  el.classList.add('show');
  _msToastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function spawnMilestoneParticles() {
  const emojis = ['✨', '🎊', '⭐', '🌟', '💫', '🎉'];
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'milestone-particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = (15 + Math.random() * 70) + '%';
      el.style.top  = (20 + Math.random() * 50) + '%';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }, i * 70);
  }
}
