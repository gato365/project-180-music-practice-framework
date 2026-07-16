// ─────────────────────────────────────────────────────────────────────────────
// SummaryStep.jsx — what was practiced, saved confirmation, streak.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react'
import { KEY_COLORS, scaleName } from '../theory/scales'
import { formDef } from '../theory/forms'
import { patternDef } from '../theory/patterns'
import { prettyName } from '../theory/notes'

function dayKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

function computeStreak(sessions) {
  const days = new Set(sessions.map(s => dayKey(new Date(s.timestamp))))
  let streak = 0
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function SummaryStep({ record, sessions, recordingBlob, onDone }) {
  const streak = useMemo(
    () => computeStreak([record, ...sessions.filter(s => s.id !== record.id)]),
    [record, sessions]
  )
  const done = record.items.filter(it => !it.skipped)
  const scaleItems = done.filter(it => it.kind === 'scale')
  const patternItems = done.filter(it => it.kind === 'pattern')

  return (
    <div className="summary-step">
      <h2 className="step-title">Session saved ✓</h2>
      <p className="step-sub">
        {record.minutesActual} min practiced (target {record.minutesTarget}) ·
        day streak: {streak} {streak > 0 ? '🔥' : ''}
      </p>

      <div className="sum-grid">
        <div className="sum-block">
          <div className="sum-block-title">Scales</div>
          {scaleItems.length === 0 && <div className="sum-empty">none completed</div>}
          {scaleItems.map(it => (
            <div key={it.id} className="sum-line">
              <span className="sum-dot" style={{ background: KEY_COLORS[it.keyId] }} />
              {scaleName(it.keyId, it.scaleType)} — {formDef(it.form).label}
              <span className="sum-sec">{it.seconds}s</span>
            </div>
          ))}
        </div>

        <div className="sum-block">
          <div className="sum-block-title">Patterns</div>
          {patternItems.length === 0 && <div className="sum-empty">none completed</div>}
          {patternItems.map(it => (
            <div key={it.id} className="sum-line">
              <span className="sum-dot" style={{ background: KEY_COLORS[it.keyId] }} />
              {patternDef(it.patternId).label} in {prettyName(it.keyId)}
              <span className="sum-sec">{it.seconds}s</span>
            </div>
          ))}
        </div>

        <div className="sum-block">
          <div className="sum-block-title">Critique</div>
          {['accuracy', 'timing', 'tone', 'technique'].map(d => (
            <div key={d} className="sum-line sum-line--score">
              <span className="sum-dim">{d}</span>
              <span className="sum-stars">
                {'★'.repeat(record.critique?.[d] ?? 0)}{'☆'.repeat(5 - (record.critique?.[d] ?? 0))}
              </span>
            </div>
          ))}
          {record.critique?.auto && (
            <div className="sum-auto">
              auto estimate: {record.critique.auto.accuracyPct != null &&
                `pitch ${record.critique.auto.accuracyPct}%`}
              {record.critique.auto.timingPct != null &&
                ` · timing ${record.critique.auto.timingPct}%`}
            </div>
          )}
        </div>

        <div className="sum-block">
          <div className="sum-block-title">Tomorrow</div>
          <div className="sum-tomorrow">
            {record.reflection?.tomorrow?.trim() || 'Let the planner decide — it knows what’s due.'}
          </div>
          {recordingBlob && (
            <div className="sum-rec-note">🎙 Recording saved — listen back anytime in Progress.</div>
          )}
        </div>
      </div>

      <button className="run-start-btn" onClick={onDone}>Done</button>
    </div>
  )
}
