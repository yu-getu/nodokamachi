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
  showEventToast(ev);
  state.eventCount++;
  if (ev.id === 'storm') state.stormCount++;
  const now = Date.now();
  state.activeEvent = { eventId: ev.id, endsAt: ev.dur > 0 ? now + ev.dur * 1000 : now, mult: ev.mult || 1 };
  state.eventDiscount = ev.discount || 1;
  if (ev.bonus === 'flat') {
    state.coins += ev.amt; state.totalEarned += ev.amt;
    spawnFloatCoins(`+${fmt(ev.amt)}`);
    addLog(`${ev.icon} ${ev.title} +${fmt(ev.amt)}コイン！`);
  } else if (ev.bonus === 'cps30') {
    const b = Math.floor(getCps() * 30); state.coins += b; state.totalEarned += b;
    spawnFloatCoins(`+${fmt(b)}`);
    addLog(`${ev.icon} ${ev.title} +${fmt(b)}コイン！`);
  } else { addLog(`${ev.icon} ${ev.title}`); }
  checkAchievements(); render();
}

function showEventToast(ev) {
  const t = document.getElementById('eventToast');
  document.getElementById('eventIcon').textContent = ev.icon;
  document.getElementById('eventTitle').textContent = ev.title;
  document.getElementById('eventDesc').textContent = ev.desc;
  t.className = `event-toast ${ev.type} show`;
  if (eventToastTimer) clearTimeout(eventToastTimer);
  eventToastTimer = setTimeout(() => t.classList.remove('show'), 4000);
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
