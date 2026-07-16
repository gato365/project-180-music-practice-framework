// ─────────────────────────────────────────────────────────────────────────────
// useAudio.js — Tone.js audio hook
// Written tenor pitch → transposed to concert pitch for playback
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import * as Tone from 'tone'
import { toConcertPitch } from '../utils/noteUtils'

const SALAMANDER_URLS = {
  A0:'A0.mp3',C1:'C1.mp3','D#1':'Ds1.mp3','F#1':'Fs1.mp3',
  A1:'A1.mp3',C2:'C2.mp3','D#2':'Ds2.mp3','F#2':'Fs2.mp3',
  A2:'A2.mp3',C3:'C3.mp3','D#3':'Ds3.mp3','F#3':'Fs3.mp3',
  A3:'A3.mp3',C4:'C4.mp3','D#4':'Ds4.mp3','F#4':'Fs4.mp3',
  A4:'A4.mp3',C5:'C5.mp3','D#5':'Ds5.mp3','F#5':'Fs5.mp3',
  A5:'A5.mp3',C6:'C6.mp3','D#6':'Ds6.mp3','F#6':'Fs6.mp3',
  A7:'A7.mp3',C8:'C8.mp3',
}

export function useAudio() {
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [instrument,   setInstrument]   = useState('sax')
  const [pianoLoaded,  setPianoLoaded]  = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)

  const pianoRef    = useRef(null)
  const saxRef      = useRef(null)
  const filterRef   = useRef(null)
  const timeoutsRef = useRef([])

  const initAudio = useCallback(async () => {
    if (audioStarted) return
    await Tone.start()
    setAudioStarted(true)

    // Piano sampler (Salamander Grand, concert pitch)
    pianoRef.current = new Tone.Sampler({
      urls: SALAMANDER_URLS,
      release: 1.2,
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      onload: () => setPianoLoaded(true),
    }).toDestination()

    // Sax synth — sawtooth + low-pass filter for reed character
    filterRef.current = new Tone.Filter({ frequency: 2000, type: 'lowpass', Q: 3 }).toDestination()
    saxRef.current = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.05, decay: 0.1, sustain: 0.75, release: 0.7 },
      volume: -4,
    }).connect(filterRef.current)
  }, [audioStarted])

  const getInst = useCallback(() =>
    instrument === 'piano' ? pianoRef.current : saxRef.current,
  [instrument])

  // Play a single note (written pitch → transposed to concert for audio)
  const playNote = useCallback(async (writtenNote, duration = '4n') => {
    await initAudio()
    const inst = getInst()
    if (!inst) return
    try { inst.triggerAttackRelease(toConcertPitch(writtenNote), duration) }
    catch(e) { console.warn('playNote:', e) }
  }, [initAudio, getInst])

  // Play a sequence with live index highlighting
  const playSequence = useCallback(async (notes, noteValue = '4n', bpm = 80) => {
    if (isPlaying) return
    await initAudio()
    const inst = getInst()
    if (!inst) return

    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    Tone.Transport.bpm.value = bpm
    setIsPlaying(true)
    setCurrentIndex(0)

    const secPerBeat = 60 / bpm
    const durMap = { '1n':4,'2n':2,'4n':1,'8n':0.5,'16n':0.25 }
    const noteSec = secPerBeat * (durMap[noteValue] ?? 1)
    const now = Tone.now() + 0.05

    notes.forEach((note, i) => {
      try { inst.triggerAttackRelease(toConcertPitch(note), noteValue, now + i * noteSec) }
      catch(e) { console.warn(`Skip ${note}:`, e) }

      Tone.getDraw().schedule(() => setCurrentIndex(i), now + i * noteSec)
    })

    const t = setTimeout(() => {
      setIsPlaying(false)
      setCurrentIndex(-1)
    }, (notes.length * noteSec + 0.4) * 1000)
    timeoutsRef.current.push(t)
  }, [isPlaying, initAudio, getInst])

  const stop = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    const inst = getInst()
    if (inst?.releaseAll) inst.releaseAll()
    setIsPlaying(false)
    setCurrentIndex(-1)
  }, [getInst])

  useEffect(() => () => timeoutsRef.current.forEach(clearTimeout), [])

  return { isPlaying, currentIndex, instrument, setInstrument,
           pianoLoaded, audioStarted, playNote, playSequence, stop, initAudio }
}
