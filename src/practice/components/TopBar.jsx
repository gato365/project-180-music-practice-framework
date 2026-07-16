// ─────────────────────────────────────────────────────────────────────────────
// TopBar.jsx — horizontal control strip at top of page
// Pattern selector | Key selector | Notation mode | Weekly schedule strip
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { PATTERNS, SCALE_ORDER, SCALES, WEEKLY_SCHEDULE } from '../data/scales'

const NOTATION_MODES = [
  { id: 'staff',      label: 'Staff' },
  { id: 'staffNamed', label: 'Staff + Names' },
  { id: 'letter',     label: 'Letters' },
]

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function TopBar({
  selectedPattern, onPattern,
  selectedKey,     onKey,
  notationMode,    onNotation,
}) {
  const todayName = DAY_NAMES[new Date().getDay()]
  const scale     = SCALES[selectedKey]

  return (
    <header className="topbar">
      {/* ── Row 1: main controls ─────────────────────────────────────────── */}
      <div className="topbar-row topbar-row--main">

        {/* Brand */}
        <div className="tb-brand">
          <span className="tb-brand-icon">🎷</span>
          <div>
            <div className="tb-brand-title">Scale Practice</div>
            <div className="tb-brand-sub">Tenor Sax · Major / Ionian</div>
          </div>
        </div>

        <div className="tb-divider" />

        {/* Pattern */}
        <div className="tb-group">
          <span className="tb-group-label">Pattern</span>
          <div className="tb-pills">
            {PATTERNS.map(p => (
              <button
                key={p.id}
                className={`tb-pill ${selectedPattern === p.id ? 'tb-pill--active' : ''}`}
                style={selectedPattern === p.id ? { '--pill-color': scale.color } : {}}
                onClick={() => onPattern(p.id)}
                title={p.desc}
                aria-pressed={selectedPattern === p.id}
              >
                <span className="tb-pill-icon">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tb-divider" />

        {/* Practice Key */}
        <div className="tb-group">
          <span className="tb-group-label">Practice Key (Tenor Written)</span>
          <div className="tb-pills">
            {SCALE_ORDER.map(k => {
              const s      = SCALES[k]
              const active = k === selectedKey
              return (
                <button
                  key={k}
                  className={`tb-key-pill ${active ? 'tb-key-pill--active' : ''}`}
                  style={{
                    '--pill-color': s.color,
                    borderColor:     active ? s.color : 'transparent',
                    background:      active ? s.color + '28' : 'var(--surface3)',
                    color:           active ? s.color : 'var(--text-muted)',
                  }}
                  onClick={() => onKey(k)}
                  aria-pressed={active}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="tb-divider" />

        {/* Display mode */}
        <div className="tb-group">
          <span className="tb-group-label">Display</span>
          <div className="tb-pills">
            {NOTATION_MODES.map(m => (
              <button
                key={m.id}
                className={`tb-pill ${notationMode === m.id ? 'tb-pill--active' : ''}`}
                style={notationMode === m.id ? { '--pill-color': scale.color } : {}}
                onClick={() => onNotation(m.id)}
                aria-pressed={notationMode === m.id}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 2: info strip + weekly schedule ─────────────────────────── */}
      <div className="topbar-row topbar-row--info">
        {/* Current scale info */}
        <div className="tb-info">
          <span className="tb-info-name" style={{ color: scale.color }}>
            {scale.name}
          </span>
          <span className="tb-info-sep">·</span>
          <span className="tb-info-detail">{scale.keySignature}</span>
          <span className="tb-info-sep">·</span>
          <span className="tb-info-concert">Piano hears: {scale.concertName}</span>
        </div>

        <div className="tb-divider" />

        {/* Weekly schedule — compact */}
        <div className="tb-schedule">
          {WEEKLY_SCHEDULE.map(({ day, keys, type }) => {
            const isToday = day === todayName
            return (
              <div
                key={day}
                className={`tb-day ${isToday ? 'tb-day--today' : ''}`}
                title={`${day}${type === 'review' ? ' (Review)' : ''}`}
              >
                <span className="tb-day-name">{day.slice(0,3)}</span>
                {keys.length > 0 ? (
                  <div className="tb-day-keys">
                    {keys.map(k => (
                      <span
                        key={k}
                        className="tb-day-dot"
                        style={{ background: SCALES[k]?.color }}
                        title={SCALES[k]?.name}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="tb-day-rest">—</span>
                )}
                {type === 'review' && <span className="tb-day-rev">R</span>}
              </div>
            )
          })}
        </div>
      </div>
    </header>
  )
}
