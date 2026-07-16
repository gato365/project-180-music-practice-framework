// ─────────────────────────────────────────────────────────────────────────────
// NoteCards.jsx — big letter-notation cards for the current group.
// Click a card to hear that note. Shows degree above, valve fingering below
// when the instrument has fingerings (trumpet).
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { noteDisplayName, parseNote, noteToMidi } from '../theory/notes'
import { trumpetFingering, fingeringLabel } from '../theory/instruments'

export default function NoteCards({ notes = [], degrees = [], color = '#c084fc',
                                    activeIndex = -1, showFingerings = false,
                                    onNoteClick }) {
  return (
    <div className="note-cards">
      {notes.map((n, i) => {
        const { octave } = parseNote(n)
        const active = i === activeIndex
        const fing = showFingerings ? trumpetFingering(noteToMidi(n)) : null
        return (
          <button
            key={`${n}-${i}`}
            className={`note-card ${active ? 'note-card--active' : ''}`}
            style={{
              '--nc': color,
              borderColor: active ? color : undefined,
              boxShadow: active ? `0 0 18px ${color}66` : undefined,
            }}
            onClick={() => onNoteClick?.(n)}
            title={`Play ${n}`}
          >
            <span className="note-card-degree">{degrees[i] ?? ''}</span>
            <span className="note-card-name" style={{ color: active ? '#fff' : color }}>
              {noteDisplayName(n)}
              <sub className="note-card-oct">{octave}</sub>
            </span>
            {showFingerings && (
              <span className="note-card-fing">
                {fing ? (
                  <span className="mini-valves-row">
                    {[1, 2, 3].map(v => (
                      <span key={v}
                        className={`mini-valve-dot ${fing.includes(v) ? 'on' : ''}`}>
                        {v}
                      </span>
                    ))}
                  </span>
                ) : '—'}
                <span className="mini-valve-label">{fingeringLabel(fing)}</span>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
