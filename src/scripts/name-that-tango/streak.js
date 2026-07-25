// Name That Tango — Daily Challenge perfect-streak tracker (localStorage).
// A "perfect" daily is all DAILY_ROUNDS songs fully correct on the day's first
// attempt. Consecutive perfect days build a streak; a non-perfect first
// attempt, or a skipped day, breaks it. The count feeds the Daily Streak
// leaderboard (see leaderboard.js / quiz.js).
import { todayKey, prevDayKey } from './util.js';

var STREAK_KEY = 'ntt_daily_streak_v1';

function read() {
  try {
    var raw = window.localStorage.getItem(STREAK_KEY);
    var s = raw ? JSON.parse(raw) : null;
    if (s && typeof s === 'object') {
      return { streak: s.streak || 0, lastPerfectDate: s.lastPerfectDate || '' };
    }
  } catch (e) {}
  return { streak: 0, lastPerfectDate: '' };
}

function write(rec) {
  try { window.localStorage.setItem(STREAK_KEY, JSON.stringify(rec)); } catch (e) {}
}

// Fold the first daily attempt for `date` into the streak.
//   perfect  - were all songs fully correct?
// Returns { streak, extended, broken }:
//   streak   - the streak after this attempt
//   extended - a perfect day that grew (or started) the streak
//   broken   - a non-perfect day that ended a live streak
// Idempotent for the same date (a replay reports the stored streak, no change).
export function recordDaily(date, perfect) {
  var rec = read();
  if (perfect) {
    if (rec.lastPerfectDate === date) {
      return { streak: rec.streak, extended: false, broken: false };
    }
    var next = rec.lastPerfectDate === prevDayKey(date) ? rec.streak + 1 : 1;
    write({ streak: next, lastPerfectDate: date });
    return { streak: next, extended: true, broken: false };
  }
  var wasLive = rec.streak > 0 && (rec.lastPerfectDate === date || rec.lastPerfectDate === prevDayKey(date));
  write({ streak: 0, lastPerfectDate: '' });
  return { streak: 0, extended: false, broken: wasLive };
}

// The live streak for display: only counts if the last perfect day was today
// or yesterday — otherwise a missed day has already broken it.
export function currentStreak() {
  var rec = read();
  if (!rec.streak) return 0;
  var today = todayKey();
  return (rec.lastPerfectDate === today || rec.lastPerfectDate === prevDayKey(today)) ? rec.streak : 0;
}
