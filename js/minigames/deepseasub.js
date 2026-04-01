// ══════════════════════════════
//  深海調査船ミニゲーム：ソナー探査
//  回転アームがターゲット（ブリップ）に重なった瞬間にボタンを押す
// ══════════════════════════════

const DEEPSEASUB_MAX_PLAYS = 10;
const DSUB_PERFECT_DEG     = 12; // ±12度でPERFECT
const DSUB_GOOD_DEG        = 28; // ±28度でGOOD

let _dsubAngle     = 0;     // 現在のアーム角度（ラジアン）
let _dsubTargetRad = 1.5;   // ターゲット角度（ラジアン）
let _dsubSpeed     = 0.35;  // 回転速度（回/秒）
let _dsubRaf       = null;
let _dsubLastTime  = null;
let _dsubPlayed    = false;
let _dsubCtx       = null;

function openDeepseasubGame() {
  if ((state.buildings['deepseasub']?.level || 0) === 0) return;
  _dsubPlayed  = false;
  _dsubAngle   = 0;
  _dsubTargetRad = (20 + Math.random() * 320) * Math.PI / 180;
  _dsubSpeed   = 0.25 + Math.random() * 0.2;
  mgShowResult('deepseasubResult', '', '');
  mgUpdatePlaysEl('deepseasubPlaysRemain', 'deepseasub', DEEPSEASUB_MAX_PLAYS);
  const btn = document.getElementById('sonarPressBtn');
  if (btn) {
    btn.disabled    = mgGetPlaysRemain('deepseasub', DEEPSEASUB_MAX_PLAYS) === 0;
    btn.textContent = '🔊 探査！';
  }
  document.getElementById('deepseasubModal').classList.add('show');
  _dsubInitCanvas();
  if (mgGetPlaysRemain('deepseasub', DEEPSEASUB_MAX_PLAYS) > 0) _dsubStartAnim();
}

function closeDeepseasubGame() {
  _dsubStopAnim();
  document.getElementById('deepseasubModal').classList.remove('show');
  renderShop();
}

function _dsubInitCanvas() {
  const canvas = document.getElementById('sonarCanvas');
  if (!canvas) return;
  _dsubCtx = canvas.getContext('2d');
}

function _dsubAngleDiff(a, b) {
  let d = ((a - b) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  return Math.abs(d);
}

function _dsubDraw() {
  const ctx = _dsubCtx;
  if (!ctx) return;
  const canvas = document.getElementById('sonarCanvas');
  if (!canvas) return;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, r = W / 2 - 4;

  ctx.clearRect(0, 0, W, H);

  // 背景円
  ctx.fillStyle = '#0a1628';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // グリッドリング
  ctx.strokeStyle = 'rgba(0,200,100,0.15)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath(); ctx.arc(cx, cy, r * i / 3, 0, Math.PI * 2); ctx.stroke();
  }
  // クロスライン
  ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

  // スイープ残像（扇形）
  ctx.save();
  ctx.translate(cx, cy);
  const sweepArc = Math.PI * 0.35;
  for (let i = 0; i < 30; i++) {
    const a = _dsubAngle - (sweepArc * i / 30);
    const alpha = (1 - i / 30) * 0.22;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a - sweepArc / 60, a);
    ctx.fillStyle = `rgba(0,220,100,${alpha})`;
    ctx.fill();
  }
  ctx.restore();

  // ターゲットブリップ（アームとの距離に応じて輝度変化）
  const tX = cx + Math.cos(_dsubTargetRad) * r * 0.7;
  const tY = cy + Math.sin(_dsubTargetRad) * r * 0.7;
  const diff = _dsubAngleDiff(_dsubAngle, _dsubTargetRad);
  const brightness = Math.max(0, 1 - diff / (Math.PI * 0.5));

  if (brightness > 0.04) {
    ctx.beginPath();
    ctx.arc(tX, tY, 5 + brightness * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,255,160,${brightness})`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tX, tY, 9, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,160,${brightness * 0.35})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // アーム
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(0,255,100,0.9)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ff64';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(_dsubAngle) * r, Math.sin(_dsubAngle) * r);
  ctx.stroke();
  ctx.restore();

  // 中心点
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#00ff64';
  ctx.fill();
}

function _dsubStartAnim() {
  _dsubStopAnim();
  _dsubLastTime = performance.now();
  function frame(now) {
    const dt = (now - _dsubLastTime) / 1000;
    _dsubLastTime = now;
    _dsubAngle = (_dsubAngle + _dsubSpeed * Math.PI * 2 * dt) % (Math.PI * 2);
    _dsubDraw();
    if (!_dsubPlayed) _dsubRaf = requestAnimationFrame(frame);
  }
  _dsubRaf = requestAnimationFrame(frame);
}

function _dsubStopAnim() {
  if (_dsubRaf) { cancelAnimationFrame(_dsubRaf); _dsubRaf = null; }
}

function pressDeepseasubBtn() {
  if (_dsubPlayed || mgGetPlaysRemain('deepseasub', DEEPSEASUB_MAX_PLAYS) === 0) return;
  _dsubStopAnim();
  _dsubPlayed = true;
  mgRecordPlay('deepseasub');

  const diffDeg = _dsubAngleDiff(_dsubAngle, _dsubTargetRad) * (180 / Math.PI);
  const base = mgBaseReward('deepseasub', 30);

  let reward, label, cls;
  if (diffDeg <= DSUB_PERFECT_DEG) {
    reward = Math.floor(base * 3);   label = '🦈 PERFECT！完璧な探査！'; cls = 'mg-result-perfect'; playMilestoneSfx();
  } else if (diffDeg <= DSUB_GOOD_DEG) {
    reward = Math.floor(base * 1.5); label = '👍 GOOD！目標に接近';    cls = 'mg-result-good';    playQuestSfx();
  } else {
    reward = Math.floor(base * 0.2); label = '🌊 外れた…';            cls = 'mg-result-miss';    playTones([300, 250], 0.3, 0.18);
  }

  mgShowResult('deepseasubResult', `${label}  +${fmt(reward)} 🪙`, cls);
  mgRewardAndLog(reward, `🦈 ソナー ${label}`);
  mgUpdatePlaysEl('deepseasubPlaysRemain', 'deepseasub', DEEPSEASUB_MAX_PLAYS);

  const btn = document.getElementById('sonarPressBtn');
  if (btn) {
    const remain = mgGetPlaysRemain('deepseasub', DEEPSEASUB_MAX_PLAYS);
    btn.disabled    = remain === 0;
    btn.textContent = remain > 0 ? '🔊 もう一度' : '今日はここまで';
  }

  if (mgGetPlaysRemain('deepseasub', DEEPSEASUB_MAX_PLAYS) > 0) {
    setTimeout(() => {
      _dsubPlayed    = false;
      _dsubAngle     = 0;
      _dsubTargetRad = (20 + Math.random() * 320) * Math.PI / 180;
      _dsubSpeed     = 0.25 + Math.random() * 0.2;
      mgShowResult('deepseasubResult', '', '');
      _dsubStartAnim();
    }, 900);
  }
}
