// ─────────────────────────────────────────────────────────────────────────────
// ProgressTab.jsx — how practice is changing over time.
//
// The coverage view is the planner's mirror: it colors each of the 12 keys and
// 5 patterns by how recently they were practiced, using the SAME stats the
// planner ranks against — what looks neglected here is what gets scheduled next.
//
// Charts follow the dataviz method: single-hue bars for magnitude, a validated
// 3-hue categorical set for the reflection trend lines (#3987e5/#199e70/#c98500,
// CVD ΔE 41 on this surface), a monotone-lightness sequential ramp for coverage
// cells with visible labels as the relief channel, and a real table view.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, useState } from 'react'
import { KEY_IDS, SCALE_TYPE_IDS, scaleType } from '../theory/scales'
import { PATTERNS } from '../theory/patterns'
import { prettyName } from '../theory/notes'
import { coverageStats, daysSince } from '../engine/coverage'
import { getRecording } from '../state/audioStore'

const DAYS_SHOWN = 14
const BAR_HUE = '#c084fc'                    // single series → one hue, no legend
const TREND = [                              // validated categorical trio (dark)
  { id: 'improved',  label: 'Improved',       color: '#3987e5' },
  { id: 'needsWork', label: 'Needs work',     color: '#c98500' },
  { id: 'tomorrow',  label: 'Tomorrow clear', color: '#199e70' },
]
// Sequential freshness ramp (monotone lightness, bright = recent, recedes = old)
const FRESH_RAMP = ['#cd93ff', '#a875e6', '#8659c2', '#64419a', '#453064']

function freshColor(days) {
  if (days === null) return null            // "never" is a distinct no-data state
  if (days <= 1) return FRESH_RAMP[0]
  if (days <= 3) return FRESH_RAMP[1]
  if (days <= 7) return FRESH_RAMP[2]
  if (days <= 14) return FRESH_RAMP[3]
  return FRESH_RAMP[4]
}

function agoShort(days) {
  if (days === null) return '—'
  if (days < 1) return 'today'
  return `${Math.round(days)}d`
}

function dayKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }

function fmtMin(min) {
  if (min < 60) return `${Math.round(min)}m`
  return `${Math.floor(min / 60)}h ${Math.round(min % 60)}m`
}

// ── Recording playback cell ─────────────────────────────────────────────────

function RecordingCell({ recordingId }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  if (!recordingId) return <span className="pt-norec">—</span>
  if (url) return <audio controls src={url} className="pt-audio" />
  return (
    <button className="link-btn" disabled={loading} onClick={async () => {
      setLoading(true)
      const blob = await getRecording(recordingId)
      if (blob) setUrl(URL.createObjectURL(blob))
      setLoading(false)
    }}>
      {loading ? '…' : '▶ listen'}
    </button>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────

export default function ProgressTab({ sessions }) {
  const now = Date.now()
  const cov = useMemo(() => coverageStats(sessions, now), [sessions, now])

  const stats = useMemo(() => {
    const totalMin = sessions.reduce((s, x) => s + (x.minutesActual ?? 0), 0)
    const weekAgo = now - 7 * 86400000
    const weekMin = sessions
      .filter(s => Date.parse(s.timestamp) >= weekAgo)
      .reduce((s, x) => s + (x.minutesActual ?? 0), 0)
    const days = new Set(sessions.map(s => dayKey(new Date(s.timestamp))))
    let streak = 0
    const cursor = new Date()
    if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (days.has(dayKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1) }
    return { totalMin, weekMin, streak, count: sessions.length }
  }, [sessions, now])

  const daily = useMemo(() => {
    const byDay = new Map()
    for (const s of sessions) {
      const k = dayKey(new Date(s.timestamp))
      byDay.set(k, (byDay.get(k) ?? 0) + (s.minutesActual ?? 0))
    }
    const out = []
    for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      out.push({
        label: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
        full: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        minutes: Math.round((byDay.get(dayKey(d)) ?? 0) * 10) / 10,
      })
    }
    return out
  }, [sessions])

  const trend = useMemo(() => {
    const withScores = [...sessions]
      .filter(s => s.reflection?.scores)
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
      .slice(-12)
    return withScores.map(s => ({
      t: s.timestamp,
      improved: s.reflection.scores.improved ?? null,
      needsWork: s.reflection.scores.needsWork ?? null,
      tomorrow: s.reflection.scores.tomorrow ?? null,
    }))
  }, [sessions])

  const critAvg = useMemo(() => {
    const recent = sessions.filter(s => s.critique).slice(0, 10)
    const dims = ['accuracy', 'timing', 'tone', 'technique']
    return dims.map(d => {
      const vals = recent.map(s => s.critique[d]).filter(v => v != null)
      return { dim: d, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null }
    })
  }, [sessions])

  const maxMin = Math.max(...daily.map(d => d.minutes), 1)
  const peakIdx = daily.reduce((b, d, i) => (d.minutes > daily[b].minutes ? i : b), 0)

  if (sessions.length === 0) {
    return (
      <div className="progress-tab">
        <header className="tab-header"><h1>Progress</h1></header>
        <div className="pt-empty">
          <p>No sessions yet.</p>
          <p className="pt-empty-hint">Finish your first guided session and everything
          lights up here — time, streaks, and key coverage.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="progress-tab">
      <header className="tab-header">
        <h1>Progress</h1>
        <p className="tab-sub">Time, coverage and self-assessment over time. The
          coverage grid is exactly what the planner reads — dim keys come up next.</p>
      </header>

      {/* ── Stat tiles ─────────────────────────────────────────────────── */}
      <div className="stat-row">
        <div className="stat-tile"><span className="stat-label">Total practice</span>
          <span className="stat-val">{fmtMin(stats.totalMin)}</span></div>
        <div className="stat-tile"><span className="stat-label">Sessions</span>
          <span className="stat-val">{stats.count}</span></div>
        <div className="stat-tile"><span className="stat-label">Last 7 days</span>
          <span className="stat-val">{fmtMin(stats.weekMin)}</span></div>
        <div className="stat-tile"><span className="stat-label">Day streak</span>
          <span className="stat-val">{stats.streak}{stats.streak > 0 ? ' 🔥' : ''}</span></div>
      </div>

      {/* ── Minutes per day ────────────────────────────────────────────── */}
      <section className="pt-block">
        <h2 className="pt-title">Minutes per day — last {DAYS_SHOWN} days</h2>
        <div className="bar-chart" role="img"
             aria-label={`Minutes practiced per day over the last ${DAYS_SHOWN} days`}>
          {daily.map((d, i) => (
            <div key={i} className="bar-col" title={`${d.full}: ${d.minutes} min`}>
              {i === peakIdx && d.minutes > 0 && (
                <span className="bar-peak">{d.minutes}m</span>
              )}
              <span className="bar-fill" style={{
                height: `${Math.max((d.minutes / maxMin) * 110, d.minutes > 0 ? 3 : 0)}px`,
                background: BAR_HUE,
              }} />
              <span className="bar-day">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Coverage: 12 keys ──────────────────────────────────────────── */}
      <section className="pt-block">
        <h2 className="pt-title">Key coverage
          <span className="pt-title-sub">bright = practiced recently · dim = due soon · outlined = never</span>
        </h2>
        <div className="cov-grid">
          {KEY_IDS.map(k => {
            const d = daysSince(cov.keys[k].lastTs, now)
            const bg = freshColor(d)
            const types = cov.types[k] || {}
            return (
              <div key={k}
                className={`cov-cell ${bg ? '' : 'cov-cell--never'}`}
                style={bg ? { background: bg } : {}}
                title={`${prettyName(k)} — ${d === null ? 'never practiced'
                  : `last practiced ${agoShort(d)} ago`} · ${cov.keys[k].count} times total`}>
                <span className="cov-key">{prettyName(k)}</span>
                <span className="cov-ago">{agoShort(d)}</span>
                <span className="cov-types">
                  {SCALE_TYPE_IDS.map(t => {
                    const td = daysSince(types[t], now)
                    const hit = td !== null && td <= 14
                    return <span key={t}
                      className={`cov-type-dot ${hit ? 'on' : ''}`}
                      title={`${scaleType(t).label}: ${td === null ? 'never' : agoShort(td) + ' ago'}`} />
                  })}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Coverage: patterns ─────────────────────────────────────────── */}
      <section className="pt-block">
        <h2 className="pt-title">Pattern coverage</h2>
        <div className="cov-grid cov-grid--patterns">
          {PATTERNS.map(p => {
            const st = cov.patterns[p.id]
            const d = daysSince(st?.lastTs, now)
            const bg = freshColor(d)
            return (
              <div key={p.id}
                className={`cov-cell ${bg ? '' : 'cov-cell--never'}`}
                style={bg ? { background: bg } : {}}
                title={`${p.label} — ${d === null ? 'never practiced'
                  : `last practiced ${agoShort(d)} ago`} · ${st?.count ?? 0} times`}>
                <span className="cov-key cov-key--sm">{p.label}</span>
                <span className="cov-ago">{agoShort(d)}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Reflection trends ──────────────────────────────────────────── */}
      {trend.length >= 2 && (
        <section className="pt-block">
          <h2 className="pt-title">Reflection scores — last {trend.length} sessions</h2>
          <div className="trend-legend">
            {TREND.map(t => (
              <span key={t.id} className="tl-item">
                <span className="tl-swatch" style={{ background: t.color }} />{t.label}
              </span>
            ))}
          </div>
          <TrendChart data={trend} series={TREND} />
        </section>
      )}

      {/* ── Critique averages ──────────────────────────────────────────── */}
      <section className="pt-block">
        <h2 className="pt-title">Critique — average of last 10 sessions</h2>
        <div className="crit-bars">
          {critAvg.map(({ dim, avg }) => (
            <div key={dim} className="crit-row"
                 title={avg ? `${dim}: ${avg.toFixed(1)} / 5` : `${dim}: no data`}>
              <span className="crit-dim">{dim}</span>
              <span className="crit-track">
                <span className="crit-fill"
                  style={{ width: avg ? `${(avg / 5) * 100}%` : 0, background: BAR_HUE }} />
              </span>
              <span className="crit-val">{avg ? avg.toFixed(1) : '—'}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Session table ──────────────────────────────────────────────── */}
      <section className="pt-block">
        <h2 className="pt-title">All sessions</h2>
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Date</th><th>Mode</th><th>Min</th><th>Keys</th>
                <th>Items</th><th>Critique ⌀</th><th>Recording</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const c = s.critique
                const cavg = c
                  ? ((c.accuracy + c.timing + c.tone + c.technique) / 4).toFixed(1)
                  : '—'
                return (
                  <tr key={s.id}>
                    <td>{new Date(s.timestamp).toLocaleDateString(undefined,
                      { month: 'short', day: 'numeric' })}{' '}
                      <span className="pt-time">{new Date(s.timestamp).toLocaleTimeString(undefined,
                        { hour: '2-digit', minute: '2-digit' })}</span></td>
                    <td>{s.instrument === 'none' ? `🎧 (${s.voice})` :
                         s.instrument === 'sax' ? '🎷' : '🎺'}</td>
                    <td className="pt-num">{s.minutesActual ?? s.minutesTarget}</td>
                    <td>{(s.keys ?? []).map(prettyName).join(' ')}</td>
                    <td className="pt-num">{(s.items ?? []).filter(i => !i.skipped).length}</td>
                    <td className="pt-num">{cavg}</td>
                    <td><RecordingCell recordingId={s.recordingId} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ── SVG line chart for the 3 reflection series ──────────────────────────────

function TrendChart({ data, series }) {
  const W = 560, H = 150, PAD_L = 26, PAD_R = 96, PAD_T = 10, PAD_B = 20
  const n = data.length
  const x = i => PAD_L + (n === 1 ? 0 : (i / (n - 1)) * (W - PAD_L - PAD_R))
  const y = v => PAD_T + (1 - (v - 1) / 4) * (H - PAD_T - PAD_B)

  return (
    <div className="trend-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img"
           aria-label="Reflection scores per session, 1 to 5">
        {[1, 3, 5].map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={y(v)} x2={W - PAD_R} y2={y(v)}
                  stroke="#2a2e45" strokeWidth="1" />
            <text x={PAD_L - 6} y={y(v) + 3} textAnchor="end"
                  fontSize="9" fill="#6b7280">{v}</text>
          </g>
        ))}
        {series.map(s => {
          const pts = data.map((d, i) => ({ x: x(i), y: d[s.id] != null ? y(d[s.id]) : null, v: d[s.id] }))
            .filter(p => p.y !== null)
          if (pts.length < 2) return null
          const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
          const last = pts[pts.length - 1]
          return (
            <g key={s.id}>
              <path d={path} fill="none" stroke={s.color} strokeWidth="2"
                    strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill={s.color}
                        stroke="#1a1d2e" strokeWidth="2">
                  <title>{`${s.label}: ${p.v}/5`}</title>
                </circle>
              ))}
              <text x={last.x + 8} y={last.y + 3} fontSize="9.5"
                    fill="#e5e7eb">{s.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
