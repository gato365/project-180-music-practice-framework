// ─────────────────────────────────────────────────────────────────────────────
// notes.js — note parsing, MIDI conversion, display, and staff geometry.
// Pure JS (no React) so the planner engine can run in node for testing.
//
// Note strings are always WRITTEN pitch for the active instrument,
// e.g. "Eb4", "F#5", "Cbb3". Octave numbers follow the letter name
// (Cb5 is a half step below C5, i.e. it sounds like B4).
// ─────────────────────────────────────────────────────────────────────────────

export const NOTE_STEPS     = { C:0,D:1,E:2,F:3,G:4,A:5,B:6 }
export const NOTE_SEMITONES = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }
export const LETTERS        = ['C','D','E','F','G','A','B']

const SHARP_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT_NAMES  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// ── Parsing ──────────────────────────────────────────────────────────────────

export function parseNote(noteStr) {
  const m = String(noteStr).match(/^([A-G])(#{1,2}|b{1,2})?(-?\d+)?$/)
  if (!m) throw new Error(`Cannot parse note: "${noteStr}"`)
  return { letter: m[1], acc: m[2] || '', octave: parseInt(m[3] ?? '4') }
}

export function accidentalValue(acc) {
  return acc.split('').reduce((s, c) => s + (c === '#' ? 1 : -1), 0)
}

/** Diatonic step index (C0 = 0, D0 = 1, … C4 = 28). Used for staff position. */
export function absStep(noteStr) {
  const { letter, octave } = parseNote(noteStr)
  return octave * 7 + NOTE_STEPS[letter]
}

export function noteToMidi(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  return (octave + 1) * 12 + NOTE_SEMITONES[letter] + accidentalValue(acc)
}

/** MIDI → simple note string using sharp or flat spelling. */
export function midiToNote(midi, spell = 'sharp') {
  const names = spell === 'flat' ? FLAT_NAMES : SHARP_NAMES
  const oct = Math.floor(midi / 12) - 1
  const sem = ((midi % 12) + 12) % 12
  return names[sem] + oct
}

export function pitchClass(midi) {
  return ((midi % 12) + 12) % 12
}

// ── Octave helpers ───────────────────────────────────────────────────────────

export function raiseOctave(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  return `${letter}${acc}${octave + 1}`
}

export function lowerOctave(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  return `${letter}${acc}${octave - 1}`
}

// ── Display helpers ──────────────────────────────────────────────────────────

const ACC_SYMBOLS = { '#':'♯', 'b':'♭', '##':'𝄪', 'bb':'𝄫', '':'' }

/** "Eb4" → "E♭" */
export function noteDisplayName(noteStr) {
  const { letter, acc } = parseNote(noteStr)
  return letter + (ACC_SYMBOLS[acc] ?? '')
}

/** "Eb4" → "E♭4" */
export function noteDisplayFull(noteStr) {
  const { letter, acc, octave } = parseNote(noteStr)
  return letter + (ACC_SYMBOLS[acc] ?? '') + octave
}

/** "Db" → "D♭" (key / tonic names without octave) */
export function prettyName(name) {
  return String(name).replace('##','𝄪').replace('bb','𝄫').replace('#','♯').replace('b','♭')
}

// ── Staff geometry (grand staff SVG) ─────────────────────────────────────────

export const TREBLE_BOTTOM_ABS = 4*7 + NOTE_STEPS['E']   // E4 = 30
export const BASS_BOTTOM_ABS   = 2*7 + NOTE_STEPS['G']   // G2 = 18
export const MIDDLE_C_ABS      = 4*7 + NOTE_STEPS['C']   // C4 = 28
export const TREBLE_BOT_Y      = 108
export const BASS_BOT_Y        = 216
export const HALF_STEP_Y       = 6

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

// ── Time formatting ──────────────────────────────────────────────────────────

export function fmtMs(ms) {
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's'
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function fmtSec(sec) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}
