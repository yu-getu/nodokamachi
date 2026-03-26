// ══════════════════════════════
//  サウンドシステム（Web Audio API）
// ══════════════════════════════
let _audioCtx = null, _sfxOn = true, _bgmOn = true, _bgmTimer = null;
let _bgmAudio = null;

function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _initBgmAudio() {
  if (_bgmAudio) return;
  _bgmAudio = new Audio('./ひだまりのまち.mp3');
  _bgmAudio.loop = true;
  _bgmAudio.volume = 0.5;
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
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  } catch (e) { }
}

function playCoinSfx() { playTones([523, 784], 0.2, 0.18); }
function playBuildSfx() { playTones([262, 330, 392], 0.28, 0.2); }
function playAchievSfx() { playTones([523, 659, 784, 1047], 0.5, 0.22); }
function playHarvestSfx() { playTones([440, 550], 0.18, 0.18); }
function playMilestoneSfx() { playTones([392, 523, 659, 784, 1047], 0.55, 0.22); }
function playQuestSfx() { playTones([523, 659, 784], 0.4, 0.25); }
function playUnlockSfx() { playTones([330, 440, 554, 659], 0.45, 0.22); }

function toggleBgm() {
  _bgmOn = !_bgmOn;
  if (_bgmOn) _startBgm(); else _stopBgm();
  localStorage.setItem('nodoka_bgm', _bgmOn ? '1' : '0');
  updateSoundBtns();
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

function initSound() {
  _bgmOn = localStorage.getItem('nodoka_bgm') !== '0';
  _sfxOn = localStorage.getItem('nodoka_sfx') !== '0';
  updateSoundBtns();
  // ブラウザの自動再生ポリシー対策：初回クリックで再生開始
  document.addEventListener('click', () => { if (_bgmOn) _startBgm(); }, { once: true });
}
