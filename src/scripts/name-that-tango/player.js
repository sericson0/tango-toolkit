// Name That Tango — the clip player: a small state machine around the shared
// <audio> element (30s clips with a countdown, pause/resume, "later clip",
// reveal-panel full listens, preloading, and load-failure recovery).
//
// The Matching board and the session summary drive `Player.audio` directly
// for their own per-row playback; they register onEnded/onError interceptors
// so this module's default handlers stand aside while they're active.
import { CLIP_DURATION_S } from './config.js';
import { random } from './util.js';

var CLIP_FADE_S = 1;            // ramp the clip's volume down to silence over its final second

var clipAudio = document.getElementById('clipAudio');
var playBtn = document.getElementById('playBtn');
var laterClipBtn = document.getElementById('laterClipBtn');
var playerStatus = document.getElementById('playerStatus');
var clipProgressBar = document.getElementById('clipProgressBar');

var playerState = 'idle'; // idle | playing | paused | ended
var clipStartOffset = 0;
var listeningFull = false;      // reveal "listen from the top" mode (no 30s cap)
var countdownInterval = null;
var singerAskedHint = false;    // whether the current round asks for the singer (clips start later in the song)
var pendingMeta = null;         // loadedmetadata handler awaiting a deferred seek

var preloadEl = new Audio();    // warms the next round's clip so Play is instant
preloadEl.preload = 'auto';

var endedInterceptors = [];
var errorInterceptors = [];

// In "listen from the top" mode (reveal panel) the 30s cap is lifted so the
// player can hear the whole recording after answering.
function clipLimit() {
  var songDuration = isFinite(clipAudio.duration) && clipAudio.duration > 0 ? clipAudio.duration : null;
  if (listeningFull) return songDuration || CLIP_DURATION_S;
  var available = songDuration ? Math.max(0, songDuration - clipStartOffset) : CLIP_DURATION_S;
  return Math.min(CLIP_DURATION_S, available);
}

function elapsedInClip() {
  return Math.max(0, clipAudio.currentTime - clipStartOffset);
}

function updatePlayBtn() {
  if (playerState === 'playing') playBtn.textContent = '⏸ Pause';
  else if (playerState === 'paused') playBtn.textContent = '▶ Resume';
  else playBtn.textContent = '▶ Play Clip';
}

function updateProgress() {
  var lim = clipLimit();
  var frac = lim > 0 ? Math.min(1, elapsedInClip() / lim) : 0;
  clipProgressBar.style.width = (frac * 100) + '%';
}

function tickCountdown() {
  var remaining = Math.max(0, clipLimit() - elapsedInClip());
  playerStatus.textContent = Math.ceil(remaining) + 's remaining';
  updateProgress();
  // Fade the last second so clips don't cut off mid-note. Volume is reset to
  // full whenever playback (re)starts in playClip().
  clipAudio.volume = remaining >= CLIP_FADE_S ? 1 : Math.max(0, remaining / CLIP_FADE_S);
  if (remaining <= 0) stopClip('Clip ended — tap Play to listen again.');
}

function stopClip(statusText) {
  clipAudio.pause();
  clearInterval(countdownInterval);
  playerState = 'ended';
  updatePlayBtn();
  updateProgress();
  playerStatus.textContent = statusText;
}

function clearPendingMeta() {
  if (pendingMeta) {
    clipAudio.removeEventListener('loadedmetadata', pendingMeta);
    pendingMeta = null;
  }
}

// Pick a start offset, clamped so a short recording can't start past its own
// end (which would produce an instant "clip ended"). Needs the track
// duration, so it waits for metadata if the browser hasn't loaded it yet.
function seekThenPlay(computeOffset) {
  var begin = function () {
    clipStartOffset = computeOffset();
    try { clipAudio.currentTime = clipStartOffset; } catch (e) {}
    playClip();
  };
  if (clipAudio.readyState >= 1) { begin(); return; }
  playerStatus.textContent = 'Loading…';
  clearPendingMeta();
  pendingMeta = function () {
    clearPendingMeta();
    begin();
  };
  clipAudio.addEventListener('loadedmetadata', pendingMeta);
  // A previous failed fetch leaves the element in an error state that won't
  // retry on its own — load() restarts it so Play can recover from a blip.
  if (clipAudio.preload === 'none' || clipAudio.error) clipAudio.load();
}

function startClip() {
  listeningFull = false;
  seekThenPlay(function () {
    var raw = singerAskedHint ? (55 + random() * 10) : random() * 60;
    var dur = clipAudio.duration;
    if (isFinite(dur) && dur > 0) {
      raw = Math.min(raw, Math.max(0, dur - Math.min(CLIP_DURATION_S, dur)));
    }
    return raw;
  });
}

// Reveal-panel "Listen from the top": whole recording, no clip cap.
function listenFull() {
  listeningFull = true;
  seekThenPlay(function () { return 0; });
}

// Replay the exact same segment after a clip ends — hearing a different
// random slice each time made "listen again" feel like a different song.
// "Later clip" is the deliberate way to hear another part.
function replayClip() {
  listeningFull = false;
  seekThenPlay(function () { return clipStartOffset; });
}

// "Later clip": replay starting CLIP_DURATION_S further into the song than
// wherever the current clip started, clamped so it can't start past the end.
function shiftClipLater() {
  listeningFull = false;
  seekThenPlay(function () {
    var next = clipStartOffset + CLIP_DURATION_S;
    var dur = clipAudio.duration;
    if (isFinite(dur) && dur > 0) next = Math.min(next, Math.max(0, dur - 1));
    return next;
  });
}

function playClip() {
  playerState = 'playing';
  updatePlayBtn();
  clipAudio.volume = 1;  // undo any leftover fade from a previous clip
  clearInterval(countdownInterval);
  var playPromise = clipAudio.play();
  if (playPromise && playPromise.catch) {
    // Covers both real failures and browsers that block the round-start
    // auto-play: fall back to the idle state so the Play button works.
    playPromise.catch(function () {
      clearInterval(countdownInterval);
      playerState = 'idle';
      updatePlayBtn();
      updateProgress();
      playerStatus.textContent = 'Tap ▶ Play to hear the clip.';
    });
  }
  countdownInterval = setInterval(tickCountdown, 200);
  tickCountdown();
}

function pauseClip() {
  clipAudio.pause();
  clearInterval(countdownInterval);
  playerState = 'paused';
  updatePlayBtn();
  playerStatus.textContent = 'Paused — ' + Math.ceil(Math.max(0, clipLimit() - elapsedInClip())) + 's remaining';
}

// Point the player at a new track and reset to idle. `singerAsked` biases
// the random clip offset toward later in the song (vocals rarely open a tango).
function loadTrack(url, opts) {
  clearInterval(countdownInterval);
  clearPendingMeta();
  clipAudio.pause();
  clipAudio.src = url;
  clipStartOffset = 0;
  listeningFull = false;
  singerAskedHint = !!(opts && opts.singerAsked);
  playerState = 'idle';
  updatePlayBtn();
  updateProgress();
  playerStatus.textContent = '';
}

// Park the player so another surface (summary rows, matching board) can use
// the shared audio element without the countdown fighting it.
function suspend() {
  clearInterval(countdownInterval);
  clearPendingMeta();
  clipAudio.pause();
  clipAudio.volume = 1;  // other surfaces (summary/matching) share this element at full volume
  playerState = 'idle';
  listeningFull = false;
  updatePlayBtn();
  playerStatus.textContent = '';
}

playBtn.addEventListener('click', function () {
  if (playerState === 'playing') pauseClip();
  else if (playerState === 'paused') playClip();
  else if (playerState === 'ended') replayClip();
  else startClip();
});

laterClipBtn.addEventListener('click', shiftClipLater);

clipAudio.addEventListener('ended', function () {
  for (var i = 0; i < endedInterceptors.length; i++) {
    if (endedInterceptors[i]()) return;
  }
  stopClip('Clip ended — tap Play to listen again.');
});

// Load failures (R2 hiccup, 404, dropped connection) used to leave the player
// stuck on "Loading…" with no way forward. Surface it and reset to idle so
// Play retries and Skip stays an obvious escape hatch.
clipAudio.addEventListener('error', function () {
  if (!clipAudio.error) return;
  for (var i = 0; i < errorInterceptors.length; i++) {
    if (errorInterceptors[i]()) return;
  }
  clearInterval(countdownInterval);
  clearPendingMeta();
  playerState = 'idle';
  updatePlayBtn();
  playerStatus.textContent = 'Could not load this clip — press Play to retry, or Skip to move on.';
});

export var Player = {
  audio: clipAudio,
  playBtn: playBtn,
  loadTrack: loadTrack,
  preloadNext: function (url) { if (url) preloadEl.src = url; },
  startClip: startClip,
  replayClip: replayClip,
  playClip: playClip,
  pauseClip: pauseClip,
  listenFull: listenFull,
  stopClip: stopClip,
  suspend: suspend,
  getState: function () { return playerState; },
  isListeningFull: function () { return listeningFull; },
  onEnded: function (fn) { endedInterceptors.push(fn); },
  onError: function (fn) { errorInterceptors.push(fn); }
};
