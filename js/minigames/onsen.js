// ══════════════════════════════
//  温泉旅館ミニゲーム：湯加減調整
//  ゲージをゾーン内に保ち続ける（6秒）
// ══════════════════════════════

const ONSEN_MAX_PLAYS  = 10;
const ONSEN_DURATION   = 6;   // 秒
const ONSEN_ZONE_L     = 38;
const ONSEN_ZONE_H     = 62;
const ONSEN_STEP       = 6;   // ボタン1回の変化量（%）
const ONSEN_DRIFT_MAX  = 14;  // ドリフト速度上限（%/秒）

let _onsenTemp       = 50;
let _onsenDrift      = 5;
let _onsenTimeLeft   = ONSEN_DURATION;
let _onsenInZoneSecs = 0;
let _onsenRaf        = null;
let _onsenLastTime   = null;
let _onsenPlaying    = false;
let _onsenDriftTimer = null;

function openOnsenGame() {
  if ((state.buildings['onsen']?.level || 0) === 0) return;
  _onsenPlaying = false;
  mgShowResult('onsenResult', '', '');
  _onsenResetDisplay();
  mgUpdatePlaysEl('onsenPlaysRemain', 'onsen', ONSEN_MAX_PLAYS);
  const startBtn = document.getElementById('onsenStartBtn');
  if (startBtn) startBtn.disabled = mgGetPlaysRemain('onsen', ONSEN_MAX_PLAYS) === 0;
  document.getElementById('onsenModal').classList.add('show');
}

function closeOnsenGame() {
  _onsenStop();
  document.getElementById('onsenModal').classList.remove('show');
  renderShop();
}

function _onsenResetDisplay() {
  _onsenTemp = 50;
  const bar = document.getElementById('onsenTempBar');
  if (bar) bar.style.width = '50%';
  const timer = document.getElementById('onsenTimer');
  if (timer) timer.textContent = `${ONSEN_DURATION}秒`;
  _onsenUpdateBarColor(50);
}

function _onsenUpdateBarColor(temp) {
  const bar = document.getElementById('onsenTempBar');
  if (!bar) return;
  const inZone = temp >= ONSEN_ZONE_L && temp <= ONSEN_ZONE_H;
  bar.style.background = inZone
    ? 'linear-gradient(90deg, #42a5f5, #0288d1)'
    : (temp < ONSEN_ZONE_L ? 'linear-gradient(90deg, #90caf9, #64b5f6)' : 'linear-gradient(90deg, #ef5350, #e53935)');
}

function startOnsenGame() {
  if (mgGetPlaysRemain('onsen', ONSEN_MAX_PLAYS) === 0 || _onsenPlaying) return;
  mgRecordPlay('onsen');
  _onsenTemp       = 50;
  _onsenDrift      = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8);
  _onsenTimeLeft   = ONSEN_DURATION;
  _onsenInZoneSecs = 0;
  _onsenPlaying    = true;
  _onsenLastTime   = performance.now();
  document.getElementById('onsenStartBtn').disabled = true;
  document.getElementById('onsenHotBtn').disabled  = false;
  document.getElementById('onsenCoolBtn').disabled = false;
  _onsenScheduleDrift();
  _onsenRaf = requestAnimationFrame(_onsenFrame);
}

function _onsenScheduleDrift() {
  if (_onsenDriftTimer) clearTimeout(_onsenDriftTimer);
  _onsenDriftTimer = setTimeout(() => {
    if (!_onsenPlaying) return;
    _onsenDrift = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * ONSEN_DRIFT_MAX);
    _onsenScheduleDrift();
  }, 700 + Math.random() * 1000);
}

function _onsenFrame(now) {
  const dt = (now - _onsenLastTime) / 1000;
  _onsenLastTime = now;
  _onsenTemp     = Math.max(0, Math.min(100, _onsenTemp + _onsenDrift * dt));
  _onsenTimeLeft = Math.max(0, _onsenTimeLeft - dt);

  const inZone = _onsenTemp >= ONSEN_ZONE_L && _onsenTemp <= ONSEN_ZONE_H;
  if (inZone) _onsenInZoneSecs += dt;

  const bar = document.getElementById('onsenTempBar');
  if (bar) bar.style.width = _onsenTemp + '%';
  _onsenUpdateBarColor(_onsenTemp);

  const timer = document.getElementById('onsenTimer');
  if (timer) timer.textContent = `${Math.ceil(_onsenTimeLeft)}秒`;

  if (_onsenTimeLeft <= 0) { _onsenFinish(); return; }
  _onsenRaf = requestAnimationFrame(_onsenFrame);
}

function onsenHot()  { if (_onsenPlaying) _onsenTemp = Math.min(100, _onsenTemp + ONSEN_STEP); }
function onsenCool() { if (_onsenPlaying) _onsenTemp = Math.max(0,   _onsenTemp - ONSEN_STEP); }

function _onsenStop() {
  _onsenPlaying = false;
  if (_onsenRaf) { cancelAnimationFrame(_onsenRaf); _onsenRaf = null; }
  if (_onsenDriftTimer) { clearTimeout(_onsenDriftTimer); _onsenDriftTimer = null; }
}

function _onsenFinish() {
  _onsenStop();
  const scorePct = Math.min(100, (_onsenInZoneSecs / ONSEN_DURATION) * 100);
  const base = mgBaseReward('onsen', 30);

  let reward, label, cls;
  if (scorePct >= 80) {
    reward = Math.floor(base * 3);   label = '♨️ 最高の湯加減！'; cls = 'mg-result-perfect'; playMilestoneSfx();
  } else if (scorePct >= 50) {
    reward = Math.floor(base * 1.5); label = '👍 いい湯でした';   cls = 'mg-result-good';    playQuestSfx();
  } else {
    reward = Math.floor(base * 0.4); label = '😓 湯加減が難しい'; cls = 'mg-result-miss';    playTones([300,250],0.3,0.18);
  }

  mgShowResult('onsenResult', `${label}（${Math.round(scorePct)}%）  +${fmt(reward)} 🪙`, cls);
  mgRewardAndLog(reward, `♨️ 温泉 ${label}`);
  mgUpdatePlaysEl('onsenPlaysRemain', 'onsen', ONSEN_MAX_PLAYS);
  document.getElementById('onsenHotBtn').disabled  = true;
  document.getElementById('onsenCoolBtn').disabled = true;
  const startBtn = document.getElementById('onsenStartBtn');
  if (startBtn) {
    startBtn.disabled = mgGetPlaysRemain('onsen', ONSEN_MAX_PLAYS) === 0;
    startBtn.textContent = '♨️ もう一度';
  }
}
