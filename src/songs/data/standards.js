// ─────────────────────────────────────────────────────────────────────────────
// standards.js — 15 essential jazz standards with chord changes
//
// All chords stored in CONCERT pitch (C instruments).
// Transposition for Bb/Eb instruments handled in chordUtils.js.
//
// Measure format:
//   Each measure = array of { chord: string, beats: number }
//   beats must sum to the time signature numerator (4 for 4/4, 3 for 3/4)
//
// Section format:
//   { label: 'A' | 'B' | 'C' | 'Verse' | 'Chorus' | 'Bridge',
//     measures: MeasureArray }
// ─────────────────────────────────────────────────────────────────────────────

const b4 = chord => [{ chord, beats: 4 }]
const b3 = chord => [{ chord, beats: 3 }]
const b22 = (c1, c2) => [{ chord: c1, beats: 2 }, { chord: c2, beats: 2 }]
const b21 = (c1, c2) => [{ chord: c1, beats: 2 }, { chord: c2, beats: 1 }]
const b12 = (c1, c2) => [{ chord: c1, beats: 1 }, { chord: c2, beats: 2 }]
const b211 = (c1,c2,c3) => [{ chord:c1, beats:2 },{ chord:c2, beats:1 },{ chord:c3, beats:1 }]
const b1111 = (a,b,c,d) => [{ chord:a, beats:1 },{ chord:b, beats:1 },{ chord:c, beats:1 },{ chord:d, beats:1 }]

export const STANDARDS = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'autumn-leaves',
    title: 'Autumn Leaves',
    composer: 'Joseph Kosma',
    year: 1945,
    style: 'Ballad / Swing',
    keyCenter: 'G minor',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['minor', 'standard', 'ballad', 'ii-V-I'],
    notes: 'Classic ii–V–I in Gm. Pairs of ii–Vs in Bb and Gm before resolving. Essential for learning functional harmony.',
    sections: [
      { label: 'A', repeat: true, measures: [
        b22('Cm7','F7'), b22('BbMaj7','EbMaj7'), b22('Am7b5','D7'), b4('Gm7'),
        b22('Cm7','F7'), b22('BbMaj7','EbMaj7'), b22('Am7b5','D7'), b4('Gm'),
      ]},
      { label: 'B', measures: [
        b22('Am7b5','D7'), b4('Gm7'), b22('Cm7','F7'), b4('BbMaj7'),
        b22('EbMaj7','Am7b5'), b22('D7','D7'), b4('Gm'), b4('Gm'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'blue-bossa',
    title: 'Blue Bossa',
    composer: 'Kenny Dorham',
    year: 1963,
    style: 'Bossa Nova',
    keyCenter: 'C minor',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['minor', 'bossa', 'latin', 'ii-V-I', 'modulation'],
    notes: 'Key change from C minor to Db major in bars 9–12. A great tune for practicing modulation and bossa nova feel.',
    sections: [
      { label: 'A', measures: [
        b4('Cm'),      b4('Cm'),
        b4('Fm7'),     b4('Fm7'),
        b22('Dm7b5','G7b9'), b4('Cm'), b22('Dm7b5','G7'), b4('Cm'),
      ]},
      { label: 'B', notes: 'Modulates to Db major', measures: [
        b4('DbMaj7'), b4('DbMaj7'),
        b22('Gb7','Gb7'), b4('DbMaj7'), b22('Dm7b5','G7'), b4('Cm'),
        b4('Cm'),     b4('Cm'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'all-the-things',
    title: 'All The Things You Are',
    composer: 'Jerome Kern',
    year: 1939,
    style: 'Swing',
    keyCenter: 'Ab major',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['standard', 'complex', 'multiple-keys', 'ii-V-I', 'bebop'],
    notes: 'Cycles through 5 key centers. One of the most harmonically rich standards. Essential bebop repertoire.',
    sections: [
      { label: 'A', measures: [
        b4('Fm7'), b4('Bb m7'), b4('Eb7'), b4('AbMaj7'),
        b4('DbMaj7'), b22('Dm7','G7'), b4('CMaj7'), b4('CMaj7'),
      ]},
      { label: 'A', measures: [
        b4('Cm7'), b4('Fm7'), b4('Bb7'), b4('EbMaj7'),
        b4('AbMaj7'), b22('Am7b5','D7'), b4('GMaj7'), b4('GMaj7'),
      ]},
      { label: 'B', measures: [
        b4('Am7'), b4('D7'), b4('GMaj7'), b4('GMaj7'),
        b4('F#m7'), b4('B7'), b4('EMaj7'), b22('C7','C7'),
      ]},
      { label: 'A', measures: [
        b4('Fm7'), b4('Bbm7'), b4('Eb7'), b4('AbMaj7'),
        b4('DbMaj7'), b22('Dbm7','Gb7'), b4('AbMaj7'), b22('Bb m7','Eb7'),
        b4('AbMaj7'), b4('AbMaj7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'summertime',
    title: 'Summertime',
    composer: 'George Gershwin',
    year: 1935,
    style: 'Ballad',
    keyCenter: 'A minor',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['minor', 'ballad', 'standard', 'blues'],
    notes: 'Timeless Gershwin. The slow, cyclical minor progression is deceptively simple. Great vehicle for phrasing.',
    sections: [
      { label: 'A', repeat: true, measures: [
        b22('Am7','Am7'), b22('Am7','E7'), b22('Am7','Am7'), b22('Am','Am'),
        b22('Am7','D7'), b22('Am7','F7'), b22('Am7','E7'), b22('Am','Am'),
      ]},
      { label: 'B', measures: [
        b22('E7','E7'), b22('E7','E7'), b22('Am7','Am7'), b22('Am','Am'),
        b22('Am7','D7'), b22('Am7','F7'), b22('Am7','E7'), b22('Am','Am'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'take-the-a-train',
    title: 'Take The A Train',
    composer: 'Billy Strayhorn',
    year: 1941,
    style: 'Swing',
    keyCenter: 'C major',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['swing', 'major', 'standard', 'tritone-sub'],
    notes: 'Duke Ellington\'s signature. The #11 (Lydian) sound on the IV gives it that classic Strayhorn color.',
    sections: [
      { label: 'A', repeat: true, measures: [
        b4('CMaj7'), b4('CMaj7'), b22('D7#11','D7#11'), b22('D7#11','G7'),
        b4('CMaj7'), b22('C7','C7'), b4('DMaj7'), b22('G7','G7'),
      ]},
      { label: 'B', measures: [
        b4('Am7'), b4('D7'), b4('GMaj7'), b4('GMaj7'),
        b22('Am7','D7'), b22('Am7','D7'), b4('CMaj7'), b22('G7','G7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'impressions',
    title: 'Impressions',
    composer: 'John Coltrane',
    year: 1961,
    style: 'Modal / Hard Bop',
    keyCenter: 'D dorian',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['modal', 'coltrane', 'dorian', 'minor'],
    notes: 'Modal jazz — D dorian for 16 bars, Eb dorian for 8 bars, back to D. Focus on playing inside the mode. Based on Miles Davis\'s "So What."',
    sections: [
      { label: 'A', notes: 'D Dorian — 16 bars', measures: [
        b4('Dm7'), b4('Dm7'), b4('Dm7'), b4('Dm7'),
        b4('Dm7'), b4('Dm7'), b4('Dm7'), b4('Dm7'),
        b4('Dm7'), b4('Dm7'), b4('Dm7'), b4('Dm7'),
        b4('Dm7'), b4('Dm7'), b4('Dm7'), b4('Dm7'),
      ]},
      { label: 'B', notes: 'Eb Dorian — 8 bars', measures: [
        b4('Ebm7'), b4('Ebm7'), b4('Ebm7'), b4('Ebm7'),
        b4('Ebm7'), b4('Ebm7'), b4('Ebm7'), b4('Ebm7'),
      ]},
      { label: 'A', notes: 'D Dorian — back home, 8 bars', measures: [
        b4('Dm7'), b4('Dm7'), b4('Dm7'), b4('Dm7'),
        b4('Dm7'), b4('Dm7'), b4('Dm7'), b4('Dm7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'footprints',
    title: 'Footprints',
    composer: 'Wayne Shorter',
    year: 1966,
    style: 'Modal / Post-Bop',
    keyCenter: 'C minor',
    timeSignature: '6/4',
    beatsPerBar: 6,
    tags: ['minor', 'modal', 'wayne-shorter', '6/4', 'post-bop'],
    notes: 'Wayne Shorter classic in 6/4. The three-bar loop at the top creates an unusual phrase structure. Essential for modern jazz feel.',
    sections: [
      { label: 'A', notes: '6/4 — feel the long swing', measures: [
        [{ chord:'Cm7',  beats:6 }], [{ chord:'Cm7',  beats:6 }],
        [{ chord:'Cm7',  beats:6 }], [{ chord:'Cm7',  beats:6 }],
        [{ chord:'F7',   beats:6 }], [{ chord:'F7',   beats:6 }],
        [{ chord:'Cm7',  beats:6 }], [{ chord:'Cm7',  beats:6 }],
        [{ chord:'Ab7',  beats:3 },{ chord:'G7',   beats:3 }],
        [{ chord:'Cm',   beats:6 }],
        [{ chord:'Ab7',  beats:3 },{ chord:'G7',   beats:3 }],
        [{ chord:'Cm',   beats:6 }],
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'misty',
    title: 'Misty',
    composer: 'Erroll Garner',
    year: 1954,
    style: 'Ballad',
    keyCenter: 'Eb major',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['ballad', 'standard', 'major', 'romantic'],
    notes: 'Beautiful ballad changes. The bridge cycles through several ii–V–Is. Great for melodic ballad playing.',
    sections: [
      { label: 'A', measures: [
        b4('EbMaj7'), b22('Bb m7','Eb7'), b4('AbMaj7'), b22('Abm6','Abm7'),
        b22('Db7','Db7'), b4('EbMaj7'), b22('Cm7','Fm7'), b22('Bb7','Bb7'),
      ]},
      { label: 'A', measures: [
        b4('EbMaj7'), b22('Bb m7','Eb7'), b4('AbMaj7'), b22('Abm6','Abm7'),
        b22('Db7','Db7'), b4('EbMaj7'), b22('Cm7','Fm7'), b22('Bb7','EbMaj7'),
      ]},
      { label: 'B', measures: [
        b22('Bb m7','Eb7'), b4('AbMaj7'), b22('Am7','D7'), b4('GMaj7'),
        b22('Gm7','C7'),    b4('FMaj7'),  b22('Fm7','Bb7'), b4('Bb7'),
      ]},
      { label: 'A', measures: [
        b4('EbMaj7'), b22('Bb m7','Eb7'), b4('AbMaj7'), b22('Abm6','Abm7'),
        b22('Db7','Db7'), b4('EbMaj7'), b22('Cm7','Fm7'), b22('Bb7','EbMaj7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'maiden-voyage',
    title: 'Maiden Voyage',
    composer: 'Herbie Hancock',
    year: 1965,
    style: 'Modal / Funk',
    keyCenter: 'D suspended',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['modal', 'herbie-hancock', 'sus4', 'funk', 'post-bop'],
    notes: 'All sus4 chords — suspended voicings create an open, floating sound. One of the defining pieces of modal jazz. Focus on color over function.',
    sections: [
      { label: 'A', repeat: true, notes: 'All sus4 — float freely inside each color', measures: [
        b4('D7sus4'), b4('D7sus4'), b4('F7sus4'), b4('F7sus4'),
        b4('D7sus4'), b4('D7sus4'), b4('F7sus4'), b4('F7sus4'),
      ]},
      { label: 'B', measures: [
        b4('Bb7sus4'), b4('Bb7sus4'), b4('Ab7sus4'), b4('Ab7sus4'),
        b4('Bb7sus4'), b4('Bb7sus4'), b4('Ab7sus4'), b4('Ab7sus4'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'stella-by-starlight',
    title: 'Stella By Starlight',
    composer: 'Victor Young',
    year: 1944,
    style: 'Ballad / Swing',
    keyCenter: 'Bb major',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['standard', 'ballad', 'complex', 'bebop', 'through-composed'],
    notes: 'Through-composed with many unexpected turns. Every bebop musician knows it. Requires real harmonic awareness.',
    sections: [
      { label: 'A', measures: [
        b22('Em7b5','A7'), b4('Cm7'), b22('Fm7','Bb7'), b4('EbMaj7'),
        b22('Ab7','Ab7'), b4('BbMaj7'), b22('Em7b5','A7'), b4('Dm7'),
      ]},
      { label: 'B', measures: [
        b22('Gm7','C7'), b4('FMaj7'), b22('Am7b5','D7b9'), b4('Gm7'),
        b22('Gm7','C7'), b4('FMaj7'), b22('Fm7','Bb7'), b4('EbMaj7'),
      ]},
      { label: 'C', measures: [
        b22('Em7b5','A7'), b4('Dm7'), b22('Em7b5','A7'), b4('Dm7'),
        b22('Cm7b5','F7'), b4('BbMaj7'), b22('Gm7','C7'), b22('Cm7','F7'),
        b4('BbMaj7'), b4('BbMaj7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'round-midnight',
    title: "'Round Midnight",
    composer: 'Thelonious Monk',
    year: 1944,
    style: 'Ballad',
    keyCenter: 'Eb minor',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['monk', 'minor', 'ballad', 'bebop', 'complex'],
    notes: 'Monk\'s signature ballad. Dense chromatic harmony. Every chord choice matters. Best studied slowly with careful attention to voice leading.',
    sections: [
      { label: 'A', measures: [
        b22('Eb m','Eb m7'), b22('Ebm7','Ab7'), b22('DbMaj7','Cbm7'), b22('F7','Gb7'),
        b22('Eb m','Eb m7'), b22('Eb m7','Ab7'), b22('DbMaj7','Gb7'), b4('Ebm'),
      ]},
      { label: 'B', measures: [
        b4('Bb7b9'), b4('Bb7'), b22('Ebm','Ebm'), b22('Bb7b9','Bb7'),
        b22('Ebm','Eb7'), b22('Ab7','Abm7'), b22('Db7','Db7'), b4('GbMaj7'),
      ]},
      { label: 'A', measures: [
        b22('Eb m','Eb m7'), b22('Ebm7','Ab7'), b22('DbMaj7','Cbm7'), b22('F7','Gb7'),
        b22('Eb m','Eb m7'), b22('Eb m7','Ab7'), b22('DbMaj7','Gb7'), b4('DbMaj7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'there-will-never',
    title: 'There Will Never Be Another You',
    composer: 'Harry Warren',
    year: 1942,
    style: 'Swing',
    keyCenter: 'Eb major',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['standard', 'swing', 'major', 'bebop', 'ii-V-I'],
    notes: 'A bebop workhorse. The changes are clean and functional — perfect for practicing long bebop lines through ii–V–Is.',
    sections: [
      { label: 'A', repeat: true, measures: [
        b4('EbMaj7'), b22('Ab7','Ab7'), b4('EbMaj7'), b22('Cm7','F7'),
        b22('Fm7','Bb7'), b4('EbMaj7'), b22('Fm7','Bb7'), b4('EbMaj7'),
      ]},
      { label: 'B', measures: [
        b4('EbMaj7'), b22('Ab7','Ab7'), b4('EbMaj7'), b22('Bb7','Bb7'),
        b22('Gm7','C7'), b22('Fm7','Bb7'), b4('EbMaj7'), b22('Fm7','Bb7'),
        b4('EbMaj7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'my-favorite-things',
    title: 'My Favorite Things',
    composer: 'Richard Rodgers',
    year: 1959,
    style: 'Modal / Waltz',
    keyCenter: 'E minor',
    timeSignature: '3/4',
    beatsPerBar: 3,
    tags: ['coltrane', 'modal', 'waltz', 'minor', '3/4'],
    notes: 'Coltrane transformed this show tune into a landmark modal piece. 3/4 time. Em and EM alternate — feel the shift from minor to major.',
    sections: [
      { label: 'A', notes: 'E minor feel', measures: [
        b3('Em7'), b3('Em7'), b3('Em7'), b3('Em7'),
        b3('Am7'), b3('Am7'), b3('Am7'), b3('Am7'),
        b3('Am7'), b3('Am7'), b3('Am7'), b3('Am7'),
        b3('Em7'), b3('Em7'), b3('Em7'), b3('Em7'),
      ]},
      { label: 'B', notes: 'E major feel', measures: [
        b3('EMaj7'), b3('EMaj7'), b3('EMaj7'), b3('EMaj7'),
        b3('AMaj7'), b3('AMaj7'), b3('AMaj7'), b3('AMaj7'),
        b3('AMaj7'), b3('AMaj7'), b3('AMaj7'), b3('AMaj7'),
        b3('EMaj7'), b3('EMaj7'), b3('EMaj7'), b3('EMaj7'),
      ]},
      { label: 'C', notes: 'Bridge — functional harmony', measures: [
        [{ chord:'F#m7',beats:3 }],[{ chord:'B7',   beats:3 }],
        [{ chord:'F#m7',beats:3 }],[{ chord:'B7',   beats:3 }],
        [{ chord:'EMaj7',beats:3}],[{ chord:'EMaj7',beats:3}],
        [{ chord:'EMaj7',beats:3}],[{ chord:'EMaj7',beats:3}],
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'cantaloupe-island',
    title: 'Cantaloupe Island',
    composer: 'Herbie Hancock',
    year: 1964,
    style: 'Funk / Soul Jazz',
    keyCenter: 'F minor',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['herbie-hancock', 'funk', 'soul-jazz', 'minor', 'pentatonic'],
    notes: 'Groovy Herbie funk classic. Three static chord environments — each lasts 4 bars. Play pentatonic over Fm, then hear how the harmony shifts.',
    sections: [
      { label: 'A', notes: 'Fm pentatonic — groove is everything', measures: [
        b4('Fm7'), b4('Fm7'), b4('Fm7'), b4('Fm7'),
      ]},
      { label: 'B', notes: 'Shift up a half-step', measures: [
        b4('Db7'), b4('Db7'), b4('Db7'), b4('Db7'),
      ]},
      { label: 'C', notes: 'Back down — contrast', measures: [
        b4('D7'),  b4('D7'),  b4('Db7'), b4('Db7'),
      ]},
      { label: 'A', measures: [
        b4('Fm7'), b4('Fm7'), b4('Fm7'), b4('Fm7'),
      ]},
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'straight-no-chaser',
    title: 'Straight, No Chaser',
    composer: 'Thelonious Monk',
    year: 1951,
    style: 'Bebop Blues',
    keyCenter: 'F major',
    timeSignature: '4/4',
    beatsPerBar: 4,
    tags: ['monk', 'blues', 'bebop', 'F blues', 'swing'],
    notes: '12-bar bebop blues in F. The rhythm and melody are more Monk than the changes, but the changes are a solid bebop blues vehicle.',
    sections: [
      { label: 'Blues', notes: '12-bar F bebop blues — repeat indefinitely', measures: [
        b4('F7'),    b4('F7'),    b4('F7'),    b22('F7','Bb7'),
        b4('Bb7'),   b4('Bb7'),   b4('F7'),    b4('F7'),
        b22('Am7b5','D7'), b22('Gm7','C7'), b22('F7','D7'), b22('Gm7','C7'),
      ]},
    ],
  },
]

// Tags for filtering
export const ALL_TAGS = [...new Set(STANDARDS.flatMap(s => s.tags))].sort()

// Style categories
export const ALL_STYLES = [...new Set(STANDARDS.map(s => s.style))].sort()
