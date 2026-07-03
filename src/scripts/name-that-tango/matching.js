// Name That Tango — the Matching game: match clips to orchestra (and title)
// tiles by drag-and-drop or tap-to-place, or type both in at Challenge level.
import { CLIP_DURATION_S } from './config.js';
import { norm, normLoose, esc, extractYear, uniqueSorted, sampleN, shuffle, personThumb, getSortLastName } from './util.js';
import { setupTypeahead } from './combo.js';
import { Stats } from './stats.js';
import { Player } from './player.js';

var matchingSection = document.getElementById('matchingSection');
var matchingBoard = document.getElementById('matchingBoard');
var matchingHint = document.getElementById('matchingHint');
var matchingScore = document.getElementById('matchingScore');
var matchingSubmitBtn = document.getElementById('matchingSubmitBtn');
var matchingPlayAgainBtn = document.getElementById('matchingPlayAgainBtn');
var matchingChangeBtn = document.getElementById('matchingChangeBtn');
var matchingEndBtn = document.getElementById('matchingEndBtn');

var clipAudio = Player.audio;

// Matching game state
var matchingCfg = null;           // { count, titles, writein } — the selected level's board shape
var playableRows = [];            // full playable discography (for typeahead pools + song picks)
var eligibleOrchestras = [];      // orchestras with enough songs to be a fair answer
var matchingSongs = [];
var matchingOrchOptions = [];     // shuffled orchestra tile values (drag/tap modes)
var matchingTitleOptions = [];    // shuffled title tile values (drag/tap modes, when titles asked)
var matchingPlacements = [];      // parallel to matchingSongs: { orch: value|null, title: value|null }
var matchingSelectedChip = null;  // tap-to-place: { type: 'orch'|'title', value } currently picked up
var matchingResults = [];
var matchingGraded = false;
var matchingPlayingIdx = -1;
var matchingStopTimer = null;

var exitCallback = null;

export function initMatching(callbacks) {
  exitCallback = callbacks.onExit;
}

// Pick match.count distinct orchestras (per the selected level), one random
// song each. Intro/Medium/Advanced show every orchestra (and title) as a
// tile the player drags — or taps — onto the clip it belongs to; Challenge
// has the player type both in instead. Reuses the shared <audio> element
// for per-row playback.
export function startMatching(opts) {
  matchingCfg = opts.cfg;
  playableRows = opts.playableRows;
  eligibleOrchestras = opts.eligibleOrchestras;
  if (eligibleOrchestras.length < matchingCfg.count) return;
  var chosen = sampleN(eligibleOrchestras, matchingCfg.count);
  matchingSongs = chosen.map(function (orch) {
    var songs = playableRows.filter(function (r) { return r.Bandleader === orch; });
    return sampleN(songs, 1)[0];
  });
  matchingOrchOptions = matchingCfg.writein ? [] : shuffle(chosen.slice());
  matchingTitleOptions = (matchingCfg.writein || !matchingCfg.titles) ? [] :
    shuffle(matchingSongs.map(function (s) { return s.Title; }));
  matchingPlacements = matchingSongs.map(function () { return { orch: null, title: null }; });
  matchingSelectedChip = null;
  matchingResults = [];
  matchingGraded = false;
  Player.suspend();
  stopMatchingAudio();

  document.getElementById('setupSection').style.display = 'none';
  document.getElementById('summarySection').style.display = 'none';
  document.getElementById('quizSection').style.display = 'none';
  matchingSection.style.display = '';

  matchingHint.textContent = matchingCfg.writein
    ? 'Type the orchestra and title for each clip.'
    : 'Drag a tile onto its clip — or tap a tile, then tap a clip to place it.';
  matchingScore.textContent = '';
  matchingSubmitBtn.style.display = '';
  matchingPlayAgainBtn.style.display = 'none';
  matchingChangeBtn.style.display = 'none';
  renderMatchingBoard();
}

function renderMatchingBoard() {
  if (matchingGraded) { renderMatchingResults(); return; }
  matchingBoard.innerHTML = matchingCfg.writein ? matchingWriteinHtml() : matchingDragHtml();
  if (matchingCfg.writein) attachMatchingTypeaheads();
}

function matchingWriteinHtml() {
  var html = '<div class="ntt-match-rows">';
  for (var i = 0; i < matchingSongs.length; i++) {
    html += '<div class="ntt-match-row" data-idx="' + i + '">';
    html += '<button type="button" class="ntt-btn-play ntt-match-play" data-idx="' + i + '">▶ Play</button>';
    html += '<div class="ntt-match-fields">';
    html += '<div class="ntt-combo">';
    html += '<input type="text" class="ntt-text-input ntt-combo-input ntt-match-orch-input" data-idx="' + i + '" autocomplete="off" placeholder="Orchestra…" role="combobox" aria-expanded="false" aria-autocomplete="list">';
    html += '<div class="ntt-combo-list" role="listbox" data-match-list="orch-' + i + '" hidden></div>';
    html += '</div>';
    html += '<div class="ntt-combo">';
    html += '<input type="text" class="ntt-text-input ntt-combo-input ntt-match-title-input" data-idx="' + i + '" autocomplete="off" placeholder="Title…" role="combobox" aria-expanded="false" aria-autocomplete="list">';
    html += '<div class="ntt-combo-list" role="listbox" data-match-list="title-' + i + '" hidden></div>';
    html += '</div>';
    html += '</div></div>';
  }
  html += '</div>';
  return html;
}

// Same accent-folding suggestions the quiz type-ins get — spelling
// "D'Arienzo" or "Recuerdo" from memory shouldn't be the hard part.
// Suggestion pools span the whole library, so they don't leak which
// songs are on the board.
function attachMatchingTypeaheads() {
  var orchValues = eligibleOrchestras.slice().sort(function (a, b) {
    return getSortLastName(a) < getSortLastName(b) ? -1 : 1;
  });
  var titleValues = uniqueSorted(playableRows, 'Title');
  for (var i = 0; i < matchingSongs.length; i++) {
    var oi = matchingBoard.querySelector('.ntt-match-orch-input[data-idx="' + i + '"]');
    var ol = matchingBoard.querySelector('.ntt-combo-list[data-match-list="orch-' + i + '"]');
    if (oi && ol) setupTypeahead(oi, ol, orchValues);
    var ti = matchingBoard.querySelector('.ntt-match-title-input[data-idx="' + i + '"]');
    var tl = matchingBoard.querySelector('.ntt-combo-list[data-match-list="title-' + i + '"]');
    if (ti && tl) setupTypeahead(ti, tl, titleValues);
  }
}

// Song clips sit above the tile bank so you drag tiles up into them —
// shorter drags, and the drop targets are visible without scrolling down
// first. Rows lay out two-up (see .ntt-match-rows) to keep the whole
// board shorter still.
function matchingDragHtml() {
  var html = '<div class="ntt-match-rows">';
  for (var i = 0; i < matchingSongs.length; i++) {
    html += '<div class="ntt-match-row" data-idx="' + i + '">';
    html += '<button type="button" class="ntt-btn-play ntt-match-play" data-idx="' + i + '">▶ Play</button>';
    html += '<div class="ntt-match-fields">';
    html += matchingSlotHtml(i, 'orch', 'Drop orchestra here');
    if (matchingCfg.titles) html += matchingSlotHtml(i, 'title', 'Drop title here');
    html += '</div></div>';
  }
  html += '</div><div class="ntt-match-bank">';
  html += matchingChipGroupHtml('orch', 'Orchestras', matchingOrchOptions);
  if (matchingCfg.titles) html += matchingChipGroupHtml('title', 'Titles', matchingTitleOptions);
  html += '</div>';
  return html;
}

function matchingChipGroupHtml(type, label, allValues) {
  var placed = {};
  matchingPlacements.forEach(function (p) { if (p[type]) placed[p[type]] = true; });
  var available = allValues.filter(function (v) { return !placed[v]; });
  var html = '<div class="ntt-match-chip-group">';
  html += '<div class="ntt-match-bank-label">' + esc(label) + '</div>';
  html += '<div class="ntt-match-chips" data-chip-type="' + type + '">';
  html += available.length
    ? available.map(function (v) { return matchingChipHtml(type, v, null); }).join('')
    : '<span class="ntt-match-bank-empty">All placed</span>';
  html += '</div></div>';
  return html;
}

function matchingChipHtml(type, value, fromIdx) {
  var selected = matchingSelectedChip && matchingSelectedChip.type === type && matchingSelectedChip.value === value;
  var thumb = type === 'orch' ? personThumb('bandleaders', value) : '';
  var cls = 'ntt-match-chip' + (thumb ? ' ntt-match-chip-thumb' : '') + (selected ? ' is-selected' : '');
  var fromAttr = fromIdx !== null ? ' data-from-idx="' + fromIdx + '"' : '';
  return '<div class="' + cls + '" draggable="true" tabindex="0" role="button" ' +
    'data-chip-type="' + type + '" data-value="' + esc(value) + '"' + fromAttr + '>' + thumb + '<span>' + esc(value) + '</span></div>';
}

function matchingSlotHtml(idx, type, placeholder) {
  var value = matchingPlacements[idx][type];
  var html = '<div class="ntt-match-slot' + (value ? ' is-filled' : '') + '" data-idx="' + idx + '" ' +
    'data-slot-type="' + type + '" tabindex="0" role="button">';
  html += value ? matchingChipHtml(type, value, idx) : '<span class="ntt-match-slot-placeholder">' + esc(placeholder) + '</span>';
  html += '</div>';
  return html;
}

function renderMatchingResults() {
  var html = '<div class="ntt-match-rows">';
  for (var i = 0; i < matchingSongs.length; i++) {
    var song = matchingSongs[i];
    var res = matchingResults[i];
    html += '<div class="ntt-match-row" data-idx="' + i + '">';
    html += '<button type="button" class="ntt-btn-play ntt-match-play" data-idx="' + i + '">▶ Play</button>';
    html += '<div class="ntt-match-result">';
    var ob = res.orchCorrect
      ? '<span class="ntt-badge ntt-badge-correct">✓</span>'
      : '<span class="ntt-badge ntt-badge-wrong">✗</span>';
    html += '<div>' + ob + ' <strong>' + esc(song.Bandleader) + '</strong>' +
      (res.orchCorrect ? '' : ' <span class="ntt-summary-arrow">(you: ' + esc(res.guessOrch || '—') + ')</span>') + '</div>';
    if (matchingCfg.titles) {
      var tb = res.titleCorrect
        ? '<span class="ntt-badge ntt-badge-correct">✓</span>'
        : '<span class="ntt-badge ntt-badge-wrong">✗</span>';
      html += '<div class="ntt-match-title-line">' + tb + ' <span class="ntt-meta-title">' + esc(song.Title) + '</span>' +
        (res.titleCorrect ? '' : ' <span class="ntt-summary-arrow">(you: ' + esc(res.guessTitle || '—') + ')</span>') + '</div>';
    }
    var singer = song.Singer && norm(song.Singer) !== 'instrumental' ? ' · ' + esc(song.Singer) : ' · Instrumental';
    html += '<div class="ntt-match-year">' + esc(String(extractYear(song.Date) || '')) + singer + '</div>';
    html += '</div></div>';
  }
  html += '</div>';
  matchingBoard.innerHTML = html;
}

// Tap-to-place: tap an available tile to pick it up, then tap a slot (of
// the same type) to drop it there. Tapping a filled slot with nothing
// picked up sends that tile back to the bank. Complements native
// drag-and-drop for touch/keyboard users.
matchingBoard.addEventListener('click', function (e) {
  var playBtnEl = e.target.closest('.ntt-match-play');
  if (playBtnEl) { matchingPlay(parseInt(playBtnEl.getAttribute('data-idx'), 10)); return; }
  if (matchingGraded || matchingCfg.writein) return;

  var slot = e.target.closest('.ntt-match-slot');
  if (slot) {
    var slotIdx = parseInt(slot.getAttribute('data-idx'), 10);
    var slotType = slot.getAttribute('data-slot-type');
    if (matchingSelectedChip && matchingSelectedChip.type === slotType) {
      matchingPlacements[slotIdx][slotType] = matchingSelectedChip.value;
      matchingSelectedChip = null;
    } else if (matchingPlacements[slotIdx][slotType]) {
      matchingPlacements[slotIdx][slotType] = null;
    }
    renderMatchingBoard();
    return;
  }

  var chip = e.target.closest('.ntt-match-chip');
  if (chip) {
    var type = chip.getAttribute('data-chip-type');
    var value = chip.getAttribute('data-value');
    matchingSelectedChip = (matchingSelectedChip && matchingSelectedChip.type === type && matchingSelectedChip.value === value)
      ? null : { type: type, value: value };
    renderMatchingBoard();
  }
});

matchingBoard.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
  var target = e.target.closest('.ntt-match-chip, .ntt-match-slot, .ntt-match-play');
  if (!target) return;
  e.preventDefault();
  target.click();
});

// Native HTML5 drag-and-drop for mouse/trackpad users. Dropping a tile
// that came from another slot clears that slot; dropping onto a slot that
// already had a tile simply overwrites it — the bumped tile reappears in
// the bank on the next render (no data is lost).
matchingBoard.addEventListener('dragstart', function (e) {
  var chip = e.target.closest('.ntt-match-chip');
  if (!chip) return;
  var payload = {
    type: chip.getAttribute('data-chip-type'),
    value: chip.getAttribute('data-value'),
    fromIdx: chip.hasAttribute('data-from-idx') ? parseInt(chip.getAttribute('data-from-idx'), 10) : null
  };
  e.dataTransfer.setData('application/x-ntt-' + payload.type, '1');
  e.dataTransfer.setData('text/plain', JSON.stringify(payload));
  e.dataTransfer.effectAllowed = 'move';
  chip.classList.add('is-dragging');
  startMatchingAutoScroll();
});

matchingBoard.addEventListener('dragend', function (e) {
  var chip = e.target.closest('.ntt-match-chip');
  if (chip) chip.classList.remove('is-dragging');
  stopMatchingAutoScroll();
});

// Only shows the "drop allowed" cursor when the dragged tile's type
// matches the target — dataTransfer.getData isn't readable during
// dragover, so type is checked via a marker MIME type instead.
matchingBoard.addEventListener('dragover', function (e) {
  var slot = e.target.closest('.ntt-match-slot');
  var bank = e.target.closest('.ntt-match-chips');
  var target = slot || bank;
  if (!target || !e.dataTransfer.types) return;
  var wantType = slot ? slot.getAttribute('data-slot-type') : bank.getAttribute('data-chip-type');
  if (e.dataTransfer.types.indexOf('application/x-ntt-' + wantType) !== -1) e.preventDefault();
});

// Auto-scroll the page while a tile is being dragged near the top/bottom
// of the viewport — without this, a drop target below the fold is
// unreachable mid-drag, since a native HTML5 drag doesn't let the mouse
// wheel or a normal scroll gesture take over.
var MATCH_AUTOSCROLL_EDGE = 80;
var MATCH_AUTOSCROLL_SPEED = 14;
var matchingAutoScrollDelta = 0;
var matchingAutoScrollTimer = null;
function startMatchingAutoScroll() {
  if (matchingAutoScrollTimer) return;
  matchingAutoScrollTimer = setInterval(function () {
    if (matchingAutoScrollDelta) window.scrollBy(0, matchingAutoScrollDelta);
  }, 16);
}
function stopMatchingAutoScroll() {
  clearInterval(matchingAutoScrollTimer);
  matchingAutoScrollTimer = null;
  matchingAutoScrollDelta = 0;
}
document.addEventListener('dragover', function (e) {
  if (!matchingAutoScrollTimer) return;
  if (e.clientY < MATCH_AUTOSCROLL_EDGE) matchingAutoScrollDelta = -MATCH_AUTOSCROLL_SPEED;
  else if (e.clientY > window.innerHeight - MATCH_AUTOSCROLL_EDGE) matchingAutoScrollDelta = MATCH_AUTOSCROLL_SPEED;
  else matchingAutoScrollDelta = 0;
});

matchingBoard.addEventListener('drop', function (e) {
  var raw;
  try { raw = JSON.parse(e.dataTransfer.getData('text/plain')); } catch (err) { return; }
  if (!raw || !raw.type) return;

  var slot = e.target.closest('.ntt-match-slot');
  if (slot) {
    var slotType = slot.getAttribute('data-slot-type');
    if (raw.type !== slotType) return;
    e.preventDefault();
    if (raw.fromIdx !== null) matchingPlacements[raw.fromIdx][raw.type] = null;
    matchingPlacements[parseInt(slot.getAttribute('data-idx'), 10)][slotType] = raw.value;
    matchingSelectedChip = null;
    renderMatchingBoard();
    return;
  }

  var bank = e.target.closest('.ntt-match-chips');
  if (bank && bank.getAttribute('data-chip-type') === raw.type) {
    e.preventDefault();
    if (raw.fromIdx !== null) matchingPlacements[raw.fromIdx][raw.type] = null;
    matchingSelectedChip = null;
    renderMatchingBoard();
  }
});

function stopMatchingAudio() {
  clipAudio.pause();
  clearTimeout(matchingStopTimer);
  if (matchingPlayingIdx !== -1) {
    var b = matchingBoard.querySelector('.ntt-match-play[data-idx="' + matchingPlayingIdx + '"]');
    if (b) b.innerHTML = '▶ Play';
  }
  matchingPlayingIdx = -1;
}

Player.onEnded(function () {
  if (matchingPlayingIdx === -1) return false;
  stopMatchingAudio();
  return true;
});

Player.onError(function () {
  if (matchingPlayingIdx === -1) return false;
  stopMatchingAudio();
  matchingHint.textContent = 'Could not load that clip — try it again, or play another row.';
  return true;
});

function matchingPlay(idx) {
  var wasThis = matchingPlayingIdx === idx;
  stopMatchingAudio();
  if (wasThis) return; // second tap on the playing row = stop
  var song = matchingSongs[idx];
  if (!song) return;
  clipAudio.src = song._audioUrl;
  clipAudio.currentTime = Math.random() * 45;
  var p = clipAudio.play();
  if (p && p.catch) p.catch(function () {});
  matchingPlayingIdx = idx;
  var btn = matchingBoard.querySelector('.ntt-match-play[data-idx="' + idx + '"]');
  if (btn) btn.innerHTML = '⏸ Pause';
  matchingStopTimer = setTimeout(function () { stopMatchingAudio(); }, CLIP_DURATION_S * 1000);
}

function submitMatching() {
  var orchCorrect = 0, titleCorrect = 0;
  var titlesAsked = matchingCfg.titles;
  matchingResults = [];
  for (var i = 0; i < matchingSongs.length; i++) {
    var song = matchingSongs[i];
    var guessOrch, guessTitle;
    if (matchingCfg.writein) {
      var orchInput = matchingBoard.querySelector('.ntt-match-orch-input[data-idx="' + i + '"]');
      var titleInput = matchingBoard.querySelector('.ntt-match-title-input[data-idx="' + i + '"]');
      guessOrch = orchInput ? orchInput.value.trim() : '';
      guessTitle = titleInput ? titleInput.value.trim() : '';
    } else {
      guessOrch = matchingPlacements[i].orch || '';
      guessTitle = titlesAsked ? (matchingPlacements[i].title || '') : '';
    }
    var oc = guessOrch !== '' && norm(guessOrch) === norm(song.Bandleader);
    var tc = false;
    if (titlesAsked) {
      var accepted = [normLoose(song.Title)];
      if (song.AltTitle) accepted.push(normLoose(song.AltTitle));
      tc = guessTitle !== '' && accepted.indexOf(normLoose(guessTitle)) !== -1;
    }
    if (oc) orchCorrect++;
    if (titlesAsked && tc) titleCorrect++;
    matchingResults.push({ guessOrch: guessOrch, orchCorrect: oc, guessTitle: guessTitle, titleCorrect: tc });
    Stats.recordSong(song.Bandleader, [{ key: 'Bandleader', correct: oc }], oc);
  }
  Stats.recordSessionEnd();
  Stats.render();
  matchingGraded = true;
  stopMatchingAudio();
  renderMatchingBoard();
  matchingScore.textContent = titlesAsked
    ? ('Orchestras ' + orchCorrect + '/' + matchingSongs.length + ' · Titles ' + titleCorrect + '/' + matchingSongs.length)
    : ('Orchestras ' + orchCorrect + '/' + matchingSongs.length);
  matchingSubmitBtn.style.display = 'none';
  matchingPlayAgainBtn.style.display = '';
  matchingChangeBtn.style.display = '';
}

function exitMatching() {
  stopMatchingAudio();
  matchingSection.style.display = 'none';
  if (exitCallback) exitCallback();
}

matchingSubmitBtn.addEventListener('click', submitMatching);
matchingPlayAgainBtn.addEventListener('click', function () {
  startMatching({ cfg: matchingCfg, playableRows: playableRows, eligibleOrchestras: eligibleOrchestras });
});
matchingChangeBtn.addEventListener('click', exitMatching);
matchingEndBtn.addEventListener('click', exitMatching);
