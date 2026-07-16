// ─────────────────────────────────────────────────────────────────────────────
// timeEstimator.js — how long will a plan actually take?
//
// Play-along mode: seconds ≈ notes × beat length × PLAY_REPEAT (listen once,
// play along ≈ 1.6 passes per group on average) + breathing gaps + lead-in.
// Quiz mode (no instrument): a fixed thinking time per tapped note.
//
// These constants are the planner's main tunables — see README
// "Decisions to sanity-check".
// ─────────────────────────────────────────────────────────────────────────────

export const TIMING = {
  LEAD_IN_SEC: 2,            // settle before the first note of an item
  GROUP_GAP_SEC: 0.6,        // breath between note groups
  ITEM_TRANSITION_SEC: 6,    // read the next card, reset embouchure
  SESSION_OVERHEAD_SEC: 15,  // start/end friction inside the run screen
  PLAY_REPEAT: 1.6,          // effective passes per group (listen + play)
  QUIZ_SEC_PER_NOTE: 1.6,    // tap-quiz thinking time per note
}

export const DUR_BEATS = { '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25 }

/** BPM the planner sets per session length (user can nudge in plan preview). */
export const DEFAULT_BPM = { 5: 96, 10: 88, 15: 80 }

/**
 * @param {object} spec { noteCount, groupCount }
 * @param {object} opts { bpm, noteValue, mode: 'play'|'quiz' }
 */
export function estimateItemSeconds(spec, { bpm = 88, noteValue = '4n', mode = 'play' } = {}) {
  const { noteCount, groupCount } = spec
  if (mode === 'quiz') {
    return TIMING.LEAD_IN_SEC
      + noteCount * TIMING.QUIZ_SEC_PER_NOTE
      + groupCount * TIMING.GROUP_GAP_SEC
  }
  const secPerNote = (60 / bpm) * (DUR_BEATS[noteValue] ?? 1)
  return TIMING.LEAD_IN_SEC
    + noteCount * secPerNote * TIMING.PLAY_REPEAT
    + groupCount * TIMING.GROUP_GAP_SEC
}

/** Total run time for a list of items that already carry estSeconds. */
export function estimatePlanSeconds(items) {
  const body = items.reduce((s, it) => s + it.estSeconds, 0)
  return body
    + Math.max(0, items.length - 1) * TIMING.ITEM_TRANSITION_SEC
    + TIMING.SESSION_OVERHEAD_SEC
}
