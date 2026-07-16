// ─────────────────────────────────────────────────────────────────────────────
// LetterNotation.jsx
// Displays scale notes as styled letter names only — no staff.
// Groups ascending and descending with visual separators.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { parseNote } from '../utils/noteUtils'

function NoteChip({ noteStr, isActive, color, onClick, index }) {
  const { letter, acc, octave } = parseNote(noteStr)
  const accSym = acc === '#' ? '♯' : acc === 'b' ? '♭' : acc === '##' ? '𝄪' : acc === 'bb' ? '𝄫' : ''

  return (
    <button
      className={`note-chip ${isActive ? 'note-chip--active' : ''}`}
      style={{
        '--chip-color':  color,
        borderColor:     isActive ? '#fff' : color + '66',
        backgroundColor: isActive ? color  : color + '18',
        boxShadow:       isActive ? `0 0 12px ${color}88` : 'none',
      }}
      onClick={() => onClick?.(noteStr)}
      aria-label={`Note ${letter}${acc} octave ${octave}, position ${index + 1}`}
    >
      <span className="chip-letter">{letter}</span>
      {accSym && <span className="chip-acc">{accSym}</span>}
      <span className="chip-oct">{octave}</span>
    </button>
  )
}

/**
 * @param {object} props
 * @param {string[]} props.ascending   - ascending note sequence
 * @param {string[]} props.descending  - descending note sequence
 * @param {number}   props.activeIndex - globally active index into full sequence
 * @param {string}   props.color       - accent colour
 * @param {function} props.onNoteClick
 */
export default function LetterNotation({
  ascending  = [],
  descending = [],
  activeIndex = -1,
  color = '#c084fc',
  onNoteClick,
}) {
  const ascLen = ascending.length

  return (
    <div className="letter-notation">
      {/* ── Ascending row ──────────────────────────────────────────────── */}
      <div className="notation-row">
        <span className="row-label row-label--asc">▲ Up</span>
        <div className="chip-row">
          {ascending.map((n, i) => (
            <React.Fragment key={`asc-${i}`}>
              <NoteChip
                noteStr={n}
                index={i}
                isActive={activeIndex === i}
                color={color}
                onClick={onNoteClick}
              />
              {i < ascending.length - 1 && (
                <span className="chip-arrow">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="notation-divider" style={{ borderColor: color + '44' }}>
        <span style={{ color: color + 'aa', fontSize: '18px' }}>↕</span>
      </div>

      {/* ── Descending row ─────────────────────────────────────────────── */}
      <div className="notation-row">
        <span className="row-label row-label--desc">▼ Down</span>
        <div className="chip-row">
          {descending.map((n, i) => (
            <React.Fragment key={`desc-${i}`}>
              <NoteChip
                noteStr={n}
                index={ascLen + i}
                isActive={activeIndex === ascLen + i}
                color={color + 'cc'}
                onClick={onNoteClick}
              />
              {i < descending.length - 1 && (
                <span className="chip-arrow">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
