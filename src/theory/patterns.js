// ─────────────────────────────────────────────────────────────────────────────
// patterns.js — technical exercises / progressions, practiced in any key.
//
// Numbers are scale degrees of the key's MAJOR scale (jazz convention):
//   • ii–V–I, 1–4–5, 4–2–5–1 are chord progressions → rendered as arpeggios
//   • arpeggio (1 3 5 8) and 1–2–3–5–6 are melodic digital patterns
//
// Generators take the 8 spelled major-scale notes and return groups in the
// same shape the forms use, so the Run screen treats scales and patterns
// identically.
// ─────────────────────────────────────────────────────────────────────────────

import { raiseOctave } from './notes.js'

export const PATTERNS = [
  { id: 'ii-V-I',    label: 'ii–V–I',    reach: [0, 17], noteCount: 13, groupCount: 3,
    desc: 'arpeggiate iim7 → V7 → IMaj7' },
  { id: '1-4-5',     label: '1–4–5',     reach: [0, 19], noteCount: 16, groupCount: 4,
    desc: 'I, IV and V triad arpeggios' },
  { id: 'arpeggio',  label: 'Arpeggios', reach: [0, 12], noteCount: 8,  groupCount: 2,
    desc: '1 3 5 8, up and down' },
  { id: '1-2-3-5-6', label: '1–2–3–5–6', reach: [0, 9],  noteCount: 10, groupCount: 2,
    desc: 'pentatonic digital pattern' },
  { id: '4-2-5-1',   label: '4–2–5–1',   reach: [0, 17], noteCount: 13, groupCount: 4,
    desc: 'IV → ii → V → I arpeggios' },
]

export const PATTERN_IDS = PATTERNS.map(p => p.id)

export function patternDef(patternId) {
  return PATTERNS.find(p => p.id === patternId) ?? PATTERNS[0]
}

// deg(d): 1-based major-scale degree → note; d + 7 = an octave up.
function makeDeg(n) {
  return d => (d > 7 ? raiseOctave(n[d - 8]) : n[d - 1])
}

export function patternGroups(patternId, n) {
  const deg = makeDeg(n)
  switch (patternId) {

    case 'ii-V-I': return [
      { notes:[deg(2),deg(4),deg(6),deg(8)],         degrees:['2','4','6','1'],     label:'ii m7',  direction:'up' },
      { notes:[deg(5),deg(7),deg(9),deg(11)],        degrees:['5','7','2','4'],     label:'V 7',    direction:'up' },
      { notes:[deg(1),deg(3),deg(5),deg(7),deg(8)],  degrees:['1','3','5','7','1'], label:'I Maj7', direction:'up' },
    ]

    case '1-4-5': return [
      { notes:[deg(1),deg(3),deg(5),deg(8)],   degrees:['1','3','5','1'], label:'I',    direction:'up'   },
      { notes:[deg(4),deg(6),deg(8),deg(11)],  degrees:['4','6','1','4'], label:'IV',   direction:'up'   },
      { notes:[deg(5),deg(7),deg(9),deg(12)],  degrees:['5','7','2','5'], label:'V',    direction:'up'   },
      { notes:[deg(8),deg(5),deg(3),deg(1)],   degrees:['1','5','3','1'], label:'I ↓',  direction:'down' },
    ]

    case 'arpeggio': return [
      { notes:[deg(1),deg(3),deg(5),deg(8)], degrees:['1','3','5','1'], label:'up',   direction:'up'   },
      { notes:[deg(8),deg(5),deg(3),deg(1)], degrees:['1','5','3','1'], label:'down', direction:'down' },
    ]

    case '1-2-3-5-6': return [
      { notes:[deg(1),deg(2),deg(3),deg(5),deg(6)], degrees:['1','2','3','5','6'], label:'up',   direction:'up'   },
      { notes:[deg(6),deg(5),deg(3),deg(2),deg(1)], degrees:['6','5','3','2','1'], label:'down', direction:'down' },
    ]

    case '4-2-5-1': return [
      { notes:[deg(4),deg(6),deg(8)],         degrees:['4','6','1'],     label:'IV',  direction:'up' },
      { notes:[deg(2),deg(4),deg(6)],         degrees:['2','4','6'],     label:'ii',  direction:'up' },
      { notes:[deg(5),deg(7),deg(9)],         degrees:['5','7','2'],     label:'V',   direction:'up' },
      { notes:[deg(1),deg(3),deg(5),deg(8)],  degrees:['1','3','5','1'], label:'I',   direction:'up' },
    ]

    default: return []
  }
}
