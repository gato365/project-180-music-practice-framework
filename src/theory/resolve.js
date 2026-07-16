// ─────────────────────────────────────────────────────────────────────────────
// resolve.js — turn a (serializable) plan item into concrete notes/groups for
// a given instrument. The planner stores only ids; octaves and spellings are
// resolved here so the same plan renders correctly for sax vs trumpet ranges.
// ─────────────────────────────────────────────────────────────────────────────

import { tonicMidiFor, spellScale8, scaleName } from './scales.js'
import { formDef, formGroups } from './forms.js'
import { patternDef, patternGroups } from './patterns.js'
import { prettyName } from './notes.js'
import { tonicNameFor } from './scales.js'

/** Can this scale form be played in this key on this instrument? */
export function isFormAvailable(inst, keyId, typeId, formId) {
  const form = formDef(formId)
  if (form.majorOnly && typeId !== 'major') return false
  return tonicMidiFor(inst, keyId, form.reach) !== null
}

export function isPatternAvailable(inst, keyId, patternId) {
  return tonicMidiFor(inst, keyId, patternDef(patternId).reach) !== null
}

/**
 * Resolve a plan item → { groups, notes8, label, sub } or null if it cannot
 * be placed in the instrument's range.
 *
 * Scale item:   { kind:'scale',   keyId, scaleType, form }
 * Pattern item: { kind:'pattern', keyId, patternId }
 */
export function resolveItem(item, inst) {
  if (item.kind === 'scale') {
    const form = formDef(item.form)
    const tonicMidi = tonicMidiFor(inst, item.keyId, form.reach)
    if (tonicMidi === null) return null
    if (form.majorOnly && item.scaleType !== 'major') return null
    const notes8 = spellScale8(item.keyId, item.scaleType, tonicMidi)
    return {
      groups: formGroups(item.form, notes8),
      notes8,
      label: scaleName(item.keyId, item.scaleType),
      sub: form.label,
    }
  }
  if (item.kind === 'pattern') {
    const pat = patternDef(item.patternId)
    const tonicMidi = tonicMidiFor(inst, item.keyId, pat.reach)
    if (tonicMidi === null) return null
    // Progressions/digital patterns are built on the key's major scale.
    const notes8 = spellScale8(item.keyId, 'major', tonicMidi)
    return {
      groups: patternGroups(item.patternId, notes8),
      notes8,
      label: `${pat.label} in ${prettyName(tonicNameFor(item.keyId, 'major'))}`,
      sub: pat.desc,
    }
  }
  return null
}

/** Flat list of every note in an item, in played order (for time & analysis). */
export function itemNoteSequence(item, inst) {
  const r = resolveItem(item, inst)
  if (!r) return []
  return r.groups.flatMap(g => g.notes)
}
