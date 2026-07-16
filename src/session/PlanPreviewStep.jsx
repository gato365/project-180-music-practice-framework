// ─────────────────────────────────────────────────────────────────────────────
// PlanPreviewStep.jsx — today's auto-generated plan, with a short "why",
// light edits (toggle items, nudge BPM, regenerate rotation) and the
// before-you-start checklist folded into the footer. Default path: just Start.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react'
import { KEY_COLORS } from '../theory/scales'
import { resolveItem } from '../theory/resolve'
import { fmtSec } from '../theory/notes'
import { estimatePlanSeconds } from '../engine/timeEstimator'
import { useInstrumentAudio } from '../audio/useInstrumentAudio'

export default function PlanPreviewStep({
  plan, inst, recorder, onStart, onRegenerate, onBpm, onBack,
}) {
  const [excluded, setExcluded] = useState(() => new Set())
  const [headphones, setHeadphones] = useState(false)
  const [recordWanted, setRecordWanted] = useState(false)
  const audio = useInstrumentAudio(inst)

  const included = plan.items.filter(it => !excluded.has(it.id))
  const totalSec = useMemo(() => estimatePlanSeconds(included), [included])

  const resolved = useMemo(() =>
    plan.items.map(it => ({ item: it, r: resolveItem(it, inst) })),
  [plan, inst])

  function toggle(id) {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function toggleRecord() {
    if (recordWanted) { setRecordWanted(false); return }
    const ok = await recorder.request()
    setRecordWanted(ok)
  }

  function preview(item) {
    const r = resolveItem(item, inst)
    if (!r) return
    audio.stop()
    audio.playSequence(r.groups[0].notes, { noteValue: plan.noteValue, bpm: plan.bpm })
  }

  const canStart = included.length > 0
  const canRecord = plan.mode === 'play'

  return (
    <div className="plan-step">
      <div className="plan-head">
        <button className="link-btn" onClick={onBack}>← Back</button>
        <h2 className="plan-title">Your {plan.minutes}-minute plan</h2>
        <div className="plan-est">
          ~{fmtSec(totalSec)} planned · {included.length} items
        </div>
      </div>

      <div className="plan-why">
        {plan.why.map((line, i) => <div key={i} className="plan-why-line">{line}</div>)}
      </div>

      <div className="plan-items">
        {resolved.map(({ item, r }) => {
          const off = excluded.has(item.id)
          const color = KEY_COLORS[item.keyId] ?? 'var(--accent)'
          return (
            <div key={item.id}
                 className={`plan-item ${off ? 'plan-item--off' : ''}`}
                 style={{ '--pi': color }}>
              <button className="pi-toggle" onClick={() => toggle(item.id)}
                      aria-pressed={!off}
                      title={off ? 'Include this item' : 'Skip this item'}>
                {off ? '○' : '●'}
              </button>
              <div className="pi-main">
                <div className="pi-label" style={{ color: off ? 'var(--dim)' : color }}>
                  {r ? r.label : item.id}
                  <span className="pi-sub">{r?.sub}</span>
                </div>
                <div className="pi-why">{item.why}</div>
              </div>
              <div className="pi-right">
                <span className="pi-est">{fmtSec(item.estSeconds)}</span>
                <button className="pi-play"
                        onClick={() => preview(item)}
                        title="Hear the first group">▶</button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="plan-tools">
        <button className="tool-btn" onClick={onRegenerate}>
          ↻ Regenerate (next keys in rotation)
        </button>
        <div className="bpm-nudge">
          <span className="bpm-label">Tempo {plan.bpm} BPM</span>
          <button className="tool-btn tool-btn--sm" onClick={() => onBpm(Math.max(60, plan.bpm - 8))}>−</button>
          <button className="tool-btn tool-btn--sm" onClick={() => onBpm(Math.min(160, plan.bpm + 8))}>+</button>
        </div>
      </div>

      <div className="plan-checklist">
        <label className="check-row">
          <input type="checkbox" checked={headphones}
                 onChange={e => setHeadphones(e.target.checked)} />
          <span>🎧 Headphones on</span>
        </label>

        {canRecord && (
          <label className="check-row">
            <input type="checkbox"
                   checked={recordWanted}
                   disabled={recorder.state === 'unsupported'}
                   onChange={toggleRecord} />
            <span>
              🎙 Record this session for listen-back &amp; auto-scoring
              {recorder.state === 'denied' && (
                <em className="check-warn"> — mic permission denied; recording off</em>
              )}
              {recorder.state === 'unsupported' && (
                <em className="check-warn"> — not supported in this browser</em>
              )}
            </span>
          </label>
        )}

        <button
          className={`run-start-btn ${!canStart ? 'run-start-btn--disabled' : ''}`}
          disabled={!canStart}
          onClick={() => onStart(new Set(included.map(it => it.id)),
                                 recordWanted && recorder.state === 'ready')}>
          ▶ Start practicing
        </button>
      </div>
    </div>
  )
}
