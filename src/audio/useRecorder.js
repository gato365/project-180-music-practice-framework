// ─────────────────────────────────────────────────────────────────────────────
// useRecorder.js — MediaRecorder wrapper for practice-session recording.
// Recording is strictly optional: every failure path (no API, permission
// denied, hardware error) lands in a state the session flow can ignore.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',              // Safari
  'audio/ogg;codecs=opus',
]

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  return MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported?.(m)) ?? ''
}

/**
 * states: idle → requesting → ready → recording → stopped
 *                    ↘ denied / unsupported
 */
export function useRecorder() {
  const [state, setState] = useState(
    typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined' ? 'idle' : 'unsupported'
  )
  const [blob, setBlob] = useState(null)

  const streamRef   = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef   = useRef([])
  const stopResolveRef = useRef(null)

  /** Ask for the mic (called from an explicit user toggle). */
  const request = useCallback(async () => {
    if (state === 'unsupported') return false
    if (streamRef.current) { setState('ready'); return true }
    setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      })
      streamRef.current = stream
      setState('ready')
      return true
    } catch (e) {
      console.warn('mic permission:', e)
      setState('denied')
      return false
    }
  }, [state])

  const start = useCallback(() => {
    const stream = streamRef.current
    if (!stream) return false
    try {
      const mimeType = pickMimeType()
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      setBlob(null)
      rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const out = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        setBlob(out)
        setState('stopped')
        stopResolveRef.current?.(out)
        stopResolveRef.current = null
      }
      rec.start(1000)   // gather chunks every second
      recorderRef.current = rec
      setState('recording')
      return true
    } catch (e) {
      console.warn('recorder start:', e)
      setState('denied')
      return false
    }
  }, [])

  /** @returns {Promise<Blob|null>} the finished recording */
  const stop = useCallback(() => {
    const rec = recorderRef.current
    if (!rec || rec.state === 'inactive') return Promise.resolve(blob)
    return new Promise(resolve => {
      stopResolveRef.current = resolve
      try { rec.stop() } catch { resolve(null) }
    })
  }, [blob])

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const reset = useCallback(() => {
    setBlob(null)
    if (state !== 'unsupported' && state !== 'denied') {
      setState(streamRef.current ? 'ready' : 'idle')
    }
  }, [state])

  useEffect(() => () => {
    try { recorderRef.current?.state === 'recording' && recorderRef.current.stop() }
    catch { /* noop */ }
    streamRef.current?.getTracks().forEach(t => t.stop())
  }, [])

  return { state, blob, request, start, stop, reset, releaseMic }
}
