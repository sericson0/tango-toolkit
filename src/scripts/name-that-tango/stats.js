// Name That Tango — persistent progress (localStorage).
// One rolling record of lifetime accuracy: overall + per answer field +
// per orchestra, plus a fully-correct streak. Cleared with the Reset button.
import { esc } from './util.js';
import { STATS_KEY } from './config.js';

var statsPanel = document.getElementById('statsPanel');
var statsToggle = document.getElementById('statsToggle');
var statsBody = document.getElementById('statsBody');

var data = null;

function blank() {
  return { sessions: 0, songs: 0, fieldsAsked: 0, fieldsCorrect: 0,
           currentStreak: 0, bestStreak: 0, perField: {}, perOrchestra: {} };
}

function load() {
  if (data) return data;
  try {
    var raw = window.localStorage.getItem(STATS_KEY);
    data = raw ? JSON.parse(raw) : blank();
  } catch (e) { data = blank(); }
  if (!data || typeof data !== 'object') data = blank();
  // tolerate older/partial payloads
  ['perField', 'perOrchestra'].forEach(function (k) { if (!data[k]) data[k] = {}; });
  return data;
}

function save() {
  try { window.localStorage.setItem(STATS_KEY, JSON.stringify(data)); } catch (e) {}
}

// Record one graded song. fieldResults: [{key, correct}], orch: bandleader name.
function recordSong(orch, fieldResults, allCorrect) {
  var d = load();
  d.songs++;
  fieldResults.forEach(function (f) {
    d.fieldsAsked++;
    if (f.correct) d.fieldsCorrect++;
    var pf = d.perField[f.key] || (d.perField[f.key] = { asked: 0, correct: 0 });
    pf.asked++;
    if (f.correct) pf.correct++;
  });
  if (orch) {
    var po = d.perOrchestra[orch] || (d.perOrchestra[orch] = { songs: 0, asked: 0, correct: 0 });
    po.songs++;
    po.asked += fieldResults.length;
    po.correct += fieldResults.filter(function (f) { return f.correct; }).length;
  }
  if (allCorrect) {
    d.currentStreak++;
    if (d.currentStreak > d.bestStreak) d.bestStreak = d.currentStreak;
  } else {
    d.currentStreak = 0;
  }
  save();
}

function recordSessionEnd() { var d = load(); d.sessions++; save(); }

function reset() { data = blank(); save(); render(); }

function pct(correct, asked) { return asked ? Math.round((correct / asked) * 100) : 0; }

function getCurrentStreak() { return load().currentStreak || 0; }
function getBestStreak() { return load().bestStreak || 0; }

function render() {
  var d = load();
  if (!d.songs) { statsPanel.hidden = true; return; }
  statsPanel.hidden = false;

  var orchs = Object.keys(d.perOrchestra).map(function (name) {
    var o = d.perOrchestra[name];
    return { name: name, songs: o.songs, acc: pct(o.correct, o.asked) };
  }).sort(function (a, b) { return b.songs - a.songs; }).slice(0, 8);

  var html = '';
  html += '<div class="ntt-stats-row">';
  html += '<span class="ntt-stat"><strong>' + pct(d.fieldsCorrect, d.fieldsAsked) + '%</strong> accuracy</span>';
  html += '<span class="ntt-stat"><strong>' + d.songs + '</strong> songs</span>';
  html += '<span class="ntt-stat"><strong>' + d.sessions + '</strong> sessions</span>';
  html += '<span class="ntt-stat"><strong>' + d.bestStreak + '</strong> best streak</span>';
  html += '</div>';

  if (orchs.length) {
    html += '<table class="ntt-stats-table"><thead><tr><th>Orchestra</th><th>Songs</th><th>Accuracy</th></tr></thead><tbody>';
    orchs.forEach(function (o) {
      html += '<tr><td>' + esc(o.name) + '</td><td>' + o.songs + '</td><td>' + o.acc + '%</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '<button type="button" class="ntt-btn-text ntt-stats-reset" id="statsResetBtn">Reset progress</button>';
  statsBody.innerHTML = html;

  var resetBtn = document.getElementById('statsResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    if (window.confirm('Reset all saved progress? This cannot be undone.')) reset();
  });
}

statsToggle.addEventListener('click', function () {
  var open = statsBody.hidden;
  statsBody.hidden = !open;
  statsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  statsToggle.innerHTML = open ? 'Your progress ▴' : 'Your progress ▾';
});

export var Stats = {
  recordSong: recordSong,
  recordSessionEnd: recordSessionEnd,
  reset: reset,
  render: render,
  getCurrentStreak: getCurrentStreak,
  getBestStreak: getBestStreak
};
