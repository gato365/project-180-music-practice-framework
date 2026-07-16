// PlaybackBar.jsx — transport: play/stop, BPM, volume, transpose, display options
import React from 'react'
import { TRANSPOSE_OPTIONS } from '../utils/chordUtils'

const TEMPOS = [
  { label: 'Slow', bpm: 60 },
  { label: 'Med',  bpm: 100 },
  { label: 'Fast', bpm: 160 },
  { label: 'Bird', bpm: 240 },
]

export default function PlaybackBar({
  isPlaying, onPlay, onStop,
  bpm, onBpm,
  volume, onVolume,
  transposeId, onTranspose,
  showBarNums, onShowBarNums,
  soundLoaded, audioReady,
  standardTitle,
  totalMeasures,
}) {
  const tp = TRANSPOSE_OPTIONS.find(t => t.id === transposeId) ?? TRANSPOSE_OPTIONS[0]

  return (
    <div className="playback-bar">
      {/* ── Play / Stop ─────────────────────────────────────────────────── */}
      <div className="pb-zone">
        <button
          className={`pb-play ${isPlaying ? 'pb-play--stop' : 'pb-play--go'}`}
          onClick={isPlaying ? onStop : onPlay}
          title={isPlaying ? 'Stop (Space)' : 'Play chords (Space)'}
        >
          {isPlaying
            ? <><span className="pb-play-icon">■</span> Stop</>
            : <><span className="pb-play-icon">▶</span> Play</>
          }
        </button>
        <div className="pb-info">
          {!audioReady && <span className="pb-hint">Click Play to activate audio</span>}
          {audioReady && !soundLoaded && <span className="pb-hint pb-hint--loading">Loading piano…</span>}
          {soundLoaded && (
            <span className="pb-hint pb-hint--ok">
              {standardTitle} · {totalMeasures} bars
            </span>
          )}
        </div>
      </div>

      <div className="pb-sep" />

      {/* ── Transpose ───────────────────────────────────────────────────── */}
      <div className="pb-zone pb-zone--col">
        <span className="pb-label">Instrument</span>
        <div className="pb-pills">
          {TRANSPOSE_OPTIONS.filter(t => t.id !== 'custom').map(t => (
            <button
              key={t.id}
              className={`pb-pill ${transposeId === t.id ? 'pb-pill--on' : ''}`}
              onClick={() => onTranspose(t.id)}
              title={`Transpose for ${t.label}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tp.semitones !== 0 && (
          <span className="pb-transpose-note">
            +{tp.semitones} semitones written
          </span>
        )}
      </div>

      <div className="pb-sep" />

      {/* ── BPM ─────────────────────────────────────────────────────────── */}
      <div className="pb-zone pb-zone--col">
        <span className="pb-label">Tempo — <strong>{bpm} BPM</strong></span>
        <div className="pb-bpm-row">
          <input
            type="range" min={30} max={300} step={2} value={bpm}
            onChange={e => onBpm(Number(e.target.value))}
            className="pb-slider"
          />
          <div className="pb-tempo-presets">
            {TEMPOS.map(t => (
              <button
                key={t.label}
                className={`pb-tempo-chip ${bpm === t.bpm ? 'pb-tempo-chip--on' : ''}`}
                onClick={() => onBpm(t.bpm)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pb-sep" />

      {/* ── Volume ──────────────────────────────────────────────────────── */}
      <div className="pb-zone pb-zone--col">
        <span className="pb-label">Vol <strong>{volume} dB</strong></span>
        <input
          type="range" min={-40} max={0} step={2} value={volume}
          onChange={e => onVolume(Number(e.target.value))}
          className="pb-slider pb-slider--short"
        />
      </div>

      <div className="pb-sep" />

      {/* ── Display options ─────────────────────────────────────────────── */}
      <div className="pb-zone pb-zone--col">
        <span className="pb-label">Display</span>
        <label className="pb-toggle">
          <input
            type="checkbox"
            checked={showBarNums}
            onChange={e => onShowBarNums(e.target.checked)}
          />
          <span>Bar numbers</span>
        </label>
      </div>
    </div>
  )
}
