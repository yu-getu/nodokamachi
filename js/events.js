// ══════════════════════════════
//  イベントシステム
// ══════════════════════════════
function getEventMult() {
  if (!state.activeEvent) return 1;
  if (Date.now() > state.activeEvent.endsAt) { state.activeEvent = null; state.eventDiscount = 1; return 1; }
  const m = state.activeEvent.mult;
  // 花火台シナジー：イベント倍率をさらに強化（悪イベントには適用しない）
  if (m > 1) return m * (1 + getDecoEventBonus());
  return m;
}

let eventToastTimer = null;
function triggerRandomEvent() {
  if (getTotalLv() < 1) return;
  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  state.eventCount++;
  if (ev.id === 'storm' || ev.id === 'lightning') state.stormCount++;
  const now = Date.now();
  state.activeEvent = { eventId: ev.id, endsAt: ev.dur > 0 ? now + ev.dur * 1000 : now, mult: ev.mult || 1 };
  state.eventDiscount = ev.discount || 1;
  if (ev.bonus === 'cps' || ev.bonus === 'cps30') {
    const sec = ev.bonusSec || 30;
    const b = Math.floor(getCps() * sec);
    state.coins += b; state.totalEarned += b;
    spawnFloatCoins(`+${fmt(b)}`);
    addLog(`${ev.icon} ${ev.title} +${fmt(b)}コイン！`);
  } else if (ev.bonus === 'flat') {
    state.coins += ev.amt; state.totalEarned += ev.amt;
    spawnFloatCoins(`+${fmt(ev.amt)}`);
    addLog(`${ev.icon} ${ev.title} +${fmt(ev.amt)}コイン！`);
  } else {
    addLog(`${ev.icon} ${ev.title}`);
  }
  showEventToast(ev);
  flashScreen(ev.type);
  if (ev.type === 'bad') shakeScreen();
  playEventSfx(ev.type);
  checkAchievements(); render();
}

function showEventToast(ev) {
  const t = document.getElementById('eventToast');
  document.getElementById('eventIcon').textContent = ev.icon;
  document.getElementById('eventTitle').textContent = ev.title;
  document.getElementById('eventDesc').textContent = ev.desc;
  t.className = `event-toast ${ev.type} show`;
  if (eventToastTimer) clearTimeout(eventToastTimer);
  eventToastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}

function flashScreen(type) {
  const colors = { great: 'rgba(255,215,0,0.22)', good: 'rgba(76,175,80,0.18)', bad: 'rgba(229,57,53,0.22)', info: 'rgba(66,165,245,0.16)' };
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;inset:0;z-index:9000;pointer-events:none;background:${colors[type]||colors.info};animation:eventFlash .6s ease-out forwards`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

function shakeScreen() {
  const wrap = document.querySelector('.game-wrap');
  if (!wrap) return;
  wrap.classList.add('screen-shake');
  setTimeout(() => wrap.classList.remove('screen-shake'), 500);
}

function scheduleNextEvent() {
  setTimeout(() => { triggerRandomEvent(); scheduleNextEvent(); }, (45 + Math.random() * 75) * 1000);
}

function updateEventBadge() {
  const badge = document.getElementById('eventBadge');
  if (!badge) return;
  const ae = state.activeEvent;
  if (!ae || ae.dur === 0) { badge.style.display = 'none'; return; }

  const remaining = Math.max(0, Math.ceil((ae.endsAt - Date.now()) / 1000));
  if (remaining <= 0) { badge.style.display = 'none'; return; }

  const ev = EVENTS.find(e => e.id === ae.eventId);
  if (!ev) { badge.style.display = 'none'; return; }

  badge.style.display = 'flex';
  badge.className = `event-badge ev-${ev.type}`;
  document.getElementById('eventBadgeIcon').textContent  = ev.icon;
  document.getElementById('eventBadgeTitle').textContent = ev.title;
  document.getElementById('eventBadgeTimer').textContent = `残り ${remaining}秒`;
}
