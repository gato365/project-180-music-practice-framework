// ─────────────────────────────────────────────────────────────────────────────
// WeeklySchedule.jsx — weekly rotation calendar with today highlighted
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { WEEKLY_SCHEDULE, SCALES } from '../data/scales'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function WeeklySchedule({ onSelectKey }) {
  const todayName = DAY_NAMES[new Date().getDay()]

  return (
    <div className="weekly-schedule">
      <h3 className="sidebar-section-title">Weekly Rotation</h3>
      <div className="schedule-grid">
        {WEEKLY_SCHEDULE.map(({ day, keys, type }) => {
          const isToday = day === todayName
          const isRest  = type === 'rest'

          return (
            <div
              key={day}
              className={`schedule-day ${isToday ? 'schedule-day--today' : ''} ${isRest ? 'schedule-day--rest' : ''}`}
            >
              <div className="day-header">
                <span className="day-name">{day.slice(0, 3)}</span>
                {isToday && <span className="today-badge">Today</span>}
                {type === 'review' && <span className="review-badge">Review</span>}
              </div>

              {isRest ? (
                <span className="rest-label">Rest / Free</span>
              ) : (
                <div className="day-keys">
                  {keys.map(k => (
                    <button
                      key={k}
                      className="day-key-btn"
                      style={{ '--key-color': SCALES[k]?.color }}
                      onClick={() => onSelectKey(k)}
                      title={`Practice ${SCALES[k]?.name}`}
                    >
                      {SCALES[k]?.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
