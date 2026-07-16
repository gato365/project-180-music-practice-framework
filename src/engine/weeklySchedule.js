// ─────────────────────────────────────────────────────────────────────────────
// weeklySchedule.js — day types (learn / review / rest) for each weekday.
// The app ships a sensible default; the Schedule tab lets the user edit it.
// The planner derives today's plan from today's day type:
//   learn  → surface the least-recently-practiced keys
//   review → reinforce keys touched in the last 7 days
//   rest   → if the user practices anyway, keep it short and light
// ─────────────────────────────────────────────────────────────────────────────

export const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export const DAY_TYPES = [
  { id: 'learn',  label: 'Learn',  desc: 'new / neglected keys' },
  { id: 'review', label: 'Review', desc: 'reinforce this week'  },
  { id: 'rest',   label: 'Rest',   desc: 'off (light if you play)' },
]

// Default: learn early in the week, consolidate at the end, Sunday off.
export const DEFAULT_WEEKLY_SCHEDULE = {
  Sunday: 'rest',
  Monday: 'learn',
  Tuesday: 'learn',
  Wednesday: 'learn',
  Thursday: 'review',
  Friday: 'learn',
  Saturday: 'review',
}

export function dayTypeFor(date, schedule = DEFAULT_WEEKLY_SCHEDULE) {
  const name = DAY_NAMES[date.getDay()]
  return schedule[name] ?? 'learn'
}

export function dayTypeLabel(typeId) {
  return DAY_TYPES.find(t => t.id === typeId)?.label ?? typeId
}
