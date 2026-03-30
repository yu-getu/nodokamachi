// ══════════════════════════════
//  次元の扉ミニゲーム：デュアルバー
//  2本の針を同時にゾーンで止める
// ══════════════════════════════

const DIMGATE_MAX_PLAYS = 10;
const DIMGATE_GOOD_L    = 25;  // GOODゾーン左端 %
const DIMGATE_GOOD_W    = 50;  // GOODゾーン幅 %
const DIMGATE_PERF_L    = 40;  // PERFECTゾーン左端 %
const DIMGATE_PERF_W    = 20;  // PERFECTゾーン幅 %

let _dgPosA   = 50;
let _dgPosB   = 50;
let _dgSpeedA = 0.7;
let _dgSpeedB = 0.5;
let _dgRaf    = null;
let _dgStart  = null;
let _dgPlayed = false;

function openDimgateGame() {
  if ((state.buildings['dimgate']?.level || 0) === 0) return;
  _dgPlayed  = false;
  _dgSpeedA  = 0.55 + Math.random() * 0.35;
  _dgSpeedB  = 0.40 + Math.random() * 0.35;
  _dgPosA    = Math.random() * 86 + 7;
  _dgPosB    = Math.random() * 86 + 7;
  mgShowResult('dimgateResult', '', '');
  mgUpdatePlaysEl('dimgatePlaysRemain', 'dimgate', DIMGATE_MAX_PLAYS);
  const btn = document.getElementById('dimgatePressBtn');
  if (btn) {
    btn.disabled    = mgGetPlaysRemain('dimgate', DIMGATE_MAX_PLAYS) === 0;
    btn.textContent = '🌀 次元を開く！';
  }
  document.getElementById('dimgateModal').classList.add('show');
  if (mgGetPlaysRemain('dimgate', DIMGATE_MAX_PLAYS) > 0) _dgStartAnim();
}

function closeDimgateGame() {
  _dgStopAnim();
  document.getElementById('dimgateModal').classList.remove('show');
  renderShop();
}

function _dgStartAnim() {
  _dgStopAnim();
  _dgStart = performance.now();
  function frame(now) {
    const elapsed = (now - _dgStart) / 1000;
    _dgPosA = (Math.sin(elapsed * _dgSpeedA * Math.PI * 2) + 1) / 2 * 86 + 7;
    _dgPosB = (Math.sin(elapsed * _dgSpeedB * Math.PI * 2 + 1.0) + 1) / 2 * 86 + 7;
    const indA = document.getElementById('dimgateIndicatorA');
    const indB = document.getElementById('dimgateIndicatorB');
    if (indA) indA.style.left = `calc(${_dgPosA}% - 4px)`;
    if (indB) indB.style.left = `calc(${_dgPosB}% - 4px)`;
    if (!_dgPlayed) _dgRaf = requestAnimationFrame(frame);
  }
  _dgRaf = requestAnimationFrame(frame);
}

function _dgStopAnim() {
  if (_dgRaf) { cancelAnimationFrame(_dgRaf); _dgRaf = null; }
}

function _dgInZone(pos, l, w) { return pos >= l && pos <= l + w; }

function pressDimgateBtn() {
  if (_dgPlayed || mgGetPlaysRemain('dimgate', DIMGATE_MAX_PLAYS) === 0) return;
  _dgStopAnim();
  _dgPlayed = true;
  mgRecordPlay('dimgate');

  const aPerf = _dgInZone(_dgPosA, DIMGATE_PERF_L, DIMGATE_PERF_W);
  const bPerf = _dgInZone(_dgPosB, DIMGATE_PERF_L, DIMGATE_PERF_W);
  const aGood = _dgInZone(_dgPosA, DIMGATE_GOOD_L, DIMGATE_GOOD_W);
  const bGood = _dgInZone(_dgPosB, DIMGATE_GOOD_L, DIMGATE_GOOD_W);

  const base = mgBaseReward('dimgate', 30);
  let reward, label, cls;
  if (aPerf && bPerf) {
    reward = Math.floor(base * 3);    label = '🌀 PERFECT！次元が開いた！'; cls = 'mg-result-perfect'; playMilestoneSfx();
  } else if ((aGood || aPerf) && (bGood || bPerf)) {
    reward = Math.floor(base * 1.5);  label = '👍 GOOD！扉が揺れている';   cls = 'mg-result-good';    playQuestSfx();
  } else if ((aGood || aPerf) || (bGood || bPerf)) {
    reward = Math.floor(base * 0.6);  label = '😐 片方だけ…';             cls = 'mg-result-miss';    playTones([300, 250], 0.3, 0.18);
  } else {
    reward = Math.floor(base * 0.15); label = '❌ ミス…';                 cls = 'mg-result-miss';    playTones([200, 150], 0.3, 0.18);
  }

  mgShowResult('dimgateResult', `${label}  +${fmt(reward)} 🪙`, cls);
  mgRewardAndLog(reward, `🌀 次元の扉 ${label}`);
  mgUpdatePlaysEl('dimgatePlaysRemain', 'dimgate', DIMGATE_MAX_PLAYS);

  const btn = document.getElementById('dimgatePressBtn');
  if (btn) {
    const remain = mgGetPlaysRemain('dimgate', DIMGATE_MAX_PLAYS);
    btn.disabled    = remain === 0;
    btn.textContent = remain > 0 ? '🌀 もう一度' : '今日はここまで';
  }

  if (mgGetPlaysRemain('dimgate', DIMGATE_MAX_PLAYS) > 0) {
    setTimeout(() => {
      _dgPlayed  = false;
      _dgSpeedA  = 0.55 + Math.random() * 0.35;
      _dgSpeedB  = 0.40 + Math.random() * 0.35;
      mgShowResult('dimgateResult', '', '');
      _dgStartAnim();
    }, 900);
  }
}
