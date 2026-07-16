// ─────────────────────────────────────────────────────────────────────────────
// CritiqueStep.jsx — evaluate the session on tone / accuracy / time / technique.
//
// Honest split (see README):
//   • accuracy + timing CAN be estimated from a recording (monophonic pitch
//     detection) or, in No-Instrument mode, from quiz accuracy → prefilled,
//     clearly labeled as beta estimates, always overridable.
//   • tone + technique CANNOT be judged reliably from audio → self-rated only.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useEffect } from 'react'
import { analyzeRecording, pctToScore } from '../audio/pitchAnalysis'

const DIMS = [
  { id: 'accuracy',  label: 'Accuracy',  hint: 'right notes, right order' },
  { id: 'timing',    label: 'Time',      hint: 'steady pulse at tempo' },
  { id: 'tone',      label: 'Tone',      hint: 'sound quality (self-rated)' },
  { id: 'technique', label: 'Technique', hint: 'fingers, breath, articulation (self-rated)' },
]

export default function CritiqueStep({ plan, itemResults, recordingBlob,
                                       expectedMidis, onDone }) {
  const [scores, setScores] = useState({ accuracy: 3, timing: 3, tone: 3, technique: 3 })
  const [auto, setAuto] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)

  const audioUrl = useMemo(
    () => (recordingBlob ? URL.createObjectURL(recordingBlob) : null),
    [recordingBlob]
  )
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  // No-instrument sessions: quiz accuracy is the auto estimate.
  const quizAcc = useMemo(() => {
    const accs = itemResults.filter(r => r.quizAccuracy != null).map(r => r.quizAccuracy)
    if (!accs.length) return null
    return Math.round(accs.reduce((s, a) => s + a, 0) / accs.length)
  }, [itemResults])

  useEffect(() => {
    if (plan.mode === 'quiz' && quizAcc !== null) {
      setAuto({ accuracyPct: quizAcc, timingPct: null, source: 'quiz' })
      setScores(s => ({ ...s, accuracy: pctToScore(quizAcc) }))
    }
  }, [plan.mode, quizAcc])

  async function runAnalysis() {
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const midis = typeof expectedMidis === 'function' ? expectedMidis() : expectedMidis
      const result = await analyzeRecording(recordingBlob, midis, { bpm: plan.bpm })
      if (!result) { setAnalyzeError('Could not analyze this recording.'); return }
      setAuto({ ...result, source: 'recording' })
      setScores(s => ({
        ...s,
        accuracy: pctToScore(result.accuracyPct),
        timing: pctToScore(result.timingPct),
      }))
    } catch (e) {
      console.warn('analysis failed:', e)
      setAnalyzeError('Analysis failed — rate it yourself below.')
    } finally {
      setAnalyzing(false)
    }
  }

  function setDim(id, val) {
    setScores(s => ({ ...s, [id]: val }))
  }

  return (
    <div className="critique-step">
      <h2 className="step-title">Critique</h2>
      <p className="step-sub">How did it go? Tone and technique are yours to judge;
        accuracy and time can be estimated for you.</p>

      {audioUrl && (
        <div className="critique-audio">
          <div className="ca-label">🎙 Your session recording</div>
          <audio controls src={audioUrl} className="ca-player" />
          <button className="tool-btn" onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? 'Analyzing…' : '✨ Estimate accuracy & time from recording (beta)'}
          </button>
          {analyzeError && <div className="ca-error">{analyzeError}</div>}
        </div>
      )}

      {auto && (
        <div className="auto-box">
          {auto.source === 'recording' ? (
            <>
              Detected <strong>{auto.detectedCount}</strong> notes
              (expected {auto.expectedCount}) →
              pitch match <strong>{auto.accuracyPct}%</strong> ·
              pace <strong>{auto.notesPerMin}</strong> notes/min vs
              planned {auto.plannedNotesPerMin} → timing <strong>{auto.timingPct}%</strong>.
              <span className="auto-note"> Estimates only — mic quality and room noise
              matter. Adjust the sliders if this feels wrong.</span>
            </>
          ) : (
            <>
              Quiz accuracy across items: <strong>{auto.accuracyPct}%</strong> —
              prefilled below.
            </>
          )}
        </div>
      )}

      <div className="dim-list">
        {DIMS.map(d => (
          <div key={d.id} className="dim-row">
            <div className="dim-head">
              <span className="dim-label">{d.label}</span>
              <span className="dim-hint">{d.hint}</span>
              <span className="dim-val">{scores[d.id]}</span>
            </div>
            <div className="dim-scale">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v}
                  className={`dim-dot ${scores[d.id] >= v ? 'dim-dot--on' : ''}`}
                  onClick={() => setDim(d.id, v)}
                  aria-label={`${d.label} ${v} of 5`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="run-start-btn" onClick={() => onDone({
        ...scores,
        auto: auto ? {
          accuracyPct: auto.accuracyPct ?? null,
          timingPct: auto.timingPct ?? null,
          notesPerMin: auto.notesPerMin ?? null,
          source: auto.source,
        } : null,
      })}>
        Continue to reflection →
      </button>
    </div>
  )
}
