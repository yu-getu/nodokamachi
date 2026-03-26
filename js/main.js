// ══════════════════════════════
//  コアCPS計算・アクション・ゲームループ・起動
// ══════════════════════════════

// ── グローバルCPS計算 ──
function getCps() {
  const base = BUILDINGS.reduce((s,b) => s + getBuildingCps(b), 0);
  return base * getAchievMult() * getPrestigeMult();
}
function getEffectiveCps() { return getCps() * getEventMult() * getSeasonMult() * getBeautyMult() * getWeekendMult(); }

// ── アクション ──
function buyBuilding(id) {
  const b=BUILDINGS.find(x=>x.id===id);
  const lv=state.buildings[id].level;
  const maxLv=getMaxLevel();
  const cost=getBuildingCost(b);
  if(state.coins<cost||lv>=maxLv) return;

  state.coins-=cost;
  state.buildings[id].level++;
  const nl=state.buildings[id].level;

  addLog(lv===0?`🏗️ ${b.emoji}${b.name}を建設！(Lv.1)`:`⬆️ ${b.emoji}${b.name} Lv.${nl}に強化！`);
  spawnFloatCoins(`-${fmt(cost)}`);
  playBuildSfx();
  checkMilestones(id);
  checkAchievements();
  renderQuests();
  render();
}

function manualHarvest() {
  const bonus=Math.max(1,getEffectiveCps()*2*getSkillCollectMult());
  state.coins+=bonus; state.totalEarned+=bonus;
  spawnFloatCoins(`+${fmt(bonus)}`);
  playHarvestSfx();
  checkAchievements(); renderQuests(); render();
}

// ── ゲームループ ──
let tickCount = 0;
function tick() {
  const now=Date.now(), dt=(now-state.lastTick)/1000; state.lastTick=now;
  const earned=getEffectiveCps()*dt;
  state.coins+=earned; state.totalEarned+=earned;
  renderStats();
  document.querySelectorAll('.shop-item').forEach((el,i)=>{
    const b=BUILDINGS[i]; if(!b) return;
    const lv=state.buildings[b.id].level, maxLv=getMaxLevel();
    const isMax=lv>=maxLv, cost=getBuildingCost(b);
    el.className=`shop-item ${isMax?'maxed':state.coins>=cost?'affordable':''} ${getPhase(lv).colorClass}`;
    const btn=el.querySelector('.btn-buy');
    if(btn&&!isMax) btn.disabled=state.coins<cost;
  });
  document.querySelectorAll('.deco-item').forEach((el,i)=>{
    const d=DECORATIONS[i]; if(!d) return;
    const owned=!!state.decorations[d.id];
    const canAfford=!owned&&state.coins>=d.cost;
    el.className=`deco-item ${owned?'owned':canAfford?'affordable':''}`;
    const btn=el.querySelector('.btn-buy');
    if(btn&&!owned) btn.disabled=!canAfford;
  });
  AREAS.forEach(area=>{
    const btn=document.getElementById(`areaBtn${area.id}`);
    if(btn) btn.disabled=state.coins<area.unlockCost;
  });
  document.querySelectorAll('.research-item').forEach((el,i)=>{
    const r=RESEARCH[i]; if(!r) return;
    const done=!!state.research[r.id];
    const canAfford=!done&&state.coins>=r.cost;
    el.className=`research-item ${done?'done':canAfford?'affordable':''}`;
    const btn=el.querySelector('.btn-research');
    if(btn&&!done) btn.disabled=!canAfford;
  });
  // ── ゲーム内時間を進める ──
  state.gameDayProgress = (state.gameDayProgress || 0) + dt / GAME_DAY_REAL_SECS;
  if (state.gameDayProgress >= 1) {
    state.gameDayProgress -= 1;
    const prevSeason = getCurrentSeason();
    state.gameDay = (state.gameDay || 0) + 1;
    const newSeason = getCurrentSeason();
    if (prevSeason.id !== newSeason.id) {
      addLog(`${newSeason.emoji} 季節が変わりました：${newSeason.name}（${newSeason.desc}）`);
      setWeather(getSeasonWeather());
    }
    renderSeason();
  }

  tickCount++;
  if(tickCount%150===0){ saveGame(); updateSaveStatus(); }
  if(tickCount%50===0) updateSaveStatus();
  if(tickCount%100===0) { checkAchievements(); renderQuests(); }
  if(tickCount%50===0) updateSky();
  const resInterval = Math.max(25, 100 - getTotalLv());
  if(tickCount % resInterval === 0) spawnResident();
}

// ── 起動 ──
const loaded = loadGame();
addLog(loaded ? '💾 セーブデータを読み込みました。' : '🌿 のどかまちへようこそ！最初の建物を建ててみよう。');
if(state.prestigeCount > 0){
  document.getElementById('prestigeBadge').style.display='flex';
  document.getElementById('prestigeCount').textContent=state.prestigeCount;
}
render();
renderDailyBar();
checkQuestRefresh();
initSound();
updateSky();
initWeather();
setInterval(tick, 200);
scheduleNextEvent();

// Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/nodokamachi/sw.js')
      .then(reg => console.log('SW登録成功:', reg.scope))
      .catch(err => console.log('SW登録失敗:', err));
  });
}
