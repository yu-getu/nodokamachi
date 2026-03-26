// ══════════════════════════════
//  実績システム
// ══════════════════════════════
function getAchievMult() {
  let m = 1;
  if (state.achievements.coins_10k) m += .05;
  if (state.achievements.coins_100k) m += .10;
  if (state.achievements.all_buildings) m += .15;
  if (state.achievements.ms_4) m += .25;
  if (state.achievements.lv50) m += .10;
  if (state.achievements.lv100) m += .20;
  if (state.achievements.area2) m += .05;
  if (state.achievements.area3) m += .10;
  if (state.achievements.area4) m += .15;
  if (state.achievements.area5) m += .20;
  if (state.achievements.area6) m += .25;
  if (state.achievements.all_areas) m += .30;
  if (state.achievements.research_3) m += .05;
  if (state.achievements.research_all) m += .20;
  return m;
}

let achievToastTimer = null;
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (state.achievements[a.id]) return;
    if (a.check(state)) { state.achievements[a.id] = true; showAchievToast(a); addLog(`🏅 実績解除：${a.name}`); }
  });
}
function showAchievToast(a) {
  const t = document.getElementById('achievToast');
  document.getElementById('achievToastIcon').textContent = a.icon;
  document.getElementById('achievToastName').textContent = a.name;
  t.classList.add('show');
  playAchievSfx();
  if (achievToastTimer) clearTimeout(achievToastTimer);
  achievToastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}
