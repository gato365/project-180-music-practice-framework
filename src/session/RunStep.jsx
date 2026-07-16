// ─────────────────────────────────────────────────────────────────────────────
// RunStep.jsx — play-along session runner (instrument in hand).
// Steps through the planned items group by group with dual timers, notation,
// fingerings (trumpet), and audible playback. ▶▶ Play-along chains all groups
// of the current item so the user can play with it continuously.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { KEY_COLORS } from '../theory/scales'
import { resolveItem } from '../theory/resolve'
import { useInstrumentAudio } from '../audio/useInstrumentAudio'
import GrandStaff from '../components/GrandStaff'
import NoteCards from '../components/NoteCards'
import TimerBar from '../components/TimerBar'

const sleep = ms => new Promise(r => setTimeout(r, ms))
const GROUP_GAP_MS = 700

export default function RunStep({ plan, items, inst, sessionStart, recording, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0)
  const [groupIdx, setGroupIdx] = useState(0)
  const [auto, setAuto] = useState(false)
  const [itemStart, setItemStart] = useState(Date.now())

  const resultsRef = useRef([])
  const autoTokenRef = useRef(null)
  const audio = useInstrumentAudio(inst)

  const item = items[itemIdx]
  const resolved = useMemo(() => (item ? resolveItem(item, inst) : null), [item, inst])
  const groups = resolved?.groups ?? []
  const group = groups[groupIdx]
  const color = item ? (KEY_COLORS[item.keyId] ?? '#c084fc') : '#c084fc'
  const isLastItem = itemIdx === items.length - 1
  const isLastGroup = groupIdx === groups.length - 1

  const stopAuto = useCallback(() => {
    if (autoTokenRef.current) autoTokenRef.current.cancelled = true
    autoTokenRef.current = null
    audio.stop()
    setAuto(false)
  }, [audio])

  useEffect(() => () => stopAuto(), [stopAuto])

  function recordResult(skipped) {
    resultsRef.current.push({
      id: item.id, kind: item.kind, keyId: item.keyId,
      scaleType: item.scaleType, form: item.form, patternId: item.patternId,
      seconds: Math.round((Date.now() - itemStart) / 1000),
      skipped,
    })
  }

  function advanceItem(skipped) {
    stopAuto()
    recordResult(skipped)
    if (isLastItem) {
      onComplete(resultsRef.current)
      return
    }
    setItemIdx(i => i + 1)
    setGroupIdx(0)
    setItemStart(Date.now())
  }

  function finishEarly() {
    stopAuto()
    // Count the current item if the user got into it at all.
    recordResult(groupIdx === 0)
    onComplete(resultsRef.current)
  }

  async function playGroup() {
    stopAuto()
    if (!group) return
    audio.playSequence(group.notes, { noteValue: plan.noteValue, bpm: plan.bpm })
  }

  async function playAlong() {
    stopAuto()
    const token = { cancelled: false }
    autoTokenRef.current = token
    setAuto(true)
    for (let g = groupIdx; g < groups.length; g++) {
      if (token.cancelled) return
      setGroupIdx(g)
      const ms = await audio.playSequence(groups[g].notes,
        { noteValue: plan.noteValue, bpm: plan.bpm })
      await sleep((ms ?? 0) + GROUP_GAP_MS)
      if (token.cancelled) return
    }
    autoTokenRef.current = null
    setAuto(false)
  }

  // Fallback: an item that can't resolve on this instrument is auto-skipped.
  useEffect(() => {
    if (item && !resolved) advanceItem(true)
  }, [item, resolved])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !resolved) return null

  const progress = (itemIdx + (groupIdx + 1) / Math.max(1, groups.length)) / items.length

  return (
    <div className="run-step">
      <TimerBar
        sessionStart={sessionStart}
        itemStart={itemStart}
        targetMinutes={plan.minutes}
        progress={progress}
        color={color}
        contextLabel={`${resolved.label} · ${resolved.sub} · group ${groupIdx + 1}/${groups.length}`}
      />

      {recording && <div className="rec-badge">● REC</div>}

      <div className="run-display">
        <div className="run-group-head">
          <span className="rg-label" style={{ color }}>{group.label}</span>
          <span className="rg-degrees">{group.degrees.join('  ')}</span>
          <span className="rg-dir">{group.direction === 'up' ? '▲ ascending' : '▼ descending'}</span>
        </div>

        <GrandStaff
          notes={group.notes}
          color={color}
          activeIndex={audio.activeIndex}
          peakIndex={group.direction === 'up' ? group.notes.length - 1 : -1}
          onNoteClick={n => audio.playNote(n, plan.noteValue)}
        />

        <NoteCards
          notes={group.notes}
          degrees={group.degrees}
          color={color}
          activeIndex={audio.activeIndex}
          showFingerings={inst.hasFingerings}
          onNoteClick={n => audio.playNote(n, plan.noteValue)}
        />
      </div>

      <div className="run-groups-map">
        {groups.map((g, i) => (
          <button key={i}
            className={`rg-chip ${i === groupIdx ? 'rg-chip--current' : i < groupIdx ? 'rg-chip--done' : ''}`}
            style={i === groupIdx ? { borderColor: color, color } : {}}
            onClick={() => { stopAuto(); setGroupIdx(i) }}>
            {g.label}
          </button>
        ))}
      </div>

      <div className="run-controls">
        {auto ? (
          <>
            <div className="run-auto-note" style={{ color }}>▶▶ playing along…</div>
            <button className="run-btn" onClick={stopAuto}>⏸ Pause</button>
          </>
        ) : (
          <>
            <button className="run-btn" onClick={playGroup}
              disabled={audio.isPlaying}>
              {audio.isPlaying ? '…' : '▶ Hear group'}
            </button>
            <button className="run-btn run-btn--accent" style={{ background: color }}
              onClick={playAlong}>
              ▶▶ Play along
            </button>
            {!isLastGroup ? (
              <button className="run-btn" onClick={() => setGroupIdx(g => g + 1)}>
                Next group →
              </button>
            ) : (
              <button className="run-btn run-btn--next"
                style={{ borderColor: color, color }}
                onClick={() => advanceItem(false)}>
                {isLastItem ? '✓ Finish items' : 'Next item →'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="run-item-strip">
        {items.map((it, i) => (
          <span key={it.id}
            className={`ri-dot ${i < itemIdx ? 'ri-dot--done' : i === itemIdx ? 'ri-dot--current' : ''}`}
            style={i === itemIdx ? { background: color } : {}}
            title={it.id} />
        ))}
        <span className="ri-count">{itemIdx + 1} / {items.length}</span>
        <button className="link-btn link-btn--dim" onClick={() => advanceItem(true)}>
          skip item
        </button>
        <button className="link-btn link-btn--dim" onClick={finishEarly}>
          finish early
        </button>
      </div>
    </div>
  )
}
