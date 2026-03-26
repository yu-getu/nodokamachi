// ══════════════════════════════
//  デイリーボーナスシステム
// ══════════════════════════════
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getYesterdayStr() {
  const d = new Date(); d.setDate(d.getDate()-1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isDailyClaimable() {
  return state.daily.lastClaimDate !== getTodayStr();
}

function getCurrentDayReward() {
  const idx = state.daily.streak % 7;
  return DAILY_REWARDS[idx];
}

function claimDaily() {
  if (!isDailyClaimable()) return;

  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  if (state.daily.lastClaimDate === yesterday) {
    state.daily.streak++;
  } else {
    state.daily.streak = 1;
  }
  state.daily.lastClaimDate = today;
  state.daily.totalClaimed++;

  const reward = DAILY_REWARDS[(state.daily.streak - 1) % 7];

  if (reward.multiplier > 1) {
    const dur = (reward.duration || 3600) * 1000;
    state.activeEvent = {
      eventId: 'daily7',
      endsAt: Date.now() + dur,
      mult: reward.multiplier,
    };
    addLog(`👑 7日連続ログイン！${reward.duration/3600}時間CPS×${reward.multiplier}ボーナス！`);
    spawnFloatCoins(`👑×${reward.multiplier}`);
  } else {
    const cpsBonus = Math.floor(getEffectiveCps() * reward.cpsHours * 3600);
    const bonus = Math.max(reward.minCoins, cpsBonus);
    state.coins += bonus;
    state.totalEarned += bonus;
    addLog(`🎁 デイリーボーナス受け取り！(${state.daily.streak}日連続) +${fmt(bonus)}コイン（${reward.cpsHours}時間分）`);
    spawnFloatCoins(`+${fmt(bonus)}`);
  }

  saveGame();
  renderDailyBar();
  closeModal('dailyModal');
  render();
}

function openDailyModal() {
  const canClaim = isDailyClaimable();
  const streak = state.daily.streak;
  const nextReward = getCurrentDayReward();

  document.getElementById('dailyModalMsg').textContent = canClaim
    ? `${streak > 0 ? streak + '日連続ログイン中！' : ''}今日のボーナスを受け取ろう`
    : '今日はもう受け取り済みです。また明日！';

  const cal = document.getElementById('dailyCalendar');
  cal.innerHTML = '';
  DAILY_REWARDS.forEach((r, i) => {
    const dayNum = i + 1;
    const isPast  = dayNum < (streak % 7 === 0 && streak > 0 ? 7 : streak % 7);
    const isToday = canClaim && dayNum === ((streak % 7) + 1 <= 7 ? (streak % 7) + 1 : 1);
    const isFuture = !isPast && !isToday;
    const cls = isPast ? 'past' : isToday ? 'today' : 'future';
    const bonusText = r.multiplier > 1 ? r.special : `${r.cpsHours}時間分`;
    cal.innerHTML += `<div class="daily-day ${cls}">
      <div class="daily-day-num">${dayNum}日</div>
      <div class="daily-day-icon">${r.icon}</div>
      <div class="daily-day-bonus">${bonusText}</div>
    </div>`;
  });

  const bonusEl = document.getElementById('dailyBonusCoins');
  if (nextReward.multiplier > 1) {
    bonusEl.textContent = `👑 ${nextReward.special}`;
  } else {
    const cpsBonus = Math.floor(getEffectiveCps() * nextReward.cpsHours * 3600);
    const bonus = Math.max(nextReward.minCoins, cpsBonus);
    bonusEl.textContent = `+${fmt(bonus)} 🪙（${nextReward.cpsHours}時間分）`;
  }

  const btn = document.getElementById('btnDailyModal');
  btn.textContent = canClaim ? '受け取る！' : '閉じる';
  btn.disabled = false;
  btn.onclick = canClaim ? claimDaily : () => closeModal('dailyModal');

  document.getElementById('dailyModal').classList.add('show');
}

function renderDailyBar() {
  const canClaim = isDailyClaimable();
  const bar = document.getElementById('dailyBar');
  const streak = state.daily.streak;
  const nextReward = getCurrentDayReward();

  bar.classList.toggle('claimed', !canClaim);
  document.getElementById('dailyBarIcon').textContent = canClaim ? nextReward.icon : '✅';
  document.getElementById('dailyBarTitle').textContent = canClaim
    ? 'デイリーボーナス受け取れます！'
    : '本日受け取り済み';

  if (!canClaim) {
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate()+1);
    tomorrow.setHours(0,0,0,0);
    const diffH = Math.ceil((tomorrow-now)/3600000);
    document.getElementById('dailyBarSubtitle').textContent = `次回：約${diffH}時間後`;
  } else {
    const bonusSub = nextReward.multiplier > 1
      ? nextReward.special
      : `+${fmt(Math.max(nextReward.minCoins, Math.floor(getEffectiveCps()*nextReward.cpsHours*3600)))}コイン（${nextReward.cpsHours}時間分）`;
    document.getElementById('dailyBarSubtitle').textContent = `本日のボーナス：${bonusSub}`;
  }

  document.getElementById('dailyStreak').textContent =
    streak > 0 ? `🔥${streak}日連続` : '';
  document.getElementById('btnDailyClaim').disabled = !canClaim;
  document.getElementById('btnDailyClaim').style.display = canClaim ? '' : 'none';
}
