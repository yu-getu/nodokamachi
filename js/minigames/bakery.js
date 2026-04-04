// ══════════════════════════════
//  パン屋ミニゲーム
// ══════════════════════════════

const BAKERY_DAILY_MAX = 10; // 1日の最大プレイ回数（参考値）

// ゾーン境界（バー幅100%基準）
const BK_GOOD_L    = 28;
const BK_GOOD_W    = 44;
const BK_PERFECT_L = 42;
const BK_PERFECT_W = 16;

// クールタイム・倍率
const BK_COOLDOWN_SEC  = 1;    // クリック間のクールタイム（秒）
const BK_MULT_MIN      = 0.3;  // 倍率下限
const BK_MULT_MAX      = 3.0;  // 倍率上限
const BK_MULT_UP       = 0.2;  // PERFECT で上昇する量
const BK_MULT_GOOD_UP  = 0.05; // GOOD で上昇する量
const BK_MULT_DOWN     = 0.25; // MISS で低下する量

let _bkRaf        = null;
let _bkStartTime  = null;
let _bkPlayed     = false;
let _bkCurrentPos = 50;
let _bkSpeed      = 0.8;

let _bkCooldownEnd = 0;
let _bkCdInterval  = null;

function _bkTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getBakeryPlaysToday() {
  if ((state.bakeryGameLastDate || '') !== _bkTodayStr()) return 0;
  return state.bakeryGamePlaysToday || 0;
}

function getBakeryPlaysRemain() {
  return BAKERY_DAILY_MAX; // 回数制限なし
}

function _bkGetMult() {
  if ((state.bakeryGameLastDate || '') !== _bkTodayStr()) return 1.0;
  return state.bakeryMult ?? 1.0;
}

function _bkSetMult(val) {
  state.bakeryMult = Math.max(BK_MULT_MIN, Math.min(BK_MULT_MAX, Math.round(val * 100) / 100));
}

function _bkUpdateMultDisplay(diff) {
  const el = document.getElementById('bkMultDisplay');
  if (!el) return;
  const mult = _bkGetMult();
  let color = mult >= 1.5 ? '#f5a623' : mult < 0.8 ? '#e05' : '#555';
  if (mult >= 2.5) color = '#a020f0';
  let diffHtml = '';
  if (diff !== undefined && diff !== 0) {
    const sign  = diff > 0 ? '▲' : '▼';
    const dc    = diff > 0 ? '#f5a623' : '#e05';
    diffHtml = `　<span style="color:${dc};font-size:11px">${sign}${Math.abs(diff).toFixed(2)}</span>`;
  }
  el.innerHTML = `倍率：<strong style="color:${color}">×${mult.toFixed(2)}</strong>${diffHtml}`;
}

function openBakeryGame() {
  if ((state.buildings['bakery']?.level || 0) === 0) return;

  _bkPlayed = false;
  document.getElementById('bkResult').textContent = '';
  document.getElementById('bkResult').className = 'bk-result';
  _bkUpdateStatus();
  _bkUpdateMultDisplay();
  document.getElementById('bakeryModal').classList.add('show');

  if (getBakeryPlaysRemain() > 0 && Date.now() >= _bkCooldownEnd) {
    _bkSpeed = 0.65 + Math.random() * 0.3;
    _bkStartAnim();
  }
}

function closeBakeryGame() {
  _bkStopAnim();
  _bkStopCooldown();
  document.getElementById('bakeryModal').classList.remove('show');
  renderShop();
}

function _bkUpdateBread(pos) {
  const el  = document.getElementById('bkBreadDisplay');
  const lbl = document.getElementById('bkBreadLabel');
  if (!el) return;
  const cls =
    pos >= BK_PERFECT_L && pos <= BK_PERFECT_L + BK_PERFECT_W ? 'bk-bread-perfect' :
    pos >= BK_GOOD_L    && pos <= BK_GOOD_L    + BK_GOOD_W    ? 'bk-bread-good'    :
    pos > BK_GOOD_L + BK_GOOD_W                                ? 'bk-bread-burnt'   :
                                                                  'bk-bread-raw';
  const newClass = 'bk-bread ' + cls;
  if (el.className !== newClass) {
    el.className = newClass;
    if (lbl) lbl.textContent =
      cls === 'bk-bread-perfect' ? '✨ 焼き立て！'  :
      cls === 'bk-bread-good'    ? 'いい感じ！'     :
      cls === 'bk-bread-burnt'   ? '💨 焦げそう！'  : '生焼け…';
  }
}

function _bkStartAnim() {
  _bkStopAnim();
  _bkStartTime = performance.now();
  function frame(now) {
    const elapsed = (now - _bkStartTime) / 1000;
    _bkCurrentPos = (Math.sin(elapsed * _bkSpeed * Math.PI * 2) + 1) / 2 * 86 + 7;
    const ind = document.getElementById('bkIndicator');
    if (ind) ind.style.left = `calc(${_bkCurrentPos}% - 4px)`;
    _bkUpdateBread(_bkCurrentPos);
    _bkRaf = requestAnimationFrame(frame);
  }
  _bkRaf = requestAnimationFrame(frame);
}

function _bkStopAnim() {
  if (_bkRaf) { cancelAnimationFrame(_bkRaf); _bkRaf = null; }
}

function _bkStopCooldown() {
  if (_bkCdInterval) { clearInterval(_bkCdInterval); _bkCdInterval = null; }
}

function _bkStartCooldown() {
  _bkCooldownEnd = Date.now() + BK_COOLDOWN_SEC * 1000;
  _bkStopCooldown();

  const btn   = document.getElementById('bkPressBtn');
  const cdEl  = document.getElementById('bkCooldown');
  if (btn) btn.disabled = true;

  _bkCdInterval = setInterval(() => {
    const remain = (_bkCooldownEnd - Date.now()) / 1000;
    if (remain <= 0) {
      _bkStopCooldown();
      _bkUpdateStatus();
      _bkSpeed = 0.65 + Math.random() * 0.3;
      _bkStartAnim();
    } else {
      if (cdEl) cdEl.textContent = `次まで ${remain.toFixed(1)}秒…`;
    }
  }, 100);
}

function _bkUpdateStatus() {
  const cdEl = document.getElementById('bkCooldown');
  const btn  = document.getElementById('bkPressBtn');
  if (!cdEl || !btn) return;
  cdEl.textContent = '';
  btn.disabled = false;
}

function pressBakeryBtn() {
  if (getBakeryPlaysRemain() === 0) return;
  if (Date.now() < _bkCooldownEnd) return;

  const pos = _bkCurrentPos;
  _bkStopAnim();

  // プレイ数・日付リセット
  const today = _bkTodayStr();
  if ((state.bakeryGameLastDate || '') !== today) {
    state.bakeryGameLastDate  = today;
    state.bakeryGamePlaysToday = 0;
    state.bakeryMult           = 1.0; // 倍率も日次リセット
  }
  state.bakeryGamePlaysToday = (state.bakeryGamePlaysToday || 0) + 1;
  state.bakeryTotalPlays     = (state.bakeryTotalPlays     || 0) + 1;

  const b      = BUILDINGS.find(x => x.id === 'bakery');
  const base   = Math.max(100, Math.floor(getBuildingCps(b) * 30));
  const mult   = _bkGetMult();
  const inPerf = pos >= BK_PERFECT_L && pos <= BK_PERFECT_L + BK_PERFECT_W;
  const inGood = pos >= BK_GOOD_L    && pos <= BK_GOOD_L    + BK_GOOD_W;

  let reward, label, cls;
  if (inPerf) {
    reward = Math.floor(base * 3 * mult);
    label  = '🎉 PERFECT！';
    cls    = 'bk-result-perfect';
    _bkSetMult(mult + BK_MULT_UP);
    playMilestoneSfx();
    state.mgGotPerfect = true;
  } else if (inGood) {
    reward = Math.floor(base * 1.5 * mult);
    label  = '👍 GOOD！';
    cls    = 'bk-result-good';
    _bkSetMult(mult + BK_MULT_GOOD_UP);
    playQuestSfx();
  } else {
    if (pos > BK_GOOD_L + BK_GOOD_W) state.bakeryBurntOnce = true;
    reward = Math.floor(base * 0.2 * mult);
    label  = '💨 ミス…';
    cls    = 'bk-result-miss';
    _bkSetMult(mult - BK_MULT_DOWN);
    playTones([300, 250], 0.3, 0.18);
  }

  state.coins      += reward;
  state.totalEarned += reward;

  const newMult  = _bkGetMult();
  const multDiff = newMult - mult;

  const resultEl = document.getElementById('bkResult');
  resultEl.textContent = `${label}  +${fmt(reward)} 🪙`;
  resultEl.className   = `bk-result ${cls}`;

  addLog(`🥐 パン焼き ${label} +${fmt(reward)}コイン！（倍率×${newMult.toFixed(2)}）`);
  spawnFloatCoins(`+${fmt(reward)}`);
  renderStats();
  _bkUpdateMultDisplay(multDiff);

  _bkPlayed = true;
  _bkStartCooldown();
}
