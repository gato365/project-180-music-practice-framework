// ─────────────────────────────────────────────────────────────────────────────
// GroupDisplay.jsx — the core cognitive training display
//
// Shows 4 notes at once (letter + accidental + degree number).
// The active note (currently playing) glows. Out-of-range notes are flagged.
// User mentally rehearses: see note → recall fingering → anticipate next.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { noteDisplayName, noteDisplayFull, isInTenorRange } from '../utils/noteUtils'

function NoteCard({ noteStr, degree, isActive, isPlaying, color, index, onClick }) {
  const display    = noteDisplayName(noteStr)
  const inRange    = isInTenorRange(noteStr)
  const letter     = display[0]
  const accidental = display.slice(1)

  return (
    <button
      className={`note-card ${isActive ? 'note-card--active' : ''} ${isPlaying ? 'note-card--playing' : ''}`}
      style={{
        '--card-color': color,
        borderColor:     isActive ? color : color + '44',
        backgroundColor: isActive ? color + '22' : 'var(--surface2)',
        boxShadow:       isActive ? `0 0 24px ${color}55, inset 0 0 0 1px ${color}` : 'none',
      }}
      onClick={() => onClick?.(noteStr)}
      aria-label={`Note ${display} degree ${degree}`}
    >
      {/* Sequence position */}
      <span className="card-seq">{index + 1}</span>

      {/* Note name — large */}
      <div className="card-note">
        <span className="card-letter" style={{ color: isActive ? color : 'var(--text)' }}>
          {letter}
        </span>
        {accidental && (
          <span className="card-acc" style={{ color: isActive ? color : 'var(--muted)' }}>
            {accidental}
          </span>
        )}
      </div>

      {/* Scale degree */}
      <div className="card-degree" style={{ color: isActive ? color : 'var(--dim)' }}>
        {degree}
      </div>

      {/* Out-of-range warning */}
      {!inRange && (
        <span className="card-warn" title="Outside standard tenor sax range (Bb3–F6)">⚠</span>
      )}
    </button>
  )
}

/**
 * @param {object}   props
 * @param {string[]} props.notes       — notes in this group (max 4)
 * @param {string[]} props.degrees     — scale degree labels ('1','3','2','4')
 * @param {string}   props.label       — group label ('i', 'A1', etc.)
 * @param {string}   props.direction   — 'up' | 'down'
 * @param {string}   props.color       — scale accent color
 * @param {number}   props.activeNote  — index of currently playing note (-1 = none)
 * @param {boolean}  props.isPlaying   — audio currently running
 * @param {function} props.onNoteClick — called with noteStr when card clicked
 */
export default function GroupDisplay({
  notes     = [],
  degrees   = [],
  label     = '',
  direction = 'up',
  color     = '#c084fc',
  activeNote  = -1,
  isPlaying   = false,
  onNoteClick,
}) {
  return (
    <div className="group-display">
      {/* Group label + direction indicator */}
      <div className="gd-header">
        <span className="gd-label">Group {label}</span>
        <span className="gd-dir" style={{ color: color + 'cc' }}>
          {direction === 'up' ? '▲ Ascending' : '▼ Descending'}
        </span>
        <span className="gd-count">{notes.length} notes</span>
      </div>

      {/* The 4 note cards */}
      <div className="gd-cards" data-count={notes.length}>
        {notes.map((noteStr, i) => (
          <NoteCard
            key={`${noteStr}-${i}`}
            noteStr={noteStr}
            degree={degrees[i] ?? '?'}
            isActive={activeNote === i}
            isPlaying={isPlaying && activeNote === i}
            color={color}
            index={i}
            onClick={onNoteClick}
          />
        ))}
      </div>

      {/* Written tenor note names below cards */}
      <div className="gd-names">
        {notes.map((n, i) => (
          <span
            key={i}
            className={`gd-name ${activeNote === i ? 'gd-name--active' : ''}`}
            style={{ color: activeNote === i ? color : 'var(--dim)' }}
          >
            {noteDisplayFull(n)}
          </span>
        ))}
      </div>
    </div>
  )
}
