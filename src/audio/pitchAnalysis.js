// ─────────────────────────────────────────────────────────────────────────────
// pitchAnalysis.js — monophonic pitch detection over a finished recording.
//
// HONEST LIMITS (ship-behind-beta): autocorrelation on a single-line horn in
// a quiet room gives a usable *estimate* of "did the right pitches happen in
// the right order" and "how fast were notes coming". It cannot judge tone or
// technique — those stay self-rated. Results are presented as estimates.
//
// Pipeline: decode blob → mono samples → windowed autocorrelation (ACF with
// parabolic interpolation, à la Chris Wilson's pitch detector) → run-length
// note segmentation → order-tolerant match (LCS on pitch classes, so octave
// errors from the detector don't zero the score).
// ─────────────────────────────────────────────────────────────────────────────

const WINDOW = 2048
const HOP = 1024
const RMS_GATE = 0.008          // below this the window is treated as silence
const MIN_RUN = 3               // windows a pitch must persist to count (~70ms)
const FREQ_MIN = 55             // A1
const FREQ_MAX = 1600

export function freqToMidiFloat(freq) {
  return 69 + 12 * Math.log2(freq / 440)
}

/** Autocorrelation pitch detector. Returns frequency in Hz, or -1. */
export function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < RMS_GATE) return -1

  // Trim leading/trailing low-signal edges
  let r1 = 0, r2 = SIZE - 1
  const thres = 0.2
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break }
  const b = buf.slice(r1, r2)
  const N = b.length
  if (N < 32) return -1

  const c = new Float32Array(N)
  for (let lag = 0; lag < N; lag++) {
    let sum = 0
    for (let i = 0; i < N - lag; i++) sum += b[i] * b[i + lag]
    c[lag] = sum
  }

  let d = 0
  while (d + 1 < N && c[d] > c[d + 1]) d++
  let maxval = -1, maxpos = -1
  for (let i = d; i < N; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i }
  }
  if (maxpos <= 0) return -1
  let T0 = maxpos

  // Parabolic interpolation around the peak
  const x1 = c[T0 - 1] ?? c[T0], x2 = c[T0], x3 = c[T0 + 1] ?? c[T0]
  const a = (x1 + x3 - 2 * x2) / 2
  const bb = (x3 - x1) / 2
  if (a) T0 = T0 - bb / (2 * a)

  const freq = sampleRate / T0
  return (freq >= FREQ_MIN && freq <= FREQ_MAX) ? freq : -1
}

/** Decode an audio blob to mono Float32 samples. */
async function decodeBlob(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  try {
    const arrayBuf = await blob.arrayBuffer()
    const audioBuf = await ctx.decodeAudioData(arrayBuf)
    return { samples: audioBuf.getChannelData(0), sampleRate: audioBuf.sampleRate,
             duration: audioBuf.duration }
  } finally {
    try { await ctx.close() } catch { /* noop */ }
  }
}

/** Segment frame-level pitches into note events via run-length grouping. */
function segmentNotes(frames, secPerHop) {
  const notes = []
  let curMidi = null, runLen = 0, runStart = 0
  const flush = () => {
    if (curMidi !== null && runLen >= MIN_RUN) {
      notes.push({ t: runStart * secPerHop, midi: curMidi })
    }
  }
  frames.forEach((midi, i) => {
    if (midi === curMidi) { runLen++; return }
    flush()
    curMidi = midi
    runLen = 1
    runStart = i
  })
  flush()
  return notes.filter(n => n.midi !== null)
}

/** Longest common subsequence length of two int arrays. */
function lcsLength(a, b) {
  const m = a.length, n = b.length
  if (!m || !n) return 0
  let prev = new Int32Array(n + 1)
  let cur = new Int32Array(n + 1)
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1] + 1
        : Math.max(prev[j], cur[j - 1])
    }
    ;[prev, cur] = [cur, prev]
  }
  return prev[n]
}

/**
 * Analyze a session recording against the notes the plan expected.
 *
 * @param {Blob} blob                the session recording
 * @param {number[]} expectedMidis   CONCERT-pitch midis in played order
 * @param {object} opts              { bpm } planned tempo (quarter notes)
 * @returns {Promise<{
 *   accuracyPct, timingPct, notesPerMin, plannedNotesPerMin,
 *   detectedCount, expectedCount, seconds } | null>}
 */
export async function analyzeRecording(blob, expectedMidis, { bpm = 88 } = {}) {
  if (!blob || !expectedMidis?.length) return null
  let decoded
  try { decoded = await decodeBlob(blob) }
  catch (e) { console.warn('decode failed:', e); return null }

  const { samples, sampleRate, duration } = decoded
  const secPerHop = HOP / sampleRate

  const frames = []
  for (let start = 0; start + WINDOW <= samples.length; start += HOP) {
    const freq = autoCorrelate(samples.subarray(start, start + WINDOW), sampleRate)
    frames.push(freq > 0 ? Math.round(freqToMidiFloat(freq)) : null)
  }

  const detected = segmentNotes(frames, secPerHop)
  if (!detected.length) {
    return {
      accuracyPct: 0, timingPct: 0, notesPerMin: 0,
      plannedNotesPerMin: bpm, detectedCount: 0,
      expectedCount: expectedMidis.length, seconds: duration,
    }
  }

  // Octave-tolerant sequence match on pitch classes.
  const expPc = expectedMidis.map(m => ((m % 12) + 12) % 12)
  const detPc = detected.map(n => ((n.midi % 12) + 12) % 12)
  const matched = lcsLength(expPc, detPc)
  const accuracyPct = Math.round(100 * Math.min(1, matched / expPc.length))

  // Pace vs plan: quarter notes at `bpm` ≈ bpm notes/minute while playing.
  // Use the active span (first→last detected note) to ignore setup silence.
  const activeSpan = Math.max(5, (detected[detected.length - 1].t - detected[0].t) || duration)
  const notesPerMin = Math.round(detected.length / activeSpan * 60)
  const timingPct = Math.max(0, Math.round(100 - (Math.abs(notesPerMin - bpm) / bpm) * 100))

  return {
    accuracyPct, timingPct, notesPerMin,
    plannedNotesPerMin: bpm,
    detectedCount: detected.length,
    expectedCount: expectedMidis.length,
    seconds: Math.round(duration),
  }
}

/** Map a 0–100 estimate onto the 1–5 critique scale. */
export function pctToScore(pct) {
  return Math.max(1, Math.min(5, Math.round(pct / 20)))
}
