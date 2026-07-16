// ─────────────────────────────────────────────────────────────────────────────
// GrandStaff.jsx — treble-staff SVG renderer (visual language from
// scale-practice, reworked for horn notation: everything sits on ONE treble
// staff with ledger lines above/below — written B3 hangs under middle C's
// ledger instead of jumping to a bass clef).
//
// Lines break where the caller says (`lineStarts`, e.g. at the ascent→descent
// turn) so a one-octave run reads as 8 notes up / 8 notes down.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import {
  parseNote, absStep, ledgerLineSteps,
  TREBLE_BOTTOM_ABS, TREBLE_BOT_Y, HALF_STEP_Y,
} from '../theory/notes.js'

const TREBLE_LINES  = [60, 72, 84, 96, 108]
const STAFF_H       = 196
const NOTE_RX       = 6.5
const NOTE_RY       = 4.8
const STEM_LEN      = 30
const LEDGER_HALF   = 10
const LINE_W        = 1.3
const NOTES_PER_LINE = 8

function trebleStaffY(noteStr) {
  const stepRel = absStep(noteStr) - TREBLE_BOTTOM_ABS
  return { y: TREBLE_BOT_Y - stepRel * HALF_STEP_Y, stepRel }
}

function StaffLines({ xs, xe }) {
  return TREBLE_LINES.map(y => (
    <line key={y} x1={xs} y1={y} x2={xe} y2={y}
          stroke="#374151" strokeWidth={LINE_W} />
  ))
}

function GClef({ x }) {
  return (
    <g stroke="#4b5563" fill="none" strokeWidth={1.7} strokeLinecap="round">
      <line x1={x+8} y1={TREBLE_BOT_Y-46} x2={x+8} y2={TREBLE_BOT_Y+24} />
      <path d={`M${x+8} ${TREBLE_BOT_Y-46} Q${x+21} ${TREBLE_BOT_Y-58} ${x+12} ${TREBLE_BOT_Y-40}`} />
      <ellipse cx={x+8} cy={TREBLE_BOT_Y-12} rx={7.5} ry={7} />
      <path d={`M${x+8} ${TREBLE_BOT_Y+24} Q${x-3} ${TREBLE_BOT_Y+27} ${x+4} ${TREBLE_BOT_Y+17}`} />
    </g>
  )
}

function LedgerLines({ x, stepRel }) {
  return ledgerLineSteps(stepRel).map(s => {
    const ly = TREBLE_BOT_Y - s * HALF_STEP_Y
    return <line key={s} x1={x-LEDGER_HALF} y1={ly} x2={x+LEDGER_HALF} y2={ly}
                 stroke="#4b5563" strokeWidth={LINE_W+0.2} />
  })
}

function NoteHead({ x, y, fill, isActive, showName, noteStr, direction, seqNum }) {
  const { acc } = parseNote(noteStr)
  const accSym  = acc === '#' ? '♯' : acc === 'b' ? '♭' : acc === '##' ? '𝄪' : acc === 'bb' ? '𝄫' : ''
  const stemX   = x + NOTE_RX * 0.82
  const stemTop = direction === 'up' ? y - STEM_LEN : y
  const stemBot = direction === 'up' ? y             : y + STEM_LEN
  return (
    <g style={{ cursor:'pointer' }}>
      <line x1={stemX} y1={stemTop} x2={stemX} y2={stemBot}
            stroke={isActive ? '#fff' : '#374151'} strokeWidth={1.4} />
      <ellipse cx={x} cy={y} rx={NOTE_RX} ry={NOTE_RY} transform={`rotate(-13,${x},${y})`}
        fill={isActive ? '#fff' : fill}
        stroke={isActive ? '#fff' : fill}
        strokeWidth={isActive ? 2 : 1}
        style={{ filter: isActive ? `drop-shadow(0 0 6px ${fill})` : 'none', transition:'all 0.08s' }}
      />
      {accSym && (
        <text x={x-NOTE_RX-3} y={y+4} textAnchor="end"
              fontSize="11" fill={isActive ? '#fff' : '#9ca3af'} fontWeight="bold">
          {accSym}
        </text>
      )}
      {showName && (
        <text x={x} y={y > 118 ? y + 16 : 152} textAnchor="middle"
              fontSize="8.5" fill={fill} fontWeight="700">
          {noteStr}
        </text>
      )}
      <text x={x} y={direction==='up' ? stemTop-3 : stemBot+10}
            textAnchor="middle" fontSize="7" fill={isActive ? '#fff' : '#6b7280'}>
        {seqNum}
      </text>
    </g>
  )
}

function StaffSystem({ notes, color, activeIndex, globalOffset, showNames, peakIndex, onNoteClick }) {
  const n        = notes.length
  const LEFT_PAD = 60
  const perNote  = Math.max(36, Math.min(60, 580 / Math.max(n, 1)))
  const width    = Math.max(420, LEFT_PAD + n * perNote + 24)
  const xEnd     = width - 16
  const topY     = TREBLE_LINES[0]
  const botY     = TREBLE_LINES[4]

  const noteData = useMemo(() =>
    notes.map((noteStr, i) => {
      const gi = globalOffset + i
      const { y, stepRel } = trebleStaffY(noteStr)
      const isAscending = gi <= peakIndex
      const fill        = isAscending ? color : color + 'aa'
      const direction   = stepRel < 4 ? 'up' : 'down'
      return { noteStr, x: LEFT_PAD + i * perNote, y, stepRel, fill, direction, gi }
    }),
  [notes, color, peakIndex, globalOffset, perNote])

  return (
    <svg width={width} height={STAFF_H} viewBox={`0 12 ${width} ${STAFF_H}`}
         className="staff-svg" style={{ display:'block' }}>
      <StaffLines xs={28} xe={xEnd} />
      {[28, xEnd].map(bx => (
        <line key={bx} x1={bx} y1={topY} x2={bx} y2={botY}
              stroke="#4b5563" strokeWidth={1.8} />
      ))}
      <line x1={xEnd+4} y1={topY} x2={xEnd+4} y2={botY} stroke="#4b5563" strokeWidth={4.5} />
      <GClef x={30} />
      {noteData.map(({ noteStr, x, y, stepRel, fill, direction, gi }) => (
        <g key={`${noteStr}-${gi}`} onClick={() => onNoteClick?.(noteStr)}>
          <LedgerLines x={x} stepRel={stepRel} />
          <NoteHead x={x} y={y} fill={fill} isActive={activeIndex === gi}
            showName={showNames} noteStr={noteStr} direction={direction} seqNum={gi+1} />
        </g>
      ))}
    </svg>
  )
}

export default function GrandStaff({ notes = [], color = '#c084fc', activeIndex = -1,
                                     peakIndex = 7, showNames = false, onNoteClick,
                                     lineStarts = null }) {
  if (!notes.length) return <div className="staff-empty">Nothing to show.</div>

  // lineStarts: explicit system-break indices (e.g. at ascent→descent), so a
  // one-octave run renders as exactly 8 notes up / 8 notes down.
  const chunks = []
  if (lineStarts?.length) {
    const starts = [...new Set(lineStarts.filter(s => s > 0 && s < notes.length))]
      .sort((a, b) => a - b)
    let prev = 0
    for (const s of [...starts, notes.length]) {
      if (s > prev) chunks.push({ notes: notes.slice(prev, s), offset: prev })
      prev = s
    }
  } else {
    for (let i = 0; i < notes.length; i += NOTES_PER_LINE)
      chunks.push({ notes: notes.slice(i, i + NOTES_PER_LINE), offset: i })
  }

  return (
    <div className="staff-scroll-outer">
      {chunks.map(({ notes: chunk, offset }) => (
        <div key={offset} className="staff-block-wrap" style={{ overflowX:'auto' }}>
          <StaffSystem
            notes={chunk} color={color}
            activeIndex={activeIndex} globalOffset={offset}
            showNames={showNames} peakIndex={peakIndex}
            onNoteClick={onNoteClick}
          />
        </div>
      ))}
    </div>
  )
}
