// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — session-first shell.
//
// "Start Session" IS the app: the guided session flow fills the main area and
// stays mounted across navigation so an in-flight session is never lost.
// Reference tabs (Songs / Fingerings / Schedule / Progress) live in a slim
// side rail, clearly subordinate — browse-anytime libraries, not the product.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react'
import './styles/app.css'
import SessionFlow from './session/SessionFlow'
import SongsApp from './songs/SongsApp'
import FingeringsApp from './fingerings/FingeringsApp'
import ScheduleTab from './tabs/ScheduleTab'
import ProgressTab from './tabs/ProgressTab'
import { INSTRUMENT_CHOICES } from './theory/instruments'
import { loadSettings, saveSettings } from './state/settingsStore'
import { loadSessions } from './state/sessionStore'

const REFERENCE_TABS = [
  { id: 'songs',      label: 'Songs',      icon: '𝄞' },
  { id: 'fingerings', label: 'Fingerings', icon: '☰' },
  { id: 'schedule',   label: 'Schedule',   icon: '▦' },
  { id: 'progress',   label: 'Progress',   icon: '↗' },
]

export default function App() {
  const [view, setView] = useState('session')
  const [settings, setSettings] = useState(loadSettings)
  const [sessions, setSessions] = useState(loadSessions)
  const [sessionStage, setSessionStage] = useState('setup')

  const { instrument, voice } = settings

  useEffect(() => { saveSettings(settings) }, [settings])

  const setInstrument = id => setSettings(s => ({ ...s, instrument: id }))
  const setVoice = id => setSettings(s => ({ ...s, voice: id }))

  // Sax and trumpet are both Bb instruments → song charts default to Bb.
  const songTranspose = instrument === 'none' ? 'concert' : 'bb'
  // Lock the instrument only while actually practicing (the plan preview
  // rebuilds itself if the instrument changes).
  const sessionActive = ['run', 'critique', 'reflect'].includes(sessionStage)

  return (
    <div className="app-root">
      {/* ── Side rail ─────────────────────────────────────────────────── */}
      <aside className="rail">
        <div className="rail-brand">♪ Practice<br /><span>Framework</span></div>

        <button
          className={`rail-start ${view === 'session' ? 'rail-start--active' : ''}`}
          onClick={() => setView('session')}>
          <span className="rail-start-icon">▶</span>
          <span>
            {sessionActive ? 'Session in progress' : 'Start Session'}
            {sessionActive && <em className="rail-live">● live</em>}
          </span>
        </button>

        <nav className="rail-tabs">
          <div className="rail-tabs-label">Reference</div>
          {REFERENCE_TABS.map(t => (
            <button key={t.id}
              className={`rail-tab ${view === t.id ? 'rail-tab--active' : ''}`}
              onClick={() => setView(t.id)}>
              <span className="rail-tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>

        <div className="rail-foot">
          <label className="rail-inst-label" htmlFor="rail-inst">Instrument</label>
          <select id="rail-inst" className="rail-inst"
            value={instrument}
            onChange={e => setInstrument(e.target.value)}
            disabled={sessionActive}
            title={sessionActive ? 'Locked while a session is running' : 'Choose your instrument'}>
            {INSTRUMENT_CHOICES.map(i => (
              <option key={i.id} value={i.id}>{i.label}</option>
            ))}
          </select>
        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <main className="main">
        <div style={{ display: view === 'session' ? 'block' : 'none' }}>
          <SessionFlow
            instrument={instrument}
            voice={voice}
            onInstrument={setInstrument}
            onVoice={setVoice}
            sessions={sessions}
            onSessionSaved={setSessions}
            onStageChange={setSessionStage}
          />
        </div>
        {view === 'songs' && (
          <SongsApp key={songTranspose} initialTranspose={songTranspose} />
        )}
        {view === 'fingerings' && <FingeringsApp instrument={instrument} />}
        {view === 'schedule' && <ScheduleTab />}
        {view === 'progress' && <ProgressTab sessions={sessions} />}
      </main>
    </div>
  )
}
