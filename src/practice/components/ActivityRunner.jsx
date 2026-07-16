// ─────────────────────────────────────────────────────────────────────────────
// ActivityRunner.jsx — Practice session engine
//
// Flow: for each selected scale → straight → 3rds → pentatonic
//   Within each pattern: AUTO-play groups in sequence using selected BPM/duration
//   Auto stops at each pattern boundary; user clicks [Next →] to continue
//   Timers run throughout; results recorded on pattern completion
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react'
import { SCALES, PATTERNS }       from '../data/scales'
import { getPatternGroups }        from '../utils/noteUtils'
import { useAudio }               from '../hooks/useAudio'
import TimerWidget                from './TimerWidget'
import GroupDisplay               from './GroupDisplay'
import GrandStaff                 from './GrandStaff'

export default function ActivityRunner({ config, onComplete }) {
  const {
    selectedScales, noteValue, bpm, sound, displayMode,
    breakMode, sessionStart,
  } = config

  // ── Core position state ───────────────────────────────────────────────────
  const [scaleIdx,   setScaleIdx]   = useState(0)
  const [patternIdx, setPatternIdx] = useState(0)
  const [groupIdx,   setGroupIdx]   = useState(0)

  // ── Timing ────────────────────────────────────────────────────────────────
  const patternStartRef = useRef(Date.now())
  const [patternStart,  setPatternStartState] = useState(Date.now())
  const resultsRef      = useRef([])

  // ── Audio ─────────────────────────────────────────────────────────────────
  const {
    isPlaying, currentIndex,
    setInstrument,
    playSequence, playNote, stop, initAudio,
  } = useAudio()

  // Sync instrument with config sound
  useEffect(() => {
    if (sound !== 'off') setInstrument(sound)
  }, [sound, setInstrument])

  // ── Auto-play state ───────────────────────────────────────────────────────
  const [autoMode, setAutoMode]   = useState(false)
  const autoModeRef               = useRef(false)
  const autoTimerRef              = useRef(null)

  function setAuto(val) {
    autoModeRef.current = val
    setAutoMode(val)
  }

  function clearAutoTimer() {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }

  // Compute total playback duration for N notes (mirrors useAudio's timeout)
  function seqDurationMs(noteCount) {
    const secPerBeat = 60 / bpm
    const durMap = { '1n': 4, '2n': 2, '4n': 1, '8n': 0.5, '16n': 0.25 }
    const noteSec = secPerBeat * (durMap[noteValue] ?? 1)
    return (noteCount * noteSec + 0.4) * 1000
  }

  // ── Start auto mode on mount ──────────────────────────────────────────────
  useEffect(() => {
    setAuto(true)
    return () => {
      setAuto(false)
      clearAutoTimer()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-play engine: fires on every position change while in auto mode ───
  useEffect(() => {
    if (!autoMode) return
    clearAutoTimer()

    let cancelled = false

    // Capture current group values now (not stale in callbacks)
    const notes       = currentGroup.notes
    const atBoundary  = isLastGroup
    const dur         = seqDurationMs(notes.length)
    const gapMs       = 300  // pause between groups after audio ends

    const run = async () => {
      if (sound !== 'off') {
        await initAudio()
        if (cancelled) return
        // Small pre-group lead-in so UI has time to settle
        await new Promise(r => { autoTimerRef.current = setTimeout(r, 80) })
        if (cancelled) return
        playSequence(notes, noteValue, bpm)
      }

      autoTimerRef.current = setTimeout(() => {
        if (cancelled) return
        if (atBoundary || breakMode) {
          // Pattern complete, or break-per-group mode — stop auto, let user continue
          autoModeRef.current = false
          setAutoMode(false)
        } else {
          setGroupIdx(g => g + 1)
        }
      }, dur + gapMs)
    }

    run()

    return () => {
      cancelled = true
      clearAutoTimer()
    }
  }, [autoMode, scaleIdx, patternIdx, groupIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived current state ─────────────────────────────────────────────────
  const currentScaleKey     = selectedScales[scaleIdx]
  const currentScale        = SCALES[currentScaleKey]
  const currentPatternId    = PATTERNS[patternIdx].id
  const currentPatternLabel = PATTERNS[patternIdx].label
  const groups              = getPatternGroups(currentPatternId, currentScale.notes)
  const currentGroup        = groups[groupIdx]

  const isLastGroup   = groupIdx   === groups.length   - 1
  const isLastPattern = patternIdx === PATTERNS.length  - 1
  const isLastScale   = scaleIdx   === selectedScales.length - 1

  // ── Manual play (while auto is paused) ───────────────────────────────────
  async function handlePlay() {
    if (sound === 'off') return
    if (isPlaying) { stop(); return }
    await initAudio()
    await playSequence(currentGroup.notes, noteValue, bpm)
  }

  // ── Click a single note card ──────────────────────────────────────────────
  async function handleNoteClick(noteStr) {
    if (sound === 'off') return
    await initAudio()
    await playNote(noteStr, noteValue)
  }

  // ── Record result for the current pattern ────────────────────────────────
  function recordPattern() {
    const now    = Date.now()
    const timeMs = now - patternStartRef.current
    resultsRef.current.push({
      scale:        currentScaleKey,
      scaleName:    currentScale.name,
      pattern:      currentPatternId,
      patternLabel: currentPatternLabel,
      groups:       groups.length,
      timeMs,
    })
    patternStartRef.current = now
    setPatternStartState(now)
  }

  // ── Next: only called at pattern boundaries; restarts auto mode ──────────
  function handleNext() {
    if (isPlaying) stop()
    clearAutoTimer()

    // If mid-pattern (auto was paused manually), just advance one group
    if (!isLastGroup) {
      setGroupIdx(g => g + 1)
      setAuto(true)
      return
    }

    // Last group of this pattern — record it
    recordPattern()

    if (!isLastPattern) {
      setPatternIdx(p => p + 1)
      setGroupIdx(0)
      setAuto(true)
      return
    }

    if (!isLastScale) {
      setScaleIdx(s => s + 1)
      setPatternIdx(0)
      setGroupIdx(0)
      setAuto(true)
      return
    }

    // All done!
    onComplete(resultsRef.current)
  }

  // ── Pause auto mode ───────────────────────────────────────────────────────
  function handlePause() {
    if (isPlaying) stop()
    clearAutoTimer()
    setAuto(false)
  }

  // ── Resume auto mode ──────────────────────────────────────────────────────
  function handleResume() {
    setAuto(true)
  }

  // ── Go back (stops auto) ──────────────────────────────────────────────────
  function handlePrev() {
    if (isPlaying) stop()
    clearAutoTimer()
    setAuto(false)
    if (groupIdx > 0) { setGroupIdx(g => g - 1); return }
    if (patternIdx > 0) {
      const prevGroups = getPatternGroups(PATTERNS[patternIdx-1].id, currentScale.notes)
      setPatternIdx(p => p - 1)
      setGroupIdx(prevGroups.length - 1)
    }
  }

  // ── Next button label (shown when auto is paused at a boundary) ───────────
  let nextLabel = 'Next Group →'
  if (isLastGroup && isLastPattern && isLastScale) nextLabel = '✓ Finish Session'
  else if (isLastGroup && isLastPattern)            nextLabel = `Next Scale: ${SCALES[selectedScales[scaleIdx+1]]?.name} →`
  else if (isLastGroup)                             nextLabel = `Next: ${PATTERNS[patternIdx+1]?.label} →`

  return (
    <div className="activity-runner">

      {/* ── Timer + progress strip ─────────────────────────────────────── */}
      <TimerWidget
        sessionStart={sessionStart}
        patternStart={patternStart}
        patternLabel={currentPatternLabel}
        scaleLabel={currentScale.name}
        groupNum={groupIdx + 1}
        totalGroups={groups.length}
        color={currentScale.color}
      />

      {/* ── Session progress breadcrumb ────────────────────────────────── */}
      <div className="ar-breadcrumb">
        {selectedScales.map((k, si) => (
          <div key={k} className="ar-bc-scale">
            <span
              className={`ar-bc-name ${si === scaleIdx ? 'ar-bc-name--current' : si < scaleIdx ? 'ar-bc-name--done' : ''}`}
              style={{ color: si <= scaleIdx ? SCALES[k].color : 'var(--dim)' }}
            >
              {si < scaleIdx ? '✓ ' : ''}{SCALES[k].name}
            </span>
            <div className="ar-bc-patterns">
              {PATTERNS.map((p, pi) => {
                const isDone    = si < scaleIdx || (si === scaleIdx && pi < patternIdx)
                const isCurrent = si === scaleIdx && pi === patternIdx
                return (
                  <span
                    key={p.id}
                    className={`ar-bc-dot ${isDone ? 'ar-bc-dot--done' : isCurrent ? 'ar-bc-dot--current' : ''}`}
                    style={isCurrent ? { background: SCALES[k].color } : {}}
                    title={p.label}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main display area ──────────────────────────────────────────── */}
      <div className="ar-display">
        {displayMode === 'letter' ? (
          <GroupDisplay
            notes={currentGroup.notes}
            degrees={currentGroup.degrees}
            label={currentGroup.label}
            direction={currentGroup.direction}
            color={currentScale.color}
            activeNote={currentIndex}
            isPlaying={isPlaying}
            onNoteClick={handleNoteClick}
          />
        ) : (
          <div className="ar-staff-wrap">
            <GrandStaff
              notes={currentGroup.notes}
              color={currentScale.color}
              activeIndex={currentIndex}
              peakIndex={currentGroup.direction === 'up' ? currentGroup.notes.length - 1 : -1}
              showNames={displayMode === 'staffNamed'}
              notesPerLine={8}
              onNoteClick={handleNoteClick}
            />
          </div>
        )}
      </div>

      {/* ── Pattern reference: all groups in this pattern ──────────────── */}
      <div className="ar-pattern-map">
        {groups.map((g, i) => (
          <button
            key={i}
            className={`ar-pm-group ${i === groupIdx ? 'ar-pm-group--current' : i < groupIdx ? 'ar-pm-group--done' : ''}`}
            style={i === groupIdx ? { borderColor: currentScale.color, color: currentScale.color } : {}}
            onClick={() => {
              if (isPlaying) stop()
              clearAutoTimer()
              setAuto(false)
              setGroupIdx(i)
            }}
            title={`Group ${g.label}: ${g.notes.join(' ')}`}
          >
            <span className="ar-pm-label">{g.label}</span>
            <span className="ar-pm-degrees">{g.degrees.join(' ')}</span>
          </button>
        ))}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="ar-controls">

        {autoMode ? (
          /* ── Auto-playing: show pause button ─────────────────────── */
          <>
            <div className="ar-auto-status" style={{ color: currentScale.color }}>
              ▶ Auto-playing {currentGroup.label}…
            </div>
            <button
              className="ar-btn ar-btn--ghost"
              onClick={handlePause}
            >
              ⏸ Pause
            </button>
          </>
        ) : (
          /* ── Paused: show normal controls ────────────────────────── */
          <>
            {/* Prev */}
            <button
              className="ar-btn ar-btn--ghost"
              onClick={handlePrev}
              disabled={scaleIdx === 0 && patternIdx === 0 && groupIdx === 0}
            >
              ← Prev
            </button>

            {/* Play (manual) */}
            {sound !== 'off' && (
              <button
                className={`ar-btn ar-btn--play ${isPlaying ? 'ar-btn--stop' : ''}`}
                style={!isPlaying ? { background: currentScale.color, color: '#0d0f17' } : {}}
                onClick={handlePlay}
              >
                {isPlaying ? '■ Stop' : `▶ Play ${currentGroup.notes.length} Notes`}
              </button>
            )}

            {sound === 'off' && (
              <div className="ar-sound-off">
                🔇 Sound off — click notes to preview
              </div>
            )}

            {/* Resume auto (mid-pattern) or Next (at boundary) */}
            {!isLastGroup ? (
              <button
                className="ar-btn ar-btn--next"
                style={{ borderColor: currentScale.color, color: currentScale.color }}
                onClick={handleResume}
              >
                {breakMode ? 'Next Group →' : '▶ Resume Auto'}
              </button>
            ) : (
              <button
                className="ar-btn ar-btn--next"
                style={{ borderColor: currentScale.color, color: currentScale.color }}
                onClick={handleNext}
              >
                {nextLabel}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Group pattern reference panel ──────────────────────────────── */}
      <div className="ar-info-strip">
        <div className="aris-label">
          {currentPatternLabel} — {currentGroup.direction === 'up' ? '▲ Ascending' : '▼ Descending'}
        </div>
        <div className="aris-seq">
          {currentGroup.degrees.join('  ')}
          <span className="aris-sep">→</span>
          {currentGroup.notes.map((n, i) => (
            <span
              key={i}
              className={`aris-note ${i === currentIndex ? 'aris-note--active' : ''}`}
              style={i === currentIndex ? { color: currentScale.color } : {}}
            >
              {n.replace(/\d/, '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
