// ─────────────────────────────────────────────────────────────────────────────
// QuizRunner.jsx — No-Instrument session runner (from project-127's drill).
// Nothing here requires playing: read the notation, TAP the next note of the
// scale/pattern on the chromatic pad, hear it in the chosen horn's voice.
// Live accuracy feeds the session critique (there is no mic to grade).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { KEY_COLORS } from '../theory/scales'
import { resolveItem } from '../theory/resolve'
import { noteToMidi, midiToNote, noteDisplayName, pitchClass } from '../theory/notes'
import { useInstrumentAudio } from '../audio/useInstrumentAudio'
import GrandStaff from '../components/GrandStaff'
import TimerBar from '../components/TimerBar'

const FLAT_LABELS = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B']

export default function QuizRunner({ plan, items, inst, sessionStart, onComplete }) {
  const [itemIdx, setItemIdx] = useState(0)
  const [groupIdx, setGroupIdx] = useState(0)
  const [noteIdx, setNoteIdx] = useState(0)
  const [flash, setFlash] = useState(null)          // { pc, ok }
  const [hintPc, setHintPc] = useState(null)
  const [itemStart, setItemStart] = useState(Date.now())

  const resultsRef = useRef([])
  const statsRef = useRef({ firstTry: 0, total: 0, wrongOnCurrent: 0 })
  const audio = useInstrumentAudio(inst)

  const item = items[itemIdx]
  const resolved = useMemo(() => (item ? resolveItem(item, inst) : null), [item, inst])
  const groups = resolved?.groups ?? []
  const group = groups[groupIdx]
  const color = item ? (KEY_COLORS[item.keyId] ?? '#c084fc') : '#c084fc'

  // Pad labels: pitch classes in the current key use the key's own spelling.
  const padLabels = useMemo(() => {
    const labels = [...FLAT_LABELS]
    if (resolved) {
      for (const n of resolved.notes8) {
        labels[pitchClass(noteToMidi(n))] = noteDisplayName(n)
      }
    }
    return labels
  }, [resolved])

  const expected = group?.notes[noteIdx]
  const expectedPc = expected != null ? pitchClass(noteToMidi(expected)) : null

  const resetPerNote = useCallback(() => {
    statsRef.current.wrongOnCurrent = 0
    setHintPc(null)
  }, [])

  function recordCurrent(skipped) {
    const s = statsRef.current
    const acc = s.total > 0 ? Math.round((s.firstTry / s.total) * 100) : null
    resultsRef.current.push({
      id: item.id, kind: item.kind, keyId: item.keyId,
      scaleType: item.scaleType, form: item.form, patternId: item.patternId,
      seconds: Math.round((Date.now() - itemStart) / 1000),
      skipped,
      quizAccuracy: skipped ? null : acc,
    })
    statsRef.current = { firstTry: 0, total: 0, wrongOnCurrent: 0 }
  }

  function advanceItem(skipped) {
    recordCurrent(skipped)
    setNoteIdx(0)
    setGroupIdx(0)
    setHintPc(null)
    if (itemIdx === items.length - 1) {
      onComplete(resultsRef.current)
      return
    }
    setItemIdx(i => i + 1)
    setItemStart(Date.now())
  }

  function finishEarly() {
    recordCurrent(noteIdx === 0 && groupIdx === 0)
    onComplete(resultsRef.current)
  }

  function handleTap(pc) {
    if (expectedPc === null) return
    const s = statsRef.current
    if (pc === expectedPc) {
      s.total += 1
      if (s.wrongOnCurrent === 0) s.firstTry += 1
      resetPerNote()
      setFlash({ pc, ok: true })
      audio.playNote(expected, '8n')
      // advance within group / groups / item
      if (noteIdx + 1 < group.notes.length) {
        setNoteIdx(noteIdx + 1)
      } else if (groupIdx + 1 < groups.length) {
        setGroupIdx(groupIdx + 1)
        setNoteIdx(0)
      } else {
        advanceItem(false)
      }
    } else {
      s.wrongOnCurrent += 1
      if (s.wrongOnCurrent >= 2) setHintPc(expectedPc)
      setFlash({ pc, ok: false })
      // Hear the wrong pitch near the expected octave — educational.
      const near = noteToMidi(expected) + (((pc - expectedPc + 18) % 12) - 6)
      audio.playNote(midiToNote(near, 'flat'), '8n', 0.5)
    }
  }

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 220)
    return () => clearTimeout(t)
  }, [flash])

  // Auto-skip unresolvable items (planner shouldn't produce them).
  useEffect(() => {
    if (item && !resolved) advanceItem(true)
  }, [item, resolved])  // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !resolved || !group) return null

  const liveAcc = statsRef.current.total > 0
    ? Math.round((statsRef.current.firstTry / statsRef.current.total) * 100)
    : null
  const progress = (itemIdx + (groupIdx + noteIdx / group.notes.length) /
    Math.max(1, groups.length)) / items.length

  return (
    <div className="run-step quiz-step">
      <TimerBar
        sessionStart={sessionStart}
        itemStart={itemStart}
        targetMinutes={plan.minutes}
        progress={progress}
        color={color}
        contextLabel={`${resolved.label} · ${resolved.sub} · tap the notes in order`}
      />

      <div className="run-display">
        <div className="run-group-head">
          <span className="rg-label" style={{ color }}>{group.label}</span>
          <span className="rg-degrees">
            {group.degrees.map((d, i) => (
              <span key={i} className={`qz-deg ${i === noteIdx ? 'qz-deg--now' : i < noteIdx ? 'qz-deg--done' : ''}`}>
                {d}
              </span>
            ))}
          </span>
          {liveAcc !== null && (
            <span className="qz-acc" style={{ color }}>{liveAcc}% accuracy</span>
          )}
        </div>

        <GrandStaff
          notes={group.notes}
          color={color}
          activeIndex={noteIdx}
          peakIndex={group.direction === 'up' ? group.notes.length - 1 : -1}
          onNoteClick={n => audio.playNote(n, plan.noteValue)}
        />

        <div className="quiz-pads">
          {padLabels.map((label, pc) => (
            <button key={pc}
              className={[
                'quiz-pad',
                flash?.pc === pc ? (flash.ok ? 'quiz-pad--ok' : 'quiz-pad--bad') : '',
                hintPc === pc ? 'quiz-pad--hint' : '',
              ].join(' ')}
              onClick={() => handleTap(pc)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="run-controls">
        <button className="run-btn" onClick={() =>
          audio.playSequence(group.notes, { noteValue: plan.noteValue, bpm: plan.bpm })}>
          ▶ Hear this group
        </button>
        <div className="qz-progress-note">
          note {noteIdx + 1}/{group.notes.length} · group {groupIdx + 1}/{groups.length}
        </div>
      </div>

      <div className="run-item-strip">
        {items.map((it, i) => (
          <span key={it.id}
            className={`ri-dot ${i < itemIdx ? 'ri-dot--done' : i === itemIdx ? 'ri-dot--current' : ''}`}
            style={i === itemIdx ? { background: color } : {}} />
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
