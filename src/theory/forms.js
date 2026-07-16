// ─────────────────────────────────────────────────────────────────────────────
// forms.js — the four scale practice forms.
// Group generators come from scale-practice (straight / thirds / pentatonic);
// the two-octave generator is new (a known gap in the source projects).
//
// Each generator takes the 8 spelled scale notes (tonic→tonic) and returns
//   [{ notes: string[], degrees: string[], label, direction: 'up'|'down' }]
//
// `reach` = [semitones below tonic, semitones above tonic] the form needs;
// used to place the tonic octave inside the instrument's written range.
// `majorOnly` — the pentatonic form uses major-scale degrees 1 2 3 5 6, so the
// planner only schedules it against major scales.
// ─────────────────────────────────────────────────────────────────────────────

import { raiseOctave, lowerOctave } from './notes.js'

export const FORMS = [
  { id: 'oneOctave',  label: 'One Octave',  short: '1 oct',
    reach: [0, 12],  noteCount: 16, groupCount: 4,  majorOnly: false,
    desc: 'up and down, 4 groups of 4' },
  { id: 'twoOctaves', label: 'Two Octaves', short: '2 oct',
    reach: [0, 24],  noteCount: 30, groupCount: 8,  majorOnly: false,
    desc: 'full range, up then down' },
  { id: 'thirds',     label: 'Thirds',      short: '3rds',
    // descending run ends on ♭7 below the tonic in natural minor → reach −2
    reach: [-2, 14], noteCount: 30, groupCount: 8,  majorOnly: false,
    desc: 'skip a degree, up then down' },
  { id: 'pentatonic', label: 'Pentatonic',  short: 'penta',
    reach: [-5, 14], noteCount: 40, groupCount: 10, majorOnly: true,
    desc: 'degrees 1 2 3 5 6' },
]

export const FORM_IDS = FORMS.map(f => f.id)

export function formDef(formId) {
  return FORMS.find(f => f.id === formId) ?? FORMS[0]
}

// ── One octave (straight) — 4 groups of 4 ────────────────────────────────────

export function getStraightGroups(n) {
  return [
    { notes:[n[0],n[1],n[2],n[3]], degrees:['1','2','3','4'], label:'i',   direction:'up'   },
    { notes:[n[4],n[5],n[6],n[7]], degrees:['5','6','7','1'], label:'ii',  direction:'up'   },
    { notes:[n[7],n[6],n[5],n[4]], degrees:['1','7','6','5'], label:'iii', direction:'down' },
    { notes:[n[3],n[2],n[1],n[0]], degrees:['4','3','2','1'], label:'iv',  direction:'down' },
  ]
}

// ── Two octaves — 8 groups of 4 (new generator) ─────────────────────────────
// Ascends both octaves, then mirrors back down. The octave-2 notes reuse the
// octave-1 spelling raised an octave, so accidentals stay consistent.

export function getTwoOctaveGroups(n) {
  const hi = n.map(raiseOctave)   // hi[0] === n[7] (same pitch, same spelling)
  return [
    { notes:[n[0], n[1], n[2], n[3]],  degrees:['1','2','3','4'],  label:'U1', direction:'up'   },
    { notes:[n[4], n[5], n[6], n[7]],  degrees:['5','6','7','1'],  label:'U2', direction:'up'   },
    { notes:[hi[1],hi[2],hi[3],hi[4]], degrees:['2','3','4','5'],  label:'U3', direction:'up'   },
    { notes:[hi[5],hi[6],hi[7]],       degrees:['6','7','1'],      label:'U4', direction:'up'   },
    { notes:[hi[7],hi[6],hi[5],hi[4]], degrees:['1','7','6','5'],  label:'D1', direction:'down' },
    { notes:[hi[3],hi[2],hi[1],n[7]],  degrees:['4','3','2','1'],  label:'D2', direction:'down' },
    { notes:[n[6], n[5], n[4], n[3]],  degrees:['7','6','5','4'],  label:'D3', direction:'down' },
    { notes:[n[2], n[1], n[0]],        degrees:['3','2','1'],      label:'D4', direction:'down' },
  ]
}

// ── Thirds — 8 groups (last of each direction has 3 notes) ──────────────────

export function getThirdsGroups(n) {
  return [
    { notes:[n[0],n[2],n[1],n[3]],        degrees:['1','3','2','4'], label:'A1', direction:'up'   },
    { notes:[n[2],n[4],n[3],n[5]],        degrees:['3','5','4','6'], label:'A2', direction:'up'   },
    { notes:[n[4],n[6],n[5],n[7]],        degrees:['5','7','6','1'], label:'A3', direction:'up'   },
    { notes:[n[6],raiseOctave(n[1]),n[7]], degrees:['7','2','1'],     label:'A4', direction:'up'   },
    { notes:[n[7],n[5],n[6],n[4]],        degrees:['1','6','7','5'], label:'D1', direction:'down' },
    { notes:[n[5],n[3],n[4],n[2]],        degrees:['6','4','5','3'], label:'D2', direction:'down' },
    { notes:[n[3],n[1],n[2],n[0]],        degrees:['4','2','3','1'], label:'D3', direction:'down' },
    { notes:[n[1],lowerOctave(n[6]),n[0]], degrees:['2','7','1'],     label:'D4', direction:'down' },
  ]
}

// ── Pentatonic groups — 10 groups of 4 (major degrees 1 2 3 5 6) ─────────────

export function getPentatonicGroups(n) {
  return [
    { notes:[n[0],n[1],n[2],n[4]],                           degrees:['1','2','3','5'], label:'A1', direction:'up'   },
    { notes:[n[1],n[2],n[4],n[5]],                           degrees:['2','3','5','6'], label:'A2', direction:'up'   },
    { notes:[n[2],n[4],n[5],n[7]],                           degrees:['3','5','6','1'], label:'A3', direction:'up'   },
    { notes:[n[4],n[5],n[7],raiseOctave(n[1])],              degrees:['5','6','1','2'], label:'A4', direction:'up'   },
    { notes:[n[5],n[7],raiseOctave(n[1]),n[7]],              degrees:['6','1','2','1'], label:'A5', direction:'up'   },
    { notes:[n[5],n[4],n[2],n[1]],                           degrees:['6','5','3','2'], label:'D1', direction:'down' },
    { notes:[n[4],n[2],n[1],n[0]],                           degrees:['5','3','2','1'], label:'D2', direction:'down' },
    { notes:[n[2],n[1],n[0],lowerOctave(n[5])],              degrees:['3','2','1','6'], label:'D3', direction:'down' },
    { notes:[n[1],n[0],lowerOctave(n[5]),lowerOctave(n[4])], degrees:['2','1','6','5'], label:'D4', direction:'down' },
    { notes:[n[0],lowerOctave(n[5]),lowerOctave(n[4]),n[0]], degrees:['1','6','5','1'], label:'D5', direction:'down' },
  ]
}

export function formGroups(formId, notes8) {
  switch (formId) {
    case 'oneOctave':  return getStraightGroups(notes8)
    case 'twoOctaves': return getTwoOctaveGroups(notes8)
    case 'thirds':     return getThirdsGroups(notes8)
    case 'pentatonic': return getPentatonicGroups(notes8)
    default:           return getStraightGroups(notes8)
  }
}
