// ─────────────────────────────────────────────────────────────────────────────
// Sidebar.jsx — left panel: key selector, pattern, notation mode, info
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { SCALES, SCALE_ORDER, PATTERNS } from '../data/scales'
import WeeklySchedule from './WeeklySchedule'

const NOTATION_MODES = [
  { id: 'staff',      label: 'Staff Only',       icon: '𝄞' },
  { id: 'staffNamed', label: 'Staff + Names',     icon: '𝄞A' },
  { id: 'letter',     label: 'Letter Only',       icon: 'ABC' },
]

export default function Sidebar({
  selectedKey,
  onSelectKey,
  selectedPattern,
  onSelectPattern,
  notationMode,
  onNotationMode,
}) {
  const scale = SCALES[selectedKey]

  return (
    <aside className="sidebar">
      {/* ── App title ───────────────────────────────────────────────────── */}
      <div className="sidebar-brand">
        <span className="brand-icon">🎷</span>
        <div>
          <div className="brand-title">Scale Practice</div>
          <div className="brand-sub">Tenor Sax · Ionian / Major</div>
        </div>
      </div>

      {/* ── Key selection ───────────────────────────────────────────────── */}
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Practice Key</h3>
        <div className="key-grid">
          {SCALE_ORDER.map(k => {
            const s    = SCALES[k]
            const active = k === selectedKey
            return (
              <button
                key={k}
                className={`key-btn ${active ? 'key-btn--active' : ''}`}
                style={{
                  '--key-color': s.color,
                  borderColor:     active ? s.color : s.color + '44',
                  backgroundColor: active ? s.color + '33' : 'transparent',
                  boxShadow:       active ? `0 0 0 1px ${s.color}` : 'none',
                }}
                onClick={() => onSelectKey(k)}
                aria-pressed={active}
              >
                <span className="key-name" style={{ color: active ? s.color : '#e5e7eb' }}>
                  {s.name}
                </span>
                <span className="key-sig">{s.keySignature.split('—')[0].trim()}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Scale info card ─────────────────────────────────────────────── */}
      {scale && (
        <div className="scale-info-card" style={{ borderColor: scale.color + '55' }}>
          <div className="sic-row">
            <span className="sic-label">Key sig</span>
            <span className="sic-val">{scale.keySignature}</span>
          </div>
          <div className="sic-row">
            <span className="sic-label">Tenor (written)</span>
            <span className="sic-val" style={{ color: scale.color }}>{scale.saxWritten}</span>
          </div>
          <div className="sic-row">
            <span className="sic-label">Notes</span>
            <span className="sic-val sic-notes">
              {scale.notes.join(' · ')}
            </span>
          </div>
        </div>
      )}

      {/* ── Pattern selection ───────────────────────────────────────────── */}
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Pattern</h3>
        <div className="pattern-list">
          {PATTERNS.map(p => (
            <button
              key={p.id}
              className={`pattern-btn ${selectedPattern === p.id ? 'pattern-btn--active' : ''}`}
              style={selectedPattern === p.id ? { borderColor: scale?.color, color: scale?.color } : {}}
              onClick={() => onSelectPattern(p.id)}
              aria-pressed={selectedPattern === p.id}
            >
              <span className="pattern-icon">{p.icon}</span>
              <span>
                <div className="pattern-label">{p.label}</div>
                <div className="pattern-desc">{p.description}</div>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Notation mode ───────────────────────────────────────────────── */}
      <section className="sidebar-section">
        <h3 className="sidebar-section-title">Display</h3>
        <div className="notation-toggle">
          {NOTATION_MODES.map(m => (
            <button
              key={m.id}
              className={`notation-btn ${notationMode === m.id ? 'notation-btn--active' : ''}`}
              style={notationMode === m.id ? { backgroundColor: scale?.color + '33', color: scale?.color, borderColor: scale?.color } : {}}
              onClick={() => onNotationMode(m.id)}
              aria-pressed={notationMode === m.id}
            >
              <span className="nm-icon">{m.icon}</span>
              <span className="nm-label">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Weekly schedule ─────────────────────────────────────────────── */}
      <WeeklySchedule onSelectKey={onSelectKey} />

      {/* ── Practice tips ───────────────────────────────────────────────── */}
      <div className="tips-box">
        <div className="tips-title">Practice Modes</div>
        <ul className="tips-list">
          <li>🖐 Fingerings (no horn)</li>
          <li>🎷 Full saxophone playing</li>
          <li>🎯 Aim for 2 octaves</li>
        </ul>
      </div>
    </aside>
  )
}
