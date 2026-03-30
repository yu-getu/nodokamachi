// ══════════════════════════════
//  ミニゲーム共通ユーティリティ
// ══════════════════════════════

function mgTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function mgGetPlaysRemain(id, maxPlays) {
  if ((state[`${id}GameLastDate`] || '') !== mgTodayStr()) return maxPlays;
  return Math.max(0, maxPlays - (state[`${id}GamePlaysToday`] || 0));
}

function mgRecordPlay(id) {
  const today = mgTodayStr();
  if ((state[`${id}GameLastDate`] || '') !== today) {
    state[`${id}GameLastDate`] = today;
    state[`${id}GamePlaysToday`] = 0;
  }
  state[`${id}GamePlaysToday`] = (state[`${id}GamePlaysToday`] || 0) + 1;
}

function mgShowResult(elId, text, cls) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = text;
  el.className = `mg-result ${cls}`;
}

function mgUpdatePlaysEl(elId, id, maxPlays) {
  const el = document.getElementById(elId);
  if (!el) return;
  const remain = mgGetPlaysRemain(id, maxPlays);
  el.textContent = remain > 0 ? `残り ${remain} 回 / ${maxPlays}回` : '本日終了。また明日！';
}

function mgBaseReward(buildingId, seconds) {
  const b = BUILDINGS.find(x => x.id === buildingId);
  if (!b) return 100;
  return Math.max(100, Math.floor(getBuildingCps(b) * seconds));
}

function mgRewardAndLog(reward, logText) {
  state.coins += reward;
  state.totalEarned += reward;
  addLog(`${logText} +${fmt(reward)}コイン！`);
  spawnFloatCoins(`+${fmt(reward)}`);
  renderStats();
}
