// ─────────────────────────────────────────────────────────────────────────────
// TimerWidget.jsx — dual running timers
//   Left:  total session elapsed
//   Right: current pattern elapsed
// Uses requestAnimationFrame via useEffect for smooth updates.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react'

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000)
  const min      = Math.floor(totalSec / 60)
  const sec      = (totalSec % 60).toString().padStart(2, '0')
  const tenths   = Math.floor((ms % 1000) / 100)
  return `${min}:${sec}.${tenths}`
}

/**
 * @param {number}  props.sessionStart  — Date.now() when session began
 * @param {number}  props.patternStart  — Date.now() when current pattern began
 * @param {string}  props.patternLabel  — e.g. "Straight Scale"
 * @param {string}  props.scaleLabel    — e.g. "E♭ Major"
 * @param {number}  props.groupNum      — current group (1-based)
 * @param {number}  props.totalGroups   — total groups in this pattern
 */
export default function TimerWidget({
  sessionStart,
  patternStart,
  patternLabel,
  scaleLabel,
  groupNum,
  totalGroups,
  color = '#c084fc',
}) {
  const [tick, setTick] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    let running = true
    function loop() {
      if (!running) return
      setTick(Date.now())
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const now         = Date.now()
  const sessionMs   = sessionStart ? now - sessionStart : 0
  const patternMs   = patternStart ? now - patternStart : 0
  const progress    = totalGroups > 0 ? groupNum / totalGroups : 0

  return (
    <div className="timer-widget">
      {/* Progress bar */}
      <div className="tw-progress-bar">
        <div
          className="tw-progress-fill"
          style={{ width: `${progress * 100}%`, background: color }}
        />
      </div>

      <div className="tw-body">
        {/* Context label */}
        <div className="tw-context">
          <span className="tw-scale" style={{ color }}>{scaleLabel}</span>
          <span className="tw-sep">·</span>
          <span className="tw-pattern">{patternLabel}</span>
          <span className="tw-sep">·</span>
          <span className="tw-group">
            Group {groupNum} / {totalGroups}
          </span>
        </div>

        {/* Timers */}
        <div className="tw-timers">
          <div className="tw-timer">
            <span className="tw-timer-label">Session</span>
            <span className="tw-timer-val">{formatTime(sessionMs)}</span>
          </div>
          <div className="tw-timer-divider" />
          <div className="tw-timer">
            <span className="tw-timer-label">Pattern</span>
            <span className="tw-timer-val" style={{ color }}>{formatTime(patternMs)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
