// ══════════════════════════════
//  宇宙基地ミニゲーム：ロケット発射
//  カウントダウンが0になった瞬間にボタンを押す
// ══════════════════════════════

const ROCKET_MAX_PLAYS      = 10;
const ROCKET_STEP_MS        = 900;  // 各数字の表示時間
const ROCKET_PERFECT_WINDOW = 250;  // ms（0表示後この時間内 = PERFECT）
const ROCKET_GOOD_WINDOW    = 600;  // ms（PERFECT外でこの時間内 = GOOD）
const ROCKET_SEQUENCE       = [5, 4, 3, 2, 1, '発射！'];

let _rocketStep      = -1;
let _rocketTimer     = null;
let _rocketFireTime  = null; // '発射！'が表示された時刻
let _rocketPlayed    = false;
let _rocketEarlyMiss = false;

function openRocketGame() {
  if ((state.buildings['rocket']?.level || 0) === 0) return;
  _rocketPlayed = false; _rocketStep = -1; _rocketEarlyMiss = false;
  mgShowResult('rocketResult', '', '');
  _rocketSetDisplay('🚀');
  const btn = document.getElementById('rocketPressBtn');
  if (btn) btn.disabled = mgGetPlaysRemain('rocket', ROCKET_MAX_PLAYS) === 0;
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
  _rocketPlayed = false;
}

function startRocketCountdown() {
  if (mgGetPlaysRemain('rocket', ROCKET_MAX_PLAYS) === 0 || _rocketStep >= 0) return;
  mgRecordPlay('rocket');
  _rocketStep = 0; _rocketEarlyMiss = false; _rocketFireTime = null;
  document.getElementById('rocketPressBtn').disabled = false;
  _rocketAdvance();
}

function _rocketAdvance() {
  if (_rocketStep >= ROCKET_SEQUENCE.length) return;
  const val = ROCKET_SEQUENCE[_rocketStep];
  if (val === '発射！') {
    _rocketFireTime = Date.now();
    _rocketSetDisplay('発射！', 'rocket-fire');
    playTones([784, 988, 1175], 0.5, 0.28);
    _rocketTimer = setTimeout(() => {
      if (!_rocketPlayed) _rocketResolve(); // タイムオーバー
    }, 1200);
  } else {
    _rocketSetDisplay(String(val), val <= 2 ? 'rocket-urgent' : '');
    playTones([440], 0.2, 0.15);
    _rocketStep++;
    _rocketTimer = setTimeout(_rocketAdvance, ROCKET_STEP_MS);
  }
}

function pressRocketBtn() {
  if (_rocketPlayed) return;
  if (_rocketFireTime === null && _rocketStep >= 0) {
    // カウントダウン中に押した = 早押しミス
    _rocketEarlyMiss = true;
    _rocketClear();
    _rocketPlayed = true;
    const base   = mgBaseReward('rocket', 30);
    const reward = Math.floor(base * 0.1);
    mgShowResult('rocketResult', `⚡ 早すぎた！  +${fmt(reward)} 🪙`, 'mg-result-miss');
    mgRewardAndLog(reward, '🚀 ロケット 早すぎた！');
    mgUpdatePlaysEl('rocketPlaysRemain', 'rocket', ROCKET_MAX_PLAYS);
    playTones([300,250],0.3,0.18);
    _rocketAfterPlay();
    return;
  }
  if (_rocketFireTime !== null) _rocketResolve();
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
    reward = Math.floor(base * 1.5); label = '👍 GOOD！いいタイミング'; cls = 'mg-result-good';    playQuestSfx();
  } else {
    reward = Math.floor(base * 0.2); label = '😅 遅すぎた…';           cls = 'mg-result-miss';    playTones([300,250],0.3,0.18);
  }

  mgShowResult('rocketResult', `${label}  +${fmt(reward)} 🪙`, cls);
  mgRewardAndLog(reward, `🚀 ロケット ${label}`);
  mgUpdatePlaysEl('rocketPlaysRemain', 'rocket', ROCKET_MAX_PLAYS);
  _rocketSetDisplay('🚀');
  _rocketAfterPlay();
}

function _rocketAfterPlay() {
  _rocketStep = -1;
  const btn = document.getElementById('rocketPressBtn');
  if (!btn) return;
  const remain = mgGetPlaysRemain('rocket', ROCKET_MAX_PLAYS);
  btn.disabled    = remain === 0;
  btn.textContent = remain > 0 ? '🚀 もう一度' : '今日はここまで';
}
