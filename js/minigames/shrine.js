// ══════════════════════════════
//  神社ミニゲーム：おみくじ
//  ボタンを押すとランダムな結果
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
  document.getElementById('shrineLotDisplay').textContent = '🎋';
  document.getElementById('shrineLotDisplay').className   = 'shrine-lot-display';
  const btn = document.getElementById('shrinePressBtn');
  if (btn) { btn.disabled = mgGetPlaysRemain('shrine', SHRINE_MAX_PLAYS) === 0; btn.textContent = '🎋 おみくじを引く'; }
  mgUpdatePlaysEl('shrinePlaysRemain', 'shrine', SHRINE_MAX_PLAYS);
  document.getElementById('shrineModal').classList.add('show');
}

function closeShrineGame() {
  document.getElementById('shrineModal').classList.remove('show');
  renderShop();
}

function pressShrineBtn() {
  if (mgGetPlaysRemain('shrine', SHRINE_MAX_PLAYS) === 0) return;
  mgRecordPlay('shrine');

  // 抽選
  const r = Math.random();
  let cum = 0, result = SHRINE_LOTS[SHRINE_LOTS.length - 1];
  for (const lot of SHRINE_LOTS) { cum += lot.prob; if (r < cum) { result = lot; break; } }

  const base   = mgBaseReward('shrine', 60);
  const reward = Math.floor(base * result.mult);

  const disp = document.getElementById('shrineLotDisplay');
  if (disp) { disp.textContent = result.emoji; disp.className = `shrine-lot-display ${result.cls}`; }
  mgShowResult('shrineResult', `${result.label}！  +${fmt(reward)} 🪙`, result.mult >= 3 ? 'mg-result-perfect' : result.mult >= 1 ? 'mg-result-good' : 'mg-result-miss');
  mgRewardAndLog(reward, `⛩️ おみくじ ${result.label}`);
  mgUpdatePlaysEl('shrinePlaysRemain', 'shrine', SHRINE_MAX_PLAYS);

  if (result.mult >= 3) playMilestoneSfx();
  else if (result.mult >= 1) playQuestSfx();
  else playTones([300,250],0.3,0.18);

  const btn = document.getElementById('shrinePressBtn');
  if (btn) {
    const remain = mgGetPlaysRemain('shrine', SHRINE_MAX_PLAYS);
    btn.disabled  = remain === 0;
    btn.textContent = remain > 0 ? '🎋 もう一度引く' : '今日はここまで';
  }
}
