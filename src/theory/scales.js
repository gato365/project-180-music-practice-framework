// ─────────────────────────────────────────────────────────────────────────────
// scales.js — all 12 keys × { major, natural minor, harmonic minor }.
//
// Spelling uses the letter-sequence algorithm from trumpet-scales.html:
// the 7 letters ascend in order from the tonic letter, and each note's
// accidental is whatever the interval demands (double sharps/flats included,
// e.g. F𝄪 in G♯ harmonic minor).
//
// Octave placement is per instrument and per form: the tonic is placed at the
// lowest octave where the whole form (which may dip below the tonic or span
// two octaves) fits the instrument's written range. If no octave fits, the
// form is unavailable for that key/instrument and the planner picks another.
// ─────────────────────────────────────────────────────────────────────────────

import { LETTERS, NOTE_SEMITONES, pitchClass } from './notes.js'

// Canonical 12 keys, identified by their major-key spelling.
export const KEY_IDS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

export const KEY_PC = {
  C:0, Db:1, 'C#':1, D:2, Eb:3, E:4, F:5, Gb:6, 'F#':6,
  G:7, Ab:8, 'G#':8, A:9, Bb:10, B:11,
}

// A distinct color per key (used for accents in plan/run/progress UI).
export const KEY_COLORS = {
  C:'#f87171', Db:'#fb923c', D:'#fbbf24', Eb:'#c084fc', E:'#f472b6', F:'#a3e635',
  Gb:'#60a5fa', G:'#34d399', Ab:'#38bdf8', A:'#2dd4bf', Bb:'#e879f9', B:'#facc15',
}

// Minor keys respell some tonics so signatures stay sane
// (C# minor instead of Db minor, G# minor instead of Ab minor, …).
const MINOR_TONIC = { Db:'C#', Gb:'F#', Ab:'G#' }

export const SCALE_TYPES = [
  { id: 'major',         label: 'Major',          short: 'maj',
    intervals: [0,2,4,5,7,9,11,12] },
  { id: 'minor',         label: 'Natural Minor',  short: 'min',
    intervals: [0,2,3,5,7,8,10,12] },
  { id: 'harmonicMinor', label: 'Harmonic Minor', short: 'harm',
    intervals: [0,2,3,5,7,8,11,12] },
]

export const SCALE_TYPE_IDS = SCALE_TYPES.map(t => t.id)

export function scaleType(typeId) {
  return SCALE_TYPES.find(t => t.id === typeId) ?? SCALE_TYPES[0]
}

/** Tonic spelling for a key+type, e.g. ('Db','minor') → 'C#'. */
export function tonicNameFor(keyId, typeId) {
  if (typeId === 'major') return keyId
  return MINOR_TONIC[keyId] ?? keyId
}

/** Human name, e.g. 'E♭ Major', 'C♯ Harmonic Minor' (pretty accidentals). */
export function scaleName(keyId, typeId) {
  const t = scaleType(typeId)
  const tonic = tonicNameFor(keyId, typeId)
  return `${tonic.replace('#','♯').replace('b','♭')} ${t.label}`
}

// Key signatures (major). Minor keys share the relative major's signature.
const MAJOR_SIG = {
  C:'no sharps or flats', G:'1 sharp', D:'2 sharps', A:'3 sharps', E:'4 sharps',
  B:'5 sharps', Gb:'6 flats', Db:'5 flats', Ab:'4 flats', Eb:'3 flats',
  Bb:'2 flats', F:'1 flat',
}

export function keySignatureLabel(keyId, typeId) {
  if (typeId === 'major') return MAJOR_SIG[keyId] ?? ''
  // Relative major of a minor key is 3 semitones up.
  const relPc = (KEY_PC[keyId] + 3) % 12
  const relId = KEY_IDS.find(k => KEY_PC[k] === relPc)
  const base = MAJOR_SIG[relId] ?? ''
  return typeId === 'harmonicMinor' ? `${base}, raised 7th` : base
}

/**
 * Spell an 8-note scale (tonic → tonic) starting at an exact MIDI note.
 * Returns note strings with octaves, e.g. ['Eb4','F4',…,'Eb5'].
 */
export function spellScale8(keyId, typeId, tonicMidi) {
  const type = scaleType(typeId)
  const li = LETTERS.indexOf(tonicNameFor(keyId, typeId)[0])
  const notes = []
  for (let i = 0; i < 8; i++) {
    const letter = LETTERS[(li + i) % 7]
    const midi = tonicMidi + type.intervals[i]
    let diff = pitchClass(midi) - NOTE_SEMITONES[letter]
    if (diff > 6)  diff -= 12
    if (diff < -6) diff += 12
    const acc = diff === 0 ? '' : diff === 1 ? '#' : diff === -1 ? 'b'
              : diff === 2 ? '##' : 'bb'
    // Octave chosen so letter+acc+octave lands exactly on midi (Cb/B# safe).
    const oct = Math.floor((midi - NOTE_SEMITONES[letter] - diff) / 12) - 1
    notes.push(`${letter}${acc}${oct}`)
  }
  return notes
}

/**
 * Lowest in-range tonic MIDI for a key on an instrument, honoring the form's
 * reach below/above the tonic. Returns null if the form doesn't fit anywhere.
 *
 * @param {object} inst      instrument def ({ writtenMin, writtenMax })
 * @param {string} keyId     one of KEY_IDS
 * @param {[number,number]} reach  [semitonesBelowTonic(≤0), semitonesAboveTonic]
 */
export function tonicMidiFor(inst, keyId, reach = [0, 12]) {
  const pc = KEY_PC[keyId]
  const [below, above] = reach
  for (let m = inst.writtenMin; m <= inst.writtenMax; m++) {
    if (pitchClass(m) !== pc) continue
    if (m + below >= inst.writtenMin && m + above <= inst.writtenMax) return m
  }
  return null
}
