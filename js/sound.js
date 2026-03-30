// ══════════════════════════════
//  サウンドシステム（Web Audio API）
// ══════════════════════════════
let _audioCtx = null, _sfxOn = true, _bgmOn = true, _bgmTimer = null;
let _bgmAudio = null;
let _bgmVol = 0.5, _sfxVol = 0.8;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _initBgmAudio() {
  if (_bgmAudio) return;
  _bgmAudio = new Audio('./ひだまりのまち.mp3');
  _bgmAudio.loop = true;
  _bgmAudio.volume = _bgmVol;
}

function _startBgm() {
  _initBgmAudio();
  _bgmAudio.play().catch(() => { });
}

function _stopBgm() {
  if (_bgmAudio) { _bgmAudio.pause(); _bgmAudio.currentTime = 0; }
}

function playTones(freqs, dur = 0.3, vol = 0.22, type = 'sine') {
  if (!_sfxOn) return;
  try {
    const ctx = getAudioCtx();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type; osc.frequency.value = freq;
      osc.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(vol * _sfxVol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  } catch (e) { }
}

function playCoinSfx() { playTones([523, 784], 0.2, 0.18); }
function playBuildSfx() { playTones([262, 330, 392], 0.28, 0.2); }
function playAchievSfx() { playTones([523, 659, 784, 1047], 0.5, 0.22); }
function playHarvestSfx() { playTones([440, 550], 0.18, 0.18); }
function playQuestSfx() { playTones([523, 659, 784], 0.4, 0.25); }
function playUnlockSfx() { playTones([330, 440, 554, 659], 0.45, 0.22); }
function playMilestoneSfx() { playTones([392, 494, 587, 698, 784, 988], 0.6, 0.28, 'sine'); }
function playEventSfx(type) {
  if (type === 'great') {
    // ファンファーレ：上昇アルペジオ＋高音フィナーレ
    playTones([392, 523, 659, 784, 1047], 0.55, 0.30, 'sine');
  } else if (type === 'good') {
    // 明るいチャイム
    playTones([659, 784, 988], 0.45, 0.24, 'sine');
  } else if (type === 'bad') {
    // 不穏な低音：下降
    playTones([330, 277, 233, 185], 0.5, 0.28, 'sawtooth');
  } else {
    // info：短い通知音
    playTones([523, 659], 0.3, 0.20, 'sine');
  }
}

function toggleBgm() {
  _bgmOn = !_bgmOn;
  if (_bgmOn) _startBgm(); else _stopBgm();
  localStorage.setItem('nodoka_bgm', _bgmOn ? '1' : '0');
  updateSoundBtns();
  if (typeof state !== 'undefined') {
    state.bgmToggleCount = (state.bgmToggleCount || 0) + 1;
    checkAchievements();
  }
}
function toggleSfx() {
  _sfxOn = !_sfxOn;
  localStorage.setItem('nodoka_sfx', _sfxOn ? '1' : '0');
  updateSoundBtns();
}
function updateSoundBtns() {
  const b = document.getElementById('btnBgm'), s = document.getElementById('btnSfx');
  if (b) { b.textContent = _bgmOn ? '🎵' : '🔇'; b.classList.toggle('off', !_bgmOn); }
  if (s) { s.textContent = _sfxOn ? '🔔' : '🔕'; s.classList.toggle('off', !_sfxOn); }
}

function openSettings() {
  document.getElementById('sBgmOn').checked = _bgmOn;
  document.getElementById('sSfxOn').checked = _sfxOn;
  const bgmPct = Math.round(_bgmVol * 100);
  const sfxPct = Math.round(_sfxVol * 100);
  document.getElementById('sBgmVol').value = bgmPct;
  document.getElementById('sSfxVol').value = sfxPct;
  document.getElementById('sBgmVolVal').textContent = bgmPct + '%';
  document.getElementById('sSfxVolVal').textContent = sfxPct + '%';
  document.getElementById('settingsModal').classList.add('show');
}

function setBgmOn(on) { if (on !== _bgmOn) toggleBgm(); }
function setSfxOn(on)  { if (on !== _sfxOn) toggleSfx(); }

function setBgmVolume(val) {
  _bgmVol = val / 100;
  if (_bgmAudio) _bgmAudio.volume = _bgmVol;
  document.getElementById('sBgmVolVal').textContent = val + '%';
  localStorage.setItem('nodoka_bgm_vol', val);
}

function setSfxVolume(val) {
  _sfxVol = val / 100;
  document.getElementById('sSfxVolVal').textContent = val + '%';
  localStorage.setItem('nodoka_sfx_vol', val);
}

function initSound() {
  _bgmOn = localStorage.getItem('nodoka_bgm') !== '0';
  _sfxOn = localStorage.getItem('nodoka_sfx') !== '0';
  const savedBgmVol = localStorage.getItem('nodoka_bgm_vol');
  if (savedBgmVol !== null) _bgmVol = Number(savedBgmVol) / 100;
  const savedSfxVol = localStorage.getItem('nodoka_sfx_vol');
  if (savedSfxVol !== null) _sfxVol = Number(savedSfxVol) / 100;
  updateSoundBtns();
  document.addEventListener('click', () => { if (_bgmOn) _startBgm(); }, { once: true });
}
