// ══════════════════════════════
//  宇宙基地ミニゲーム：ロケット発射
//  ランダムなタイミングで「発射！」が出たら即座にボタンを押す
// ══════════════════════════════

const ROCKET_MAX_PLAYS      = 10;
const ROCKET_PERFECT_WINDOW = 300;  // ms（発射後この時間内 = PERFECT）
const ROCKET_GOOD_WINDOW    = 700;  // ms
const ROCKET_TIMEOUT_MS     = 1500; // ms（これ以降は MISS）

let _rocketFireTime = null;
let _rocketTimer    = null;
let _rocketPlayed   = false;
let _rocketWaiting  = false; // 開始〜発射までの待機中フラグ

function openRocketGame() {
  if ((state.buildings['rocket']?.level || 0) === 0) return;
  _rocketReset();
  mgShowResult('rocketResult', '', '');
  _rocketSetDisplay('🚀', '');
  const startBtn = document.getElementById('rocketStartBtn');
  const pressBtn = document.getElementById('rocketPressBtn');
  if (startBtn) startBtn.disabled = mgGetPlaysRemain('rocket', ROCKET_MAX_PLAYS) === 0;
  if (pressBtn) pressBtn.disabled = true;
  mgUpdatePlaysEl('rocketPlaysRemain', 'rocket', ROCKET_MAX_PLAYS);
  document.getElementById('rocketModal').classList.add('show');
}

function closeRocketGame() {
  _rocketClear();
  document.getElementById('rocketModal').classList.remove('show');
  renderShop();
}

function _rocketSetDisplay(text, cls = '') {
  const el = document.getElementById('rocketCountdown');
  if (!el) return;
  el.textContent = text;
  el.className   = `rocket-countdown ${cls}`;
}

function _rocketClear() {
  if (_rocketTimer) { clearTimeout(_rocketTimer); _rocketTimer = null; }
}

function _rocketReset() {
  _rocketClear();
  _rocketFireTime = null;
  _rocketPlayed   = false;
  _rocketWaiting  = false;
}

// HTML の onclick="startRocketCountdown()" と互換
function startRocketCountdown() {
  if (mgGetPlaysRemain('rocket', ROCKET_MAX_PLAYS) === 0 || _rocketWaiting) return;
  mgRecordPlay('rocket');
  _rocketWaiting  = true;
  _rocketFireTime = null;
  _rocketPlayed   = false;

  const startBtn = document.getElementById('rocketStartBtn');
  const pressBtn = document.getElementById('rocketPressBtn');
  if (startBtn) startBtn.disabled = true;
  if (pressBtn) pressBtn.disabled = false; // 早押しミス可能なので有効化

  _rocketSetDisplay('待機中…', 'rocket-wait');

  // ランダム遅延 1.5〜4.0 秒
  const delay = 1500 + Math.random() * 2500;
  _rocketTimer = setTimeout(() => {
    if (_rocketPlayed) return; // 早押し済み
    _rocketFireTime = Date.now();
    _rocketSetDisplay('発射！', 'rocket-fire');
    playTones([784, 988, 1175], 0.5, 0.28);
    // タイムアウト
    _rocketTimer = setTimeout(() => {
      if (!_rocketPlayed) _rocketResolve();
    }, ROCKET_TIMEOUT_MS);
  }, delay);
}

function pressRocketBtn() {
  if (_rocketPlayed || !_rocketWaiting) return;

  if (_rocketFireTime === null) {
    // 発射前の早押し
    _rocketClear();
    _rocketPlayed = true;
    _rocketSetDisplay('💥', '');
    mgShowResult('rocketResult', `⚡ 早すぎた！`, 'mg-result-miss');
    addLog('🚀 ロケット 早すぎた…');
    mgUpdatePlaysEl('rocketPlaysRemain', 'rocket', ROCKET_MAX_PLAYS);
    playTones([300, 250], 0.3, 0.18);
    _rocketAfterPlay();
    return;
  }
  _rocketResolve();
}

function _rocketResolve() {
  if (_rocketPlayed) return;
  _rocketClear();
  _rocketPlayed = true;
  const base  = mgBaseReward('rocket', 30);
  const delay = _rocketFireTime ? Date.now() - _rocketFireTime : 99999;

  let reward, label, cls;
  if (delay <= ROCKET_PERFECT_WINDOW) {
    reward = Math.floor(base * 3);   label = '🚀 PERFECT！完璧な発射！'; cls = 'mg-result-perfect'; playMilestoneSfx();
  } else if (delay <= ROCKET_GOOD_WINDOW) {
    reward = Math.floor(base * 1.5); label = '👍 GOOD！いいタイミング';  cls = 'mg-result-good';    playQuestSfx();
  } else {
    reward = 0;                       label = '😅 遅すぎた…';            cls = 'mg-result-miss';    playTones([300, 250], 0.3, 0.18);
  }

  _rocketSetDisplay('🚀', '');
  mgShowResult('rocketResult', reward > 0 ? `${label}  +${fmt(reward)} 🪙` : label, cls);
  if (reward > 0) mgRewardAndLog(reward, `🚀 ロケット ${label}`);
  else addLog(`🚀 ロケット ${label}`);
  mgUpdatePlaysEl('rocketPlaysRemain', 'rocket', ROCKET_MAX_PLAYS);
  _rocketAfterPlay();
}

function _rocketAfterPlay() {
  _rocketWaiting = false;
  const startBtn = document.getElementById('rocketStartBtn');
  const pressBtn = document.getElementById('rocketPressBtn');
  const remain   = mgGetPlaysRemain('rocket', ROCKET_MAX_PLAYS);
  if (pressBtn) pressBtn.disabled = true;
  if (startBtn) {
    startBtn.disabled    = remain === 0;
    startBtn.textContent = remain > 0 ? '▶ もう一度' : '今日はここまで';
  }
}
