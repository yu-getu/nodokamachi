// ══════════════════════════════
//  季節・昼夜・天気・住人システム
// ══════════════════════════════

// ── ゲーム内時間 ──
function getGameHour() {
  return Math.floor((state.gameDayProgress || 0) * 24);
}

function getGameDate() {
  const day = state.gameDay || 0;
  const seasonIdx   = Math.floor(day / GAME_SEASON_DAYS) % 4;
  const dayInSeason = (day % GAME_SEASON_DAYS) + 1;
  const year        = Math.floor(day / (GAME_SEASON_DAYS * 4)) + 1;
  return { year, season: SEASONS[seasonIdx], dayInSeason, totalDays: day + 1 };
}

function getCurrentSeason() { return getGameDate().season; }
function getSeasonMult()     { return getCurrentSeason().cpsMult; }

function renderSeason() {
  const { year, season, dayInSeason } = getGameDate();
  const badge = document.getElementById('seasonBadge');
  badge.textContent = `${season.emoji} ${year}年 ${season.name} ${dayInSeason}日`;
  badge.className = `season-badge ${season.cssClass}`;
  updateSky();
}

// 昼夜サイクル（ゲーム内時間基準）
function getDayPhase() {
  const h = getGameHour();
  if (h >= 5  && h < 8)  return 'dawn';
  if (h >= 8  && h < 18) return 'day';
  if (h >= 18 && h < 20) return 'dusk';
  return 'night';
}

let _starField = null;
function _ensureStarField() {
  if (_starField) return;
  const sky = document.querySelector('.sky-bg');
  _starField = document.createElement('div');
  _starField.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('div');
    s.className = 'sky-star';
    s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*50}%;width:${1+Math.random()*2}px;height:${1+Math.random()*2}px;animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*4}s`;
    _starField.appendChild(s);
  }
  sky.appendChild(_starField);
}

let _lastPhase = null;
function updateSky() {
  const phase = getDayPhase();
  const season = getCurrentSeason();
  const skyEl = document.querySelector('.sky-bg');
  const moonEl = document.getElementById('skyMoon');
  const sunEl  = document.getElementById('skySun');

  if (phase === 'night') {
    skyEl.style.background = 'linear-gradient(180deg,#0a0a2a 0%,#1a1a4e 40%,#2d3060 70%,#1a3020 100%)';
    if (moonEl) moonEl.style.display = 'block';
    if (sunEl)  sunEl.style.display  = 'none';
    _ensureStarField();
    if (_starField) _starField.style.display = 'block';
  } else if (phase === 'dawn') {
    skyEl.style.background = 'linear-gradient(180deg,#ff9a6c 0%,#ffcc80 35%,#e8f5e9 70%,#c8e6c9 100%)';
    if (moonEl) moonEl.style.display = 'none';
    if (sunEl)  sunEl.style.display  = 'none';
    if (_starField) _starField.style.display = 'none';
  } else if (phase === 'dusk') {
    skyEl.style.background = 'linear-gradient(180deg,#c0392b 0%,#e8552a 25%,#ff9a6c 50%,#ffe0b2 70%,#c8e6c9 100%)';
    if (moonEl) moonEl.style.display = 'none';
    if (sunEl)  sunEl.style.display  = 'none';
    if (_starField) _starField.style.display = 'none';
  } else {
    skyEl.style.background = season.skyGrad;
    if (moonEl) moonEl.style.display = 'none';
    if (sunEl)  sunEl.style.display  = 'block';
    if (_starField) _starField.style.display = 'none';
  }
  _lastPhase = phase;
}

// 天気システム
let _weatherTimer = null;

function setWeather(type) {
  if (_weatherTimer) { clearInterval(_weatherTimer); _weatherTimer = null; }
  const layer = document.getElementById('weatherLayer');
  if (!layer) return;
  layer.innerHTML = '';
  if (type === 'clear' || !WEATHER_DEFS[type]) return;
  _weatherTimer = setInterval(() => {
    const p = WEATHER_DEFS[type].particles;
    if (!p.length) return;
    const el = document.createElement('div');
    el.className = 'wp';
    el.textContent = p[Math.floor(Math.random() * p.length)];
    el.style.left = (Math.random() * 110 - 5) + '%';
    el.style.fontSize = (11 + Math.random() * 8) + 'px';
    const dur = 2.5 + Math.random() * 2.5;
    el.style.animationDuration = dur + 's';
    layer.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000 + 100);
  }, type === 'rain' ? 300 : 500);
}

function getSeasonWeather() {
  const s = getCurrentSeason(), r = Math.random();
  if (s.id === 'spring') return r < 0.65 ? 'cherry' : r < 0.85 ? 'rain' : 'clear';
  if (s.id === 'summer') return r < 0.55 ? 'clear'  : 'rain';
  if (s.id === 'autumn') return r < 0.60 ? 'leaves' : 'clear';
  if (s.id === 'winter') return r < 0.65 ? 'snow'   : 'clear';
  return 'clear';
}

function initWeather() {
  setWeather(getSeasonWeather());
  setInterval(() => setWeather(getSeasonWeather()), 3 * 60 * 1000);
}

// 住人システム
function spawnResident() {
  const totalLv = getTotalLv();
  if (totalLv < 3) return;
  const town = document.getElementById('townArea');
  const type = RESIDENT_TYPES[Math.floor(Math.random() * RESIDENT_TYPES.length)];
  const duration = 9 + Math.random() * 9;
  const rtl = Math.random() < 0.3;

  const el = document.createElement('div');
  el.className = 'resident' + (rtl ? ' rtl' : '');
  el.style.animationDuration = duration + 's';
  el.style.bottom = (48 + Math.random() * 18) + 'px';

  const emojiEl = document.createElement('span');
  emojiEl.className = 'res-emoji';
  emojiEl.textContent = type.emoji;
  el.appendChild(emojiEl);
  town.appendChild(el);

  const showAt = 1000 + Math.random() * 2000;
  setTimeout(() => {
    if (!el.isConnected) return;
    const season = getCurrentSeason();
    const pool = [...type.phrases, ...(SEASON_PHRASES[season.id] || [])];
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = phrase;
    el.appendChild(bubble);
    setTimeout(() => {
      bubble.classList.add('fadeout');
      setTimeout(() => bubble.remove(), 400);
    }, 2500);
  }, showAt);

  setTimeout(() => el.remove(), duration * 1000 + 200);
}
