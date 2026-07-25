// Name That Tango — pure helpers shared by every module.
// No DOM access here; anything that touches elements lives elsewhere.

// --- Accent stripping / normalization (matches tanda-builder's approach) ---
var accentMap = {
  'à':'a','á':'a','â':'a','ã':'a','ä':'a','å':'a',
  'è':'e','é':'e','ê':'e','ë':'e',
  'ì':'i','í':'i','î':'i','ï':'i',
  'ò':'o','ó':'o','ô':'o','õ':'o','ö':'o',
  'ù':'u','ú':'u','û':'u','ü':'u',
  'ñ':'n','ç':'c','ý':'y','ÿ':'y'
};

export function stripAccents(s) {
  if (!s) return '';
  return s.replace(/[à-ÿ]/g, function (c) { return accentMap[c] || c; });
}

export function norm(s) { return stripAccents((s || '').toLowerCase()).trim(); }

// Looser normalization used only for grading type-in answers: drops
// punctuation and collapses whitespace so "C.T.V." matches "CTV" and
// "Adios, Nonino" matches "Adios Nonino". Mirrors the audio-map pipeline.
export function normLoose(s) {
  var n = norm(s).replace(/[^\w\s]/g, '');
  n = n.replace(/\s+/g, ' ').trim();
  return n.replace(/\b\w(?:\s\w)+\b/g, function (m) { return m.replace(/\s/g, ''); });
}

export function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export function extractYear(dateStr) {
  if (!dateStr) return 0;
  var m = dateStr.match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : 0;
}

export function parseDate(dateStr) {
  if (!dateStr) return 0;
  var parts = dateStr.split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2], 10), parseInt(parts[0], 10) - 1, parseInt(parts[1], 10)).getTime();
  }
  parts = dateStr.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
  }
  return 0;
}

export function joinKey(bandleader, title, date) {
  return norm(bandleader) + '|' + norm(title) + '|' + parseDate(date);
}

// Format a Date as a local YYYY-MM-DD key.
export function dateKey(d) {
  var m = String(d.getMonth() + 1);
  var day = String(d.getDate());
  return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
}

// Local calendar date (YYYY-MM-DD), so the Daily Challenge rolls over at the
// player's midnight and share cards are stamped with the player's own date.
export function todayKey() {
  return dateKey(new Date());
}

// The YYYY-MM-DD one calendar day before the given key. Used to tell whether a
// perfect Daily Challenge continues yesterday's streak or starts a new one.
export function prevDayKey(key) {
  var parts = (key || '').split('-');
  var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

// --- Last-name helpers for the orchestra dropdown (matches tanda-builder) ---
var LAST_NAME_PARTICLES = ['de', 'di', 'del', 'la', 'las', 'los'];

export function getLastName(name) {
  var parts = (name || '').trim().split(/\s+/);
  if (parts.length <= 1) return name || '';
  for (var i = 1; i < parts.length; i++) {
    if (LAST_NAME_PARTICLES.indexOf(parts[i].toLowerCase()) >= 0) return parts.slice(i).join(' ');
  }
  return parts[parts.length - 1];
}

export function getSortLastName(entry) { return stripAccents(getLastName(entry)).toLowerCase(); }

export function uniqueSorted(rows, field) {
  var seen = {}, result = [];
  for (var i = 0; i < rows.length; i++) {
    var v = (rows[i][field] || '').trim();
    if (v && !seen[v]) { seen[v] = true; result.push(v); }
  }
  result.sort(function (a, b) { return a.localeCompare(b); });
  return result;
}

export function hasSinger(row) {
  var s = norm(row.Singer);
  return !!s && s !== 'instrumental';
}

// Expands a level's field list against a specific row, resolving any
// conditional fields (e.g. Big Four's "singer if vocal, else year").
export function resolveFields(fields, row) {
  var resolved = [];
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    if (f.conditional === 'singer-or-year') {
      var condMode = f.mode || 'mc';
      resolved.push(hasSinger(row) ? { key: 'Singer', mode: condMode } : { key: 'Date', mode: condMode, as: 'year' });
    } else if (f.conditional === 'has-singer') {
      if (hasSinger(row)) resolved.push({ key: f.key, mode: f.mode });
    } else {
      resolved.push(f);
    }
  }
  return resolved;
}

// Portrait thumbnails shown next to bandleader/singer multiple-choice
// options. The filename is derived from the name itself (surname for
// bandleaders, e.g. "Juan D'Arienzo" -> darienzo.webp) so any orchestra or
// singer works the same way — drop a matching /public/images/bandleaders/*.webp
// or /public/images/singers/*.webp in and it shows up automatically. Names
// without a photo on disk just show no thumbnail (onerror hides the broken
// image icon).
export function personSlug(name) {
  return stripAccents(getLastName(name) || '').toLowerCase().replace(/[^a-z]/g, '');
}

export function personThumb(dir, name) {
  var slug = personSlug(name);
  if (!slug) return '';
  return '<img class="ntt-mc-thumb" src="/images/' + dir + '/' + slug + '.webp" alt="" loading="lazy" width="200" height="200" onerror="this.style.display=\'none\'">';
}

// --- Randomness ---
// All game randomness flows through `rand` so the Daily Challenge can swap
// in a date-seeded generator and deal everyone the same songs (and mostly
// the same decoys/clip offsets too).
var rand = Math.random;
export function setRand(fn) { rand = fn; }
export function resetRand() { rand = Math.random; }
export function random() { return rand(); }

// Small, fast seeded PRNG — plenty for shuffling a song list.
export function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export function sampleN(arr, n) { return shuffle(arr).slice(0, n); }

// Picks `count` decoy years for a multiple-choice year question such that
// every pair (decoys and the answer) is at least minGap years apart —
// otherwise adjacent-year options (e.g. 1939 vs 1940) are nearly
// indistinguishable.
//
// When minYear/maxYear are given, decoys stay inside that range, so a year
// the player is being quizzed on never gets a decoy from outside the pool's
// span. If the range is too narrow to place `count` decoys at the desired
// spacing, the gap is relaxed a year at a time (down to adjacent years) so we
// still return as many options as the range can hold.
//
// Unbounded (no min/max), it keeps the old behavior: search +/-10 of the
// answer, widening the window if that can't yield enough spacing.
export function pickSpacedYears(correctYear, count, minGap, minYear, maxYear) {
  var hasBounds = typeof minYear === 'number' && typeof maxYear === 'number';

  function candidatesWithin(radius) {
    var arr = [];
    for (var dy = -radius; dy <= radius; dy++) {
      if (dy === 0) continue;
      var cand = correctYear + dy;
      if (cand <= 0) continue;
      if (hasBounds && (cand < minYear || cand > maxYear)) continue;
      arr.push(cand);
    }
    return arr;
  }

  function pick(candidates, gap) {
    var chosen = [];
    var taken = [correctYear];
    shuffle(candidates).forEach(function (y) {
      if (chosen.length >= count) return;
      if (taken.every(function (t) { return Math.abs(t - y) >= gap; })) {
        chosen.push(y);
        taken.push(y);
      }
    });
    return chosen;
  }

  if (hasBounds) {
    // One window wide enough to reach both ends of the range covers everything.
    var candidates = candidatesWithin(Math.max(maxYear - minYear, 1));
    for (var gap = minGap; gap >= 1; gap--) {
      var chosen = pick(candidates, gap);
      if (chosen.length >= count) return chosen;
    }
    // Range holds fewer than `count` distinct years — return all we can.
    return pick(candidates, 1);
  }

  var radius = 10;
  var result = [];
  while (result.length < count && radius <= 60) {
    result = pick(candidatesWithin(radius), minGap);
    radius += 10;
  }
  return result;
}

// Weighted round sampling for the Big Four (and the Daily Challenge):
// D'Arienzo has far more recordings than most orchestras, so plain uniform
// sampling over the song-level pool would make him the answer most of the
// time. Weighting each bandleader by sqrt(song count) instead of raw count
// keeps orchestras with more songs somewhat more frequent while flattening
// the distribution so everyone appears at a reasonable rate.
export function weightedSampleByBandleader(pool, n) {
  var byBandleader = {};
  pool.forEach(function (r) {
    (byBandleader[r.Bandleader] = byBandleader[r.Bandleader] || []).push(r);
  });
  var names = Object.keys(byBandleader);
  var remaining = {};
  names.forEach(function (b) { remaining[b] = shuffle(byBandleader[b]); });
  var weights = names.map(function (b) { return Math.sqrt(byBandleader[b].length); });

  var result = [];
  while (result.length < n && names.length) {
    var totalWeight = weights.reduce(function (a, w) { return a + w; }, 0);
    var r = rand() * totalWeight;
    var idx = 0, acc = 0;
    for (; idx < weights.length; idx++) {
      acc += weights[idx];
      if (r < acc) break;
    }
    if (idx >= names.length) idx = names.length - 1;
    var name = names[idx];
    result.push(remaining[name].pop());
    if (!remaining[name].length) {
      names.splice(idx, 1);
      weights.splice(idx, 1);
    }
  }
  return shuffle(result);
}
