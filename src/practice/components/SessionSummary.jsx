// ─────────────────────────────────────────────────────────────────────────────
// SessionSummary.jsx — session complete screen
//
// Displays time per pattern per scale, total session time.
// Saves session data to localStorage key 'scalePractice_sessions'.
// User can start a new session or review history.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { SCALES, PATTERNS }  from '../data/scales'
import { fmtMs }             from '../utils/noteUtils'

const LS_KEY = 'scalePractice_sessions'

function saveSession(results, config, sessionStart) {
  const totalMs  = Date.now() - sessionStart
  const session = {
    date:       new Date().toISOString(),
    scales:     config.selectedScales,
    noteValue:  config.noteValue,
    bpm:        config.bpm,
    sound:      config.sound,
    results,
    totalMs,
    totalLabel: fmtMs(totalMs),
  }
  try {
    const prev = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    prev.unshift(session)                       // newest first
    localStorage.setItem(LS_KEY, JSON.stringify(prev.slice(0, 50)))  // keep last 50
  } catch (e) {
    console.warn('Could not save session:', e)
  }
  return session
}

export default function SessionSummary({ results, config, sessionStart, onRestart }) {
  const [session, setSession] = useState(null)
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    const saved = saveSession(results, config, sessionStart)
    setSession(saved)
    try {
      const h = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
      setHistory(h)
    } catch {}
  }, [])

  if (!session) return null

  const totalMs = Date.now() - sessionStart

  // Group results by scale
  const byScale = config.selectedScales.map(k => ({
    key:   k,
    scale: SCALES[k],
    patterns: PATTERNS.map(p => ({
      id:    p.id,
      label: p.label,
      result: results.find(r => r.scale === k && r.pattern === p.id),
    })),
  }))

  return (
    <div className="summary-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="summary-header">
        <div>
          <h1 className="summary-title">Session Complete ✓</h1>
          <p className="summary-sub">
            {config.selectedScales.map(k => SCALES[k].name).join('  ·  ')}
            <span className="summary-sep">—</span>
            Total: <strong>{fmtMs(Date.now() - sessionStart)}</strong>
          </p>
        </div>
        <div className="summary-total-box">
          <span className="stb-label">Total Time</span>
          <span className="stb-val">{fmtMs(Date.now() - sessionStart)}</span>
        </div>
      </div>

      {/* ── Results table ──────────────────────────────────────────────── */}
      <div className="summary-tables">
        {byScale.map(({ key, scale, patterns }) => (
          <div key={key} className="summary-scale-block">
            <div
              className="ssb-header"
              style={{ borderColor: scale.color + '55', color: scale.color }}
            >
              {scale.name}
              <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: 10 }}>
                {scale.keySignature}
              </span>
            </div>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Pattern</th>
                  <th>Groups</th>
                  <th>Time</th>
                  <th>Avg / Group</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map(({ id, label, result }) => (
                  <tr key={id}>
                    <td style={{ color: scale.color }}>{label}</td>
                    <td>{result?.groups ?? '—'}</td>
                    <td className="td-time">
                      {result ? fmtMs(result.timeMs) : '—'}
                    </td>
                    <td className="td-time td-avg">
                      {result
                        ? fmtMs(result.timeMs / result.groups)
                        : '—'}
                    </td>
                  </tr>
                ))}
                {/* Scale subtotal */}
                <tr className="tr-subtotal">
                  <td colSpan={2}>Scale subtotal</td>
                  <td className="td-time">
                    {fmtMs(
                      patterns.reduce((s, p) => s + (p.result?.timeMs ?? 0), 0)
                    )}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="summary-actions">
        <button className="sum-btn sum-btn--primary" onClick={onRestart}>
          ▶ New Session
        </button>
        <button
          className="sum-btn sum-btn--ghost"
          onClick={() => setShowHistory(h => !h)}
        >
          {showHistory ? 'Hide History' : 'View Past Sessions'}
        </button>
      </div>

      {/* ── Session history ────────────────────────────────────────────── */}
      {showHistory && (
        <div className="session-history">
          <h2 className="sh-title">Past Sessions</h2>
          {history.length <= 1 ? (
            <p className="sh-empty">No past sessions yet.</p>
          ) : (
            <div className="sh-list">
              {history.slice(1).map((s, i) => (
                <div key={i} className="sh-row">
                  <span className="sh-date">
                    {new Date(s.date).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="sh-scales">
                    {(s.scales || []).map(k => SCALES[k]?.name).filter(Boolean).join(', ')}
                  </span>
                  <span className="sh-bpm">{s.bpm} BPM</span>
                  <span className="sh-total">{s.totalLabel ?? fmtMs(s.totalMs)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Practice tips footer ───────────────────────────────────────── */}
      <div className="summary-tips">
        <span className="tip-item">🖐 Fingerings (no instrument)</span>
        <span className="tip-sep">·</span>
        <span className="tip-item">🎷 Full saxophone playing</span>
        <span className="tip-sep">·</span>
        <span className="tip-item">🎯 Aim for 2 octaves</span>
      </div>
    </div>
  )
}
