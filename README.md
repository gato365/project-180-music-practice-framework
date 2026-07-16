# Music Practice Framework

**Live site:** https://gato365.github.io/project-180-music-practice-framework/

A session-first practice app for saxophone and trumpet (or no instrument at
all). You pick **two things** — instrument and how many minutes you have
(5 / 10 / 15) — and the app decides the rest: which of the 12 keys today, which
scale types and forms, which patterns, at what tempo, trimmed to fit your time.

Built with React 18 + Vite + Tone.js, deployed to GitHub Pages. Session history
in localStorage, recordings in IndexedDB. No account, no server.

---

## The product: one guided session

`Start Session` is the app. Everything else is a reference library beside it.

```
Setup → Plan preview → Run → Critique → Reflect → Summary
```

1. **Setup** — instrument (🎷 / 🎺 / 🎧) + minutes. In No-Instrument mode you
   still pick a playback *voice* (sax or trumpet) because they sound in
   different registers — playback range and transposition follow the horn.
2. **Plan preview** — the auto-generated plan with a short "why these" note.
   You can regenerate (next keys in rotation), nudge the BPM, toggle items
   off, enable recording — but the default path is just **Start**.
3. **Run** — the whole item is on the page as treble-staff notation: a
   one-octave scale shows all 16 notes, 8 up on one line and 8 down on the
   next (longer forms wrap the same way, breaking at direction changes).
   **▶ Auto-play lesson** walks the entire plan item by item, highlighting
   each note as it sounds so you mimic in real time; a "now playing" card
   mirrors the current note (with valve fingerings on trumpet), tempo is a
   live BPM input, and clicking any note plays just that note. Dual timers
   track session-vs-target and the current item. No-Instrument mode instead
   runs the tap-the-notes quiz with live accuracy (from project-127).
4. **Critique** — tone / accuracy / time / technique on 1–5 scales. If you
   recorded, "estimate from recording (beta)" runs in-browser pitch detection
   and prefills accuracy + time; quiz accuracy prefills it in 🎧 mode. Tone
   and technique are always self-rated — audio can't judge them honestly.
5. **Reflect** — three fixed prompts (What improved? / What needs work? /
   What tomorrow?), each with notes and a 1–5 score so reflection trends
   are chartable.
6. **Summary** — what you actually practiced, saved to history.

### The executive-decision engine

The old apps exposed everything and decided nothing. The planner
(`src/engine/sessionPlanner.js`) is the heart of this rebuild — a pure
function `{instrument, minutes, history, schedule, date} → plan`:

- **Keys/day:** 3 (5 min) or 4 (10/15 min), 2 on rest days, rotating through
  **all 12 keys**. Learn days surface never-practiced / least-recently-practiced
  keys first; review days reinforce keys touched in the last 7 days, oldest
  first. Simulated from a cold start, full 12-key coverage takes 3–5 days.
- **Scale type per key** cycles major → natural minor → harmonic minor by
  what that key has seen least recently (major first for new keys).
- **Forms:** every key starts with one octave; two octaves / thirds /
  pentatonic are added round-robin (least-recent first, evenly across keys)
  while the time budget allows. Forms that don't fit the instrument's written
  range in a key are skipped (e.g. two-octave G on trumpet); pentatonic only
  runs against major.
- **Patterns** (ii–V–I, 1–4–5, arpeggios, 1–2–3–5–6, 4–2–5–1) fill the last
  ~28% of the budget, ranked by how overdue each pattern is, each assigned
  the today-key where it's most overdue — so patterns × keys rotate through
  full coverage too.
- **Time model:** `notes × beat length × 1.6 (listen + play along) + gaps`,
  with per-item transitions and session overhead. Same day + same history →
  same plan (deterministic); **Regenerate** advances the rotation.

Every decision is history-driven via `src/engine/coverage.js`, and the
Progress tab renders the *same* coverage stats — what looks neglected there
is literally what gets scheduled next.

## Reference tabs (the side rail)

| Tab | What it is |
|---|---|
| **Songs** | The 15 jazz standards with chord charts, piano playback, transposition (from jazz-changes). Reference only — intentionally *not* wired into the timed session; repertoire philosophy is still TBD. |
| **Fingerings** | Trumpet valve chart (animated pistons, step-through, chart view). Saxophone diagrams are a placeholder ("on the roadmap"). |
| **Schedule** | The weekly learn/review/rest schedule the planner reads. Ships with a sensible default (Mon–Wed + Fri learn, Thu/Sat review, Sun rest); click a day to change it. |
| **Progress** | Total time, streaks, minutes/day chart, **12-key + pattern coverage grids**, reflection-score trends, critique averages, full session table with recording playback. |

A global instrument selector sits at the bottom of the rail; it's locked only
while a session is actually running, and the plan preview rebuilds itself if
you switch instruments there.

## Architecture

```
src/
  theory/        pure music theory (no React — runs in node)
    notes.js         parsing, MIDI, spelling display, staff geometry
    instruments.js   ranges + transposition (sax −14, trumpet −2), valve map
    scales.js        12 keys × {major, nat minor, harm minor} speller
    forms.js         one octave / two octaves / thirds / pentatonic generators
    patterns.js      ii–V–I, 1–4–5, arpeggio, 1–2–3–5–6, 4–2–5–1 generators
    resolve.js       plan item → concrete notes for an instrument's range
  engine/        the decision layer (also pure)
    sessionPlanner.js  THE planner (see above)
    coverage.js        history → recency/frequency stats
    timeEstimator.js   BPM × note count → seconds; all tunables live here
    weeklySchedule.js  learn/review/rest day types
  state/         persistence (swap-for-Firebase seam)
    storage.js         thin localStorage layer — the ONLY file that talks to it
    sessionStore.js    session records (schema documented in-file)
    settingsStore.js   instrument, voice, weekly schedule
    audioStore.js      IndexedDB blob store for recordings
  audio/
    useInstrumentAudio.js  Tone.js synth per horn, written→concert transposition
    useRecorder.js         MediaRecorder wrapper (graceful permission flow)
    pitchAnalysis.js       autocorrelation pitch detection + LCS note matching
  session/       the guided flow (SessionFlow + one file per step)
  components/    GrandStaff (SVG), NoteCards, TimerBar
  tabs/          ScheduleTab, ProgressTab
  songs/, fingerings/   kept from the source projects, self-scoped styling
```

Sax sounds a major 9th below written pitch, trumpet a major 2nd — both are
honored in playback, so the same written scale is *heard* where the real horn
would put it, including in No-Instrument mode.

## Development

```bash
npm install
npm run dev      # http://localhost:5173/project-180-music-practice-framework/
npm run build
npm run deploy   # builds and pushes dist/ to gh-pages
```

A planner simulation (spelling checks, 21-day rotation/budget/range tests for
all instrument × length combos) lives outside the repo but is easy to recreate:
import `buildPlan` in node and loop days — all theory/engine/state modules are
dependency-free ESM.

## Decisions to sanity-check (deliberately tunable)

These were judgment calls, all isolated in `src/engine/timeEstimator.js` and
the constants atop `sessionPlanner.js`:

1. **Rotation aggressiveness** — learn days always prefer the *least recent*
   key (never-practiced first, circle-of-fourths tie-break); review days do
   spaced repetition within the last 7 days. There is no "reinforce yesterday"
   bias on learn days — say the word if repetition should weigh more.
2. **BPM defaults** — 5 min → 96, 10 → 88, 15 → 80 BPM (quarter notes),
   i.e. *shorter session ⇒ faster notes, fewer forms*; nudgeable ±8 in the
   preview. `PLAY_REPEAT = 1.6` assumes you listen + play each group ~1.6×.
3. **Pitch detection ships as beta** — plain autocorrelation, octave-tolerant
   matching (LCS on pitch classes), works for a monophonic horn in a quiet
   room. It prefills accuracy/timing as *estimates you can override*; tone and
   technique are never auto-graded.
4. **Checklist folded into the plan preview** (headphones + record toggles
   above the Start button) rather than a separate screen — one less step for
   a 5-minute session.
5. **Old practice history is not migrated** — the old 6-scale localStorage
   records don't fit the new 12-key data model; the new app starts fresh
   under new storage keys (`mpf2_*`).

## Roadmap

- Firebase auth + sync (the `state/storage.js` seam is built for it)
- Saxophone fingering diagrams
- Songs wired into the session once a repertoire philosophy is defined
- Melodic minor, if wanted later
