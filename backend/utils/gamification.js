const DAY_MS = 24 * 60 * 60 * 1000;
const POINTS_PER_ACTIVE_DAY = 10;
const PERFECT_DAY_BONUS = 5;
const BONUS_PER_7_ACTIVE_DAYS = 50;

const toDate = (s) => new Date(s + 'T00:00:00Z');
const fmt = (d) => d.toISOString().split('T')[0];
const addDays = (s, n) => fmt(new Date(toDate(s).getTime() + n * DAY_MS));

function weekStart(s) {
  const d = toDate(s);
  const dayIndex = (d.getUTCDay() + 6) % 7; // Monday = 0
  return fmt(new Date(d.getTime() - dayIndex * DAY_MS));
}

// total points needed to reach a level: L2=100, L3=300, L4=600, L5=1000 ...
const pointsForLevel = (level) => 50 * level * (level - 1);

// current streak (counted back from today) and longest streak of consecutive days
function dailyStreaks(dates, today) {
  const set = new Set(dates);
  let current = 0;
  let day = today;
  while (set.has(day)) {
    current++;
    day = addDays(day, -1);
  }

  let longest = 0, run = 0, prev = null;
  for (const d of [...set].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest };
}

// weekly streak = consecutive weeks (Mon-Sun) with at least `target` check-ins
function weeklyStreaks(dates, today, target) {
  const counts = {};
  for (const d of new Set(dates)) {
    const w = weekStart(d);
    counts[w] = (counts[w] || 0) + 1;
  }
  const ok = (w) => (counts[w] || 0) >= target;

  let current = 0;
  let week = weekStart(today);
  if (ok(week)) current++;          // this week already met
  week = addDays(week, -7);         // this week still in progress: do not break the streak
  while (ok(week)) {
    current++;
    week = addDays(week, -7);
  }

  let longest = 0, run = 0, prev = null;
  for (const w of Object.keys(counts).filter(ok).sort()) {
    run = prev && addDays(prev, 7) === w ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = w;
  }
  return { current, longest };
}

function buildBadges({ totalCheckIns, bestStreak, bestWeeklyStreak, points }) {
  return [
    { id: 'first-step', name: 'First Step', description: 'Complete your first check-in', earned: totalCheckIns >= 1 },
    { id: 'getting-warm', name: 'Getting Warm', description: 'Reach a 3-day streak', earned: bestStreak >= 3 },
    { id: 'week-warrior', name: 'Week Warrior', description: 'Reach a 7-day streak', earned: bestStreak >= 7 },
    { id: 'habit-master', name: 'Habit Master', description: 'Reach a 30-day streak', earned: bestStreak >= 30 },
    { id: 'weekly-winner', name: 'Weekly Winner', description: 'Keep a 2-week streak', earned: bestWeeklyStreak >= 2 },
    { id: 'point-collector', name: 'Point Collector', description: 'Earn 200 points', earned: points >= 200 },
  ];
}

// habits = all habits of the user, checkIns = all check-ins of the user
function computeStats(habits, checkIns) {
  const today = fmt(new Date());
  const activeIds = new Set(habits.filter((h) => h.active).map((h) => String(h._id)));

  const datesByHabit = {};
  const habitsByDay = {};
  for (const c of checkIns) {
    const id = String(c.habitId);
    if (!datesByHabit[id]) datesByHabit[id] = [];
    datesByHabit[id].push(c.date);
    if (!habitsByDay[c.date]) habitsByDay[c.date] = new Set();
    habitsByDay[c.date].add(id);
  }

  // points are earned per ACTIVE DAY, not per check-in
  let points = 0;
  for (const ids of Object.values(habitsByDay)) {
    points += POINTS_PER_ACTIVE_DAY;
    const doneActive = [...ids].filter((id) => activeIds.has(id)).length;
    if (activeIds.size > 0 && doneActive >= activeIds.size) points += PERFECT_DAY_BONUS;
  }

  // bonus for every full 7 consecutive active days
  const activeDays = Object.keys(habitsByDay).sort();
  const runs = [];
  let run = 0, prev = null;
  for (const d of activeDays) {
    if (prev && addDays(prev, 1) === d) {
      run++;
    } else {
      if (run) runs.push(run);
      run = 1;
    }
    prev = d;
  }
  if (run) runs.push(run);
  for (const r of runs) points += Math.floor(r / 7) * BONUS_PER_7_ACTIVE_DAYS;

  const activeStreak = dailyStreaks(activeDays, today);

  // per-habit streaks
  const habitMap = {};
  for (const h of habits) habitMap[String(h._id)] = h;
  let bestStreak = 0, bestWeeklyStreak = 0;
  const perHabit = {};
  for (const id of Object.keys(datesByHabit)) {
    const habit = habitMap[id];
    const target = habit && habit.frequency === 'weekly' ? 1 : 3;
    const daily = dailyStreaks(datesByHabit[id], today);
    const weekly = weeklyStreaks(datesByHabit[id], today, target);
    bestStreak = Math.max(bestStreak, daily.longest);
    bestWeeklyStreak = Math.max(bestWeeklyStreak, weekly.longest);
    perHabit[id] = { daily, weekly };
  }

  // level from total points
  let level = 1;
  while (points >= pointsForLevel(level + 1)) level++;
  const floor = pointsForLevel(level);
  const size = pointsForLevel(level + 1) - floor;
  const pointsIntoLevel = points - floor;

  const totalCheckIns = checkIns.length;
  const habitStats = habits
    .filter((h) => h.active)
    .map((h) => {
      const s = perHabit[String(h._id)];
      return {
        habitId: String(h._id),
        title: h.title,
        dailyStreak: s ? s.daily.current : 0,
        longestStreak: s ? s.daily.longest : 0,
        weeklyStreak: s ? s.weekly.current : 0,
      };
    });

  return {
    points,
    level,
    pointsIntoLevel,
    pointsToNextLevel: size - pointsIntoLevel,
    progressPercent: Math.round((pointsIntoLevel / size) * 100),
    totalCheckIns,
    activeDays: activeDays.length,
    activeDayStreak: activeStreak.current,
    bestStreak,
    bestWeeklyStreak,
    badges: buildBadges({ totalCheckIns, bestStreak, bestWeeklyStreak, points }),
    habits: habitStats,
  };
}

module.exports = { computeStats };