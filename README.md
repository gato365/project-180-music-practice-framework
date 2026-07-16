# Music Practice Framework

**Live site:** https://gato365.github.io/project-180-music-practice-framework/

A unified music practice app that combines the best features of my earlier music
projects (`scale-practice`, `jazz-changes`, `trumpet-scales`, and the jazz theory
test app) into one place. The core requirement: **be able to practice with an
instrument (saxophone or trumpet) or without one** (mental practice / listening).

Built with React 18 + Vite + Tone.js, deployed to GitHub Pages.

---

## Goals

- **Practice** — guided, timed daily sessions
- **Learn** — scales, patterns, and songs across all 12 keys
- **Transcribe** — work through patterns and transcription exercises
- **See/understand fingerings** — trumpet valve fingerings; saxophone to follow
- **Measure change over time** — time spent, sessions, streaks, and more

## The App

A top navigation bar with a global **instrument choice** (🎷 Tenor Sax · 🎺 Trumpet ·
🎧 No Instrument) and four modules:

| Tab | What it does | Came from |
|---|---|---|
| **Practice** | Setup → Activity → Summary guided session: pick scales, BPM, and note value; run scale/pattern groups with live timers, grand-staff notation, and playback; save results | `scale-practice` |
| **Songs** | Jazz standards repertoire: chord charts with sections and bar numbers, piano playback with per-chord highlighting, loop + count-in, transposition (concert / B♭ / E♭) | `jazz-changes` (project-151 version) |
| **Fingerings** | Trumpet valve fingering chart for major & natural minor scales in 12 keys — animated pistons, step-through and see-all views, optional sound | `trumpet-scales.html` (project-146) |
| **Progress** | Practice metrics over time: total time, session count, last-7-days time, day streak, minutes-per-day chart, and a full session table | New (reads the Practice module's saved sessions) |

The instrument choice affects the app globally: sax and trumpet default the Songs
chord charts to B♭ transposition, "no instrument" defaults to concert pitch, and
the Fingerings tab notes when sax diagrams are still a gap.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # production build → dist/
npm run preview   # preview the production build
```

## Deployment

```bash
npm run deploy    # builds and pushes dist/ to the gh-pages branch
```

GitHub Pages serves the `gh-pages` branch. The Vite `base` is set to
`/project-180-music-practice-framework/` to match the Pages URL. (A GitHub
Actions auto-deploy on push is a nice future upgrade — it needs a token with
the `workflow` scope: `gh auth refresh -s workflow`.)

## Progress

- [x] Project scaffold (React 18 + Vite), GitHub repo, Pages deployment
- [x] Practice module ported from `scale-practice` (6 scales, 3 patterns, timers, notation, playback, localStorage history)
- [x] Songs module ported from `jazz-changes` (15 standards, playback, transposition, loop, count-in)
- [x] Fingerings module ported from `trumpet-scales.html` (React rewrite, 12 keys, major/minor)
- [x] Progress module: time-over-time metrics, streaks, per-day chart, session table
- [x] Global instrument selection (sax / trumpet / none), persisted

## Roadmap

From the framework plan and idea list:

- [ ] Choose session length up front (5 / 10 / 15 min) and trim the plan to fit
- [ ] All 12 keys in the Practice module (currently the 6 from `scale-practice`), plus natural & harmonic minor
- [ ] Two-octave pattern generation
- [ ] Daily schedule auto-generated from the weekly schedule
- [ ] Critique step (tone, accuracy, time, technique) and self-reflection prompts
- [ ] Record practice sessions, listen back, and grade the performance
- [ ] More progress metrics: pieces learned, accuracy over time
- [ ] Saxophone fingering diagrams
- [ ] Theory quiz/drill mode (from `project-127-jazz-theory-test-app`)
- [ ] Cloud sync (Firebase scaffolding exists in `project-127`)

## Source Material

This app was assembled from the projects in the parent directory
(`music_projects_add_to_list`) — see that folder's `README.md` for the full
feature map of what was taken from where.
