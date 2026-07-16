// ─────────────────────────────────────────────────────────────────────────────
// useInstrumentAudio.js — Tone.js playback in the selected instrument's voice.
//
// Notes come in as WRITTEN pitch and are transposed to concert pitch using the
// instrument's own offset — trumpet sounds a major 2nd down, tenor sax a major
// 9th down — so the same written scale is HEARD in each horn's true register.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'
import { noteToMidi, midiToNote } from '../theory/notes.js'
import { DUR_BEATS } from '../engine/timeEstimator.js'

export function useInstrumentAudio(inst) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const instRef     = useRef(inst)
  const synthsRef   = useRef({})     // instrument id → { synth, filter }
  const timeoutsRef = useRef([])
  const genRef      = useRef(0)      // invalidates stale Draw callbacks
  instRef.current = inst

  const ensureStarted = useCallback(async () => {
    if (Tone.getContext().state !== 'running') await Tone.start()
  }, [])

  const getSynth = useCallback(() => {
    const def = instRef.current
    const cached = synthsRef.current[def.id]
    if (cached) return cached.synth
    const filter = new Tone.Filter({
      frequency: def.synth.filterFreq, type: 'lowpass', Q: def.synth.filterQ,
    }).toDestination()
    const synth = new Tone.Synth({
      oscillator: { type: def.synth.oscillator },
      envelope: def.synth.envelope,
      volume: def.synth.volume,
    }).connect(filter)
    synthsRef.current[def.id] = { synth, filter }
    return synth
  }, [])

  const toConcert = useCallback(written => {
    return midiToNote(noteToMidi(written) + instRef.current.concertOffset, 'sharp')
  }, [])

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }

  /** Play one written-pitch note. */
  const playNote = useCallback(async (written, duration = '4n', velocity = 1) => {
    await ensureStarted()
    try {
      getSynth().triggerAttackRelease(toConcert(written), duration, undefined, velocity)
    } catch (e) { console.warn('playNote:', e) }
  }, [ensureStarted, getSynth, toConcert])

  /**
   * Play a written-pitch sequence with live index highlighting.
   * Resolves (via onDone) after the last note rings out.
   * Returns the sequence duration in ms.
   */
  const playSequence = useCallback(async (notes, { noteValue = '4n', bpm = 88, onDone } = {}) => {
    await ensureStarted()
    const synth = getSynth()

    clearTimeouts()
    genRef.current += 1
    const gen = genRef.current

    setIsPlaying(true)
    setActiveIndex(-1)

    const noteSec = (60 / bpm) * (DUR_BEATS[noteValue] ?? 1)
    const now = Tone.now() + 0.08

    notes.forEach((written, i) => {
      try { synth.triggerAttackRelease(toConcert(written), noteValue, now + i * noteSec) }
      catch (e) { console.warn(`skip ${written}:`, e) }
      Tone.getDraw().schedule(() => {
        if (genRef.current === gen) setActiveIndex(i)
      }, now + i * noteSec)
    })

    const totalMs = (notes.length * noteSec + 0.35) * 1000
    const t = setTimeout(() => {
      if (genRef.current !== gen) return
      setIsPlaying(false)
      setActiveIndex(-1)
      onDone?.()
    }, totalMs)
    timeoutsRef.current.push(t)
    return totalMs
  }, [ensureStarted, getSynth, toConcert])

  const stop = useCallback(() => {
    genRef.current += 1
    clearTimeouts()
    Object.values(synthsRef.current).forEach(({ synth }) => {
      try { synth.triggerRelease() } catch { /* noop */ }
    })
    setIsPlaying(false)
    setActiveIndex(-1)
  }, [])

  useEffect(() => () => {
    clearTimeouts()
    Object.values(synthsRef.current).forEach(({ synth, filter }) => {
      try { synth.dispose(); filter.dispose() } catch { /* noop */ }
    })
    synthsRef.current = {}
  }, [])

  return { isPlaying, activeIndex, playNote, playSequence, stop, ensureStarted }
}
