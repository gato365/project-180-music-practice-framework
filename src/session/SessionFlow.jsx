// ─────────────────────────────────────────────────────────────────────────────
// SessionFlow.jsx — the guided practice session, the product's core loop:
//
//   Setup → Plan preview → Run → Critique → Reflect → Summary
//
// The user picks instrument + minutes; the planner decides the rest.
// This component owns all cross-step state (plan, timing, recording,
// critique, reflection) and stays mounted across tab switches so an
// in-flight session is never lost.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { buildPlan } from '../engine/sessionPlanner'
import { resolveInstrument } from '../theory/instruments'
import { noteToMidi } from '../theory/notes'
import { itemNoteSequence } from '../theory/resolve'
import { loadWeeklySchedule } from '../state/settingsStore'
import { newSessionId, saveSession, summarizeItems } from '../state/sessionStore'
import { saveRecording } from '../state/audioStore'
import { useRecorder } from '../audio/useRecorder'
import SetupStep from './SetupStep'
import PlanPreviewStep from './PlanPreviewStep'
import RunStep from './RunStep'
import QuizRunner from './QuizRunner'
import CritiqueStep from './CritiqueStep'
import ReflectStep from './ReflectStep'
import SummaryStep from './SummaryStep'

export default function SessionFlow({
  instrument, voice, onInstrument, onVoice, sessions, onSessionSaved, onStageChange,
}) {
  const [stage, setStage] = useState('setup')
  const [minutes, setMinutes] = useState(10)
  const [plan, setPlan] = useState(null)
  const [rotationOffset, setRotationOffset] = useState(0)
  const [bpmOverride, setBpmOverride] = useState(null)
  const [runItems, setRunItems] = useState([])
  const [itemResults, setItemResults] = useState([])
  const [recordingBlob, setRecordingBlob] = useState(null)
  const [critique, setCritique] = useState(null)
  const [savedRecord, setSavedRecord] = useState(null)

  const sessionStartRef = useRef(null)
  const minutesActualRef = useRef(0)
  const recorder = useRecorder()

  const goStage = useCallback(s => {
    setStage(s)
    onStageChange?.(s)
  }, [onStageChange])

  // ── Setup → Plan ───────────────────────────────────────────────────────────
  const build = useCallback((mins, offset = 0, bpmOv = null) => {
    const p = buildPlan({
      instrument, voice, minutes: mins,
      sessions, schedule: loadWeeklySchedule(),
      rotationOffset: offset, bpmOverride: bpmOv,
    })
    setPlan(p)
    return p
  }, [instrument, voice, sessions])

  function handleBuild() {
    setRotationOffset(0)
    setBpmOverride(null)
    build(minutes, 0, null)
    goStage('plan')
  }

  // Switching instrument while previewing a plan rebuilds it for the new
  // instrument (ranges and octave placement differ).
  useEffect(() => {
    if (stage === 'plan') build(minutes, rotationOffset, bpmOverride)
  }, [instrument, voice])  // eslint-disable-line react-hooks/exhaustive-deps

  function handleRegenerate() {
    const next = rotationOffset + 1
    setRotationOffset(next)
    build(minutes, next, bpmOverride)
  }

  function handleBpm(bpm) {
    setBpmOverride(bpm)
    build(minutes, rotationOffset, bpm)
  }

  // ── Plan → Run ─────────────────────────────────────────────────────────────
  function handleStart(includedIds, recordEnabled) {
    const items = plan.items.filter(it => includedIds.has(it.id))
    setRunItems(items)
    setItemResults([])
    setRecordingBlob(null)
    sessionStartRef.current = Date.now()
    if (recordEnabled && recorder.state === 'ready') recorder.start()
    goStage('run')
  }

  // ── Run → Critique ─────────────────────────────────────────────────────────
  async function handleRunComplete(results) {
    setItemResults(results)
    minutesActualRef.current =
      Math.round(((Date.now() - sessionStartRef.current) / 60000) * 10) / 10
    if (recorder.state === 'recording') {
      const blob = await recorder.stop()
      setRecordingBlob(blob)
    }
    goStage('critique')
  }

  // Expected concert-pitch midis for pitch analysis (completed items only).
  function expectedConcertMidis() {
    const inst = resolveInstrument(plan.instrument, plan.voice)
    return itemResults
      .filter(r => !r.skipped)
      .flatMap(r => itemNoteSequence(r, inst))
      .map(n => noteToMidi(n) + inst.concertOffset)
  }

  // ── Critique → Reflect ─────────────────────────────────────────────────────
  function handleCritiqueDone(c) {
    setCritique(c)
    goStage('reflect')
  }

  // ── Reflect → save → Summary ───────────────────────────────────────────────
  async function handleReflectDone(reflection) {
    const id = newSessionId()
    let recordingId = null
    if (recordingBlob) {
      try {
        recordingId = await saveRecording(id, recordingBlob, { sessionId: id })
      } catch (e) {
        console.warn('saving recording failed:', e)
      }
    }
    const record = {
      id,
      timestamp: new Date().toISOString(),
      instrument: plan.instrument,
      voice: plan.voice,
      dayType: plan.dayType,
      minutesTarget: plan.minutes,
      minutesActual: minutesActualRef.current,
      ...summarizeItems(itemResults),
      items: itemResults,
      critique,
      reflection,
      recordingId,
    }
    const list = saveSession(record)
    setSavedRecord(record)
    onSessionSaved?.(list)
    goStage('summary')
  }

  // ── Summary → reset ────────────────────────────────────────────────────────
  function handleDone() {
    setPlan(null)
    setRunItems([])
    setItemResults([])
    setRecordingBlob(null)
    setCritique(null)
    setSavedRecord(null)
    setRotationOffset(0)
    setBpmOverride(null)
    recorder.reset()
    recorder.releaseMic()
    goStage('setup')
  }

  const inst = plan
    ? resolveInstrument(plan.instrument, plan.voice)
    : resolveInstrument(instrument, voice)

  return (
    <div className="session-flow">
      {stage === 'setup' && (
        <SetupStep
          instrument={instrument} voice={voice}
          onInstrument={onInstrument} onVoice={onVoice}
          minutes={minutes} onMinutes={setMinutes}
          sessions={sessions}
          onBuild={handleBuild}
        />
      )}

      {stage === 'plan' && plan && (
        <PlanPreviewStep
          plan={plan} inst={inst}
          recorder={recorder}
          onStart={handleStart}
          onRegenerate={handleRegenerate}
          onBpm={handleBpm}
          onBack={() => goStage('setup')}
        />
      )}

      {stage === 'run' && plan && (
        plan.mode === 'quiz' ? (
          <QuizRunner
            plan={plan} items={runItems} inst={inst}
            sessionStart={sessionStartRef.current}
            onComplete={handleRunComplete}
          />
        ) : (
          <RunStep
            plan={plan} items={runItems} inst={inst}
            sessionStart={sessionStartRef.current}
            recording={recorder.state === 'recording'}
            onComplete={handleRunComplete}
          />
        )
      )}

      {stage === 'critique' && plan && (
        <CritiqueStep
          plan={plan}
          itemResults={itemResults}
          recordingBlob={recordingBlob}
          expectedMidis={expectedConcertMidis}
          onDone={handleCritiqueDone}
        />
      )}

      {stage === 'reflect' && (
        <ReflectStep onDone={handleReflectDone} />
      )}

      {stage === 'summary' && savedRecord && (
        <SummaryStep
          record={savedRecord}
          sessions={sessions}
          recordingBlob={recordingBlob}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
