// PlaybackControls.jsx — bottom bar: play/stop, BPM, note value, instrument
import React from 'react'
import { NOTE_VALUES } from '../data/scales'

export default function PlaybackControls({
  isPlaying, onPlay, onStop,
  bpm, onBpmChange,
  noteValue, onNoteValueChange,
  instrument, onInstrumentChange,
  pianoLoaded, audioStarted,
}) {
  return (
    <div className="playback-bar">
      <button
        className={`play-btn ${isPlaying ? 'play-btn--stop' : 'play-btn--play'}`}
        onClick={isPlaying ? onStop : onPlay}
      >
        {isPlaying ? '■ Stop' : '▶ Play Scale'}
      </button>

      {!audioStarted && <span className="pb-hint">Click Play to activate audio</span>}
      {audioStarted && instrument==='piano' && !pianoLoaded &&
        <span className="pb-hint pb-hint--warn">Loading piano…</span>}

      <div className="pb-divider" />

      <div className="pb-group">
        <span className="pb-label">Note Value</span>
        <div className="pb-pills">
          {NOTE_VALUES.map(nv => (
            <button key={nv.id}
              className={`pb-pill ${noteValue===nv.id ? 'pb-pill--active' : ''}`}
              onClick={() => onNoteValueChange(nv.id)}>
              {nv.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-divider" />

      <div className="pb-group">
        <span className="pb-label">Tempo — <strong>{bpm} BPM</strong></span>
        <input type="range" min={40} max={220} step={2} value={bpm}
          onChange={e => onBpmChange(Number(e.target.value))}
          className="bpm-slider" />
      </div>

      <div className="pb-divider" />

      <div className="pb-group">
        <span className="pb-label">Sound</span>
        <div className="pb-pills">
          {[{id:'sax',label:'🎷 Sax'},{id:'piano',label:'🎹 Piano'}].map(inst => (
            <button key={inst.id}
              className={`pb-pill ${instrument===inst.id ? 'pb-pill--active' : ''}`}
              onClick={() => onInstrumentChange(inst.id)}>
              {inst.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
