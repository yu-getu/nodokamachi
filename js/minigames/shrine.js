// ══════════════════════════════
//  神社ミニゲーム：おみくじ
//  スロット演出 → 結果reveal → パーティクルバースト
// ══════════════════════════════

const SHRINE_MAX_PLAYS = 3;
const SHRINE_LOTS = [
  { label:'大吉', emoji:'✨', mult:8,   prob:0.05, cls:'shrine-daikichi' },
  { label:'吉',   emoji:'😊', mult:3,   prob:0.20, cls:'shrine-kichi'    },
  { label:'中吉', emoji:'🌿', mult:1.5, prob:0.35, cls:'shrine-chukichi' },
  { label:'小吉', emoji:'🍃', mult:0.8, prob:0.25, cls:'shrine-shokichi' },
  { label:'末吉', emoji:'🌱', mult:0.4, prob:0.10, cls:'shrine-suekichi' },
  { label:'凶',   emoji:'💀', mult:0.1, prob:0.05, cls:'shrine-kyo'      },
];

function openShrineGame() {
  if ((state.buildings['shrine']?.level || 0) === 0) return;
  mgShowResult('shrineResult', '', '');
  const disp = document.getElementById('shrineLotDisplay');
  const name = document.getElementById('shrineLotName');
  const paper = document.getElementById('shrineScrollPaper');
  if (disp)  { disp.textContent = '🎋'; disp.className = 'shrine-lot-display'; }
  if (name)  { name.textContent = ''; name.className = 'shrine-lot-name'; }
  if (paper) paper.className = 'shrine-scroll-paper';
  const btn = document.getElementById('shrinePressBtn');
  if (btn) { btn.disabled = mgGetPlaysRemain('shrine', SHRINE_MAX_PLAYS) === 0; btn.textContent = '🎋 おみくじを引く'; }
  mgUpdatePlaysEl('shrinePlaysRemain', 'shrine', SHRINE_MAX_PLAYS);
  document.getElementById('shrineModal').classList.add('show');
}

function closeShrineGame() {
  document.getElementById('shrineModal').classList.remove('show');
  renderShop();
}

// ── スロット演出 ──
function _shrineSpin(callback) {
  const disp = document.getElementById('shrineLotDisplay');
  if (!disp) { callback(); return; }
  const emojis = SHRINE_LOTS.map(l => l.emoji);
  let count = 0;
  const total = 22;
  const slowAt = total - 8;
  disp.className = 'shrine-lot-display shrine-lot-spinning';
  function tick() {
    disp.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    count++;
    if (count >= total) { setTimeout(callback, 120); return; }
    const delay = count < slowAt ? 55 : 55 + Math.pow(count - slowAt, 2) * 28;
    setTimeout(tick, delay);
  }
  tick();
}

// ── フラッシュ ──
function _shrineFlash(result) {
  const el = document.getElementById('shrineFlash');
  if (!el) return;
  const bg =
    result.cls === 'shrine-daikichi' ? 'rgba(255,220,40,.55)'  :
    result.cls === 'shrine-kichi'    ? 'rgba(100,200,100,.30)' :
    result.cls === 'shrine-kyo'      ? 'rgba(60,0,0,.50)'      : 'rgba(255,255,255,.15)';
  el.style.background = bg;
  el.classList.remove('shrine-flash-go');
  void el.offsetWidth; // reflow
  el.classList.add('shrine-flash-go');
}

// ── シェイク（凶） ──
function _shrineShake() {
  const modal = document.querySelector('#shrineModal .modal');
  if (!modal) return;
  modal.classList.remove('shrine-modal-shake');
  void modal.offsetWidth;
  modal.classList.add('shrine-modal-shake');
  setTimeout(() => modal.classList.remove('shrine-modal-shake'), 600);
}

// ── パーティクルバースト ──
function _shrineParticles(result) {
  const container = document.getElementById('shrineParticles');
  if (!container) return;
  container.innerHTML = '';

  const cfg = {
    'shrine-daikichi': { count:30, colors:['#f5c430','#ffe066','#ffd700','#fff176'], type:'star',  dist:110, dur:1.3 },
    'shrine-kichi'   : { count:18, colors:['#66bb6a','#a5d6a7','#81c784'],           type:'circle',dist:85,  dur:1.1 },
    'shrine-chukichi': { count:10, colors:['#81c784','#c8e6c9'],                      type:'circle',dist:60,  dur:0.9 },
    'shrine-kyo'     : { count:14, colors:['#8b0000','#c62828','#4a0000'],            type:'shard', dist:70,  dur:1.0 },
  }[result.cls];
  if (!cfg) return;

  for (let i = 0; i < cfg.count; i++) {
    const p = document.createElement('div');
    const angle = (i / cfg.count) * 360 + Math.random() * (360 / cfg.count);
    const dist  = cfg.dist * (0.6 + Math.random() * 0.8);
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
    const delay = Math.random() * 220;
    // 凶は下方向に集中
    const finalAngle = result.cls === 'shrine-kyo'
      ? 90 + (Math.random() - 0.5) * 120
      : angle;
    p.className = `shrine-particle${cfg.type === 'star' ? ' shrine-particle-star' : cfg.type === 'shard' ? ' shrine-particle-shard' : ''}`;
    p.style.cssText = `--a:${finalAngle}deg;--d:${dist}px;--pc:${color};--delay:${delay}ms;--dur:${cfg.dur}s`;
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 2000);
}

// ── 結果リビール ──
function _shrineReveal(result, reward) {
  const disp  = document.getElementById('shrineLotDisplay');
  const name  = document.getElementById('shrineLotName');
  const paper = document.getElementById('shrineScrollPaper');

  if (disp) {
    disp.className = 'shrine-lot-display shrine-lot-reveal';
    disp.textContent = result.emoji;
  }
  if (paper) paper.className = `shrine-scroll-paper ${result.cls}`;
  if (name) {
    name.textContent = result.label;
    name.className = 'shrine-lot-name shrine-lot-reveal-name';
  }

  _shrineFlash(result);
  setTimeout(() => _shrineParticles(result), 100);
  if (result.cls === 'shrine-kyo') setTimeout(_shrineShake, 200);

  const resCls = result.mult >= 3 ? 'mg-result-perfect' : result.mult >= 1 ? 'mg-result-good' : 'mg-result-miss';
  mgShowResult('shrineResult', `${result.label}！  +${fmt(reward)} 🪙`, resCls);
  mgRewardAndLog(reward, `⛩️ おみくじ ${result.label}`);
  mgUpdatePlaysEl('shrinePlaysRemain', 'shrine', SHRINE_MAX_PLAYS);

  if (result.mult >= 8) playMilestoneSfx();
  else if (result.mult >= 1) playQuestSfx();
  else playTones([300, 250], 0.3, 0.18);

  const btn = document.getElementById('shrinePressBtn');
  if (btn) {
    const remain = mgGetPlaysRemain('shrine', SHRINE_MAX_PLAYS);
    btn.disabled    = remain === 0;
    btn.textContent = remain > 0 ? '🎋 もう一度引く' : '今日はここまで';
  }
}

function pressShrineBtn() {
  if (mgGetPlaysRemain('shrine', SHRINE_MAX_PLAYS) === 0) return;
  mgRecordPlay('shrine');

  const btn = document.getElementById('shrinePressBtn');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  // 抽選
  const r = Math.random();
  let cum = 0, result = SHRINE_LOTS[SHRINE_LOTS.length - 1];
  for (const lot of SHRINE_LOTS) { cum += lot.prob; if (r < cum) { result = lot; break; } }

  const base   = mgBaseReward('shrine', 60);
  const reward = Math.floor(base * result.mult);

  _shrineSpin(() => _shrineReveal(result, reward));
}
