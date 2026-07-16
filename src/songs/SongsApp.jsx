// SongsApp.jsx — Songs module (from jazz-changes)
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import './songs.css'
import { STANDARDS }         from './data/standards'
import { TRANSPOSE_OPTIONS, transposeStandard, transposeChord } from './utils/chordUtils'
import { useChordPlayer }    from './hooks/useChordPlayer'
import StandardList          from './components/StandardList'
import StandardHeader        from './components/StandardHeader'
import ChordChart            from './components/ChordChart'
import PlaybackBar           from './components/PlaybackBar'

const DEFAULT_ID = 'autumn-leaves'

function totalMeasures(std) {
  return std?.sections?.reduce((s, sec) => s + sec.measures.length, 0) ?? 0
}

export default function SongsApp({ initialTranspose = 'concert' }) {
  const [selectedId,   setSelectedId]   = useState(DEFAULT_ID)
  const [transposeId,  setTransposeId]  = useState(initialTranspose)
  const [bpm,          setBpm]          = useState(120)
  const [showBarNums,  setShowBarNums]  = useState(true)
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [playHead,     setPlayHead]     = useState(false)
  const [loop,         setLoop]         = useState(false)

  const {
    isPlaying, activeSlot, soundLoaded, audioReady,
    volume, setVolume,
    play, stop, previewChord,
  } = useChordPlayer()

  // ── Derive current standard + transposition ────────────────────────────
  const rawStandard = useMemo(
    () => STANDARDS.find(s => s.id === selectedId) ?? STANDARDS[0],
    [selectedId]
  )

  const tp = useMemo(
    () => TRANSPOSE_OPTIONS.find(t => t.id === transposeId) ?? TRANSPOSE_OPTIONS[0],
    [transposeId]
  )

  const standard = useMemo(
    () => transposeStandard(rawStandard, tp.semitones, tp.spell),
    [rawStandard, tp]
  )

  const transposedKey = useMemo(() => {
    if (tp.semitones === 0) return null
    // Derive the transposed key center label
    const key = rawStandard.keyCenter
    const m   = key.match(/^([A-G][#b]?)(.*)/)
    if (!m) return null
    return transposeChord(m[1], tp.semitones, tp.spell) + (m[2] ?? '')
  }, [rawStandard, tp])

  // ── Keyboard shortcut: Space = play/stop ──────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT') return
    if (e.code === 'Space') {
      e.preventDefault()
      isPlaying ? stop() : play(standard, bpm, { loop, playHead })
    }
  }, [isPlaying, stop, play, standard, bpm, loop, playHead])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ── Stop on standard change ───────────────────────────────────────────
  useEffect(() => { stop() }, [selectedId])

  const playOptions = { loop, playHead }

  function handleSelect(id) {
    setSelectedId(id)
  }

  return (
    <div className="songs-module app-shell">
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <div className={`sidebar-wrap ${sidebarOpen ? '' : 'sidebar-wrap--closed'}`}>
        <StandardList selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <div className="main-wrap">
        {/* Sidebar toggle */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Hide tune list' : 'Show tune list'}
        >
          {sidebarOpen ? '◀' : '▶ Tunes'}
        </button>

        {/* Tune header */}
        <StandardHeader standard={rawStandard} transposedKey={transposedKey} />

        {/* Chord chart */}
        <div className="chart-scroll">
          <ChordChart
            standard={standard}
            activeInfo={activeSlot}
            onClickChord={previewChord}
            showBarNums={showBarNums}
          />
        </div>

        {/* Playback controls (sticky bottom) */}
        <PlaybackBar
          isPlaying={isPlaying}
          onPlay={() => play(standard, bpm, playOptions)}
          onStop={stop}
          bpm={bpm}
          onBpm={bpm => { if (isPlaying) stop(); setBpm(bpm) }}
          volume={volume}
          onVolume={setVolume}
          transposeId={transposeId}
          onTranspose={id => { if (isPlaying) stop(); setTransposeId(id) }}
          showBarNums={showBarNums}
          onShowBarNums={setShowBarNums}
          playHead={playHead}
          onPlayHead={setPlayHead}
          loop={loop}
          onLoop={setLoop}
          soundLoaded={soundLoaded}
          audioReady={audioReady}
          standardTitle={rawStandard.title}
          totalMeasures={totalMeasures(standard)}
        />
      </div>
    </div>
  )
}
