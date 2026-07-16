// ─────────────────────────────────────────────────────────────────────────────
// storage.js — thin persistence layer.
//
// Everything below the app talks to THIS module, never to localStorage
// directly. When cloud sync arrives (Firebase, per the roadmap), this is the
// only file that grows a remote backend: keep get/set synchronous-looking for
// callers and sync in the background.
//
// Session metadata lives here (small JSON). Audio recordings are far too big
// for localStorage and live in IndexedDB — see audioStore.js.
// ─────────────────────────────────────────────────────────────────────────────

const PREFIX = 'mpf2_'

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
      return true
    } catch (e) {
      console.warn(`storage.set(${key}) failed:`, e)
      return false
    }
  },

  remove(key) {
    try { localStorage.removeItem(PREFIX + key) } catch { /* noop */ }
  },
}
