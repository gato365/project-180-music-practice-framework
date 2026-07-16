// ─────────────────────────────────────────────────────────────────────────────
// noteUtils.js — note parsing, staff geometry, and pattern group generators
//
// TENOR SAX RANGE (written pitch): Bb3 (MIDI 58) → F6 (MIDI 89)
// Three Bb's within range: Bb3, Bb4, Bb5
// Highest note: F6 (altissimo — "third note starting with 6")
// No Ab below Bb3 is reachable on the instrument.
// ─────────────────────────────────────────────────────────────────────────────

export const NOTE_STEPS     = { C:0,D:1,E:2,F:3,G:4,A:5,B:6 }
export const NOTE_SEMITONES = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }

// Staff SVG geometry
export const TREBLE_BOTTOM_ABS = 4*7 + NOTE_STEPS['E']   // E4 = 30
export const BASS_BOTTOM_ABS   = 2*7 + NOTE_STEPS['G']   // G2 = 18
export const MIDDLE_C_ABS      = 4*7 + NOTE_STEPS['C']   // C4 = 28
export const TREBLE_BOT_Y      = 108
export const BASS_BOT_Y        = 216
export const HALF_STEP_Y       = 6

// Tenor sax written MIDI range
export const TENOR_MIDI_MIN = 58   // Bb3
export const TENOR_MIDI_MAX = 89   // F6

// ── PARSING ───────────────────────────────────────────────────────────────────

export function parseNote(noteStr) {
  const m = String(noteStr).match(/^([A-G])(#{1,2}|b{1,2})?(-?\d+)?$/)
  if (!m) throw new Error(`Cannot parse note: "${noteStr}"`)
  return { letter: m[1], acc: m[2] || '', octave: parseInt(m[3] ?? '4') }
}

export function absStep(noteStr) {
  const { letter, octave } = parseNote(noteStr)
  return octave * 7 + NOTE_STEPS[letter]
}

export function noteToMidi(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  const accVal = acc.split('').reduce((s,c) => s + (c==='#' ? 1 : -1), 0)
  return (octave + 1) * 12 + NOTE_SEMITONES[letter] + accVal
}

// Written tenor → Tone.js concert pitch (down 2 semitones)
export function toConcertPitch(noteStr) {
  const midi = noteToMidi(noteStr) - 2
  const oct  = Math.floor(midi / 12) - 1
  const sem  = ((midi % 12) + 12) % 12
  const SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return SHARP[sem] + oct
}

export function isInTenorRange(noteStr) {
  try {
    const m = noteToMidi(noteStr)
    return m >= TENOR_MIDI_MIN && m <= TENOR_MIDI_MAX
  } catch { return false }
}

// ── OCTAVE HELPERS ─────────────────────────────────────────────────────────────

export function raiseOctave(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  return `${letter}${acc}${octave + 1}`
}

export function lowerOctave(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  return `${letter}${acc}${octave - 1}`
}

// ── DISPLAY HELPERS ───────────────────────────────────────────────────────────

/** "Eb4" → "E♭" (letter + pretty accidental, no octave) */
export function noteDisplayName(noteStr) {
  const { letter, acc } = parseNote(noteStr)
  const sym = acc === '#' ? '♯' : acc === 'b' ? '♭' : acc === '##' ? '𝄪' : acc === 'bb' ? '𝄫' : ''
  return letter + sym
}

/** "Eb4" → "E♭4" (pretty accidental, with octave) */
export function noteDisplayFull(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  const sym = acc === '#' ? '♯' : acc === 'b' ? '♭' : acc === '##' ? '𝄪' : acc === 'bb' ? '𝄫' : ''
  return letter + sym + octave
}

// ── STAFF POSITION ─────────────────────────────────────────────────────────────

export function noteToStaffY(noteStr) {
  const abs = absStep(noteStr)
  const isT = abs >= MIDDLE_C_ABS
  if (isT) return {
    y: TREBLE_BOT_Y - (abs - TREBLE_BOTTOM_ABS) * HALF_STEP_Y,
    clef: 'treble', stepRel: abs - TREBLE_BOTTOM_ABS,
  }
  return {
    y: BASS_BOT_Y - (abs - BASS_BOTTOM_ABS) * HALF_STEP_Y,
    clef: 'bass', stepRel: abs - BASS_BOTTOM_ABS,
  }
}

export function ledgerLineSteps(stepRel) {
  const lines = []
  if (stepRel < 0)  { for (let s=0; s>=stepRel; s-=2) lines.push(s) }
  if (stepRel > 8)  { for (let s=10; s<=stepRel; s+=2) lines.push(s) }
  return lines
}

export function stepRelToY(stepRel, clef) {
  return (clef === 'treble' ? TREBLE_BOT_Y : BASS_BOT_Y) - stepRel * HALF_STEP_Y
}

// ── PATTERN GROUP GENERATORS ───────────────────────────────────────────────────
//
// Each generator returns an array of group objects:
//   { notes: string[], degrees: string[], label: string, direction: 'up'|'down' }
//
// STRAIGHT SCALE — 4 groups of 4
//   i)   1 2 3 4   — ascending first half
//   ii)  5 6 7 1   — ascending second half (ends on octave = double root peak)
//   iii) 1 7 6 5   — descending from octave (double root = same note as ii end)
//   iv)  4 3 2 1   — descending back to root

export function getStraightGroups(notes8) {
  const n = notes8
  return [
    { notes:[n[0],n[1],n[2],n[3]], degrees:['1','2','3','4'], label:'i',   direction:'up'   },
    { notes:[n[4],n[5],n[6],n[7]], degrees:['5','6','7','1'], label:'ii',  direction:'up'   },
    { notes:[n[7],n[6],n[5],n[4]], degrees:['1','7','6','5'], label:'iii', direction:'down' },
    { notes:[n[3],n[2],n[1],n[0]], degrees:['4','3','2','1'], label:'iv',  direction:'down' },
  ]
}

// THIRDS — 8 groups (last of each direction has 3 notes)
//   Ascending:  1 3 / 2 4 / 3 5 / 4 6 / 5 7 / 6 1 / 7 2 / 1
//   Descending: 1 6 / 7 5 / 6 4 / 5 3 / 4 2 / 3 1 / 2 7 / 1

export function getThirdsGroups(notes8) {
  const n = notes8
  return [
    // Ascending groups
    { notes:[n[0],n[2],n[1],n[3]],                 degrees:['1','3','2','4'], label:'A1', direction:'up'   },
    { notes:[n[2],n[4],n[3],n[5]],                 degrees:['3','5','4','6'], label:'A2', direction:'up'   },
    { notes:[n[4],n[6],n[5],n[7]],                 degrees:['5','7','6','1'], label:'A3', direction:'up'   },
    { notes:[n[6],raiseOctave(n[1]),n[7]],          degrees:['7','2','1'],     label:'A4', direction:'up'   },
    // Descending groups
    { notes:[n[7],n[5],n[6],n[4]],                 degrees:['1','6','7','5'], label:'D1', direction:'down' },
    { notes:[n[5],n[3],n[4],n[2]],                 degrees:['6','4','5','3'], label:'D2', direction:'down' },
    { notes:[n[3],n[1],n[2],n[0]],                 degrees:['4','2','3','1'], label:'D3', direction:'down' },
    { notes:[n[1],lowerOctave(n[6]),n[0]],          degrees:['2','7','1'],     label:'D4', direction:'down' },
  ]
}

// PENTATONIC GROUPS — 10 groups of 4 (degrees 1 2 3 5 6 — skip the 4th and 7th)
//   Ascending groups skip n[3] (4th) and n[6] (7th)
//   Descending groups mirror the ascent, also skipping the 4th and 7th

export function getPentatonicGroups(notes8) {
  const n = notes8
  return [
    // Ascending: 1 2 3 5 | 2 3 5 6 | 3 5 6 1 | 5 6 1 2(oct) | 6 1 2(oct) 1(oct)
    { notes:[n[0],n[1],n[2],n[4]],                                          degrees:['1','2','3','5'], label:'A1', direction:'up'   },
    { notes:[n[1],n[2],n[4],n[5]],                                          degrees:['2','3','5','6'], label:'A2', direction:'up'   },
    { notes:[n[2],n[4],n[5],n[7]],                                          degrees:['3','5','6','1'], label:'A3', direction:'up'   },
    { notes:[n[4],n[5],n[7],raiseOctave(n[1])],                             degrees:['5','6','1','2'], label:'A4', direction:'up'   },
    { notes:[n[5],n[7],raiseOctave(n[1]),n[7]],                             degrees:['6','1','2','1'], label:'A5', direction:'up'   },
    // Descending: 6 5 3 2 | 5 3 2 1 | 3 2 1 ↓6 | 2 1 ↓6 ↓5 | 1 ↓6 ↓5 1
    { notes:[n[5],n[4],n[2],n[1]],                                          degrees:['6','5','3','2'], label:'D1', direction:'down' },
    { notes:[n[4],n[2],n[1],n[0]],                                          degrees:['5','3','2','1'], label:'D2', direction:'down' },
    { notes:[n[2],n[1],n[0],lowerOctave(n[5])],                             degrees:['3','2','1','6'], label:'D3', direction:'down' },
    { notes:[n[1],n[0],lowerOctave(n[5]),lowerOctave(n[4])],                degrees:['2','1','6','5'], label:'D4', direction:'down' },
    { notes:[n[0],lowerOctave(n[5]),lowerOctave(n[4]),n[0]],                degrees:['1','6','5','1'], label:'D5', direction:'down' },
  ]
}

export function getPatternGroups(patternId, notes8) {
  switch (patternId) {
    case 'straight':   return getStraightGroups(notes8)
    case 'thirds':     return getThirdsGroups(notes8)
    case 'pentatonic': return getPentatonicGroups(notes8)
    default:           return getStraightGroups(notes8)
  }
}

// Format ms → "m:ss" or "s.s s"
export function fmtMs(ms) {
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}
