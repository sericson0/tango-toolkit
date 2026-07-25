// Name That Tango — leaderboard client: fetch the boards (Survival high
// scores + Daily Challenge perfect streaks), submit a score, and render the
// tables. Backed by /api/leaderboards (netlify/functions/leaderboards.mts).
import { esc } from './util.js';

var API_URL = '/api/leaderboards';
var NAME_KEY = 'ntt_player_name_v1';   // last leaderboard name used, prefills the inputs

var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// '2026-07' -> 'July 2026'
export function monthLabel(month) {
  var parts = (month || '').split('-');
  var name = MONTH_NAMES[parseInt(parts[1], 10) - 1];
  return name ? name + ' ' + parts[0] : 'This Month';
}

export function fetchBoards() {
  return fetch(API_URL).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

export function submitScore(board, name, score) {
  return fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: board, name: name, score: score })
  }).then(function (r) {
    if (!r.ok) {
      var err = new Error('HTTP ' + r.status);
      err.status = r.status;
      throw err;
    }
    return r.json();
  });
}

export function getSavedName() {
  try { return window.localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; }
}

export function saveName(name) {
  try { window.localStorage.setItem(NAME_KEY, name); } catch (e) {}
}

var MEDALS = ['🥇', '🥈', '🥉'];

function tableHtml(heading, entries, youTs) {
  var html = '<div class="ntt-board"><div class="ntt-board-heading">' + esc(heading) + '</div>';
  if (!entries || !entries.length) {
    html += '<p class="ntt-board-empty">No scores yet — be the first!</p>';
  } else {
    html += '<table class="ntt-board-table"><tbody>';
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var isYou = !!youTs && e.ts === youTs;
      html += '<tr' + (isYou ? ' class="ntt-board-you"' : '') + '>' +
        '<td class="ntt-board-rank">' + (MEDALS[i] || (i + 1)) + '</td>' +
        '<td class="ntt-board-name">' + esc(e.name) + (isYou ? ' (you)' : '') + '</td>' +
        '<td class="ntt-board-score">' + e.score + '</td></tr>';
    }
    html += '</tbody></table>';
  }
  return html + '</div>';
}

// Renders one board group (a titled card holding its this-month and/or
// all-time tables). `spec` is { title, note?, monthLabel?, monthly?, alltime }.
// `youTs` (from a submit response's you.ts) highlights the player's own row.
function boardGroupHtml(spec, youTs) {
  var tables = '';
  if (spec.monthly) tables += tableHtml(spec.monthLabel || 'This Month', spec.monthly, youTs);
  tables += tableHtml('All-Time', spec.alltime, youTs);
  return '<div class="ntt-board-group">' +
    '<div class="ntt-board-group-title">' + esc(spec.title) +
    (spec.note ? '<span class="ntt-board-group-note">' + esc(spec.note) + '</span>' : '') +
    '</div>' +
    '<div class="ntt-board-tables">' + tables + '</div></div>';
}

// Render both boards from a boards response. `you` (a submit response's you,
// or null) highlights the player's row on whichever board they just posted to.
export function renderAllBoards(el, data, you) {
  var youTs = you ? you.ts : null;
  var survivalYou = you && you.board === 'survival' ? youTs : null;
  var streakYou = you && you.board === 'daily-streak' ? youTs : null;
  el.innerHTML =
    boardGroupHtml({
      title: '🏆 Survival',
      monthLabel: monthLabel(data.month),
      monthly: data.survival.monthly,
      alltime: data.survival.alltime
    }, survivalYou) +
    boardGroupHtml({
      title: '🔥 Daily Streak',
      note: '5+ perfect days in a row to qualify',
      alltime: data.dailyStreak.alltime
    }, streakYou);
}
