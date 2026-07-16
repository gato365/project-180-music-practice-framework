// FingeringsApp.jsx — trumpet valve fingering chart
// React port of trumpet-scales.html (project-146). Written Bb-trumpet pitch;
// audio sounds concert pitch (written − 2 semitones).
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import './fingerings.css'
import { TRUMPET_FING as FING } from '../theory/instruments'

const KEYS = ['C','G','D','A','E','B','F','Bb','Eb','Ab','Db','F#']
const PC = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11,'E#':5,'B#':0,Fb:4 }
const LETTERS = ['C','D','E','F','G','A','B']
const LETTER_PC = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }
const MAJOR = [0,2,4,5,7,9,11,12]
const MINOR = [0,2,3,5,7,8,10,12]
const DEGREES = ['Root','2nd','3rd','4th','5th','6th','7th','Octave']

function spellScale(tonic, mode) {
  const ints = mode === 'major' ? MAJOR : MINOR
  const tonicLetter = tonic[0]
  const tonicPc = PC[tonic]
  let tonicMidi = 55
  for (let m = 55; m <= 66; m++) { if (m % 12 === tonicPc % 12) { tonicMidi = m; break } }
  const li = LETTERS.indexOf(tonicLetter)
  const notes = []
  for (let i = 0; i < 8; i++) {
    const letter = LETTERS[(li + i) % 7]
    const midi = tonicMidi + ints[i]
    const natural = LETTER_PC[letter]
    let diff = (midi % 12) - natural
    if (diff > 6) diff -= 12
    if (diff < -6) diff += 12
    const acc = diff === 0 ? '' : diff === 1 ? '♯' : diff === -1 ? '♭' : diff === 2 ? '𝄪' : '𝄫'
    notes.push({ name: letter, acc, midi })
  }
  return notes
}

const fingLabel = f => (f.length === 0 ? 'Open' : f.join(' – '))
const fingShort = f => (f.length === 0 ? 'open' : f.join('-'))

export default function FingeringsApp({ instrument = 'trumpet' }) {
  const [keyName, setKeyName] = useState('C')
  const [mode, setMode]       = useState('major')
  const [view, setView]       = useState('step')   // 'step' | 'chart'
  const [idx, setIdx]         = useState(0)
  const [sound, setSound]     = useState(false)
  const audioCtxRef = useRef(null)

  const scale = useMemo(() => spellScale(keyName, mode), [keyName, mode])

  useEffect(() => { setIdx(0) }, [keyName, mode])

  const playNote = useCallback((midi) => {
    if (!sound) return
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = audioCtxRef.current
    if (ctx.state === 'suspended') ctx.resume()
    // sound concert pitch: written − 2 semitones (Bb transposition)
    const freq = 440 * Math.pow(2, (midi - 2 - 69) / 12)
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const lp = ctx.createBiquadFilter()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    lp.type = 'lowpass'
    lp.frequency.value = freq * 4
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55)
    osc.connect(lp); lp.connect(gain); gain.connect(ctx.destination)
    osc.start(t); osc.stop(t + 0.6)
  }, [sound])

  const goTo = useCallback((i) => {
    const next = ((i % scale.length) + scale.length) % scale.length
    setIdx(next)
    playNote(scale[next].midi)
  }, [scale, playNote])

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + 1) }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(idx - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, goTo])

  const cur = scale[idx]
  const curFing = FING[cur.midi] ?? []

  return (
    <div className="fing-module">
      <header className="fing-header">
        <h1>Trumpet Scales</h1>
        <button
          className={`sound-btn ${sound ? 'on' : ''}`}
          onClick={() => { setSound(s => !s) }}
        >
          {sound ? 'Sound on' : 'Sound off'}
        </button>
      </header>

      {instrument === 'sax' && (
        <p className="fing-note">
          Saxophone fingering diagrams are on the roadmap — for now this chart shows
          trumpet valves. Written pitch is the same for both B♭ instruments.
        </p>
      )}

      <div className="keys">
        {KEYS.map(k => (
          <button
            key={k}
            className={`key-btn ${k === keyName ? 'active' : ''}`}
            onClick={() => setKeyName(k)}
          >
            {k.replace('b', '♭').replace('#', '♯')}
          </button>
        ))}
      </div>

      <div className="mode-row">
        {[['major', 'Major'], ['minor', 'Natural Minor']].map(([id, label]) => (
          <button
            key={id}
            className={`mode-btn ${mode === id ? 'active' : ''}`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="view-row">
        {[['step', 'Step Through'], ['chart', 'See All Notes']].map(([id, label]) => (
          <button
            key={id}
            className={`view-btn ${view === id ? 'active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'chart' ? (
        <div className="chart">
          {scale.map((n, i) => {
            const f = FING[n.midi] ?? []
            return (
              <button key={i} className="card" onClick={() => goTo(i)}>
                <div className="card-degree">{DEGREES[i]}</div>
                <div className="card-note">{n.name}{n.acc && <sup>{n.acc}</sup>}</div>
                <div className="mini-valves">
                  {[1, 2, 3].map(v => (
                    <div key={v} className={`mini-valve ${f.includes(v) ? 'on' : ''}`}>{v}</div>
                  ))}
                </div>
                <div className="card-fing">{fingLabel(f)}</div>
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <div
            className="stage"
            tabIndex={0}
            aria-label="Current note. Tap to go to next note."
            onClick={() => goTo(idx + 1)}
          >
            <div className="scale-label">
              {keyName} {mode === 'major' ? 'Major' : 'Natural Minor'}
            </div>
            <div className="note-name">{cur.name}{cur.acc && <sup>{cur.acc}</sup>}</div>
            <div className="fingering-text">{fingLabel(curFing)}</div>
            <div className="valves">
              {[1, 2, 3].map(v => (
                <div key={v} className={`valve ${curFing.includes(v) ? 'pressed' : ''}`}>
                  <div className="piston" />
                  <div className="valve-num">{v}</div>
                </div>
              ))}
            </div>
            <div className="tap-hint">Tap anywhere here for the next note</div>
          </div>

          <div className="strip">
            {scale.map((n, i) => {
              const f = FING[n.midi] ?? []
              return (
                <button
                  key={i}
                  className={`step ${i === idx ? 'current' : ''}`}
                  onClick={() => goTo(i)}
                >
                  <div className="step-note">{n.name}{n.acc}</div>
                  <div className="step-fing">{fingShort(f)}</div>
                </button>
              )
            })}
          </div>

          <div className="fing-nav">
            <button className="nav-btn" onClick={() => goTo(idx - 1)}>← Back</button>
            <button className="nav-btn primary" onClick={() => goTo(idx + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  )
}
