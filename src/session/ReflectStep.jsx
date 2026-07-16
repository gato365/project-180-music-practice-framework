// ─────────────────────────────────────────────────────────────────────────────
// ReflectStep.jsx — fixed self-reflection prompts + notes + a 1–5 score per
// prompt so reflection trends are chartable over time (Progress tab).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react'

const PROMPTS = [
  { id: 'improved',  label: 'What improved?',
    placeholder: 'e.g. thirds in E♭ felt smoother, better breath on long phrases…',
    scoreHint: 'how much progress today?' },
  { id: 'needsWork', label: 'What needs work?',
    placeholder: 'e.g. harmonic minor 7th still hesitant, rushing descents…',
    scoreHint: 'how solid is today’s weak spot? (1 = rough)' },
  { id: 'tomorrow',  label: 'What should I practice tomorrow?',
    placeholder: 'e.g. slow two-octave G♭, ii–V–I in B…',
    scoreHint: 'how clear is tomorrow’s goal?' },
]

export default function ReflectStep({ onDone }) {
  const [text, setText] = useState({ improved: '', needsWork: '', tomorrow: '' })
  const [scores, setScores] = useState({ improved: 3, needsWork: 3, tomorrow: 3 })

  return (
    <div className="reflect-step">
      <h2 className="step-title">Self reflection</h2>
      <p className="step-sub">Thirty honest seconds. These notes and scores show up
        in your Progress tab.</p>

      <div className="prompt-list">
        {PROMPTS.map(p => (
          <div key={p.id} className="prompt-block">
            <div className="prompt-head">
              <span className="prompt-label">{p.label}</span>
              <div className="prompt-score">
                {[1, 2, 3, 4, 5].map(v => (
                  <button key={v}
                    className={`dim-dot ${scores[p.id] >= v ? 'dim-dot--on' : ''}`}
                    onClick={() => setScores(s => ({ ...s, [p.id]: v }))}
                    aria-label={`${p.label} score ${v} of 5`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="prompt-text"
              rows={2}
              placeholder={p.placeholder}
              value={text[p.id]}
              onChange={e => setText(t => ({ ...t, [p.id]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <button className="run-start-btn"
        onClick={() => onDone({ ...text, scores })}>
        ✓ Finish &amp; save session
      </button>
    </div>
  )
}
