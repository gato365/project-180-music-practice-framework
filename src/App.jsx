// App.jsx — Music Practice Framework shell
// Top nav with four modules + a global instrument choice (sax / trumpet / none).
// The Practice module stays mounted across tab switches so an in-flight
// session isn't lost; the other modules mount on demand.
import React, { useState, useEffect } from 'react'
import './styles/shell.css'
import PracticeApp   from './practice/PracticeApp'
import SongsApp      from './songs/SongsApp'
import FingeringsApp from './fingerings/FingeringsApp'
import ProgressApp   from './progress/ProgressApp'

const TABS = [
  { id: 'practice',   label: 'Practice'   },
  { id: 'songs',      label: 'Songs'      },
  { id: 'fingerings', label: 'Fingerings' },
  { id: 'progress',   label: 'Progress'   },
]

const INSTRUMENTS = [
  { id: 'sax',     label: '🎷 Tenor Sax'    },
  { id: 'trumpet', label: '🎺 Trumpet'      },
  { id: 'none',    label: '🎧 No Instrument' },
]

const LS_INSTRUMENT = 'mpf_instrument'

function initialTab() {
  const t = new URLSearchParams(window.location.search).get('tab')
  return TABS.some(x => x.id === t) ? t : 'practice'
}

export default function App() {
  const [tab, setTab] = useState(initialTab)
  const [instrument, setInstrument] = useState(
    () => localStorage.getItem(LS_INSTRUMENT) || 'sax'
  )

  useEffect(() => {
    localStorage.setItem(LS_INSTRUMENT, instrument)
  }, [instrument])

  // Sax and trumpet are both Bb instruments → default song charts to Bb
  const songTranspose = instrument === 'none' ? 'concert' : 'bb'

  return (
    <div className="mpf-root">
      <nav className="mpf-nav">
        <span className="mpf-brand">♪ Music Practice</span>
        <div className="mpf-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`mpf-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          className="mpf-instrument"
          value={instrument}
          onChange={e => setInstrument(e.target.value)}
          aria-label="Choose your instrument"
        >
          {INSTRUMENTS.map(i => (
            <option key={i.id} value={i.id}>{i.label}</option>
          ))}
        </select>
      </nav>

      <main className="mpf-main">
        <div style={{ display: tab === 'practice' ? 'block' : 'none' }}>
          <PracticeApp />
        </div>
        {tab === 'songs' && (
          <SongsApp key={songTranspose} initialTranspose={songTranspose} />
        )}
        {tab === 'fingerings' && <FingeringsApp instrument={instrument} />}
        {tab === 'progress' && <ProgressApp />}
      </main>
    </div>
  )
}
