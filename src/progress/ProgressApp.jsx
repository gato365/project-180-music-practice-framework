// ProgressApp.jsx — practice history & metrics over time
// Reads the same localStorage key the Practice module writes
// ('scalePractice_sessions'), so every finished session shows up here.
import React, { useMemo, useState } from 'react'
import './progress.css'
import { SCALES } from '../practice/data/scales'
import { fmtMs } from '../practice/utils/noteUtils'

const LS_KEY = 'scalePractice_sessions'
const DAYS_SHOWN = 14

function demoSessions() {
  const keys = ['Eb', 'E', 'Ab', 'B', 'Db', 'Gb']
  const out = []
  for (let i = 0; i < 12; i++) {
    if (i % 3 === 2) continue
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(9, 30, 0, 0)
    const totalMs = (5 + (i * 7) % 11) * 60000
    out.push({
      date: d.toISOString(),
      scales: [keys[i % 6], keys[(i + 1) % 6]],
      bpm: 80 + (i % 4) * 10,
      totalMs,
    })
  }
  return out
}

function loadSessions() {
  if (new URLSearchParams(window.location.search).get('demo') === '1') return demoSessions()
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') }
  catch { return [] }
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function computeStats(sessions) {
  const totalMs = sessions.reduce((s, x) => s + (x.totalMs ?? 0), 0)

  const now = new Date()
  const weekAgo = now.getTime() - 7 * 86400000
  const weekMs = sessions
    .filter(s => new Date(s.date).getTime() >= weekAgo)
    .reduce((s, x) => s + (x.totalMs ?? 0), 0)

  // Day streak: consecutive calendar days with >=1 session, ending today or yesterday
  const daysWithPractice = new Set(sessions.map(s => dayKey(new Date(s.date))))
  let streak = 0
  const cursor = new Date()
  if (!daysWithPractice.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (daysWithPractice.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return { totalMs, weekMs, streak, count: sessions.length }
}

function computeDaily(sessions) {
  const byDay = new Map()
  for (const s of sessions) {
    const k = dayKey(new Date(s.date))
    byDay.set(k, (byDay.get(k) ?? 0) + (s.totalMs ?? 0))
  }
  const days = []
  for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      date: d,
      label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
      full: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      minutes: Math.round((byDay.get(dayKey(d)) ?? 0) / 60000 * 10) / 10,
    })
  }
  return days
}

export default function ProgressApp() {
  const [sessions] = useState(loadSessions)
  const stats = useMemo(() => computeStats(sessions), [sessions])
  const daily = useMemo(() => computeDaily(sessions), [sessions])
  const maxMin = Math.max(...daily.map(d => d.minutes), 1)
  const peakIdx = daily.reduce((best, d, i) => (d.minutes > daily[best].minutes ? i : best), 0)

  return (
    <div className="progress-screen">
      <header className="prog-header">
        <h1>Progress</h1>
        <p className="prog-sub">
          How your practice is changing over time — time spent, sessions, and streaks.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="prog-empty">
          <p>No sessions logged yet.</p>
          <p className="prog-empty-hint">
            Finish a session in the <strong>Practice</strong> tab and it will show up here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Stat tiles ─────────────────────────────────────────────── */}
          <div className="stat-row">
            <div className="stat-tile">
              <span className="stat-label">Total practice</span>
              <span className="stat-val">{fmtMs(stats.totalMs)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Sessions</span>
              <span className="stat-val">{stats.count}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Last 7 days</span>
              <span className="stat-val">{fmtMs(stats.weekMs)}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Day streak</span>
              <span className="stat-val">{stats.streak}{stats.streak > 0 ? ' 🔥' : ''}</span>
            </div>
          </div>

          {/* ── Daily minutes chart ────────────────────────────────────── */}
          <div className="chart-block">
            <h2 className="chart-title">Minutes practiced per day — last {DAYS_SHOWN} days</h2>
            <div className="bar-chart" role="img"
              aria-label={`Bar chart of minutes practiced per day over the last ${DAYS_SHOWN} days`}>
              {daily.map((d, i) => (
                <button key={i} className="bar-col" type="button">
                  <span className="bar-tip">{d.full}: {d.minutes} min</span>
                  {i === peakIdx && d.minutes > 0 && (
                    <span className="bar-peak-label">{d.minutes}m</span>
                  )}
                  <span
                    className="bar-fill"
                    style={{ height: `${Math.max((d.minutes / maxMin) * 120, d.minutes > 0 ? 3 : 0)}px` }}
                  />
                  <span className="bar-day">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Session table ──────────────────────────────────────────── */}
          <div className="prog-table-block">
            <h2 className="chart-title">All sessions</h2>
            <table className="prog-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Scales</th>
                  <th>BPM</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i}>
                    <td>
                      {new Date(s.date).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      {(s.scales || []).map(k => SCALES[k]?.name ?? k).join(', ')}
                    </td>
                    <td>{s.bpm}</td>
                    <td className="td-dur">{s.totalLabel ?? fmtMs(s.totalMs ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
