// ─────────────────────────────────────────────────────────────────────────────
// SetupStep.jsx — the app's landing hero. Two choices only:
// instrument + session length. Everything else is the planner's job.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { INSTRUMENT_CHOICES } from '../theory/instruments'
import { KEY_COLORS } from '../theory/scales'
import { prettyName } from '../theory/notes'
import { peekToday } from '../engine/sessionPlanner'
import { dayTypeLabel } from '../engine/weeklySchedule'
import { loadWeeklySchedule } from '../state/settingsStore'

const MINUTE_CHOICES = [5, 10, 15]

export default function SetupStep({
  instrument, voice, onInstrument, onVoice,
  minutes, onMinutes, sessions, onBuild,
}) {
  const peek = useMemo(
    () => peekToday({ sessions, schedule: loadWeeklySchedule() }),
    [sessions]
  )

  const last = sessions[0]
  const lastAgo = last ? agoLabel(Date.parse(last.timestamp)) : null
  const today = new Date().toLocaleDateString(undefined,
    { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="setup-hero">
      <div className="hero-head">
        <div className="hero-date">{today}</div>
        <h1 className="hero-title">Today&rsquo;s Practice</h1>
        <div className="hero-meta">
          <span className={`day-chip day-chip--${peek.dayType}`}>
            {dayTypeLabel(peek.dayType)} day
          </span>
          <span className="hero-rotation">
            Up next in rotation:{' '}
            {peek.keys.map(k => (
              <span key={k} className="rot-key" style={{ color: KEY_COLORS[k] }}>
                {prettyName(k)}
              </span>
            ))}
          </span>
        </div>
      </div>

      <div className="hero-card">
        <div className="hero-q">
          <div className="hero-q-label">1 · Instrument</div>
          <div className="seg-row">
            {INSTRUMENT_CHOICES.map(c => (
              <button key={c.id}
                className={`seg-btn ${instrument === c.id ? 'seg-btn--on' : ''}`}
                onClick={() => onInstrument(c.id)}
                aria-pressed={instrument === c.id}>
                {c.label}
              </button>
            ))}
          </div>
          {instrument === 'none' && (
            <div className="voice-row">
              <span className="voice-label">Hear notes as</span>
              {[['sax', '🎷 Tenor Sax'], ['trumpet', '🎺 Trumpet']].map(([id, label]) => (
                <button key={id}
                  className={`voice-btn ${voice === id ? 'voice-btn--on' : ''}`}
                  onClick={() => onVoice(id)}
                  aria-pressed={voice === id}>
                  {label}
                </button>
              ))}
              <span className="voice-hint">
                playback range &amp; transposition follow the chosen horn
              </span>
            </div>
          )}
        </div>

        <div className="hero-q">
          <div className="hero-q-label">2 · How long do you have?</div>
          <div className="minute-row">
            {MINUTE_CHOICES.map(m => (
              <button key={m}
                className={`minute-btn ${minutes === m ? 'minute-btn--on' : ''}`}
                onClick={() => onMinutes(m)}
                aria-pressed={minutes === m}>
                <span className="minute-num">{m}</span>
                <span className="minute-unit">min</span>
              </button>
            ))}
          </div>
        </div>

        <button className="hero-start" onClick={onBuild}>
          Build my session →
        </button>
        <p className="hero-fine">
          The planner reads your history and picks today&rsquo;s keys, scale forms
          and patterns for you — rotating through all 12 keys over time.
        </p>
      </div>

      {last && (
        <div className="hero-last">
          Last session: {lastAgo} · {last.minutesActual ?? last.minutesTarget} min ·{' '}
          {(last.keys ?? []).map(prettyName).join(', ')}
        </div>
      )}
    </div>
  )
}

function agoLabel(ts) {
  const d = (Date.now() - ts) / 86400000
  if (d < 1) return 'today'
  if (d < 2) return 'yesterday'
  return `${Math.floor(d)} days ago`
}
