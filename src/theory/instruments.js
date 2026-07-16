// ─────────────────────────────────────────────────────────────────────────────
// instruments.js — instrument definitions: written ranges, transposition,
// synth voicing hints, and the trumpet valve-fingering map.
//
// Both supported horns are Bb transposing instruments, but they sound in
// DIFFERENT registers:
//   • Trumpet sounds a major 2nd below written        (written C5 → concert Bb4)
//   • Tenor sax sounds a major 9th below written      (written C5 → concert Bb3)
// This matters even in No-Instrument mode: the user picks a playback "voice"
// so scales are heard in that instrument's true range.
// ─────────────────────────────────────────────────────────────────────────────

export const INSTRUMENTS = {
  sax: {
    id: 'sax',
    label: 'Tenor Sax',
    shortLabel: 'Sax',
    emoji: '🎷',
    // Written range: Bb3 → F6 (top is altissimo territory)
    writtenMin: 58,
    writtenMax: 89,
    concertOffset: -14,     // written − 14 semitones = concert (octave + M2)
    hasFingerings: false,   // sax fingering diagrams are a roadmap item
    synth: {
      oscillator: 'sawtooth',
      filterFreq: 1700, filterQ: 2,
      envelope: { attack: 0.06, decay: 0.12, sustain: 0.72, release: 0.5 },
      volume: -5,
    },
  },
  trumpet: {
    id: 'trumpet',
    label: 'Trumpet',
    shortLabel: 'Trumpet',
    emoji: '🎺',
    // Written range: F#3 → C6 (matches the valve fingering table)
    writtenMin: 54,
    writtenMax: 84,
    concertOffset: -2,      // written − 2 semitones = concert (M2)
    hasFingerings: true,
    synth: {
      oscillator: 'sawtooth',
      filterFreq: 3200, filterQ: 1,
      envelope: { attack: 0.02, decay: 0.08, sustain: 0.8, release: 0.3 },
      volume: -7,
    },
  },
}

/** Selectable in the top-level instrument switch. */
export const INSTRUMENT_CHOICES = [
  { id: 'sax',     label: '🎷 Tenor Sax' },
  { id: 'trumpet', label: '🎺 Trumpet' },
  { id: 'none',    label: '🎧 No Instrument' },
]

/**
 * Resolve the instrument definition that drives notation range, transposition,
 * and playback. In No-Instrument mode the user still picks a playback voice
 * (sax or trumpet) so the heard range matches a real horn.
 */
export function resolveInstrument(instrumentId, voiceId = 'sax') {
  if (instrumentId === 'none') return INSTRUMENTS[voiceId] ?? INSTRUMENTS.sax
  return INSTRUMENTS[instrumentId] ?? INSTRUMENTS.sax
}

/** Concert-pitch key name for a written key on a Bb instrument (−2 mod 12). */
export function concertKeyName(writtenKeyId) {
  const FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
  const PC = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,
               'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 }
  const pc = PC[writtenKeyId]
  if (pc === undefined) return writtenKeyId
  return FLAT[(pc + 10) % 12]
}

// ── Trumpet valve fingerings (written Bb-trumpet pitch, by MIDI number) ──────
// [] = open. Source: trumpet-scales.html (project-146).

export const TRUMPET_FING = {
  54:[1,2,3],55:[1,3],56:[2,3],57:[1,2],58:[1],59:[2],
  60:[],61:[1,2,3],62:[1,3],63:[2,3],64:[1,2],65:[1],66:[2],
  67:[],68:[2,3],69:[1,2],70:[1],71:[2],
  72:[],73:[1,2],74:[1],75:[2],76:[],77:[1],78:[2],
  79:[],80:[2,3],81:[1,2],82:[1],83:[2],84:[],
}

/** Valve fingering for a written trumpet MIDI note, or null if out of table. */
export function trumpetFingering(midi) {
  return TRUMPET_FING[midi] ?? null
}

export function fingeringLabel(fing) {
  if (!fing) return '—'
  return fing.length === 0 ? 'open' : fing.join('-')
}
