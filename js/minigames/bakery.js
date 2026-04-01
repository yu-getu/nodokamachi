// ══════════════════════════════
//  パン屋ミニゲーム
// ══════════════════════════════

const BAKERY_DAILY_MAX = 10; // 1日の最大プレイ回数

// ゾーン境界（バー幅100%基準）
const BK_GOOD_L    = 28;
const BK_GOOD_W    = 44;
const BK_PERFECT_L = 42;
const BK_PERFECT_W = 16;

let _bkRaf        = null;
let _bkStartTime  = null;
let _bkPlayed     = false;
let _bkCurrentPos = 50;
let _bkSpeed      = 0.8; // セッションごとに決まる速度

function _bkTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getBakeryPlaysToday() {
  if ((state.bakeryGameLastDate || '') !== _bkTodayStr()) return 0;
  return state.bakeryGamePlaysToday || 0;
}

function getBakeryPlaysRemain() {
  return Math.max(0, BAKERY_DAILY_MAX - getBakeryPlaysToday());
}

function openBakeryGame() {
  if ((state.buildings['bakery']?.level || 0) === 0) return;

  _bkPlayed = false;
  document.getElementById('bkResult').textContent = '';
  document.getElementById('bkResult').className = 'bk-result';
  _bkUpdateStatus();
  document.getElementById('bakeryModal').classList.add('show');

  if (getBakeryPlaysRemain() > 0) {
    // モーダルを開くたびに速度をランダムに変える（0.65〜0.95Hz）
    _bkSpeed = 0.65 + Math.random() * 0.3;
    _bkStartAnim();
  }
}

function closeBakeryGame() {
  _bkStopAnim();
  document.getElementById('bakeryModal').classList.remove('show');
  renderShop(); // ボタンの残り回数表示を更新
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

function _bkUpdateStatus() {
  const remain = getBakeryPlaysRemain();
  const cdEl   = document.getElementById('bkCooldown');
  const btn    = document.getElementById('bkPressBtn');
  if (!cdEl || !btn) return;

  if (remain === 0) {
    cdEl.textContent = '本日の分は終了しました。また明日！';
    btn.disabled = true;
  } else if (_bkPlayed) {
    cdEl.textContent = `残り ${remain} 回 / ${BAKERY_DAILY_MAX}回`;
    btn.disabled = false;
  } else {
    cdEl.textContent = `残り ${remain} 回 / ${BAKERY_DAILY_MAX}回`;
    btn.disabled = false;
  }
}

function pressBakeryBtn() {
  if (getBakeryPlaysRemain() === 0) return;

  const pos = _bkCurrentPos;
  _bkStopAnim();

  // プレイ数を記録
  const today = _bkTodayStr();
  if ((state.bakeryGameLastDate || '') !== today) {
    state.bakeryGameLastDate = today;
    state.bakeryGamePlaysToday = 0;
  }
  state.bakeryGamePlaysToday = (state.bakeryGamePlaysToday || 0) + 1;

  const b      = BUILDINGS.find(x => x.id === 'bakery');
  const base   = Math.max(100, Math.floor(getBuildingCps(b) * 30));
  const inPerf = pos >= BK_PERFECT_L && pos <= BK_PERFECT_L + BK_PERFECT_W;
  const inGood = pos >= BK_GOOD_L    && pos <= BK_GOOD_L    + BK_GOOD_W;

  let reward, label, cls;
  if (inPerf) {
    reward = Math.floor(base * 3);
    label  = '🎉 PERFECT！';
    cls    = 'bk-result-perfect';
    playMilestoneSfx();
  } else if (inGood) {
    reward = Math.floor(base * 1.5);
    label  = '👍 GOOD！';
    cls    = 'bk-result-good';
    playQuestSfx();
  } else {
    reward = Math.floor(base * 0.2);
    label  = '💨 ミス…';
    cls    = 'bk-result-miss';
    playTones([300, 250], 0.3, 0.18);
  }

  state.coins += reward;
  state.totalEarned += reward;

  const resultEl = document.getElementById('bkResult');
  resultEl.textContent = `${label}  +${fmt(reward)} 🪙`;
  resultEl.className   = `bk-result ${cls}`;

  addLog(`🥐 パン焼き ${label} +${fmt(reward)}コイン！`);
  spawnFloatCoins(`+${fmt(reward)}`);
  renderStats();

  _bkPlayed = true;
  _bkUpdateStatus();

  // 残りがあれば次のプレイに向けてアニメ再開（速度もランダムに更新）
  if (getBakeryPlaysRemain() > 0) {
    setTimeout(() => {
      _bkPlayed = false;
      _bkSpeed = 0.65 + Math.random() * 0.3;
      _bkStartAnim();
    }, 600);
  }
}
