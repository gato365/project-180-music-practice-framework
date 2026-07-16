// ─────────────────────────────────────────────────────────────────────────────
// sessionStore.js — session history records (localStorage via storage.js).
//
// Record shape (extends project-127's { timestamp, key, testType, accuracy }):
// {
//   id, timestamp (ISO), instrument, voice, dayType,
//   minutesTarget, minutesActual,
//   keys[], scaleTypes[], forms[], patterns[],          // summaries
//   items: [{ kind, keyId, scaleType?, form?, patternId?, seconds, skipped?,
//             quizAccuracy? }],
//   critique:   { accuracy, timing, tone, technique,    // 1–5 self/confirmed
//                 auto: { accuracyPct, notesPerMin, timingPct } | null },
//   reflection: { improved, needsWork, tomorrow,        // free text
//                 scores: { improved, needsWork, tomorrow } },  // 1–5
//   recordingId: string | null                          // IndexedDB key
// }
// ─────────────────────────────────────────────────────────────────────────────

import { storage } from './storage.js'

const KEY = 'sessions'
const MAX_SESSIONS = 300

export function loadSessions() {
  const list = storage.get(KEY, [])
  return Array.isArray(list) ? list : []
}

/** Prepend a finished session; newest first. Returns the saved list. */
export function saveSession(record) {
  const list = [record, ...loadSessions()].slice(0, MAX_SESSIONS)
  storage.set(KEY, list)
  return list
}

export function newSessionId(now = Date.now()) {
  return `s_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/** Build the summary arrays a record carries, from its item results. */
export function summarizeItems(items) {
  const uniq = arr => [...new Set(arr.filter(Boolean))]
  const done = items.filter(it => !it.skipped)
  return {
    keys:       uniq(done.map(it => it.keyId)),
    scaleTypes: uniq(done.filter(it => it.kind === 'scale').map(it => it.scaleType)),
    forms:      uniq(done.filter(it => it.kind === 'scale').map(it => it.form)),
    patterns:   uniq(done.filter(it => it.kind === 'pattern').map(it => it.patternId)),
  }
}
