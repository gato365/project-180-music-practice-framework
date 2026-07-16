// ─────────────────────────────────────────────────────────────────────────────
// TimerBar.jsx — dual live timers for the run screen:
//   left:  whole-session elapsed vs the chosen target (turns amber when over)
//   right: current item elapsed
// Plus a progress fill across the top.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export default function TimerBar({ sessionStart, itemStart, targetMinutes,
                                   progress = 0, contextLabel = '', color = '#c084fc' }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(id)
  }, [])

  const now = Date.now()
  const sessionMs = sessionStart ? now - sessionStart : 0
  const itemMs = itemStart ? now - itemStart : 0
  const targetMs = targetMinutes * 60000
  const over = sessionMs > targetMs

  return (
    <div className="timer-bar">
      <div className="tb-progress"><div className="tb-fill"
        style={{ width: `${Math.min(100, progress * 100)}%`, background: color }} /></div>
      <div className="tb-body">
        <div className="tb-context">{contextLabel}</div>
        <div className="tb-timers">
          <div className="tb-timer">
            <span className="tb-label">Session</span>
            <span className={`tb-val ${over ? 'tb-val--over' : ''}`}>
              {fmt(sessionMs)}<span className="tb-target"> / {targetMinutes}:00</span>
            </span>
          </div>
          <div className="tb-divider" />
          <div className="tb-timer">
            <span className="tb-label">This item</span>
            <span className="tb-val" style={{ color }}>{fmt(itemMs)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
