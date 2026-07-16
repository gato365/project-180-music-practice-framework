// ─────────────────────────────────────────────────────────────────────────────
// scales.js — WRITTEN TENOR SAX PITCH (Bb transposing instrument)
//
// Tenor sax range (written): Bb3 (lowest) → F6 (highest, altissimo)
// No A below Bb3. Ab major and Gb major start on octave 4 to stay in range.
// Audio engine automatically transposes DOWN a major 2nd to concert pitch.
// ─────────────────────────────────────────────────────────────────────────────

export const SCALES = {
  Eb: {
    key: 'Eb',
    name: 'E♭ Major',
    concertName: 'D♭ Major (concert)',
    color: '#c084fc',
    keySignature: '3 flats — B♭  E♭  A♭',
    // Written tenor pitch: Eb4 → Eb5 (within Bb3–F6 range)
    notes: ['Eb4','F4','G4','Ab4','Bb4','C5','D5','Eb5'],
    days: ['Monday','Thursday'],
  },
  E: {
    key: 'E',
    name: 'E Major',
    concertName: 'D Major (concert)',
    color: '#f472b6',
    keySignature: '4 sharps — F♯  C♯  G♯  D♯',
    // Written tenor pitch: E4 → E5
    notes: ['E4','F#4','G#4','A4','B4','C#5','D#5','E5'],
    days: ['Monday','Thursday'],
  },
  Ab: {
    key: 'Ab',
    name: 'A♭ Major',
    concertName: 'G♭ Major (concert)',
    color: '#38bdf8',
    keySignature: '4 flats — B♭  E♭  A♭  D♭',
    // Start on Ab4 (Ab3 is below Bb3, out of tenor range)
    notes: ['Ab4','Bb4','C5','Db5','Eb5','F5','G5','Ab5'],
    days: ['Tuesday','Friday'],
  },
  B: {
    key: 'B',
    name: 'B Major',
    concertName: 'A Major (concert)',
    color: '#fb923c',
    keySignature: '5 sharps — F♯  C♯  G♯  D♯  A♯',
    // B3 is just above Bb3 (lowest tenor note) — valid
    notes: ['B3','C#4','D#4','E4','F#4','G#4','A#4','B4'],
    days: ['Tuesday','Friday'],
  },
  Db: {
    key: 'Db',
    name: 'D♭ Major',
    concertName: 'C♭ Major (concert)',
    color: '#34d399',
    keySignature: '5 flats — B♭  E♭  A♭  D♭  G♭',
    notes: ['Db4','Eb4','F4','Gb4','Ab4','Bb4','C5','Db5'],
    days: ['Wednesday','Saturday'],
  },
  Gb: {
    key: 'Gb',
    name: 'G♭ Major',
    concertName: 'F♭/E Major (concert)',
    color: '#60a5fa',
    keySignature: '6 flats — B♭  E♭  A♭  D♭  G♭  C♭',
    // Start on Gb4 (Gb3 is below Bb3, out of tenor range)
    notes: ['Gb4','Ab4','Bb4','Cb5','Db5','Eb5','F5','Gb5'],
    days: ['Wednesday','Saturday'],
  },
}

export const SCALE_ORDER = ['Eb','E','Ab','B','Db','Gb']

export const WEEKLY_SCHEDULE = [
  { day: 'Monday',    keys: ['Eb','E'],  type: 'learn'  },
  { day: 'Tuesday',   keys: ['Ab','B'],  type: 'learn'  },
  { day: 'Wednesday', keys: ['Db','Gb'], type: 'learn'  },
  { day: 'Thursday',  keys: ['Eb','E'],  type: 'review' },
  { day: 'Friday',    keys: ['Ab','B'],  type: 'review' },
  { day: 'Saturday',  keys: ['Db','Gb'], type: 'review' },
  { day: 'Sunday',    keys: [],          type: 'rest'   },
]

// Practice patterns — shown in this order each session
export const PATTERNS = [
  { id: 'straight',   label: 'Straight Scale',    desc: '4 groups of 4 — up then down'    },
  { id: 'thirds',     label: '3rds',              desc: '8 groups of 4 — skip a degree'   },
  { id: 'pentatonic', label: 'Pentatonic Groups', desc: '10 groups of 4 — degrees 1 2 3 5 6' },
]

export const NOTE_VALUES = [
  { id: '1n',  label: 'Whole'   },
  { id: '2n',  label: 'Half'    },
  { id: '4n',  label: 'Quarter' },
  { id: '8n',  label: 'Eighth'  },
  { id: '16n', label: '16th'    },
]
