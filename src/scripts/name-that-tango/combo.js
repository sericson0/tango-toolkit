// Name That Tango — accent-folding search widgets (combobox + typeahead)
// shared by the setup pickers, quiz type-in fields, and Matching write-ins.
import { norm, esc } from './util.js';
import { TYPEAHEAD_MIN_CHARS } from './config.js';

// --- Keyboard navigation for a suggestion list ---
// Shared by the orchestra/era combos and the quiz type-in fields. Arrow keys
// move a highlighted option; Enter accepts a highlighted option (and stops
// the event so it doesn't also submit the round); Escape closes the list.
// When nothing is highlighted, Enter falls through so the global handler can
// submit — letting a player type a full answer and just press Enter.
export function attachListNav(inputEl, listEl, onSelect) {
  function opts() { return Array.prototype.slice.call(listEl.querySelectorAll('.ntt-combo-option')); }
  function active() { return listEl.querySelector('.ntt-combo-option.active'); }
  function setActive(el) {
    var cur = active();
    if (cur) cur.classList.remove('active');
    if (el) { el.classList.add('active'); el.scrollIntoView({ block: 'nearest' }); }
  }
  inputEl.addEventListener('keydown', function (e) {
    if (listEl.hidden) return;
    var list = opts();
    if (!list.length) return;
    var idx = list.indexOf(active());
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(list[idx < 0 ? 0 : Math.min(idx + 1, list.length - 1)]); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(list[idx <= 0 ? 0 : idx - 1]); }
    else if (e.key === 'Enter') {
      var a = active();
      if (a) { e.preventDefault(); e.stopPropagation(); onSelect(a.getAttribute('data-value')); }
    } else if (e.key === 'Escape') { listEl.hidden = true; inputEl.setAttribute('aria-expanded', 'false'); }
  });
}

// Wraps a native <select> with a text input so typing strips accents
// (e.g. "Anibal" matches "Aníbal Troilo"). The <select> stays the source
// of truth so existing .value reads and 'change' listeners keep working.
export function setupCombo(selectEl, inputEl, listEl) {
  function options() {
    return Array.prototype.slice.call(selectEl.options).filter(function (o) { return o.value !== ''; });
  }
  function syncFromSelect() {
    var opt = selectEl.options[selectEl.selectedIndex];
    inputEl.value = (opt && opt.value) ? opt.textContent : '';
  }
  function showList(show) {
    listEl.hidden = !show;
    inputEl.setAttribute('aria-expanded', show ? 'true' : 'false');
  }
  function render() {
    var q = norm(inputEl.value);
    var matches = q ? options().filter(function (o) { return norm(o.textContent).indexOf(q) !== -1; }) : options();
    if (!matches.length) { showList(false); listEl.innerHTML = ''; return; }
    listEl.innerHTML = matches.map(function (o) {
      return '<div class="ntt-combo-option" role="option" data-value="' + esc(o.value) + '">' + esc(o.textContent) + '</div>';
    }).join('');
    showList(true);
  }
  function selectValue(value) {
    selectEl.value = value;
    syncFromSelect();
    showList(false);
    selectEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // Clear the field on re-entry so the full list shows and you can type a
  // fresh search, rather than having to delete the previously-picked name.
  // The prior selection is remembered and restored if nothing valid is chosen.
  var savedValue = '';
  inputEl.addEventListener('focus', function () {
    savedValue = selectEl.value;
    inputEl.value = '';
    render();
  });
  inputEl.addEventListener('input', render);
  inputEl.addEventListener('blur', function () {
    setTimeout(function () {
      showList(false);
      var typed = norm(inputEl.value);
      if (typed) {
        var exact = options().filter(function (o) { return norm(o.textContent) === typed; });
        if (exact.length === 1) {
          if (exact[0].value !== selectEl.value) selectValue(exact[0].value);
          else syncFromSelect();
          return;
        }
      }
      // Nothing valid typed — restore the selection we had on entry.
      if (selectEl.value !== savedValue) selectValue(savedValue);
      else syncFromSelect();
    }, 120);
  });
  listEl.addEventListener('mousedown', function (e) {
    var opt = e.target.closest('.ntt-combo-option');
    if (!opt) return;
    e.preventDefault();
    selectValue(opt.getAttribute('data-value'));
  });
  attachListNav(inputEl, listEl, selectValue);
  // Reflect external value changes (e.g. URL params) back into the input text.
  selectEl.addEventListener('change', syncFromSelect);
  syncFromSelect();
}

// Accent-folding suggestion list for a free-type text input (quiz answer
// fields). Suggestions appear only after TYPEAHEAD_MIN_CHARS characters so
// early letters don't hand players the answer.
export function setupTypeahead(inputEl, listEl, values) {
  function render() {
    var q = norm(inputEl.value);
    var matches = q.length >= TYPEAHEAD_MIN_CHARS
      ? values.filter(function (v) { return norm(v).indexOf(q) !== -1; }).slice(0, 8) : [];
    if (!matches.length) { listEl.hidden = true; listEl.innerHTML = ''; inputEl.setAttribute('aria-expanded', 'false'); return; }
    listEl.innerHTML = matches.map(function (v) {
      return '<div class="ntt-combo-option" role="option" data-value="' + esc(v) + '">' + esc(v) + '</div>';
    }).join('');
    listEl.hidden = false;
    inputEl.setAttribute('aria-expanded', 'true');
  }
  inputEl.addEventListener('focus', render);
  inputEl.addEventListener('input', render);
  inputEl.addEventListener('blur', function () { setTimeout(function () { listEl.hidden = true; inputEl.setAttribute('aria-expanded', 'false'); }, 120); });
  listEl.addEventListener('mousedown', function (e) {
    var opt = e.target.closest('.ntt-combo-option');
    if (!opt) return;
    e.preventDefault();
    inputEl.value = opt.getAttribute('data-value');
    listEl.hidden = true;
    inputEl.setAttribute('aria-expanded', 'false');
  });
  attachListNav(inputEl, listEl, function (v) { inputEl.value = v; listEl.hidden = true; inputEl.setAttribute('aria-expanded', 'false'); });
}
