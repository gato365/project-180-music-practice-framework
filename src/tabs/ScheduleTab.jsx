// ─────────────────────────────────────────────────────────────────────────────
// ScheduleTab.jsx — the weekly schedule the planner derives daily plans from.
// The app ships a sensible default; click a day to cycle learn → review → rest.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'
import { DAY_NAMES, DAY_TYPES, DEFAULT_WEEKLY_SCHEDULE } from '../engine/weeklySchedule'
import { loadWeeklySchedule, saveWeeklySchedule } from '../state/settingsStore'

const CYCLE = ['learn', 'review', 'rest']

export default function ScheduleTab() {
  const [schedule, setSchedule] = useState(loadWeeklySchedule)
  const todayName = DAY_NAMES[new Date().getDay()]

  function cycleDay(day) {
    const cur = schedule[day] ?? 'learn'
    const next = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]
    const updated = { ...schedule, [day]: next }
    setSchedule(updated)
    saveWeeklySchedule(updated)
  }

  function resetDefault() {
    setSchedule({ ...DEFAULT_WEEKLY_SCHEDULE })
    saveWeeklySchedule({ ...DEFAULT_WEEKLY_SCHEDULE })
  }

  return (
    <div className="schedule-tab">
      <header className="tab-header">
        <h1>Weekly Schedule</h1>
        <p className="tab-sub">
          The planner reads today&rsquo;s day type when it builds your session:
          <strong> learn</strong> days surface neglected keys,
          <strong> review</strong> days reinforce what you touched this week,
          <strong> rest</strong> days keep it short if you practice anyway.
          Click a day to change it.
        </p>
      </header>

      <div className="sched-grid">
        {DAY_NAMES.map(day => {
          const type = schedule[day] ?? 'learn'
          const isToday = day === todayName
          return (
            <button key={day}
              className={`sched-day sched-day--${type} ${isToday ? 'sched-day--today' : ''}`}
              onClick={() => cycleDay(day)}>
              <span className="sched-day-name">
                {day.slice(0, 3)}
                {isToday && <em className="sched-today-badge">today</em>}
              </span>
              <span className="sched-day-type">{type}</span>
              <span className="sched-day-desc">
                {DAY_TYPES.find(t => t.id === type)?.desc}
              </span>
            </button>
          )
        })}
      </div>

      <button className="tool-btn" onClick={resetDefault}>
        ↺ Reset to default (Mon–Wed + Fri learn · Thu/Sat review · Sun rest)
      </button>
    </div>
  )
}
