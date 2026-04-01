// ══════════════════════════════
//  ミニゲーム共通ユーティリティ
// ══════════════════════════════

function mgTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function mgGetPlaysRemain(_id, maxPlays) {
  return maxPlays; // 回数制限なし
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

function mgUpdatePlaysEl(elId, _id, _maxPlays) {
  const el = document.getElementById(elId);
  if (el) el.textContent = '';
}

function mgBaseReward(buildingId, seconds) {
  const b = BUILDINGS.find(x => x.id === buildingId);
  if (!b) return 100;
  const minigameMult = 1 + getSkillEffect('minigame_reward');
  return Math.max(100, Math.floor(getBuildingCps(b) * seconds * minigameMult));
}

function mgRewardAndLog(reward, logText) {
  state.coins += reward;
  state.totalEarned += reward;
  addLog(`${logText} +${fmt(reward)}コイン！`);
  spawnFloatCoins(`+${fmt(reward)}`);
  renderStats();
}
