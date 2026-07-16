// ─────────────────────────────────────────────────────────────────────────────
// settingsStore.js — small user preferences (instrument, playback voice,
// weekly schedule). All through the storage layer so a future Firebase swap
// stays contained.
// ─────────────────────────────────────────────────────────────────────────────

import { storage } from './storage.js'
import { DEFAULT_WEEKLY_SCHEDULE } from '../engine/weeklySchedule.js'

const SETTINGS_KEY = 'settings'
const SCHEDULE_KEY = 'weeklySchedule'

const DEFAULT_SETTINGS = {
  instrument: 'sax',   // 'sax' | 'trumpet' | 'none'
  voice: 'sax',        // playback voice in No-Instrument mode
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...(storage.get(SETTINGS_KEY, {}) || {}) }
}

export function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch }
  storage.set(SETTINGS_KEY, next)
  return next
}

export function loadWeeklySchedule() {
  const s = storage.get(SCHEDULE_KEY, null)
  return s && typeof s === 'object'
    ? { ...DEFAULT_WEEKLY_SCHEDULE, ...s }
    : { ...DEFAULT_WEEKLY_SCHEDULE }
}

export function saveWeeklySchedule(schedule) {
  storage.set(SCHEDULE_KEY, schedule)
  return schedule
}
