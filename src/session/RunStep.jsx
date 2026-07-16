// ─────────────────────────────────────────────────────────────────────────────
// RunStep.jsx — play-along session runner (instrument in hand).
//
// The WHOLE item is on the page as notation — a one-octave scale shows all
// 16 notes, 8 up on one line and 8 down on the next (longer forms wrap the
// same way, breaking lines at direction changes). ▶ Auto-play walks through
// the entire lesson item by item, highlighting each note as it sounds so the
// user can mimic in real time. Tempo is adjustable mid-session.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useMemo, useEffect } from 'react'
import { KEY_COLORS } from '../theory/scales.js'
import { resolveItem } from '../theory/resolve.js'
import { noteDisplayName, parseNote, noteToMidi } from '../theory/notes.js'
import { trumpetFingering, fingeringLabel } from '../theory/instruments.js'
import { useInstrumentAudio } from '../audio/useInstrumentAudio.js'
import GrandStaff from '../components/GrandStaff'
import TimerBar from '../components/TimerBar'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const ITEM_GAP_MS = 1600          // breathe + read the next card between items
const MAX_NOTES_PER_LINE = 8

/** Flatten an item's groups into one run with musical line breaks. */
function flattenGroups(groups) {
  const notes = [], degrees = [], lineStarts = []
  let lineLen = 0, prevDir = null, peakIndex = -1
  for (const g of groups) {
    const dirChanged = prevDir !== null && g.direction !== prevDir
    if (notes.length > 0 && (dirChanged || lineLen + g.notes.length > MAX_NOTES_PER_LINE)) {
      lineStarts.push(notes.length)
      lineLen = 0
    }
    if (g.direction === 'up') peakIndex = notes.length + g.notes.length - 1
    notes.push(...g.notes)
    degrees.push(...g.degrees)
    lineLen += g.notes.length
    prevDir = g.direction
  }
  return { notes, degrees, lineStarts, peakIndex }
}

export default function RunStep({ plan, items, inst, sessionStart, recording, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0)
  const [bpm, setBpm] = useState(plan.bpm)
  const [auto, setAuto] = useState(false)
  const [showNames, setShowNames] = useState(true)
  const [itemStart, setItemStart] = useState(Date.now())

  const resultsRef = useRef([])
  const recordedRef = useRef(new Set())
  const autoTokenRef = useRef(null)
  const itemStartRef = useRef(Date.now())
  const bpmRef = useRef(plan.bpm)
  bpmRef.current = bpm
  const audio = useInstrumentAudio(inst)

  const item = items[itemIdx]
  const resolved = useMemo(() => (item ? resolveItem(item, inst) : null), [item, inst])
  const seq = useMemo(() => (resolved ? flattenGroups(resolved.groups) : null), [resolved])
  const color = item ? (KEY_COLORS[item.keyId] ?? '#c084fc') : '#c084fc'
  const isLastItem = itemIdx === items.length - 1

  function cancelAuto() {
    if (autoTokenRef.current) autoTokenRef.current.cancelled = true
    autoTokenRef.current = null
    audio.stop()
    setAuto(false)
  }

  useEffect(() => () => cancelAuto(), [])  // eslint-disable-line react-hooks/exhaustive-deps

  function beginItem(i) {
    setItemIdx(i)
    itemStartRef.current = Date.now()
    setItemStart(itemStartRef.current)
  }

  function recordItem(i, skipped) {
    const it = items[i]
    if (!it || recordedRef.current.has(it.id)) return
    recordedRef.current.add(it.id)
    resultsRef.current.push({
      id: it.id, kind: it.kind, keyId: it.keyId,
      scaleType: it.scaleType, form: it.form, patternId: it.patternId,
      seconds: Math.round((Date.now() - itemStartRef.current) / 1000),
      skipped,
    })
  }

  // ── One item, once (listen / play along freely) ────────────────────────────
  async function playItem() {
    cancelAuto()
    if (!seq) return
    audio.playSequence(seq.notes, { noteValue: plan.noteValue, bpm: bpmRef.current })
  }

  // ── The lesson, hands-free: item after item until the plan is done ────────
  async function autoPlayLesson() {
    cancelAuto()
    const token = { cancelled: false }
    autoTokenRef.current = token
    setAuto(true)
    for (let i = itemIdx; i < items.length; i++) {
      if (token.cancelled) return
      if (i !== itemIdx) beginItem(i)
      const r = resolveItem(items[i], inst)
      if (!r) { recordItem(i, true); continue }
      const { notes } = flattenGroups(r.groups)
      const ms = await audio.playSequence(notes,
        { noteValue: plan.noteValue, bpm: bpmRef.current })
      await sleep((ms ?? 0) + ITEM_GAP_MS)
      if (token.cancelled) return
      recordItem(i, false)
    }
    autoTokenRef.current = null
    setAuto(false)
    onComplete(resultsRef.current)
  }

  function nextItem(skipped) {
    cancelAuto()
    recordItem(itemIdx, skipped)
    if (isLastItem) {
      onComplete(resultsRef.current)
      return
    }
    beginItem(itemIdx + 1)
  }

  function finishEarly() {
    cancelAuto()
    // Count the current item unless it was barely opened.
    recordItem(itemIdx, Date.now() - itemStartRef.current < 8000)
    onComplete(resultsRef.current)
  }

  if (!item) return null
  if (!resolved || !seq) {
    // An item that can't resolve on this instrument shouldn't exist (the
    // planner checks) — skip defensively.
    return (
      <div className="run-step">
        <button className="run-btn" onClick={() => nextItem(true)}>Skip unavailable item →</button>
      </div>
    )
  }

  const playingNow = audio.activeIndex >= 0 ? {
    note: seq.notes[audio.activeIndex],
    degree: seq.degrees[audio.activeIndex],
  } : null
  const fing = playingNow && inst.hasFingerings
    ? trumpetFingering(noteToMidi(playingNow.note)) : null

  const itemFraction = audio.activeIndex >= 0
    ? (audio.activeIndex + 1) / seq.notes.length : 0
  const progress = (itemIdx + itemFraction) / items.length

  return (
    <div className="run-step">
      <TimerBar
        sessionStart={sessionStart}
        itemStart={itemStart}
        targetMinutes={plan.minutes}
        progress={progress}
        color={color}
        contextLabel={`${resolved.label} · ${resolved.sub} · item ${itemIdx + 1}/${items.length}`}
      />

      {recording && <div className="rec-badge">● REC</div>}

      <div className="run-display">
        <div className="run-group-head">
          <span className="rg-label" style={{ color }}>{resolved.label}</span>
          <span className="rg-degrees">{resolved.sub} · {seq.notes.length} notes</span>
          <span className="rg-dir">bright = ascending · dim = descending</span>
          <button
            className={`rg-chip ${showNames ? 'rg-chip--current' : ''}`}
            style={showNames ? { borderColor: color, color } : {}}
            onClick={() => setShowNames(s => !s)}>
            note names
          </button>
        </div>

        <GrandStaff
          notes={seq.notes}
          color={color}
          activeIndex={audio.activeIndex}
          peakIndex={seq.peakIndex}
          showNames={showNames}
          lineStarts={seq.lineStarts}
          onNoteClick={n => { if (!auto) audio.playNote(n, plan.noteValue) }}
        />
      </div>

      {/* ── Now playing — mimic this ─────────────────────────────────── */}
      <div className={`now-card ${playingNow ? 'now-card--live' : ''}`}
           style={playingNow ? { borderColor: color } : {}}>
        {playingNow ? (
          <>
            <span className="np-degree">degree {playingNow.degree}</span>
            <span className="np-note" style={{ color }}>
              {noteDisplayName(playingNow.note)}
              <sub className="np-oct">{parseNote(playingNow.note).octave}</sub>
            </span>
            {inst.hasFingerings && (
              <span className="np-fing">
                {[1, 2, 3].map(v => (
                  <span key={v}
                    className={`mini-valve-dot ${fing?.includes(v) ? 'on' : ''}`}
                    style={fing?.includes(v) ? { background: color, borderColor: color } : {}}>
                    {v}
                  </span>
                ))}
                <span className="np-fing-label">{fingeringLabel(fing)}</span>
              </span>
            )}
            <span className="np-hint">play this with it</span>
          </>
        ) : (
          <span className="np-idle">
            {auto
              ? 'breathe — next item coming up…'
              : '▶ Auto-play walks the whole lesson and highlights each note as it sounds — play along. Click any note on the staff to hear just it.'}
          </span>
        )}
      </div>

      <div className="run-controls">
        {auto ? (
          <>
            <div className="run-auto-note" style={{ color }}>
              ▶ auto-playing the lesson… item {itemIdx + 1} of {items.length}
            </div>
            <button className="run-btn" onClick={cancelAuto}>⏸ Pause</button>
          </>
        ) : (
          <>
            <button className="run-btn run-btn--accent" style={{ background: color }}
              onClick={autoPlayLesson}>
              ▶ Auto-play lesson
            </button>
            <button className="run-btn" onClick={playItem} disabled={audio.isPlaying}>
              {audio.isPlaying ? '…' : '▶ Play this item'}
            </button>
            <button className="run-btn run-btn--next"
              style={{ borderColor: color, color }}
              onClick={() => nextItem(false)}>
              {isLastItem ? '✓ Finish items' : 'Next item →'}
            </button>
          </>
        )}

        <div className="bpm-box">
          <button className="bpm-step" onClick={() => setBpm(b => Math.max(40, b - 4))}>−</button>
          <input
            className="bpm-input"
            type="number" min={40} max={200} step={4}
            value={bpm}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              if (!Number.isNaN(v)) setBpm(Math.max(40, Math.min(200, v)))
            }}
            aria-label="Tempo in BPM"
          />
          <button className="bpm-step" onClick={() => setBpm(b => Math.min(200, b + 4))}>+</button>
          <span className="bpm-unit">BPM</span>
        </div>
      </div>

      <div className="run-item-strip">
        {items.map((it, i) => (
          <span key={it.id}
            className={`ri-dot ${i < itemIdx ? 'ri-dot--done' : i === itemIdx ? 'ri-dot--current' : ''}`}
            style={i === itemIdx ? { background: color } : {}}
            title={it.id} />
        ))}
        <span className="ri-count">{itemIdx + 1} / {items.length}</span>
        <button className="link-btn link-btn--dim" onClick={() => nextItem(true)}>
          skip item
        </button>
        <button className="link-btn link-btn--dim" onClick={finishEarly}>
          finish early
        </button>
      </div>
    </div>
  )
}
