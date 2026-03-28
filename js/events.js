// ══════════════════════════════
//  イベントシステム
// ══════════════════════════════
function getEventMult() {
  const now = Date.now();
  state.activeEvents = (state.activeEvents || []).filter(ae => now <= ae.endsAt);
  state.eventDiscount = state.activeEvents.reduce((best, ae) => Math.min(best, ae.discount || 1), 1);
  if (!state.activeEvents.length) return 1;
  const m = state.activeEvents.reduce((prod, ae) => prod * (ae.mult || 1), 1);
  // 花火台シナジー + イベント感知スキル：合計倍率がプラスの場合のみ強化
  if (m > 1) return m * (1 + getSkillEffect('event_mult')) * (1 + getDecoEventBonus());
  return m;
}

let eventToastTimer = null;
function triggerRandomEvent() {
  if (getTotalLv() < 1) return;
  const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
  state.eventCount++;
  if (ev.id === 'storm' || ev.id === 'lightning') state.stormCount++;
  const now = Date.now();
  if (!state.activeEvents) state.activeEvents = [];
  const durMult = 1 + getSkillEffect('event_dur');
  const newEndsAt = ev.dur > 0 ? now + ev.dur * 1000 * durMult : now;
  const existing = state.activeEvents.find(ae => ae.eventId === ev.id);
  if (existing) {
    existing.endsAt = newEndsAt;
  } else {
    state.activeEvents.push({ eventId: ev.id, endsAt: newEndsAt, mult: ev.mult || 1, discount: ev.discount || 1 });
    if (state.activeEvents.filter(ae => now <= ae.endsAt).length >= 3) state.eventStack3 = true;
  }
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


function updateEventBadge() {
  const container = document.getElementById('eventBadgeContainer');
  if (!container) return;
  const now = Date.now();
  const active = (state.activeEvents || []).filter(ae => ae.endsAt > now + 100);

  // 不要になったバッジを削除
  container.querySelectorAll('.event-badge').forEach(el => {
    if (!active.find(ae => ae.eventId === el.dataset.eventId)) el.remove();
  });

  // 追加・タイマー更新
  active.forEach(ae => {
    const ev = EVENTS.find(e => e.id === ae.eventId);
    if (!ev) return;
    const remaining = Math.max(0, Math.ceil((ae.endsAt - now) / 1000));
    let badge = container.querySelector(`[data-event-id="${ae.eventId}"]`);
    if (!badge) {
      badge = document.createElement('div');
      badge.className = `event-badge ev-${ev.type}`;
      badge.dataset.eventId = ae.eventId;
      badge.innerHTML = `
        <span class="event-badge-icon">${ev.icon}</span>
        <div class="event-badge-body">
          <div class="event-badge-title">${ev.title}</div>
          <div class="event-badge-timer"></div>
        </div>`;
      container.appendChild(badge);
    }
    badge.querySelector('.event-badge-timer').textContent = `残り ${remaining}秒`;
  });
}
