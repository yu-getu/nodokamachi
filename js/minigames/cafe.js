// ══════════════════════════════
//  喫茶店ミニゲーム：コーヒーを淹れる
//  横バーが自動で右に伸びる。GOODゾーンで止める。
// ══════════════════════════════

const CAFE_MAX_PLAYS  = 10;
const CAFE_GOOD_L     = 55;
const CAFE_GOOD_H     = 80;
const CAFE_PERFECT_L  = 65;
const CAFE_PERFECT_H  = 75;
const CAFE_FILL_SPEED = 28; // %/秒（約3.5秒でMAX）

let _cafeFill      = 0;
let _cafeRaf       = null;
let _cafeResetTimer = null;
let _cafeLastTime  = null;
let _cafePlayed    = false;

function openCafeGame() {
  if ((state.buildings['cafe']?.level || 0) === 0) return;
  _cafeFill   = 0;
  _cafePlayed = false;
  mgShowResult('cafeResult', '', '');
  _cafeUpdateCup(0);
  const btn = document.getElementById('cafePressBtn');
  if (btn) btn.disabled = false;
  mgUpdatePlaysEl('cafePlaysRemain', 'cafe', CAFE_MAX_PLAYS);
  document.getElementById('cafeModal').classList.add('show');
  if (mgGetPlaysRemain('cafe', CAFE_MAX_PLAYS) > 0) _cafeStartAnim();
}

function closeCafeGame() {
  _cafeStopAnim();
  document.getElementById('cafeModal').classList.remove('show');
  renderShop();
}

function _cafeUpdateCup(fill) {
  const cupEl = document.getElementById('cafeCupDisplay');
  const liqEl = document.getElementById('cafeLiquid');
  const lblEl = document.getElementById('cafeCupLabel');
  if (!cupEl || !liqEl) return;

  liqEl.style.height = Math.min(100, fill) + '%';

  const cls =
    fill >= 100          ? 'cafe-cup-overflow' :
    fill >= CAFE_PERFECT_L && fill <= CAFE_PERFECT_H ? 'cafe-cup-perfect' :
    fill >= CAFE_GOOD_L  ? 'cafe-cup-good'    :
    fill >= 30           ? 'cafe-cup-pouring'  :
                           'cafe-cup-empty';
  cupEl.className = 'cafe-cup ' + cls;
  if (lblEl) lblEl.textContent =
    cls === 'cafe-cup-overflow' ? '💦 あふれた！' :
    cls === 'cafe-cup-perfect'  ? '✨ 絶妙！'     :
    cls === 'cafe-cup-good'     ? 'いい感じ！'    :
    cls === 'cafe-cup-pouring'  ? '注いでいる…'   : 'まだ空…';
}

function _cafeStartAnim() {
  _cafeStopAnim();
  _cafeLastTime = performance.now();
  function frame(now) {
    const dt = (now - _cafeLastTime) / 1000;
    _cafeLastTime = now;
    _cafeFill = Math.min(100, _cafeFill + CAFE_FILL_SPEED * dt);
    const bar = document.getElementById('cafeFillBar');
    if (bar) bar.style.width = _cafeFill + '%';
    _cafeUpdateCup(_cafeFill);
    if (_cafeFill >= 100 && !_cafePlayed) { _cafeStopAnim(); _cafeResolve(); return; }
    if (!_cafePlayed) _cafeRaf = requestAnimationFrame(frame);
  }
  _cafeRaf = requestAnimationFrame(frame);
}

function _cafeStopAnim() {
  if (_cafeRaf) { cancelAnimationFrame(_cafeRaf); _cafeRaf = null; }
  if (_cafeResetTimer) { clearTimeout(_cafeResetTimer); _cafeResetTimer = null; }
}

function pressCafeBtn() {
  if (mgGetPlaysRemain('cafe', CAFE_MAX_PLAYS) === 0 || _cafePlayed) return;
  _cafeStopAnim();
  _cafeResolve();
}

function _cafeResolve() {
  _cafePlayed = true;
  mgRecordPlay('cafe');
  const base = mgBaseReward('cafe', 30);
  const f    = _cafeFill;

  let reward, label, cls;
  if (f >= CAFE_PERFECT_L && f <= CAFE_PERFECT_H) {
    reward = Math.floor(base * 3);   label = '☕ PERFECT！絶妙な一杯！'; cls = 'mg-result-perfect'; playMilestoneSfx();
  } else if (f >= CAFE_GOOD_L && f <= CAFE_GOOD_H) {
    reward = Math.floor(base * 1.5); label = '👍 GOOD！いい感じ';        cls = 'mg-result-good';    playQuestSfx();
  } else if (f >= 100) {
    reward = Math.floor(base * 0.1); label = '💦 あふれた…';            cls = 'mg-result-miss';    playTones([300,250],0.3,0.18);
  } else {
    reward = Math.floor(base * 0.3); label = '😐 薄すぎた…';            cls = 'mg-result-miss';    playTones([300,250],0.3,0.18);
  }

  mgShowResult('cafeResult', `${label}  +${fmt(reward)} 🪙`, cls);
  mgRewardAndLog(reward, `☕ コーヒー ${label}`);
  mgUpdatePlaysEl('cafePlaysRemain', 'cafe', CAFE_MAX_PLAYS);
  const btn = document.getElementById('cafePressBtn');
  if (btn) btn.disabled = true;

  if (mgGetPlaysRemain('cafe', CAFE_MAX_PLAYS) > 0) {
    _cafeResetTimer = setTimeout(() => {
      _cafeResetTimer = null;
      if (!document.getElementById('cafeModal')?.classList.contains('show')) return;
      _cafeFill = 0; _cafePlayed = false;
      if (btn) btn.disabled = false;
      mgShowResult('cafeResult', '', '');
      const bar = document.getElementById('cafeFillBar');
      if (bar) bar.style.width = '0%';
      _cafeUpdateCup(0);
      _cafeStartAnim();
    }, 900);
  }
}
