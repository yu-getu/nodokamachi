// ══════════════════════════════
//  遊園地ミニゲーム：盛り上げタップ
//  制限時間内に連打してメーターを上げる
// ══════════════════════════════

const AMUSEMENT_MAX_PLAYS = 10;
const AMUSEMENT_DURATION  = 5;  // 秒
const AMUSEMENT_TAP_CAP   = 50; // これ以上は報酬上限

let _amusTaps     = 0;
let _amusTimeLeft = AMUSEMENT_DURATION;
let _amusPlaying  = false;
let _amusRaf      = null;
let _amusLastTime = null;

function openAmusementGame() {
  if ((state.buildings['amusement']?.level || 0) === 0) return;
  _amusPlaying = false; _amusTaps = 0;
  mgShowResult('amusementResult', '', '');
  _amusUpdateDisplay();
  mgUpdatePlaysEl('amusementPlaysRemain', 'amusement', AMUSEMENT_MAX_PLAYS);
  const btn = document.getElementById('amusementTapBtn');
  if (btn) btn.disabled = mgGetPlaysRemain('amusement', AMUSEMENT_MAX_PLAYS) === 0;
  document.getElementById('amusementModal').classList.add('show');
}

function closeAmusementGame() {
  _amusStop();
  document.getElementById('amusementModal').classList.remove('show');
  renderShop();
}

function _amusUpdateDisplay() {
  const bar = document.getElementById('amusHypeBar');
  if (bar) bar.style.width = Math.min(100, (_amusTaps / AMUSEMENT_TAP_CAP) * 100) + '%';
  const count = document.getElementById('amusTapCount');
  if (count) count.textContent = `${_amusTaps} タップ`;
  const timer = document.getElementById('amusTimer');
  if (timer) timer.textContent = _amusPlaying ? `${Math.ceil(_amusTimeLeft)}秒` : `${AMUSEMENT_DURATION}秒`;
}

function amusementTap() {
  if (mgGetPlaysRemain('amusement', AMUSEMENT_MAX_PLAYS) === 0) return;
  if (!_amusPlaying) {
    // 最初のタップでゲーム開始
    mgRecordPlay('amusement');
    _amusTaps = 0; _amusTimeLeft = AMUSEMENT_DURATION; _amusPlaying = true;
    _amusLastTime = performance.now();
    _amusRaf = requestAnimationFrame(_amusFrame);
  }
  _amusTaps++;
  _amusUpdateDisplay();

  // ボタンアニメ
  const btn = document.getElementById('amusementTapBtn');
  if (btn) { btn.classList.add('tapped'); setTimeout(() => btn.classList.remove('tapped'), 80); }
}

function _amusFrame(now) {
  const dt = (now - _amusLastTime) / 1000;
  _amusLastTime = now;
  _amusTimeLeft = Math.max(0, _amusTimeLeft - dt);
  _amusUpdateDisplay();
  if (_amusTimeLeft <= 0) { _amusFinish(); return; }
  _amusRaf = requestAnimationFrame(_amusFrame);
}

function _amusStop() {
  _amusPlaying = false;
  if (_amusRaf) { cancelAnimationFrame(_amusRaf); _amusRaf = null; }
}

function _amusFinish() {
  _amusStop();
  const base  = mgBaseReward('amusement', 30);
  const ratio = Math.min(1, _amusTaps / AMUSEMENT_TAP_CAP);

  let reward, label, cls;
  if (_amusTaps >= AMUSEMENT_TAP_CAP) {
    reward = Math.floor(base * 3);   label = `🎡 MAX！${_amusTaps}タップ！`; cls = 'mg-result-perfect'; playMilestoneSfx();
  } else if (_amusTaps >= AMUSEMENT_TAP_CAP * 0.6) {
    reward = Math.floor(base * 1.5 * ratio + base * 0.3); label = `👍 盛り上がった！${_amusTaps}タップ`; cls = 'mg-result-good'; playQuestSfx();
  } else {
    reward = Math.floor(base * ratio + base * 0.1); label = `😅 もっと連打！${_amusTaps}タップ`; cls = 'mg-result-miss'; playTones([300,250],0.3,0.18);
  }

  mgShowResult('amusementResult', `${label}  +${fmt(reward)} 🪙`, cls);
  mgRewardAndLog(reward, `🎡 遊園地 ${_amusTaps}タップ`);
  mgUpdatePlaysEl('amusementPlaysRemain', 'amusement', AMUSEMENT_MAX_PLAYS);

  const btn = document.getElementById('amusementTapBtn');
  if (btn) {
    const remain = mgGetPlaysRemain('amusement', AMUSEMENT_MAX_PLAYS);
    btn.disabled = remain === 0;
    btn.textContent = remain > 0 ? '🎡 もう一回！' : '今日はここまで';
  }
}
