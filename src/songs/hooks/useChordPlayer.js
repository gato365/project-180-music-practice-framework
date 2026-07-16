// ─────────────────────────────────────────────────────────────────────────────
// useChordPlayer.js — Tone.js playback with per-chord highlighting
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'
import { chordToToneNotes, parseChord } from '../utils/chordUtils'

const SALAMANDER = {
  A0:'A0.mp3',C1:'C1.mp3','D#1':'Ds1.mp3','F#1':'Fs1.mp3',
  A1:'A1.mp3',C2:'C2.mp3','D#2':'Ds2.mp3','F#2':'Fs2.mp3',
  A2:'A2.mp3',C3:'C3.mp3','D#3':'Ds3.mp3','F#3':'Fs3.mp3',
  A3:'A3.mp3',C4:'C4.mp3','D#4':'Ds4.mp3','F#4':'Fs4.mp3',
  A4:'A4.mp3',C5:'C5.mp3','D#5':'Ds5.mp3','F#5':'Fs5.mp3',
  A5:'A5.mp3',C6:'C6.mp3', C7:'C7.mp3', C8:'C8.mp3',
}

// Tone note name for a single chord root at a given octave
function rootToneNote(chordSymbol, octave) {
  const notes = chordToToneNotes(chordSymbol, octave)
  return notes.length ? notes[0] : null
}

export function useChordPlayer() {
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [activeSlot,   setActiveSlot]   = useState(null)   // { sectionIdx, measureIdx, slotIdx }
  const [soundLoaded,  setSoundLoaded]  = useState(false)
  const [audioReady,   setAudioReady]   = useState(false)
  const [volume,       setVolume]       = useState(-12)     // dB

  const samplerRef   = useRef(null)
  const volNodeRef   = useRef(null)
  const timeoutRef   = useRef([])   // setTimeout IDs to cancel on stop
  // Generation counter — incremented on every play/stop so stale Draw
  // callbacks from a previous session silently no-op.
  const playGenRef   = useRef(0)

  // ── Initialise audio ──────────────────────────────────────────────────────
  const initAudio = useCallback(async () => {
    if (audioReady) return
    await Tone.start()
    setAudioReady(true)

    volNodeRef.current = new Tone.Volume(volume).toDestination()

    samplerRef.current = new Tone.Sampler({
      urls:    SALAMANDER,
      release: 2.0,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload:  () => setSoundLoaded(true),
    }).connect(volNodeRef.current)
  }, [audioReady, volume])

  // ── Volume control ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (volNodeRef.current) {
      volNodeRef.current.volume.value = volume
    }
  }, [volume])

  // ── Build a flat list of timed events from the standard's sections ─────────
  function buildEvents(standard, bpm) {
    const secPerBeat = 60 / bpm
    const events     = []
    let   cursor     = 0  // seconds from start

    standard.sections.forEach((section, si) => {
      section.measures.forEach((measure, mi) => {
        measure.forEach((slot, li) => {
          events.push({
            time:       cursor,
            sectionIdx: si,
            measureIdx: mi,
            slotIdx:    li,
            chord:      slot.chord,
            duration:   slot.beats * secPerBeat,
            beats:      slot.beats,
          })
          cursor += slot.beats * secPerBeat
        })
      })
    })

    return { events, totalDuration: cursor }
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  const play = useCallback(async (standard, bpm = 120, options = {}) => {
    const { loop = false, playHead = false } = options
    if (isPlaying) return
    await initAudio()
    const sampler = samplerRef.current
    if (!sampler) return

    // Bump generation — any pending Draw callbacks from a prior session
    // will check this and bail out.
    playGenRef.current += 1
    const myGen = playGenRef.current

    const { events, totalDuration } = buildEvents(standard, bpm)
    setIsPlaying(true)
    setActiveSlot(null)

    const now = Tone.now() + 0.1

    events.forEach(ev => {
      const t       = now + ev.time
      const release = Math.max(0.2, ev.duration - 0.05)

      // ── Chord voicing (mid register) ──────────────────────────────────
      const chordNotes = chordToToneNotes(ev.chord, 3)
      if (chordNotes.length) {
        try { sampler.triggerAttackRelease(chordNotes, release, t) } catch (_) {}
      }

      // ── Head melody: root in high register ────────────────────────────
      if (playHead) {
        const melNote = rootToneNote(ev.chord, 5)
        if (melNote) {
          // Play it slightly after the chord attack for a natural feel
          try { sampler.triggerAttackRelease(melNote, release, t + 0.04) } catch (_) {}
        }
      }

      // ── UI highlight (generation-guarded) ─────────────────────────────
      Tone.getDraw().schedule(() => {
        if (playGenRef.current !== myGen) return
        setActiveSlot({ sectionIdx: ev.sectionIdx, measureIdx: ev.measureIdx, slotIdx: ev.slotIdx })
      }, t)
    })

    // ── End of playback ───────────────────────────────────────────────────
    const endMs = (totalDuration + 0.4) * 1000
    const endT  = setTimeout(() => {
      if (playGenRef.current !== myGen) return   // already stopped
      if (loop) {
        // Restart: reset state then kick off again on next tick
        setIsPlaying(false)
        setActiveSlot(null)
        // Small gap so React can flush state before next play()
        setTimeout(() => play(standard, bpm, options), 50)
      } else {
        setIsPlaying(false)
        setActiveSlot(null)
      }
    }, endMs)
    timeoutRef.current.push(endT)

  }, [isPlaying, initAudio])

  // ── Stop ──────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    // Invalidate all pending Draw callbacks
    playGenRef.current += 1
    // Cancel end-of-playback timers
    timeoutRef.current.forEach(id => clearTimeout(id))
    timeoutRef.current = []
    if (samplerRef.current?.releaseAll) {
      try { samplerRef.current.releaseAll() } catch (_) {}
    }
    setIsPlaying(false)
    setActiveSlot(null)
  }, [])

  // ── Play a single chord (click preview) ───────────────────────────────────
  const previewChord = useCallback(async (chordSymbol) => {
    await initAudio()
    const sampler = samplerRef.current
    if (!sampler) return
    const notes = chordToToneNotes(chordSymbol, 3)
    if (notes.length) {
      try { sampler.triggerAttackRelease(notes, '2n', Tone.now() + 0.05) } catch (_) {}
    }
  }, [initAudio])

  useEffect(() => () => timeoutRef.current.forEach(clearTimeout), [])

  return {
    isPlaying, activeSlot, soundLoaded, audioReady,
    volume, setVolume,
    play, stop, previewChord, initAudio,
  }
}
