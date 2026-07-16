// PracticeApp.jsx — 3-screen state machine: Setup → Activity → Summary
import React, { useState, useRef } from 'react'
import './practice.css'
import { SCALES }       from './data/scales'
import SetupScreen      from './components/SetupScreen'
import ActivityRunner   from './components/ActivityRunner'
import SessionSummary   from './components/SessionSummary'

const LS_KEY = 'scalePractice_sessions'

function getLastSession() {
  try {
    const sessions = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return sessions[0] ?? null
  } catch { return null }
}

export default function PracticeApp() {
  const [screen,       setScreen]       = useState('setup')  // 'setup'|'activity'|'summary'
  const [sessionConfig, setSessionConfig] = useState(null)
  const [sessionResults, setSessionResults] = useState([])
  const sessionStartRef = useRef(null)

  function handleStart(config) {
    sessionStartRef.current = Date.now()
    setSessionConfig({ ...config, sessionStart: sessionStartRef.current })
    setScreen('activity')
  }

  function handleComplete(results) {
    setSessionResults(results)
    setScreen('summary')
  }

  function handleRestart() {
    setScreen('setup')
    setSessionConfig(null)
    setSessionResults([])
  }

  return (
    <div className="app-root">
      {screen === 'setup' && (
        <SetupScreen
          onStart={handleStart}
          lastSession={getLastSession()}
        />
      )}
      {screen === 'activity' && sessionConfig && (
        <ActivityRunner
          config={sessionConfig}
          onComplete={handleComplete}
        />
      )}
      {screen === 'summary' && (
        <SessionSummary
          results={sessionResults}
          config={sessionConfig}
          sessionStart={sessionStartRef.current}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
