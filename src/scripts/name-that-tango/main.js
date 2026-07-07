// Name That Tango — entry point: data loading, the setup screen (game /
// orchestra / difficulty / rounds pickers), last-used-settings persistence,
// shareable URL params, and session kickoff for the quiz, matching, and
// Daily Challenge flows.
/* global Papa */
import {
  ROUNDS_OPTIONS, DEFAULT_ROUNDS, ORCHESTRA_MIN_SONGS, ERA_MIN_BANDLEADERS,
  ERA_MIN_SONGS, SETTINGS_KEY, DAILY_KEY, DAILY_ROUNDS,
  BIG_FOUR_RANGES, GOLDEN_AGE_RANGES, BIG_FOUR_SET, MODULES
} from './config.js';
import {
  norm, esc, extractYear, joinKey, getSortLastName, uniqueSorted,
  setRand, resetRand, mulberry32, sampleN, weightedSampleByBandleader
} from './util.js';
import { setupCombo } from './combo.js';
import { Stats } from './stats.js';
import { initQuiz, startQuizSession } from './quiz.js';
import { initMatching, startMatching } from './matching.js';

// --- DOM refs (setup section) ---
var root = document.getElementById('nttRoot');
var AUDIO_BASE = root.getAttribute('data-audio-base') || '';
var ERAS = window.__NTT_ERAS__ || [];

var loadStats = document.getElementById('loadStats');
var moduleSelect = document.getElementById('moduleSelect');
var orchestraPickerWrap = document.getElementById('orchestraPickerWrap');
var eraPickerWrap = document.getElementById('eraPickerWrap');
var bigFourRangeWrap = document.getElementById('bigFourRangeWrap');
var goldenAgeRangeWrap = document.getElementById('goldenAgeRangeWrap');
var levelWrap = document.getElementById('levelWrap');
var rangeCheckboxes = Array.prototype.slice.call(document.querySelectorAll('.ntt-range-checkbox'));
var goldenRangeCheckboxes = Array.prototype.slice.call(document.querySelectorAll('.ntt-golden-range-checkbox'));
var orchestraSelect = document.getElementById('orchestraSelect');
var eraSelect = document.getElementById('eraSelect');
var orchestraSearch = document.getElementById('orchestraSearch');
var orchestraComboList = document.getElementById('orchestraComboList');
var eraSearch = document.getElementById('eraSearch');
var eraComboList = document.getElementById('eraComboList');
var levelSelect = document.getElementById('levelSelect');
var levelDesc = document.getElementById('levelDesc');
var roundsWrap = document.getElementById('roundsWrap');
var roundsSelect = document.getElementById('roundsSelect');
var poolInfo = document.getElementById('poolInfo');
var startBtn = document.getElementById('startBtn');
var setupSection = document.getElementById('setupSection');

// --- State ---
var allMetadata = [];
var playableRows = [];
var currentModuleId = 'orchestra';
var currentPool = [];
var ROUNDS_PER_SESSION = DEFAULT_ROUNDS;

// --- Data loading: metadata.csv + audio-map.csv joined client-side ---
function loadData() {
  loadStats.textContent = 'Loading discography...';
  Papa.parse('/data/metadata.csv', {
    download: true, header: true, skipEmptyLines: true,
    complete: function (metaResults) {
      allMetadata = metaResults.data;
      for (var i = 0; i < allMetadata.length; i++) allMetadata[i]._idx = i;

      Papa.parse('/data/audio-map.csv', {
        download: true, header: true, skipEmptyLines: true,
        complete: function (mapResults) {
          onDataLoaded(mapResults.data);
        },
        error: function () {
          loadStats.textContent = 'Could not load audio map.';
        }
      });
    },
    error: function () {
      loadStats.textContent = 'Could not load discography data.';
    }
  });
}

function onDataLoaded(audioMapRows) {
  var audioByKey = {};
  for (var i = 0; i < audioMapRows.length; i++) {
    var r = audioMapRows[i];
    if (!r.AudioKey) continue;
    audioByKey[joinKey(r.Bandleader, r.Title, r.Date)] = r.AudioKey;
  }

  playableRows = [];
  for (var j = 0; j < allMetadata.length; j++) {
    var row = allMetadata[j];
    var key = joinKey(row.Bandleader, row.Title, row.Date);
    var audioKey = audioByKey[key];
    if (audioKey) {
      row._audioKey = audioKey;
      row._audioUrl = AUDIO_BASE.replace(/\/$/, '') + '/' + audioKey.split('/').map(encodeURIComponent).join('/');
      playableRows.push(row);
    }
  }

  loadStats.textContent = '';
  populateOrchestraSelect();
  populateEraSelect();
  syncModuleUI();
  setupCombo(orchestraSelect, orchestraSearch, orchestraComboList);
  setupCombo(eraSelect, eraSearch, eraComboList);
  Stats.render();
  applySavedSettings();
  applyUrlParams();
}

// --- Setup: game (module) selector ---
// Drives the visible picker from the dropdown's current value. Called on
// 'change' and once on load — browsers restore the <select> value across
// reloads/bfcache without firing 'change', so init must read it explicitly.
function syncModuleUI() {
  currentModuleId = moduleSelect.value;
  orchestraPickerWrap.style.display = currentModuleId === 'orchestra' ? '' : 'none';
  eraPickerWrap.style.display = currentModuleId === 'era' ? '' : 'none';
  bigFourRangeWrap.style.display = currentModuleId === 'bigfour' ? '' : 'none';
  goldenAgeRangeWrap.style.display = currentModuleId === 'goldenage' ? '' : 'none';
  // Daily has a single fixed level and round count — nothing to configure.
  levelWrap.style.display = currentModuleId === 'daily' ? 'none' : '';
  // Matching's round count comes from the selected level (board size), not this picker.
  roundsWrap.style.display = (currentModuleId === 'matching' || currentModuleId === 'daily') ? 'none' : '';
  populateLevelSelect();
  applyBigFourRangeDefault();
  updatePoolInfo();
}
moduleSelect.addEventListener('change', syncModuleUI);

rangeCheckboxes.forEach(function (cb) { cb.addEventListener('change', updatePoolInfo); });
goldenRangeCheckboxes.forEach(function (cb) { cb.addEventListener('change', updatePoolInfo); });

// The Big Four's Intro/Medium levels default to just the Golden Age date
// ranges (Pre and Post Golden Age off) — those are the recordings most
// players know these four bandleaders by, and it keeps the early levels
// from being harder than intended. Advanced/Challenge default to every
// period checked, since players choosing that difficulty are opting into
// the broadest pool. Either default can be overridden by unchecking boxes;
// switching level re-applies it.
function applyBigFourRangeDefault() {
  if (currentModuleId !== 'bigfour') return;
  var lvl = parseInt(levelSelect.value, 10);
  var goldenOnly = (lvl === 0 || lvl === 1);
  rangeCheckboxes.forEach(function (cb) {
    var r = cb.getAttribute('data-range');
    cb.checked = goldenOnly ? (r === 'early' || r === 'later') : true;
  });
}

// --- Setup: orchestra picker ---
function populateOrchestraSelect() {
  var counts = {};
  for (var i = 0; i < playableRows.length; i++) {
    var b = playableRows[i].Bandleader;
    counts[b] = (counts[b] || 0) + 1;
  }
  var names = Object.keys(counts).filter(function (b) { return counts[b] >= ORCHESTRA_MIN_SONGS; });
  names.sort(function (a, b) {
    var la = getSortLastName(a), lb = getSortLastName(b);
    if (la < lb) return -1;
    if (la > lb) return 1;
    return a.localeCompare(b);
  });

  var html = '<option value="">Choose an orchestra...</option>';
  for (var j = 0; j < names.length; j++) {
    html += '<option value="' + esc(names[j]) + '">' + esc(names[j]) + ' (' + counts[names[j]] + ')</option>';
  }
  orchestraSelect.innerHTML = html;
}
orchestraSelect.addEventListener('change', updatePoolInfo);

// --- Setup: era picker ---
function populateEraSelect() {
  var html = '<option value="">Choose an era...</option>';
  for (var i = 0; i < ERAS.length; i++) {
    var era = ERAS[i];
    var pool = poolForEra(era);
    var distinctBandleaders = uniqueSorted(pool, 'Bandleader').length;
    if (pool.length >= ERA_MIN_SONGS && distinctBandleaders >= ERA_MIN_BANDLEADERS) {
      html += '<option value="' + esc(era.id) + '">' + esc(era.label) + ' (' + pool.length + ')</option>';
    }
  }
  eraSelect.innerHTML = html;
}
eraSelect.addEventListener('change', updatePoolInfo);

function poolForEra(era) {
  var set = {};
  era.bandleaders.forEach(function (b) { set[norm(b)] = true; });
  return playableRows.filter(function (r) { return set[norm(r.Bandleader)]; });
}

// --- Setup: level picker ---
function populateLevelSelect() {
  var levels = MODULES[currentModuleId].levels;
  var html = '';
  for (var i = 0; i < levels.length; i++) {
    html += '<option value="' + i + '" title="' + esc(levels[i].desc || levels[i].label) + '">' + esc(levels[i].label) + '</option>';
  }
  levelSelect.innerHTML = html;
  updateLevelDesc();
}
// The level's description used to live only in the option's title attribute,
// which touch devices never see — show it as text under the select too.
function updateLevelDesc() {
  var levels = MODULES[currentModuleId].levels;
  var level = levels[parseInt(levelSelect.value, 10)] || levels[0];
  levelDesc.textContent = (level && level.desc) || '';
}
levelSelect.addEventListener('change', function () {
  updateLevelDesc();
  applyBigFourRangeDefault();
  updatePoolInfo();
});

function getSelectedLevel() {
  var levels = MODULES[currentModuleId].levels;
  return levels[parseInt(levelSelect.value, 10)] || levels[0];
}

// Reads the Matching module's selected difficulty (board size, whether
// titles are asked, and whether it's drag/tap tiles vs. type-in).
function getMatchingConfig() {
  var levels = MODULES.matching.levels;
  var level = levels[parseInt(levelSelect.value, 10)] || levels[0];
  return level.match;
}

function getSelectedBigFourRanges() {
  return BIG_FOUR_RANGES.filter(function (rg) {
    var cb = rangeCheckboxes.filter(function (c) { return c.getAttribute('data-range') === rg.id; })[0];
    return cb && cb.checked;
  });
}

function getSelectedGoldenRanges() {
  return GOLDEN_AGE_RANGES.filter(function (rg) {
    var cb = goldenRangeCheckboxes.filter(function (c) { return c.getAttribute('data-range') === rg.id; })[0];
    return cb && cb.checked;
  });
}

// The Daily Challenge pool: every playable Golden Age recording.
function goldenAgePool() {
  return playableRows.filter(function (r) {
    var y = extractYear(r.Date);
    return y >= 1935 && y <= 1959;
  });
}

function getSelectedPool() {
  if (currentModuleId === 'orchestra') {
    var b = orchestraSelect.value;
    if (!b) return [];
    return playableRows.filter(function (r) { return r.Bandleader === b; });
  }
  if (currentModuleId === 'bigfour') {
    var activeRanges = getSelectedBigFourRanges();
    if (!activeRanges.length) return [];
    return playableRows.filter(function (r) {
      if (!BIG_FOUR_SET[norm(r.Bandleader)]) return false;
      var year = extractYear(r.Date);
      return activeRanges.some(function (rg) { return rg.test(year); });
    });
  }
  if (currentModuleId === 'goldenage') {
    var goldenRanges = getSelectedGoldenRanges();
    if (!goldenRanges.length) return [];
    return playableRows.filter(function (r) {
      var year = extractYear(r.Date);
      return goldenRanges.some(function (rg) { return rg.test(year); });
    });
  }
  if (currentModuleId === 'daily') return goldenAgePool();
  if (currentModuleId === 'matching') return [];
  var eraId = eraSelect.value;
  if (!eraId) return [];
  var era = ERAS.filter(function (e) { return e.id === eraId; })[0];
  return era ? poolForEra(era) : [];
}

// Orchestras with enough playable songs to be a fair Matching answer.
function matchingEligibleOrchestras() {
  var counts = {};
  for (var i = 0; i < playableRows.length; i++) {
    var b = playableRows[i].Bandleader;
    counts[b] = (counts[b] || 0) + 1;
  }
  return Object.keys(counts).filter(function (b) { return counts[b] >= ORCHESTRA_MIN_SONGS; });
}

// --- Daily Challenge helpers ---
// Local calendar date, so the puzzle rolls over at the player's midnight.
function todayKey() {
  var d = new Date();
  var m = String(d.getMonth() + 1);
  var day = String(d.getDate());
  return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
}

function dailySeed(dateKey) {
  return parseInt(dateKey.replace(/-/g, ''), 10);
}

function readDailyRecord() {
  try {
    var raw = window.localStorage.getItem(DAILY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function updatePoolInfo() {
  if (currentModuleId === 'matching') {
    currentPool = [];
    var mCfg = getMatchingConfig();
    var orchs = matchingEligibleOrchestras();
    if (orchs.length < mCfg.count) {
      poolInfo.textContent = 'Not enough orchestras available for a matching round (need ' + mCfg.count + ').';
      startBtn.disabled = true;
    } else {
      var howTo = mCfg.writein ? 'type in the orchestra and title for each clip' :
        mCfg.titles ? 'drag orchestra and title tiles onto each clip' : 'drag each orchestra tile onto its clip';
      poolInfo.textContent = orchs.length + ' orchestras available — ' + howTo + ' (' + mCfg.count + ' songs).';
      startBtn.disabled = false;
    }
    return;
  }
  if (currentModuleId === 'daily') {
    currentPool = getSelectedPool();
    var text = 'Today’s challenge: ' + DAILY_ROUNDS + ' Golden Age songs — the same set for every player, new songs at midnight.';
    var rec = readDailyRecord();
    if (rec && rec.date === todayKey()) {
      text += ' You already played today: ' + rec.songsCorrect + '/' + rec.gradedSongs + ' songs.';
    }
    poolInfo.textContent = text;
    startBtn.disabled = currentPool.length < DAILY_ROUNDS;
    return;
  }
  var pool = getSelectedPool();
  currentPool = pool;
  if (pool.length === 0) {
    poolInfo.textContent = currentModuleId === 'orchestra' ? 'Pick an orchestra to begin.' :
      currentModuleId === 'bigfour' ? 'Select at least one date range.' :
      currentModuleId === 'goldenage' ? 'Select at least one period.' : 'Pick an era to begin.';
    startBtn.disabled = true;
    return;
  }
  ROUNDS_PER_SESSION = parseInt(roundsSelect.value, 10) || DEFAULT_ROUNDS;
  var rounds = Math.min(ROUNDS_PER_SESSION, pool.length);
  poolInfo.textContent = pool.length + ' songs available — session will play ' + rounds + ' of them.';
  startBtn.disabled = false;
}
roundsSelect.addEventListener('change', updatePoolInfo);

// "What am I playing?" label for the quiz header, e.g. "Carlos Di Sarli · Advanced".
function sessionContextLabel() {
  var level = getSelectedLevel();
  var levelName = ((level && level.label) || '').replace(/\s*\(.*\)$/, '');
  var what = currentModuleId === 'orchestra' ? orchestraSelect.value :
    currentModuleId === 'bigfour' ? 'The Big Four' :
    currentModuleId === 'goldenage' ? 'Golden Age' : '';
  return what && levelName ? what + ' · ' + levelName : (what || levelName);
}

// --- Start session ---
startBtn.addEventListener('click', function () {
  saveSettings();
  // Count the play (see UsageTracker.astro). Every Start counts as a play;
  // unique players are tracked via the helper's first-use flag.
  if (window.__ttTrack) window.__ttTrack('name-that-tango');

  if (currentModuleId === 'matching') {
    resetRand();
    updateSessionUrl();
    startMatching({ cfg: getMatchingConfig(), playableRows: playableRows, eligibleOrchestras: matchingEligibleOrchestras() });
    return;
  }

  if (currentModuleId === 'daily') {
    var dailyPool = getSelectedPool();
    if (dailyPool.length < DAILY_ROUNDS) return;
    var dateKey = todayKey();
    // Everyone's RNG starts from the same date seed, so the whole session —
    // song picks, option order, decoys, even clip offsets — matches across
    // players on the same day.
    setRand(mulberry32(dailySeed(dateKey)));
    var dailyRows = weightedSampleByBandleader(dailyPool, DAILY_ROUNDS);
    updateSessionUrl();
    startQuizSession({
      moduleId: 'daily',
      level: MODULES.daily.levels[0],
      rows: dailyRows,
      pool: dailyPool,
      contextLabel: 'Daily Challenge · ' + dateKey,
      daily: { date: dateKey }
    });
    return;
  }

  resetRand();
  var pool = getSelectedPool();
  if (pool.length === 0) return;
  ROUNDS_PER_SESSION = parseInt(roundsSelect.value, 10) || DEFAULT_ROUNDS;
  var n = Math.min(ROUNDS_PER_SESSION, pool.length);
  var rows = currentModuleId === 'bigfour' ? weightedSampleByBandleader(pool, n) : sampleN(pool, n);
  updateSessionUrl();
  startQuizSession({
    moduleId: currentModuleId,
    level: getSelectedLevel(),
    rows: rows,
    pool: pool,
    contextLabel: sessionContextLabel(),
    daily: null
  });
});

// --- Shareable / restorable setup via URL query params ---
function updateSessionUrl() {
  var p = new URLSearchParams();
  p.set('game', currentModuleId);
  if (currentModuleId === 'orchestra' && orchestraSelect.value) p.set('orch', orchestraSelect.value);
  if (currentModuleId === 'era' && eraSelect.value) p.set('era', eraSelect.value);
  if (levelWrap.style.display !== 'none' && levelSelect.value !== '') p.set('level', levelSelect.value);
  if (roundsWrap.style.display !== 'none') p.set('rounds', roundsSelect.value);
  try { history.replaceState(null, '', location.pathname + '?' + p.toString()); } catch (e) {}
}

function applyUrlParams() {
  var p = new URLSearchParams(location.search);
  var g = p.get('game');
  // No game in the URL means nothing was shared — don't touch the setup,
  // or we'd clobber the settings applySavedSettings() just restored
  // (syncModuleUI rebuilds the level list, resetting its selection).
  if (!g || !MODULES[g]) return;
  moduleSelect.value = g;
  syncModuleUI();
  var r = p.get('rounds');
  if (r && ROUNDS_OPTIONS.indexOf(parseInt(r, 10)) !== -1) roundsSelect.value = r;
  var lvl = p.get('level');
  if (lvl !== null && levelSelect.options.length && parseInt(lvl, 10) < levelSelect.options.length) levelSelect.value = lvl;
  updateLevelDesc();
  applyBigFourRangeDefault();
  var orch = p.get('orch');
  if (g === 'orchestra' && orch) setSelectIfPresent(orchestraSelect, orch);
  var era = p.get('era');
  if (g === 'era' && era) setSelectIfPresent(eraSelect, era);
  updatePoolInfo();
}

function setSelectIfPresent(selectEl, value) {
  var found = Array.prototype.some.call(selectEl.options, function (o) { return o.value === value; });
  if (found) { selectEl.value = value; selectEl.dispatchEvent(new Event('change', { bubbles: true })); }
}

// --- Last-used settings (localStorage) ---
// URL params only restore a setup when you arrive via that URL; this brings
// a returning player straight back to their usual game with zero clicks.
function saveSettings() {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      game: currentModuleId,
      orch: orchestraSelect.value,
      era: eraSelect.value,
      level: levelSelect.value,
      rounds: roundsSelect.value,
      bigfour: rangeCheckboxes.filter(function (cb) { return cb.checked; }).map(function (cb) { return cb.getAttribute('data-range'); }),
      golden: goldenRangeCheckboxes.filter(function (cb) { return cb.checked; }).map(function (cb) { return cb.getAttribute('data-range'); })
    }));
  } catch (e) {}
}

function applySavedSettings() {
  var s = null;
  try {
    var raw = window.localStorage.getItem(SETTINGS_KEY);
    s = raw ? JSON.parse(raw) : null;
  } catch (e) {}
  if (!s || typeof s !== 'object') return;
  if (s.game && MODULES[s.game]) moduleSelect.value = s.game;
  syncModuleUI();
  if (s.rounds && ROUNDS_OPTIONS.indexOf(parseInt(s.rounds, 10)) !== -1) roundsSelect.value = s.rounds;
  if (s.level != null && parseInt(s.level, 10) < levelSelect.options.length) levelSelect.value = s.level;
  updateLevelDesc();
  applyBigFourRangeDefault();
  if (Array.isArray(s.bigfour)) rangeCheckboxes.forEach(function (cb) { cb.checked = s.bigfour.indexOf(cb.getAttribute('data-range')) !== -1; });
  if (Array.isArray(s.golden)) goldenRangeCheckboxes.forEach(function (cb) { cb.checked = s.golden.indexOf(cb.getAttribute('data-range')) !== -1; });
  if (s.orch) setSelectIfPresent(orchestraSelect, s.orch);
  if (s.era) setSelectIfPresent(eraSelect, s.era);
  updatePoolInfo();
}

// --- Wiring ---
function showSetup() {
  resetRand();
  setupSection.style.display = '';
  updatePoolInfo();
}

initQuiz({
  onExit: showSetup,
  onRestart: function () { startBtn.click(); }
});
initMatching({ onExit: showSetup });

syncModuleUI();
loadData();
