// Name That Tango — game configuration and tuning constants.
import { norm } from './util.js';

export var ROUNDS_OPTIONS = [5, 8, 15];
export var DEFAULT_ROUNDS = 8;
export var MC_OPTION_COUNT = 4;
export var CLIP_DURATION_S = 30;
export var ORCHESTRA_MIN_SONGS = 4;
export var ERA_MIN_BANDLEADERS = 2;
export var ERA_MIN_SONGS = 4;
export var TYPEAHEAD_MIN_CHARS = 3;   // only suggest completions once the player has typed this many characters
export var YEAR_CLOSE_THRESHOLD = 3;  // a type-in year within this many years is flagged "close" (still counts as wrong)
export var YEAR_OPTION_MIN_GAP = 2;   // multiple-choice year decoys must be at least this many years apart from each other and the answer

export var STATS_KEY = 'ntt_stats_v1';
export var SETTINGS_KEY = 'ntt_settings_v1';  // last-used setup, restored on the next visit
export var DAILY_KEY = 'ntt_daily_v1';        // first Daily Challenge result of the current day
export var DAILY_ROUNDS = 5;
export var DAILY_STREAK_MIN = 5;   // perfect dailies in a row needed to make the leaderboard

export var BIG_FOUR_BANDLEADERS = ["Juan D'Arienzo", 'Carlos Di Sarli', 'Osvaldo Pugliese', 'Aníbal Troilo'];
export var BIG_FOUR_RANGES = [
  { id: 'pre', test: function (y) { return y < 1935; } },
  { id: 'early', test: function (y) { return y >= 1935 && y <= 1949; } },
  { id: 'later', test: function (y) { return y >= 1950 && y <= 1959; } },
  { id: 'post', test: function (y) { return y >= 1960; } }
];

// Golden Age game: same year boundaries as the Big Four's golden-age ranges,
// but the bandleader pool is every orchestra recording in the selected periods.
export var GOLDEN_AGE_RANGES = [
  { id: 'early', test: function (y) { return y >= 1935 && y <= 1949; } },
  { id: 'later', test: function (y) { return y >= 1950 && y <= 1959; } }
];

export var BIG_FOUR_SET = {};
BIG_FOUR_BANDLEADERS.forEach(function (b) { BIG_FOUR_SET[norm(b)] = true; });

export var MODULES = {
  orchestra: {
    levels: [
      { label: 'Intro', desc: 'Title (multiple choice)', fields: [{ key: 'Title', mode: 'mc' }] },
      { label: 'Medium', desc: 'Title + singer — or year if instrumental (multiple choice)', fields: [{ key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
      { label: 'Advanced', desc: 'Title (type-in) + singer/year (multiple choice)', fields: [{ key: 'Title', mode: 'type' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
      { label: 'Challenge', desc: 'Title + singer/year (type-in)', fields: [{ key: 'Title', mode: 'type' }, { key: 'auto', mode: 'type', conditional: 'singer-or-year' }] }
    ]
  },
  era: {
    levels: [
      { label: '1. Bandleader (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc' }] },
      { label: '2. Bandleader + Title (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'Title', mode: 'mc' }] },
      { label: '3. Bandleader + Title (type-in)', fields: [{ key: 'Bandleader', mode: 'type' }, { key: 'Title', mode: 'type' }] },
      { label: '4. Bandleader + Title + Year (type-in)', fields: [{ key: 'Bandleader', mode: 'type' }, { key: 'Title', mode: 'type' }, { key: 'Date', mode: 'type', as: 'year' }] },
      { label: '5. + Singer (type-in)', fields: [{ key: 'Bandleader', mode: 'type' }, { key: 'Title', mode: 'type' }, { key: 'Date', mode: 'type', as: 'year' }, { key: 'Singer', mode: 'type' }] }
    ]
  },
  bigfour: {
    levels: [
      { label: 'Intro', desc: 'Bandleader (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc', fixedOptions: BIG_FOUR_BANDLEADERS }] },
      { label: 'Medium', desc: 'Bandleader + singer — or year if instrumental (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc', fixedOptions: BIG_FOUR_BANDLEADERS }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
      { label: 'Advanced', desc: 'Bandleader + title + singer/year (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc', fixedOptions: BIG_FOUR_BANDLEADERS }, { key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
      { label: 'Challenge', desc: 'Bandleader (choice) + title, year and singer (type-in)', fields: [{ key: 'Bandleader', mode: 'mc', fixedOptions: BIG_FOUR_BANDLEADERS }, { key: 'Title', mode: 'type' }, { key: 'Date', mode: 'type', as: 'year' }, { key: 'Singer', mode: 'type', conditional: 'has-singer' }] }
    ]
  },
  // Same escalating style as the Big Four, but bandleader MC options are drawn
  // from the full golden-age orchestra pool (no fixedOptions).
  goldenage: {
    levels: [
      { label: 'Intro', desc: 'Bandleader (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc' }] },
      { label: 'Medium', desc: 'Bandleader + singer — or year if instrumental (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
      { label: 'Advanced', desc: 'Bandleader + title + singer/year (multiple choice)', fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
      { label: 'Challenge', desc: 'Bandleader, title, year and singer (type-in)', fields: [{ key: 'Bandleader', mode: 'type' }, { key: 'Title', mode: 'type' }, { key: 'Date', mode: 'type', as: 'year' }, { key: 'Singer', mode: 'type', conditional: 'has-singer' }] }
    ]
  },
  // Daily Challenge: a fixed-size Golden Age quiz dealt from a date-seeded
  // RNG so every player gets the same songs on the same day (see main.js).
  daily: {
    levels: [
      { label: 'Daily', desc: 'Bandleader + title + singer — or year if instrumental (multiple choice). Same songs for everyone, new set each day.', fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] }
    ]
  },
  // Survival's ladder lives in SURVIVAL_STAGES below; this single level
  // exists so the shared setup UI (level list, saved settings, URL params)
  // treats it like any other game.
  survival: {
    levels: [
      { label: 'Survival', desc: 'Five songs per stage, each stage harder. A song not fully correct costs a life — lose 3 and the run ends. Fully-correct songs are your score.' }
    ]
  },
  // Matching runs its own board flow (see matching.js). Each level's
  // `match` config sets the board size and whether titles are matched too.
  matching: {
    levels: [
      { label: 'Intro', desc: 'Match 4 clips to 4 orchestras (drag or tap)', match: { count: 4, titles: false, writein: false } },
      { label: 'Medium', desc: 'Match 4 clips to their orchestras and titles (drag or tap)', match: { count: 4, titles: true, writein: false } },
      { label: 'Advanced', desc: 'Match 5 clips to their orchestras and titles (drag or tap)', match: { count: 5, titles: true, writein: false } },
      { label: 'Challenge', desc: 'Type the orchestra and title for 5 clips', match: { count: 5, titles: true, writein: true } }
    ]
  }
};

export var FIELD_LABELS = { Title: 'Title', Bandleader: 'Bandleader', Date: 'Year', Singer: 'Singer' };
export var FIELD_ORDER = ['Bandleader', 'Title', 'Date', 'Singer'];

// --- Survival mode ---
// An escalating gauntlet: SURVIVAL_STAGE_SONGS songs per stage, each stage a
// harder question set over a wider pool, with the last stage endless. Any song
// not fully correct costs a life; SURVIVAL_MAX_MISSES lost lives ends the run,
// and the score is the number of fully-correct songs. Top scores go to a
// shared leaderboard (see leaderboard.js and /api/leaderboards).
export var SURVIVAL_MAX_MISSES = 3;
export var SURVIVAL_STAGE_SONGS = 5;
export var SURVIVAL_CHALLENGE_EVERY = 5;  // in the endless stage, every Nth song is a type-in challenge

// `pool` names one of the pools built in main.js:
//   bigfour   - Big Four recordings from the Golden Age (1935-1959)
//   goldenage - every orchestra recording from the Golden Age
//   all       - the whole playable discography
export var SURVIVAL_STAGES = [
  { label: 'Big Four', pool: 'bigfour', desc: 'Which of the Big Four is playing?',
    fields: [{ key: 'Bandleader', mode: 'mc', fixedOptions: BIG_FOUR_BANDLEADERS }] },
  { label: 'Big Four+', pool: 'bigfour', desc: 'Bandleader plus the singer — or the year if instrumental.',
    fields: [{ key: 'Bandleader', mode: 'mc', fixedOptions: BIG_FOUR_BANDLEADERS }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
  { label: 'Golden Age', pool: 'goldenage', desc: 'Every Golden Age orchestra is now in play.',
    fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
  { label: 'Golden Age+', pool: 'goldenage', desc: 'Now the title too.',
    fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
  { label: 'All Eras', pool: 'all', desc: 'The whole discography — old guard to modern.',
    fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }] },
  { label: 'Endless', pool: 'all', desc: 'How far can you go? Every 5th song is a type-in challenge.',
    fields: [{ key: 'Bandleader', mode: 'mc' }, { key: 'Title', mode: 'mc' }, { key: 'auto', mode: 'mc', conditional: 'singer-or-year' }],
    challengeFields: [{ key: 'Bandleader', mode: 'type' }, { key: 'Title', mode: 'type' }, { key: 'auto', mode: 'type', conditional: 'singer-or-year' }] }
];
