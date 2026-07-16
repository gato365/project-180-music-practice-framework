// ─────────────────────────────────────────────────────────────────────────────
// SetupScreen.jsx — Configure and start a practice session
//
// User selects: which scales, note value, tempo, sound (default: sax),
// then clicks Start → enters the ActivityRunner.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { SCALES, SCALE_ORDER, PATTERNS, NOTE_VALUES, WEEKLY_SCHEDULE } from '../data/scales'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function SetupScreen({ onStart, lastSession }) {
  const todayName = DAY_NAMES[new Date().getDay()]
  const todayKeys = WEEKLY_SCHEDULE.find(s => s.day === todayName)?.keys ?? []

  const [selectedScales, setSelectedScales] = useState(
    todayKeys.length > 0 ? todayKeys : ['Eb', 'E']
  )
  const [noteValue, setNoteValue]   = useState('4n')
  const [bpm,       setBpm]         = useState(150)
  const [sound,     setSound]       = useState('sax')   // 'off' | 'sax' | 'piano'
  const [displayMode, setDisplayMode] = useState('letter') // 'letter' | 'staff' | 'staffNamed'
  const [breakMode, setBreakMode]   = useState(false)   // false = continuous, true = pause after each group

  function toggleScale(key) {
    setSelectedScales(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const canStart = selectedScales.length > 0

  // Estimate session time (rough: groups × note duration × note count)
  const durMap = { '1n':4,'2n':2,'4n':1,'8n':0.5,'16n':0.25 }
  const noteSec = (60 / bpm) * (durMap[noteValue] ?? 1)
  const totalPatternGroups = 4 + 8 + 10   // straight + thirds + pentatonic
  const avgNotesPerGroup   = 4
  const estSec = selectedScales.length * totalPatternGroups * avgNotesPerGroup * noteSec
  const estMin = Math.ceil(estSec / 60)

  return (
    <div className="setup-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="setup-header">
        <div className="setup-brand">
          <span className="setup-icon">🎷</span>
          <div>
            <h1 className="setup-title">Scale Practice</h1>
            <p className="setup-sub">Tenor Sax · Ionian / Major · Mental &amp; Physical</p>
          </div>
        </div>
        <div className="setup-est">
          <span className="est-label">Estimated session</span>
          <span className="est-value">~{estMin} min</span>
        </div>
      </div>

      <div className="setup-body">
        {/* ── Left column: Scale + Pattern ─────────────────────────────── */}
        <div className="setup-col">

          {/* Scale selection */}
          <div className="setup-section">
            <h2 className="setup-section-title">
              Select Scales
              <span className="setup-section-sub">written tenor pitch</span>
            </h2>
            <div className="scale-grid">
              {SCALE_ORDER.map(k => {
                const s      = SCALES[k]
                const active = selectedScales.includes(k)
                const isToday = todayKeys.includes(k)
                return (
                  <button
                    key={k}
                    className={`scale-select-btn ${active ? 'scale-select-btn--on' : ''}`}
                    style={{
                      '--sc': s.color,
                      borderColor:     active ? s.color : s.color + '33',
                      backgroundColor: active ? s.color + '22' : 'var(--surface2)',
                    }}
                    onClick={() => toggleScale(k)}
                    aria-pressed={active}
                  >
                    <span className="ssb-name" style={{ color: active ? s.color : 'var(--text)' }}>
                      {s.name}
                    </span>
                    <span className="ssb-sig">{s.keySignature}</span>
                    <span className="ssb-concert">{s.concertName}</span>
                    {isToday && <span className="ssb-today">Today</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pattern order (informational — always all 3) */}
          <div className="setup-section">
            <h2 className="setup-section-title">
              Pattern Order
              <span className="setup-section-sub">completed in sequence</span>
            </h2>
            <div className="pattern-order-list">
              {PATTERNS.map((p, i) => (
                <div key={p.id} className="pattern-order-item">
                  <span className="poi-num">{i + 1}</span>
                  <div>
                    <div className="poi-label">{p.label}</div>
                    <div className="poi-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column: Note value, Tempo, Sound, Display ──────────── */}
        <div className="setup-col">

          {/* Note value */}
          <div className="setup-section">
            <h2 className="setup-section-title">Note Value</h2>
            <div className="pill-row">
              {NOTE_VALUES.map(nv => (
                <button
                  key={nv.id}
                  className={`setup-pill ${noteValue === nv.id ? 'setup-pill--on' : ''}`}
                  onClick={() => setNoteValue(nv.id)}
                  aria-pressed={noteValue === nv.id}
                >
                  {nv.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo */}
          <div className="setup-section">
            <h2 className="setup-section-title">
              Tempo
              <span className="setup-section-sub">{bpm} BPM</span>
            </h2>
            <input
              type="range" min={30} max={200} step={2} value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="setup-slider"
              aria-valuenow={bpm}
            />
            <div className="slider-labels"><span>30</span><span>200 BPM</span></div>
          </div>

          {/* Sound */}
          <div className="setup-section">
            <h2 className="setup-section-title">Sound</h2>
            <div className="pill-row">
              {[
                { id: 'off',   label: '🔇 Off' },
                { id: 'sax',   label: '🎷 Sax' },
                { id: 'piano', label: '🎹 Piano' },
              ].map(s => (
                <button
                  key={s.id}
                  className={`setup-pill ${sound === s.id ? 'setup-pill--on' : ''}`}
                  onClick={() => setSound(s.id)}
                  aria-pressed={sound === s.id}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Display mode */}
          <div className="setup-section">
            <h2 className="setup-section-title">Display Mode</h2>
            <div className="pill-row pill-row--col">
              {[
                { id: 'letter',     label: 'Letters Only',     desc: '4 note names at a time — default' },
                { id: 'staff',      label: 'Staff Only',       desc: '8 notes per staff line'          },
                { id: 'staffNamed', label: 'Staff + Names',    desc: '8 notes with labels'             },
              ].map(m => (
                <button
                  key={m.id}
                  className={`setup-pill setup-pill--wide ${displayMode === m.id ? 'setup-pill--on' : ''}`}
                  onClick={() => setDisplayMode(m.id)}
                  aria-pressed={displayMode === m.id}
                >
                  <span>{m.label}</span>
                  <span className="pill-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Playback mode */}
          <div className="setup-section">
            <h2 className="setup-section-title">Playback Mode</h2>
            <div className="pill-row pill-row--col">
              {[
                { id: false, label: 'Continuous',      desc: 'Auto-advances through all groups — default' },
                { id: true,  label: 'Break per Group', desc: 'Pauses after every 4 notes' },
              ].map(m => (
                <button
                  key={String(m.id)}
                  className={`setup-pill setup-pill--wide ${breakMode === m.id ? 'setup-pill--on' : ''}`}
                  onClick={() => setBreakMode(m.id)}
                  aria-pressed={breakMode === m.id}
                >
                  <span>{m.label}</span>
                  <span className="pill-desc">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected scales summary */}
          {selectedScales.length > 0 && (
            <div className="setup-summary">
              <div className="summary-label">Session plan:</div>
              {selectedScales.map(k => (
                <div key={k} className="summary-scale" style={{ color: SCALES[k].color }}>
                  {SCALES[k].name} — Straight → 3rds → Pentatonic
                </div>
              ))}
            </div>
          )}

          {/* Start button */}
          <button
            className={`start-btn ${!canStart ? 'start-btn--disabled' : ''}`}
            onClick={() => canStart && onStart({ selectedScales, noteValue, bpm, sound, displayMode, breakMode })}
            disabled={!canStart}
          >
            {canStart ? '▶  Start Session' : 'Select at least one scale'}
          </button>

          {/* Last session info */}
          {lastSession && (
            <div className="last-session">
              <span className="ls-label">Last session:</span>
              <span className="ls-date">{new Date(lastSession.date).toLocaleDateString()}</span>
              <span className="ls-total">{lastSession.totalLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
