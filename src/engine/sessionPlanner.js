// ─────────────────────────────────────────────────────────────────────────────
// sessionPlanner.js — the executive-decision engine.
//
// The user picks exactly two things: instrument and minutes (5/10/15).
// This module decides everything else — which keys today, which scale type
// and forms per key, which patterns, at what BPM — and trims the whole plan
// to the time budget. Decisions are driven by history, not randomness:
// same day + same history → same plan (Regenerate advances the rotation).
//
// Selection rules (tunable, see README "Decisions to sanity-check"):
//   • Keys/day: 3 for 5 min, 4 for 10/15 min, 2 on rest days.
//   • Learn day  → keys never practiced first (circle-of-fourths order),
//                  then least-recently-practiced, then least-total-count.
//   • Review day → keys touched in the last 7 days, oldest first (spaced
//                  repetition), topped up from the learn ordering.
//   • Scale type per key cycles major → natural minor → harmonic minor,
//     picking whichever the key has seen least recently (major first).
//   • Every key starts with One Octave; extra forms (two octaves / thirds /
//     pentatonic) are added round-robin by per-key recency while time allows.
//   • Patterns get what's left of the budget (~28% target), ranked by how
//     long since each pattern was practiced, each assigned the today-key
//     where that pattern is most overdue. All 5 patterns × 12 keys rotate
//     through coverage over time.
// ─────────────────────────────────────────────────────────────────────────────

import { KEY_IDS, SCALE_TYPE_IDS, scaleName } from '../theory/scales.js'
import { FORMS, formDef } from '../theory/forms.js'
import { PATTERNS, patternDef } from '../theory/patterns.js'
import { isFormAvailable, isPatternAvailable } from '../theory/resolve.js'
import { resolveInstrument } from '../theory/instruments.js'
import { prettyName } from '../theory/notes.js'
import { coverageStats, daysSince } from './coverage.js'
import { dayTypeFor } from './weeklySchedule.js'
import {
  estimateItemSeconds, estimatePlanSeconds, DEFAULT_BPM, TIMING,
} from './timeEstimator.js'

// Musical rotation order used to break ties (fresh start walks the fourths).
const FOURTHS_ORDER = ['C','F','Bb','Eb','Ab','Db','Gb','B','E','A','D','G']

const KEYS_PER_DAY   = { 5: 3, 10: 4, 15: 4 }
const MAX_PATTERNS   = { 5: 2, 10: 3, 15: 4 }
const SCALE_BUDGET_SHARE = 0.72

// ── Key ranking ──────────────────────────────────────────────────────────────

function fourthsIndex(k) { return FOURTHS_ORDER.indexOf(k) }

function rankKeysLearn(cov) {
  return [...KEY_IDS].sort((a, b) => {
    const A = cov.keys[a], B = cov.keys[b]
    if (!A.lastTs && !B.lastTs) return fourthsIndex(a) - fourthsIndex(b)
    if (!A.lastTs) return -1
    if (!B.lastTs) return 1
    if (A.lastTs !== B.lastTs) return A.lastTs - B.lastTs
    if (A.count !== B.count) return A.count - B.count
    return fourthsIndex(a) - fourthsIndex(b)
  })
}

function rankKeysReview(cov, now) {
  const learnOrder = rankKeysLearn(cov)
  const withinWeek = k => {
    const d = daysSince(cov.keys[k].lastTs, now)
    return d !== null && d <= 7
  }
  const recent  = learnOrder.filter(withinWeek)   // oldest-within-week first
  const rest    = learnOrder.filter(k => !withinWeek(k))
  return [...recent, ...rest]
}

// ── Per-key choices ──────────────────────────────────────────────────────────

function pickScaleType(keyId, cov) {
  const seen = cov.types[keyId] || {}
  // Least-recently practiced type; never-practiced wins, in canonical order
  // (major first — it's the foundation).
  let best = null, bestTs = Infinity
  for (const t of SCALE_TYPE_IDS) {
    const ts = seen[t]
    if (!ts) return t
    if (ts < bestTs) { bestTs = ts; best = t }
  }
  return best ?? 'major'
}

function rankExtraForms(keyId, scaleType, inst, cov) {
  const seen = cov.forms[keyId] || {}
  return FORMS
    .filter(f => f.id !== 'oneOctave')
    .filter(f => isFormAvailable(inst, keyId, scaleType, f.id))
    .sort((a, b) => (seen[a.id] ?? 0) - (seen[b.id] ?? 0))
    .map(f => f.id)
}

function rankPatterns(cov) {
  return [...PATTERNS].sort((a, b) => {
    const A = cov.patterns[a.id], B = cov.patterns[b.id]
    const aTs = A?.lastTs ?? 0, bTs = B?.lastTs ?? 0
    if (aTs !== bTs) return aTs - bTs
    return (A?.count ?? 0) - (B?.count ?? 0)
  }).map(p => p.id)
}

function pickPatternKey(patternId, todayKeys, inst, cov, idx) {
  const seen = cov.patternKeys[patternId] || {}
  const usable = todayKeys.filter(k => isPatternAvailable(inst, k, patternId))
  if (!usable.length) return null
  const ranked = [...usable].sort((a, b) => (seen[a] ?? 0) - (seen[b] ?? 0))
  // Nudge consecutive patterns onto different keys when they're tied.
  const first = seen[ranked[0]] ?? 0
  const tied = ranked.filter(k => (seen[k] ?? 0) === first)
  return tied[idx % tied.length] ?? ranked[0]
}

// ── Why-string helpers ───────────────────────────────────────────────────────

function keyWhy(keyId, cov, now) {
  const d = daysSince(cov.keys[keyId].lastTs, now)
  if (d === null) return 'new — never practiced'
  if (d < 1)  return 'reinforcing yesterday'
  return `last seen ${Math.round(d)}d ago`
}

// ── The planner ──────────────────────────────────────────────────────────────

/**
 * Build today's session plan.
 *
 * @param {object} opts
 *   instrument      'sax' | 'trumpet' | 'none'
 *   voice           playback voice when instrument === 'none'
 *   minutes         5 | 10 | 15
 *   sessions        history records (any order)
 *   schedule        weekly schedule map (day name → day type)
 *   date            Date (defaults to now)
 *   rotationOffset  ≥0 — "Regenerate" advances to the next keys in rotation
 *   bpmOverride     user-nudged tempo from the plan preview (optional)
 */
export function buildPlan({
  instrument, voice = 'sax', minutes = 10, sessions = [],
  schedule, date = new Date(), rotationOffset = 0, bpmOverride = null,
}) {
  const now  = date.getTime()
  const inst = resolveInstrument(instrument, voice)
  const cov  = coverageStats(sessions, now)
  const dayType = dayTypeFor(date, schedule)
  const mode = instrument === 'none' ? 'quiz' : 'play'

  const isRest   = dayType === 'rest'
  const keyCount = isRest ? 2 : (KEYS_PER_DAY[minutes] ?? 4)
  const bpm      = bpmOverride
    ?? Math.max(60, (DEFAULT_BPM[minutes] ?? 88) - (isRest ? 8 : 0))
  const noteValue = '4n'
  const maxPatterns = isRest ? 1 : (MAX_PATTERNS[minutes] ?? 3)
  const maxFormsPerKey = isRest ? 2 : 4

  const est = spec => estimateItemSeconds(spec, { bpm, noteValue, mode })

  // 1 ── choose today's keys
  const ranked = dayType === 'review' ? rankKeysReview(cov, now) : rankKeysLearn(cov)
  const start  = ((rotationOffset % KEY_IDS.length) + KEY_IDS.length) % KEY_IDS.length * keyCount
  const todayKeys = Array.from({ length: keyCount },
    (_, i) => ranked[(start + i) % ranked.length])

  // 2 ── budget
  const budget = minutes * 60 - TIMING.SESSION_OVERHEAD_SEC
  let spent = 0
  const costOf = spec => est(spec) + TIMING.ITEM_TRANSITION_SEC

  // 3 ── base scale item per key (one octave, least-recent scale type)
  const keyPlans = todayKeys.map(keyId => ({
    keyId,
    scaleType: pickScaleType(keyId, cov),
    forms: ['oneOctave'],
    why: keyWhy(keyId, cov, now),
  }))

  // Trim keys if even the base plan overflows (can happen in quiz mode)
  const baseCost = costOf(formDef('oneOctave'))
  while (keyPlans.length > 2 && keyPlans.length * baseCost > budget) {
    keyPlans.pop()
  }
  spent += keyPlans.length * baseCost

  // 4 ── extra forms, round-robin across keys, within the scale share.
  // Each round visits the keys with the FEWEST forms first so time tops up
  // evenly (no key hoards a 4th form while another still has one).
  const extraQueues = keyPlans.map(kp => rankExtraForms(kp.keyId, kp.scaleType, inst, cov))
  const addForms = capSeconds => {
    for (let round = 0; round < 3; round++) {
      const order = keyPlans.map((_, i) => i)
        .sort((a, b) => keyPlans[a].forms.length - keyPlans[b].forms.length || a - b)
      for (const i of order) {
        const kp = keyPlans[i]
        if (kp.forms.length >= maxFormsPerKey) continue
        const next = extraQueues[i].shift()
        if (!next) continue
        const cost = costOf(formDef(next))
        if (spent + cost > capSeconds) { extraQueues[i].unshift(next); continue }
        kp.forms.push(next)
        spent += cost
      }
    }
  }
  addForms(Math.round(budget * SCALE_BUDGET_SHARE))

  // 5 ── patterns from the remaining budget
  const patternItems = []
  const rankedPatterns = rankPatterns(cov)
  for (let i = 0; i < rankedPatterns.length && patternItems.length < maxPatterns; i++) {
    const pid = rankedPatterns[i]
    const keyId = pickPatternKey(pid, todayKeys, inst, cov, patternItems.length)
    if (!keyId) continue
    const cost = costOf(patternDef(pid))
    if (spent + cost > budget) continue
    spent += cost
    const seenTs = cov.patterns[pid]?.lastTs
    patternItems.push({
      id: `pattern-${pid}-${keyId}`,
      kind: 'pattern', keyId, patternId: pid,
      estSeconds: Math.round(est(patternDef(pid))),
      why: seenTs ? `last practiced ${Math.round(daysSince(seenTs, now))}d ago` : 'new pattern',
    })
  }

  // 6 ── second pass: pour any leftover into more scale forms (still balanced)
  addForms(budget)

  // 7 ── materialize ordered items: all forms of a key together, patterns last
  const items = []
  for (const kp of keyPlans) {
    for (const formId of kp.forms) {
      items.push({
        id: `scale-${kp.keyId}-${kp.scaleType}-${formId}`,
        kind: 'scale',
        keyId: kp.keyId,
        scaleType: kp.scaleType,
        form: formId,
        estSeconds: Math.round(est(formDef(formId))),
        why: kp.why,
      })
    }
  }
  items.push(...patternItems)

  // 8 ── the "why this plan" note
  const dayName = date.toLocaleDateString(undefined, { weekday: 'long' })
  const why = []
  why.push(isRest
    ? `${dayName} is a rest day — keeping it short and light.`
    : `${dayName} is a ${dayType} day.`)
  why.push(`Keys in rotation: ${keyPlans.map(kp =>
    `${prettyName(kp.keyId)} (${kp.why})`).join(', ')}.`)
  const typeNote = keyPlans.map(kp => scaleName(kp.keyId, kp.scaleType)).join(' · ')
  why.push(`Scale types due: ${typeNote}.`)
  if (patternItems.length) {
    why.push(`Patterns most overdue: ${patternItems.map(p =>
      patternDef(p.patternId).label).join(', ')}.`)
  }
  why.push(mode === 'quiz'
    ? `No-instrument mode — playback, notation and tap-quizzes only.`
    : `Planned at ${bpm} BPM (quarter notes) to fit ${minutes} minutes.`)

  return {
    generatedAt: now,
    dayType,
    instrument,
    voice,
    minutes,
    mode,
    bpm,
    noteValue,
    items,
    totalEstSeconds: Math.round(estimatePlanSeconds(items)),
    why,
    rotationOffset,
  }
}

/** Lightweight peek for the home hero: today's day type + next keys due. */
export function peekToday({ sessions = [], schedule, date = new Date() } = {}) {
  const now = date.getTime()
  const cov = coverageStats(sessions, now)
  const dayType = dayTypeFor(date, schedule)
  const ranked = dayType === 'review' ? rankKeysReview(cov, now) : rankKeysLearn(cov)
  const n = dayType === 'rest' ? 2 : 4
  return { dayType, keys: ranked.slice(0, n) }
}
