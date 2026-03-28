// ══════════════════════════════
//  実績システム
// ══════════════════════════════
function getAchievCpsBonus() {
  const rate = getSkillEffect('achiev_cps');
  if (!rate) return 1;
  const count = Object.values(state.achievements || {}).filter(Boolean).length;
  return 1 + count * rate;
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
