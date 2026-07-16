// ─────────────────────────────────────────────────────────────────────────────
// chordUtils.js — chord transposition, parsing, and voicing utilities
// ─────────────────────────────────────────────────────────────────────────────

// Semitone values for all note names
const NOTE_MAP = {
  'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,
  'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,
}

// Preferred spellings for transposition output
const PREFER_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
const PREFER_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

// Transposition offsets: how many semitones to ADD to concert pitch for display
export const TRANSPOSE_OPTIONS = [
  { id: 'concert', label: 'Concert (C)',     semitones: 0,  spell: 'flat'  },
  { id: 'bb',      label: 'Bb Tenor Sax',   semitones: 2,  spell: 'sharp' },
  { id: 'eb',      label: 'Eb Alto Sax',    semitones: 9,  spell: 'sharp' },
  { id: 'custom',  label: 'Custom',          semitones: 0,  spell: 'flat'  },
]

// ── Chord symbol parsing ───────────────────────────────────────────────────

/**
 * Parse a chord symbol into { root, quality }.
 * e.g. "Bbm7b5" → { root: "Bb", quality: "m7b5" }
 *      "C#Maj7" → { root: "C#", quality: "Maj7" }
 */
export function parseChord(symbol) {
  if (!symbol || symbol === '%') return { root: '', quality: symbol || '' }
  // Match root: letter + optional # or b (but not "bb" key signatures)
  const m = symbol.match(/^([A-G][#b]?)(.*)$/)
  if (!m) return { root: '', quality: symbol }
  return { root: m[1], quality: m[2] }
}

/**
 * Transpose a chord symbol by a given number of semitones.
 * @param {string} symbol   — chord symbol e.g. "Cm7b5"
 * @param {number} semitones — how many semitones to transpose (can be negative)
 * @param {'flat'|'sharp'} spell — preferred accidental spelling
 */
export function transposeChord(symbol, semitones, spell = 'flat') {
  if (!symbol || semitones === 0) return symbol
  const { root, quality } = parseChord(symbol)
  if (!root || !(root in NOTE_MAP)) return symbol

  const newSemitone = ((NOTE_MAP[root] + semitones) % 12 + 12) % 12
  const notes = spell === 'flat' ? PREFER_FLAT : PREFER_SHARP
  const newRoot = notes[newSemitone]
  return newRoot + quality
}

/**
 * Transpose an entire standard's sections.
 * Returns a deep copy with all chord symbols transposed.
 */
export function transposeStandard(standard, semitones, spell = 'flat') {
  if (semitones === 0) return standard
  return {
    ...standard,
    sections: standard.sections.map(sec => ({
      ...sec,
      measures: sec.measures.map(measure =>
        measure.map(slot => ({
          ...slot,
          chord: transposeChord(slot.chord, semitones, spell),
        }))
      ),
    })),
  }
}

// ── Chord voicings for Tone.js ─────────────────────────────────────────────
//
// Maps chord quality string → array of semitone intervals above root
// We voice in closed/drop-2 position within one octave

const QUALITY_VOICINGS = {
  // 7th chords
  'Maj7':    [0, 4, 7, 11],
  'maj7':    [0, 4, 7, 11],
  'M7':      [0, 4, 7, 11],
  'm7':      [0, 3, 7, 10],
  '7':       [0, 4, 7, 10],
  'm7b5':    [0, 3, 6, 10],
  'ø7':      [0, 3, 6, 10],
  'dim7':    [0, 3, 6, 9],
  '°7':      [0, 3, 6, 9],
  'mMaj7':   [0, 3, 7, 11],
  'Maj6':    [0, 4, 7, 9],
  'm6':      [0, 3, 7, 9],
  // Triads
  '':        [0, 4, 7],
  'm':       [0, 3, 7],
  'dim':     [0, 3, 6],
  'aug':     [0, 4, 8],
  'sus4':    [0, 5, 7],
  'sus2':    [0, 2, 7],
  // Dominant variants
  '7sus4':   [0, 5, 7, 10],
  '7b9':     [0, 4, 7, 10, 13],
  '7#9':     [0, 4, 7, 10, 15],
  '7b5':     [0, 4, 6, 10],
  '7#11':    [0, 4, 7, 10, 18],
  '9':       [0, 4, 7, 10, 14],
  'm9':      [0, 3, 7, 10, 14],
  'Maj9':    [0, 4, 7, 11, 14],
  '13':      [0, 4, 7, 10, 14, 21],
  // Sixth chords
  '6':       [0, 4, 7, 9],
  '6/9':     [0, 4, 7, 9, 14],
}

/**
 * Get MIDI note numbers for a chord symbol played at a given root MIDI note.
 * @param {string} symbol    — e.g. "Cm7b5"
 * @param {number} rootMidi  — MIDI note number of root (e.g. 48 for C3)
 * @returns {number[]}       — array of MIDI notes
 */
export function chordToMidi(symbol, rootMidi = 48) {
  const { quality } = parseChord(symbol)

  // Find the best matching quality
  let intervals = QUALITY_VOICINGS[quality]

  if (!intervals) {
    // Try prefix matching for complex qualities
    const known = Object.keys(QUALITY_VOICINGS).sort((a,b) => b.length - a.length)
    for (const key of known) {
      if (quality.startsWith(key)) {
        intervals = QUALITY_VOICINGS[key]
        break
      }
    }
  }

  if (!intervals) intervals = [0, 4, 7] // fallback: major triad

  // Spread voicing over 1–2 octaves, keeping it in a comfortable piano register
  return intervals.map((iv, i) => {
    let note = rootMidi + iv
    // Keep within piano range, add octave displacement for spread
    if (i > 0 && note < rootMidi) note += 12
    return note
  })
}

/**
 * Convert chord root + quality to Tone.js note strings.
 * @param {string} symbol   — chord symbol
 * @param {number} octave   — base octave for root (default 3)
 * @returns {string[]}      — Tone.js note strings, e.g. ['C3','E3','G3','B3']
 */
export function chordToToneNotes(symbol, octave = 3) {
  if (!symbol) return []
  const { root } = parseChord(symbol)
  if (!root || !(root in NOTE_MAP)) return []

  const rootSemitone = NOTE_MAP[root]
  // MIDI for root: (octave+1)*12 + semitone
  const rootMidi     = (octave + 1) * 12 + rootSemitone
  const midiNotes    = chordToMidi(symbol, rootMidi)

  const SHARP_NAMES  = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
  return midiNotes.map(midi => {
    const o = Math.floor(midi / 12) - 1
    const s = ((midi % 12) + 12) % 12
    return SHARP_NAMES[s] + o
  })
}

// ── Display helpers ────────────────────────────────────────────────────────

/** Prettify chord quality for display: 'b' → '♭', '#' → '♯', 'Maj' → 'Δ' */
export function prettyChord(symbol) {
  if (!symbol) return ''
  return symbol
    .replace(/Maj7/g, 'Δ7')
    .replace(/Maj9/g, 'Δ9')
    .replace(/Maj/g,  'Δ')
    .replace(/m7b5/g, 'ø7')
    .replace(/b5/g,   '♭5')
    .replace(/b9/g,   '♭9')
    .replace(/b7/g,   '♭7')
    .replace(/#9/g,   '♯9')
    .replace(/#11/g,  '♯11')
    .replace(/b/g,    '♭')
    .replace(/#/g,    '♯')
}

/** Roman numeral analysis: given chord, tonic, and mode */
export function chordFunction(chord, keyRoot, keyMode = 'major') {
  const { root } = parseChord(chord)
  if (!root || !(root in NOTE_MAP)) return ''
  const rootOffset = NOTE_MAP[root]
  const keyOffset  = NOTE_MAP[keyRoot] ?? 0
  const interval   = ((rootOffset - keyOffset) + 12) % 12
  const majorMap   = { 0:'I',2:'II',4:'III',5:'IV',7:'V',9:'VI',11:'VII' }
  const minorMap   = { 0:'i',2:'ii',3:'III',5:'iv',7:'v',8:'VI',10:'VII' }
  const map        = keyMode === 'minor' ? minorMap : majorMap
  return map[interval] ?? ''
}
