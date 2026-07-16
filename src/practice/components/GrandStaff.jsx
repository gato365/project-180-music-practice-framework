// ─────────────────────────────────────────────────────────────────────────────
// GrandStaff.jsx — SVG grand staff renderer
// 8 notes per line (per staff system), then starts a new system below.
// No separate treble clef glyph — drawn with simple geometric shapes.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import {
  parseNote, noteToStaffY, ledgerLineSteps, stepRelToY,
  TREBLE_BOT_Y, BASS_BOT_Y, HALF_STEP_Y,
} from '../utils/noteUtils'

const TREBLE_LINES  = [60, 72, 84, 96, 108]
const BASS_LINES    = [168, 180, 192, 204, 216]
const STAFF_H       = 270
const NOTE_RX       = 6.5
const NOTE_RY       = 4.8
const STEM_LEN      = 30
const LEDGER_HALF   = 10
const LINE_W        = 1.3
const NOTES_PER_LINE = 8   // 8 notes per staff system

function StaffLines({ xs, xe, lines }) {
  return lines.map(y => (
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

function FClef({ x }) {
  const ty = BASS_LINES[0]
  return (
    <g stroke="#4b5563" fill="none" strokeWidth={2} strokeLinecap="round">
      <path d={`M${x+8} ${ty+3} Q${x-5} ${ty+19} ${x+8} ${ty+34}`} />
      <circle cx={x+20} cy={ty+7}  r={3} fill="#4b5563" stroke="none" />
      <circle cx={x+20} cy={ty+19} r={3} fill="#4b5563" stroke="none" />
    </g>
  )
}

function LedgerLines({ x, stepRel, clef }) {
  return ledgerLineSteps(stepRel).map(s => {
    const ly = stepRelToY(s, clef)
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
        <text x={x} y={y+20} textAnchor="middle" fontSize="8.5" fill={fill} fontWeight="700">
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

// ── Single staff system (one group of up to NOTES_PER_LINE notes) ─────────────

function StaffSystem({ notes, color, activeIndex, globalOffset, showNames, peakIndex, onNoteClick }) {
  const n        = notes.length
  const LEFT_PAD = 65
  const perNote  = Math.max(32, Math.min(56, 560 / Math.max(n, 1)))
  const width    = Math.max(480, LEFT_PAD + n * perNote + 24)
  const xEnd     = width - 16
  const topY     = TREBLE_LINES[0]
  const botY     = BASS_LINES[4]

  const noteData = useMemo(() =>
    notes.map((noteStr, i) => {
      const gi = globalOffset + i
      const { y, clef, stepRel } = noteToStaffY(noteStr)
      const isAscending = gi <= peakIndex
      const fill        = isAscending ? color : color + 'aa'
      const direction   = stepRel < 4 ? 'up' : 'down'
      return { noteStr, x: LEFT_PAD + i * perNote, y, clef, stepRel, fill, direction, gi }
    }),
  [notes, color, peakIndex, globalOffset, perNote])

  return (
    <svg width={width} height={STAFF_H} viewBox={`0 0 ${width} ${STAFF_H}`}
         className="staff-svg" style={{ display:'block' }}>
      <StaffLines xs={28} xe={xEnd} lines={TREBLE_LINES} />
      <StaffLines xs={28} xe={xEnd} lines={BASS_LINES} />
      {[28, xEnd].map(bx => (
        <line key={bx} x1={bx} y1={topY} x2={bx} y2={botY}
              stroke="#4b5563" strokeWidth={1.8} />
      ))}
      <line x1={xEnd+4} y1={topY} x2={xEnd+4} y2={botY} stroke="#4b5563" strokeWidth={4.5} />
      <line x1={17} y1={topY} x2={17} y2={botY} stroke="#4b5563" strokeWidth={3} />
      <GClef x={30} />
      <FClef x={30} />
      {noteData.map(({ noteStr, x, y, clef, stepRel, fill, direction, gi }, i) => (
        <g key={`${noteStr}-${gi}`} onClick={() => onNoteClick?.(noteStr)}>
          <LedgerLines x={x} stepRel={stepRel} clef={clef} />
          <NoteHead x={x} y={y} fill={fill} isActive={activeIndex === gi}
            showName={showNames} noteStr={noteStr} direction={direction} seqNum={gi+1} />
        </g>
      ))}
    </svg>
  )
}

// ── Main export: splits notes into groups of NOTES_PER_LINE ──────────────────

export default function GrandStaff({ notes=[], color='#c084fc', activeIndex=-1, peakIndex=7, showNames=false, onNoteClick }) {
  if (!notes.length) return <div className="staff-empty">Select a key and pattern.</div>

  const chunks = []
  for (let i = 0; i < notes.length; i += NOTES_PER_LINE)
    chunks.push({ notes: notes.slice(i, i + NOTES_PER_LINE), offset: i })

  return (
    <div className="staff-scroll-outer">
      {chunks.map(({ notes: chunk, offset }) => (
        <div key={offset} className="staff-block-wrap" style={{ overflowX:'auto', marginBottom:'16px' }}>
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
