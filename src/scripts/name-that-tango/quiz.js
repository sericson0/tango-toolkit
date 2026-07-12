// Name That Tango — the quiz flow: rounds, answer fields, grading, the
// reveal card, and the session summary (with share / replay-misses).
import {
  MC_OPTION_COUNT, YEAR_CLOSE_THRESHOLD, YEAR_OPTION_MIN_GAP,
  FIELD_LABELS, FIELD_ORDER, DAILY_KEY
} from './config.js';
import {
  norm, normLoose, esc, extractYear, uniqueSorted, shuffle, sampleN,
  pickSpacedYears, personThumb, resolveFields
} from './util.js';
import { setupTypeahead } from './combo.js';
import { Stats } from './stats.js';
import { Player } from './player.js';

var quizSection = document.getElementById('quizSection');
var summarySection = document.getElementById('summarySection');
var roundCounter = document.getElementById('roundCounter');
var quizContext = document.getElementById('quizContext');
var scoreDisplay = document.getElementById('scoreDisplay');
var streakDisplay = document.getElementById('streakDisplay');
var endQuizBtn = document.getElementById('endQuizBtn');
var skipBtn = document.getElementById('skipBtn');
var answerArea = document.getElementById('answerArea');
var answerHint = document.getElementById('answerHint');
var submitBtn = document.getElementById('submitBtn');
var nextBtn = document.getElementById('nextBtn');

var revealPanel = document.getElementById('revealPanel');
var revealBanner = document.getElementById('revealBanner');
var listenFullBtn = document.getElementById('listenFullBtn');
var detailMeta = document.getElementById('detailMeta');
var moreDetailsBtn = document.getElementById('moreDetailsBtn');
var detailGrid = document.getElementById('detailGrid');

var summaryHead = document.getElementById('summaryHead');
var summaryScore = document.getElementById('summaryScore');
var summaryBody = document.getElementById('summaryBody');
var playAgainBtn = document.getElementById('playAgainBtn');
var changeSettingsBtn = document.getElementById('changeSettingsBtn');
var replayMissesBtn = document.getElementById('replayMissesBtn');
var shareResultBtn = document.getElementById('shareResultBtn');
var shareCard = document.getElementById('shareCard');
var shareCardTitle = document.getElementById('shareCardTitle');
var shareCardGrid = document.getElementById('shareCardGrid');
var shareCardScore = document.getElementById('shareCardScore');
var shareCardLink = document.getElementById('shareCardLink');
var shareCopyBtn = document.getElementById('shareCopyBtn');

// --- State ---
var sessionOpts = null;   // { moduleId, level, pool, contextLabel, daily: {date}|null }
var sessionRounds = [];
var sessionResults = [];
var roundIndex = 0;
var currentFields = null;
var currentMcChoices = {};
var summaryPlayingIdx = -1;
var lastSummary = null;   // numbers behind the last summary, for the share text

var exitCallback = null;     // back to setup
var restartCallback = null;  // same settings, fresh songs (main re-runs Start)

// --- Session entry points ---
export function startQuizSession(opts) {
  sessionOpts = opts;
  quizContext.textContent = opts.contextLabel || '';
  beginRounds(opts.rows);
}

function beginRounds(rows) {
  sessionRounds = rows;
  sessionResults = [];
  roundIndex = 0;
  document.getElementById('setupSection').style.display = 'none';
  summarySection.style.display = 'none';
  quizSection.style.display = '';
  renderRound();
}

export function initQuiz(callbacks) {
  exitCallback = callbacks.onExit;
  restartCallback = callbacks.onRestart;
}

// --- Quiz: render a round ---
function renderRound() {
  var row = sessionRounds[roundIndex];
  currentFields = resolveFields(sessionOpts.level.fields, row);
  currentMcChoices = {};

  var singerAsked = currentFields.some(function (f) { return f.key === 'Singer'; });
  Player.loadTrack(row._audioUrl, { singerAsked: singerAsked });

  nextBtn.style.display = 'none';
  skipBtn.style.display = '';

  // Warm the next round's audio so its first Play is instant.
  var nextRow = sessionRounds[roundIndex + 1];
  Player.preloadNext(nextRow && nextRow._audioUrl);

  roundCounter.textContent = 'Song ' + (roundIndex + 1) + ' of ' + sessionRounds.length;
  updateScoreDisplay();

  var html = '';
  for (var i = 0; i < currentFields.length; i++) {
    var f = currentFields[i];
    var label = FIELD_LABELS[f.key] || f.key;
    html += '<div class="ntt-field" data-key="' + f.key + '">';
    html += '<div class="ntt-field-label">' + esc(label) + '</div>';
    if (f.mode === 'mc') {
      var options = buildMcOptions(row, f);
      currentMcChoices[f.key] = options;
      var isBandleaderThumbs = (sessionOpts.moduleId === 'bigfour' || sessionOpts.moduleId === 'goldenage' || sessionOpts.moduleId === 'daily') && f.key === 'Bandleader';
      var isSingerThumbs = f.key === 'Singer';
      var thumbDir = isBandleaderThumbs ? 'bandleaders' : (isSingerThumbs ? 'singers' : '');
      html += '<div class="ntt-mc-group' + (thumbDir ? ' ntt-mc-group-thumbs' : '') + '">';
      for (var o = 0; o < options.length; o++) {
        var skipThumb = isSingerThumbs && norm(options[o].value) === 'instrumental';
        var thumb = thumbDir && !skipThumb ? personThumb(thumbDir, options[o].value) : '';
        html += '<label class="ntt-mc-option' + (thumb ? ' ntt-mc-option-thumb' : '') + '">' +
          '<input type="radio" name="ntt-field-' + f.key + '" value="' + esc(options[o].display) + '">' +
          thumb +
          '<span>' + esc(options[o].display) + '</span></label>';
      }
      html += '</div>';
    } else {
      html += '<div class="ntt-combo">';
      html += '<input type="text" class="ntt-text-input ntt-combo-input" data-key="' + f.key + '" autocomplete="off" placeholder="Type your answer..." role="combobox" aria-expanded="false" aria-autocomplete="list">';
      html += '<div class="ntt-combo-list" role="listbox" data-list-for="' + f.key + '" hidden></div>';
      html += '</div>';
    }
    html += '</div>';
  }
  answerArea.innerHTML = html;

  var firstInput = null;
  for (var t = 0; t < currentFields.length; t++) {
    var tf = currentFields[t];
    if (tf.mode !== 'type') continue;
    var typeInput = answerArea.querySelector('.ntt-text-input[data-key="' + tf.key + '"]');
    var typeList = answerArea.querySelector('.ntt-combo-list[data-list-for="' + tf.key + '"]');
    setupTypeahead(typeInput, typeList, uniqueSorted(sessionOpts.pool, tf.key));
    if (!firstInput) firstInput = typeInput;
  }

  revealPanel.style.display = 'none';
  answerArea.style.display = '';
  answerHint.hidden = true;
  submitBtn.style.display = '';
  submitBtn.disabled = false;
  if (firstInput) { try { firstInput.focus(); } catch (e) {} }

  // After a long reveal the player may be scrolled well past the player row.
  if (quizSection.getBoundingClientRect().top < 0) {
    quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Rounds only render from a click (Start / Next / Play Again), so
  // auto-playing here is gesture-backed; saves a Play click every round.
  // If a browser still blocks it, playClip's catch resets to idle.
  Player.startClip();
}

// The span of years actually present in the session's pool, used to keep
// multiple-choice year decoys inside the range the player is quizzing on.
function poolYearBounds(pool) {
  var min = Infinity, max = -Infinity;
  for (var i = 0; i < pool.length; i++) {
    var y = extractYear(pool[i].Date);
    if (!y) continue;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return isFinite(min) ? { min: min, max: max } : null;
}

function buildMcOptions(row, field) {
  if (field.fixedOptions) {
    var fixedOpts = field.fixedOptions.map(function (v) {
      return { display: v, value: v, isCorrect: norm(v) === norm(row[field.key] || '') };
    });
    return shuffle(fixedOpts);
  }

  if (field.as === 'year') {
    var correctYear = extractYear(row.Date);
    var bounds = poolYearBounds(sessionOpts.pool);
    var chosenYears = bounds
      ? pickSpacedYears(correctYear, MC_OPTION_COUNT - 1, YEAR_OPTION_MIN_GAP, bounds.min, bounds.max)
      : pickSpacedYears(correctYear, MC_OPTION_COUNT - 1, YEAR_OPTION_MIN_GAP);
    var yearOptions = [{ display: String(correctYear), value: String(correctYear), isCorrect: true }];
    chosenYears.forEach(function (v) { yearOptions.push({ display: String(v), value: String(v), isCorrect: false }); });
    return shuffle(yearOptions);
  }

  var correctValue = row[field.key] || '';
  var decoyPool = uniqueSorted(sessionOpts.pool, field.key);
  if (field.key === 'Singer') {
    decoyPool = decoyPool.filter(function (v) { return norm(v) !== 'instrumental'; });
  }
  var decoys = decoyPool.filter(function (v) { return norm(v) !== norm(correctValue); });
  // de-dupe normalized decoys
  var seen = {}, uniqueDecoys = [];
  decoys.forEach(function (v) {
    var n = norm(v);
    if (!seen[n]) { seen[n] = true; uniqueDecoys.push(v); }
  });
  var chosenDecoys = sampleN(uniqueDecoys, MC_OPTION_COUNT - 1);
  var options = [{ display: correctValue, value: correctValue, isCorrect: true }];
  chosenDecoys.forEach(function (v) { options.push({ display: v, value: v, isCorrect: false }); });
  return shuffle(options);
}

// --- Quiz: submit / grade ---
submitBtn.addEventListener('click', function () {
  // A fully blank submit is almost always an accidental Enter — don't
  // burn the round on it. Skip is the intentional "show me" path.
  var anyAnswered = currentFields.some(function (f) {
    if (f.mode === 'mc') return !!answerArea.querySelector('input[name="ntt-field-' + f.key + '"]:checked');
    var input = answerArea.querySelector('.ntt-text-input[data-key="' + f.key + '"]');
    return !!(input && input.value.trim());
  });
  if (!anyAnswered) {
    answerHint.textContent = 'No answer yet — pick or type one, or press Skip to reveal the song.';
    answerHint.hidden = false;
    return;
  }
  answerHint.hidden = true;

  var row = sessionRounds[roundIndex];
  var fieldResults = [];

  for (var i = 0; i < currentFields.length; i++) {
    var f = currentFields[i];
    var result = gradeField(row, f);
    fieldResults.push(result);
  }

  var allCorrect = fieldResults.every(function (r) { return r.correct; });
  sessionResults.push({ row: row, fieldResults: fieldResults, allCorrect: allCorrect });
  Stats.recordSong(row.Bandleader, fieldResults, allCorrect);

  renderReveal(row, fieldResults, allCorrect);

  answerArea.style.display = 'none';
  submitBtn.style.display = 'none';
  skipBtn.style.display = 'none';
  revealPanel.style.display = '';
  nextBtn.style.display = '';
  updateScoreDisplay();
  try { nextBtn.focus(); } catch (e) {}
});

// Skip: reveal the answer without grading. Skipped songs are shown as their
// own row in the summary and are not counted in accuracy or stats.
function skipRound() {
  if (submitBtn.style.display === 'none') return; // round already answered
  var row = sessionRounds[roundIndex];
  var fieldResults = currentFields.map(function (f) {
    var correctDisplay = f.as === 'year' ? String(extractYear(row.Date)) : (row[f.key] || '');
    return { key: f.key, label: FIELD_LABELS[f.key] || f.key, correct: false,
             guessDisplay: '', correctDisplay: correctDisplay, skipped: true };
  });
  sessionResults.push({ row: row, fieldResults: fieldResults, allCorrect: false, skipped: true });

  renderReveal(row, fieldResults, false);
  answerHint.hidden = true;
  answerArea.style.display = 'none';
  submitBtn.style.display = 'none';
  skipBtn.style.display = 'none';
  revealPanel.style.display = '';
  nextBtn.style.display = '';
  updateScoreDisplay();
  try { nextBtn.focus(); } catch (e) {}
}
skipBtn.addEventListener('click', skipRound);

function gradeField(row, f) {
  var label = FIELD_LABELS[f.key] || f.key;
  var correct, guessDisplay, correctDisplay;
  var yearsOff = null, close = false;

  if (f.as === 'year') {
    correctDisplay = String(extractYear(row.Date));
  } else {
    correctDisplay = row[f.key] || '';
  }

  if (f.mode === 'mc') {
    var checked = answerArea.querySelector('input[name="ntt-field-' + f.key + '"]:checked');
    guessDisplay = checked ? checked.value : '';
    correct = !!checked && norm(guessDisplay) === norm(correctDisplay);
  } else {
    var input = answerArea.querySelector('.ntt-text-input[data-key="' + f.key + '"]');
    guessDisplay = input ? input.value.trim() : '';
    if (f.as === 'year') {
      var guessedYear = parseInt(guessDisplay, 10);
      var correctYear = extractYear(row.Date);
      correct = guessedYear === correctYear;
      if (!correct && guessDisplay !== '' && !isNaN(guessedYear)) {
        yearsOff = Math.abs(guessedYear - correctYear);
        close = yearsOff <= YEAR_CLOSE_THRESHOLD;
      }
    } else {
      // Forgiving match: punctuation/accent-insensitive, and the alternate
      // title counts too (e.g. typing "Cielito Lindo" for "Cielito Mío").
      var accepted = [normLoose(row[f.key])];
      if (f.key === 'Title' && row.AltTitle) accepted.push(normLoose(row.AltTitle));
      correct = guessDisplay !== '' && accepted.indexOf(normLoose(guessDisplay)) !== -1;
    }
  }

  return { key: f.key, label: label, correct: correct, guessDisplay: guessDisplay,
           correctDisplay: correctDisplay, yearsOff: yearsOff, close: close };
}

function updateScoreDisplay() {
  // Lifetime fully-correct streak, shown live once it's worth bragging about.
  var streak = Stats.getCurrentStreak();
  streakDisplay.textContent = streak >= 2 ? '🔥 ' + streak : '';
  streakDisplay.title = streak >= 2 ? streak + ' fully-correct songs in a row' : '';

  var graded = sessionResults.filter(function (r) { return !r.skipped; });
  if (!graded.length) { scoreDisplay.textContent = 'Score: —'; return; }
  var perKey = {}, keyOrder = [];
  graded.forEach(function (r) {
    r.fieldResults.forEach(function (f) {
      if (!perKey[f.key]) { perKey[f.key] = { correct: 0, asked: 0 }; keyOrder.push(f.key); }
      perKey[f.key].asked++;
      if (f.correct) perKey[f.key].correct++;
    });
  });
  keyOrder.sort(function (a, b) { return FIELD_ORDER.indexOf(a) - FIELD_ORDER.indexOf(b); });
  var parts = keyOrder.map(function (k) {
    var c = perKey[k];
    return (FIELD_LABELS[k] || k) + ' ' + c.correct + '/' + c.asked;
  });
  scoreDisplay.textContent = 'Score: ' + parts.join(' · ');
}

// --- Reveal panel: discographies-style detail card ---
function findFieldResult(fieldResults, key) {
  for (var i = 0; i < fieldResults.length; i++) if (fieldResults[i].key === key) return fieldResults[i];
  return null;
}

function metaRow(label, value, asked, raw) {
  var hasVal = raw ? !!value : !!(value && String(value).trim());
  var displayVal = hasVal ? (raw ? value : esc(value)) : '<span class="ntt-empty">—</span>';
  var badge = '';
  if (asked) {
    badge = asked.correct
      ? ' <span class="ntt-badge ntt-badge-correct">✓</span>'
      : asked.close
        ? ' <span class="ntt-badge ntt-badge-close">close</span>'
        : ' <span class="ntt-badge ntt-badge-wrong">✗</span>';
    if (!asked.correct) {
      if (asked.skipped) {
        displayVal += '<div class="ntt-guess">Skipped</div>';
      } else {
        var guessLine = 'Your guess: ' + (esc(asked.guessDisplay) || '<em>(blank)</em>');
        if (asked.yearsOff != null) guessLine += ' <span class="ntt-years-off">(' + asked.yearsOff + ' year' + (asked.yearsOff === 1 ? '' : 's') + ' off)</span>';
        displayVal += '<div class="ntt-guess">' + guessLine + '</div>';
      }
    }
  }
  return '<div class="ntt-detail-meta-label">' + esc(label) + '</div>' +
    '<div class="ntt-detail-meta-value' + (hasVal ? '' : ' empty') + '">' + displayVal + badge + '</div>';
}

function detailField(label, value, span) {
  var hasVal = value && String(value).trim();
  var val = hasVal ? esc(value) : '<span class="ntt-empty">—</span>';
  var cls = span ? ' ' + span : '';
  return '<div class="ntt-detail-field' + cls + '">' +
    '<div class="ntt-detail-field-label">' + esc(label) + '</div>' +
    '<div class="ntt-detail-field-value' + (hasVal ? '' : ' empty') + '">' + val + '</div></div>';
}

function renderReveal(row, fieldResults, allCorrect) {
  var skipped = fieldResults.length && fieldResults.every(function (f) { return f.skipped; });
  var correctCount = fieldResults.filter(function (f) { return f.correct; }).length;
  revealBanner.className = 'ntt-reveal-banner ' + (allCorrect ? 'ntt-reveal-banner-correct' : 'ntt-reveal-banner-wrong');
  revealBanner.textContent = skipped
    ? 'Skipped — here’s the answer'
    : allCorrect
      ? '✓ All correct!'
      : correctCount + ' of ' + fieldResults.length + ' correct';
  listenFullBtn.textContent = '▶ Listen from the top';

  var titleHtml = '<span class="ntt-meta-title">' + esc(row.Title || '') + '</span>' +
    (row.AltTitle ? '<span class="ntt-meta-alt">' + esc(row.AltTitle) + '</span>' : '');

  var html = '';
  html += metaRow('Title', titleHtml, findFieldResult(fieldResults, 'Title'), true);
  html += metaRow('Bandleader', row.Bandleader, findFieldResult(fieldResults, 'Bandleader'));
  html += metaRow('Year', String(extractYear(row.Date) || ''), findFieldResult(fieldResults, 'Date'));
  html += metaRow('Orchestra', row.Orchestra, null);
  html += metaRow('Genre', row.Genre, null);
  html += metaRow('Singer', row.Singer, findFieldResult(fieldResults, 'Singer'));
  detailMeta.innerHTML = html;

  var gridHtml = '';
  gridHtml += detailField('Label', row.Label);
  gridHtml += detailField('Master', row.Master);
  gridHtml += detailField('Grouping', row.Grouping);
  gridHtml += detailField('Composer', row.Composer);
  gridHtml += detailField('Author', row.Author, 'ntt-span2');
  gridHtml += detailField('Arranger', row.Arranger, 'ntt-span2');
  gridHtml += '<div class="ntt-detail-section-header">Band Members</div>';
  gridHtml += detailField('Lineup', row.Lineup, 'ntt-span3');
  gridHtml += detailField('Pianist', row.Pianist);
  gridHtml += detailField('Bassist', row.Bassist);
  gridHtml += detailField('Bandoneons', row.Bandoneons, 'ntt-span3');
  gridHtml += detailField('Strings', row.Strings, 'ntt-span3');
  detailGrid.innerHTML = gridHtml;

  detailGrid.style.display = 'none';
  moreDetailsBtn.textContent = 'More details ▾';
}

moreDetailsBtn.addEventListener('click', function () {
  var showing = detailGrid.style.display !== 'none';
  detailGrid.style.display = showing ? 'none' : '';
  moreDetailsBtn.textContent = showing ? 'More details ▾' : 'Less details ▴';
});

listenFullBtn.addEventListener('click', function () {
  if (Player.getState() === 'playing' && Player.isListeningFull()) { Player.pauseClip(); return; }
  Player.listenFull();
});

// --- Keyboard shortcuts (active only during the quiz) ---
// Enter submits, then advances; Space/P play-pause; S skips; 1-4 pick a
// multiple-choice option. Suggestion-list Enter is handled by attachListNav,
// which stops propagation so a highlighted completion doesn't also submit.
document.addEventListener('keydown', function (e) {
  if (quizSection.style.display === 'none') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  var tag = e.target && e.target.tagName;
  var answering = submitBtn.style.display !== 'none';

  if (e.key === 'Enter') {
    if (tag === 'BUTTON') return; // let the focused button activate natively
    e.preventDefault();
    if (answering) submitBtn.click();
    else if (nextBtn.style.display !== 'none') nextBtn.click();
    return;
  }
  // Don't hijack typing in answer fields.
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (tag === 'BUTTON' && (e.key === ' ' || e.key === 'Spacebar')) return; // space activates the focused button

  if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'p' || e.key === 'P') {
    e.preventDefault(); Player.playBtn.click(); return;
  }
  if (e.key === 's' || e.key === 'S') {
    if (answering) { e.preventDefault(); skipRound(); }
    return;
  }
  if (answering && /^[1-9]$/.test(e.key)) {
    var groups = answerArea.querySelectorAll('.ntt-mc-group');
    if (groups.length === 1) {
      var radios = groups[0].querySelectorAll('input[type="radio"]');
      var idx = parseInt(e.key, 10) - 1;
      if (radios[idx]) { radios[idx].checked = true; e.preventDefault(); }
    }
  }
});

// --- Next / summary / end early ---
nextBtn.addEventListener('click', function () {
  roundIndex++;
  if (roundIndex >= sessionRounds.length) {
    showSummary();
  } else {
    renderRound();
  }
});

endQuizBtn.addEventListener('click', function () { showSummary(); });

// --- Summary playback (reuses the shared audio element via interceptors) ---
function resetSummaryPlayback() {
  Player.audio.pause();
  if (summaryPlayingIdx !== -1) {
    var btn = summaryBody.querySelector('.ntt-btn-summary-play[data-idx="' + summaryPlayingIdx + '"]');
    if (btn) btn.textContent = '▶';
  }
  summaryPlayingIdx = -1;
}

Player.onEnded(function () {
  if (summaryPlayingIdx === -1) return false;
  resetSummaryPlayback();
  return true;
});

Player.onError(function () {
  if (summaryPlayingIdx === -1) return false;
  resetSummaryPlayback();
  return true;
});

summaryBody.addEventListener('click', function (e) {
  var btn = e.target.closest('.ntt-btn-summary-play');
  if (!btn) return;
  var idx = parseInt(btn.getAttribute('data-idx'), 10);
  var wasPlayingThis = summaryPlayingIdx === idx;
  resetSummaryPlayback();
  if (wasPlayingThis) return;
  Player.audio.src = sessionResults[idx].row._audioUrl;
  Player.audio.currentTime = 0;
  Player.audio.play();
  summaryPlayingIdx = idx;
  btn.textContent = '⏸';
});

function showSummary() {
  Player.suspend();
  resetSummaryPlayback();
  quizSection.style.display = 'none';
  summarySection.style.display = '';
  if (summarySection.getBoundingClientRect().top < 0) {
    summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (sessionResults.length) { Stats.recordSessionEnd(); Stats.render(); }

  // Fields can vary round-to-round (Big Four's conditional singer/year),
  // so the column set is the union of keys actually asked, not just round 1's.
  var usedKeys = [];
  sessionResults.forEach(function (r) {
    r.fieldResults.forEach(function (f) {
      if (usedKeys.indexOf(f.key) === -1) usedKeys.push(f.key);
    });
  });
  usedKeys.sort(function (a, b) { return FIELD_ORDER.indexOf(a) - FIELD_ORDER.indexOf(b); });

  var headHtml = '<th></th><th>Song</th>';
  usedKeys.forEach(function (k) { headHtml += '<th>' + esc(FIELD_LABELS[k] || k) + '</th>'; });
  headHtml += '<th>Result</th>';
  summaryHead.innerHTML = headHtml;

  var fieldsAsked = 0, fieldsCorrect = 0, songsCorrect = 0, songsSkipped = 0, gradedSongs = 0;
  var bodyHtml = '';
  var shareRows = [];   // one Wordle-style row of squares per song, for the share card
  // A column earns a 💎 only if every song got that field right (all 🟩).
  var colAllCorrect = usedKeys.map(function () { return true; });
  sessionResults.forEach(function (r, idx) {
    var correctInRow = r.fieldResults.filter(function (f) { return f.correct; }).length;
    var resultText;

    // Wordle-style share grid: 🟩 correct · 🟨 close · 🟥 wrong · ⬜ skipped,
    // one square per field column (a skipped song renders an all-⬜ row).
    var squares = '';
    if (r.skipped) {
      squares = '⬜'.repeat(usedKeys.length);
      colAllCorrect = colAllCorrect.map(function () { return false; });
    } else {
      usedKeys.forEach(function (k, ci) {
        var f = findFieldResult(r.fieldResults, k);
        if (f && f.correct) { squares += '🟩'; return; }
        colAllCorrect[ci] = false;   // any miss breaks the column's 💎
        if (!f) squares += '⬜';
        else if (f.close) squares += '🟨';
        else squares += '🟥';
      });
    }
    shareRows.push(squares);
    if (r.skipped) {
      songsSkipped++;
      resultText = '<span class="ntt-badge ntt-badge-skip">skipped</span>';
    } else {
      gradedSongs++;
      fieldsAsked += r.fieldResults.length;
      fieldsCorrect += correctInRow;
      if (r.allCorrect) songsCorrect++;
      resultText = r.allCorrect
        ? '<span class="ntt-badge ntt-badge-correct">✓</span>'
        : '<span class="ntt-badge ntt-badge-wrong">' + correctInRow + '/' + r.fieldResults.length + '</span>';
    }

    bodyHtml += '<tr' + (r.skipped ? ' class="ntt-row-skipped"' : '') + '>';
    bodyHtml += '<td><button type="button" class="ntt-btn-summary-play" data-idx="' + idx + '" aria-label="Play clip">▶</button></td>';
    bodyHtml += '<td>' + esc(r.row.Title) + '</td>';
    usedKeys.forEach(function (k) {
      var f = findFieldResult(r.fieldResults, k);
      if (!f) { bodyHtml += '<td class="ntt-summary-na">—</td>'; return; }
      if (f.correct) {
        bodyHtml += '<td><span class="ntt-badge ntt-badge-correct">✓</span> ' + esc(f.correctDisplay) + '</td>';
      } else if (f.skipped) {
        bodyHtml += '<td><span class="ntt-summary-na">' + esc(f.correctDisplay) + '</span></td>';
      } else {
        var offNote = f.yearsOff != null ? ' <span class="ntt-years-off">(' + f.yearsOff + 'y)</span>' : '';
        var mark = f.close ? '<span class="ntt-badge ntt-badge-close">close</span>' : '<span class="ntt-badge ntt-badge-wrong">✗</span>';
        bodyHtml += '<td>' + mark + ' ' + esc(f.guessDisplay || '(blank)') + offNote + ' <span class="ntt-summary-arrow">&rarr;</span> ' + esc(f.correctDisplay) + '</td>';
      }
    });
    bodyHtml += '<td>' + resultText + '</td>';
    bodyHtml += '</tr>';
  });
  summaryBody.innerHTML = bodyHtml;
  var scoreText = songsCorrect + ' of ' + gradedSongs + ' songs fully correct (' + fieldsCorrect + '/' + fieldsAsked + ' total fields correct).';
  if (songsSkipped) scoreText += ' ' + songsSkipped + ' skipped.';
  summaryScore.textContent = scoreText;

  // 💎 over each fully-correct column, blank elsewhere; the row is dropped if none aced.
  var anyGem = false;
  var gemHeader = '';
  usedKeys.forEach(function (k, ci) {
    if (colAllCorrect[ci]) { gemHeader += '💎'; anyGem = true; }
    else gemHeader += '　';   // ideographic space ≈ emoji width, so columns still line up
  });

  lastSummary = { songsCorrect: songsCorrect, gradedSongs: gradedSongs,
                  fieldsCorrect: fieldsCorrect, fieldsAsked: fieldsAsked, songsSkipped: songsSkipped,
                  songsTotal: sessionResults.length,
                  grid: shareRows, gems: anyGem ? gemHeader : '' };

  // Replay-the-misses: the natural study loop — a fresh mini-session from
  // just the songs that weren't fully correct (skips included).
  var missed = sessionResults.filter(function (r) { return !r.allCorrect; });
  replayMissesBtn.style.display = missed.length ? '' : 'none';
  replayMissesBtn.textContent = 'Replay missed songs (' + missed.length + ')';

  shareResultBtn.textContent = 'Share with friends';
  if (shareCard) shareCard.hidden = true;

  // Record the first Daily Challenge result of the day (later replays are
  // practice and don't overwrite the honest first attempt).
  if (sessionOpts.daily && sessionResults.length) {
    try {
      var raw = window.localStorage.getItem(DAILY_KEY);
      var prev = raw ? JSON.parse(raw) : null;
      if (!prev || prev.date !== sessionOpts.daily.date) {
        window.localStorage.setItem(DAILY_KEY, JSON.stringify({
          date: sessionOpts.daily.date,
          songsCorrect: songsCorrect, gradedSongs: gradedSongs,
          fieldsCorrect: fieldsCorrect, fieldsAsked: fieldsAsked
        }));
      }
    } catch (e) {}
  }
}

replayMissesBtn.addEventListener('click', function () {
  var missed = sessionResults.filter(function (r) { return !r.allCorrect; }).map(function (r) { return r.row; });
  if (!missed.length) return;
  resetSummaryPlayback();
  beginRounds(shuffle(missed));
});

// --- Share result: reveal a result card, copy on demand ---
// Pieces of the shareable result, so the card and the copied text stay in sync.
function shareParts() {
  var s = lastSummary || { songsCorrect: 0, songsTotal: 0, grid: [], gems: '' };
  var head = 'Name That Tango ' + s.songsTotal;
  var gridLines = [];
  if (s.grid && s.grid.length) {
    if (s.gems) gridLines.push(s.gems);   // 💎 marks any field you got right on every song
    s.grid.forEach(function (row) { gridLines.push(row); });
  }
  var score = s.songsCorrect + '/' + s.songsTotal + ' Correct';
  return { head: head, gridLines: gridLines, score: score, url: window.location.href };
}

function buildShareText() {
  var p = shareParts();
  return [p.head].concat(p.gridLines, [p.score, p.url]).join('\n');
}

function showShareCard() {
  var p = shareParts();
  shareCardTitle.textContent = p.head;
  shareCardGrid.textContent = p.gridLines.join('\n');
  shareCardScore.textContent = p.score;
  shareCardLink.href = p.url;
  shareCard.hidden = false;
  shareCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function legacyCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  var ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  return ok;
}

shareResultBtn.addEventListener('click', showShareCard);

shareCopyBtn.addEventListener('click', function () {
  var text = buildShareText();
  function done(ok) {
    shareCopyBtn.textContent = ok ? 'Copied!' : 'Copy failed';
    setTimeout(function () { shareCopyBtn.textContent = 'Copy to clipboard'; }, 2000);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(legacyCopy(text)); });
  } else {
    done(legacyCopy(text));
  }
});

playAgainBtn.addEventListener('click', function () {
  resetSummaryPlayback();
  if (restartCallback) restartCallback();
});

changeSettingsBtn.addEventListener('click', function () {
  resetSummaryPlayback();
  summarySection.style.display = 'none';
  if (exitCallback) exitCallback();
});
