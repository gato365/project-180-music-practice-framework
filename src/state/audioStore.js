// ─────────────────────────────────────────────────────────────────────────────
// audioStore.js — practice recordings in IndexedDB.
// Audio blobs are far too large for localStorage; session records reference
// them by recordingId. Failures degrade gracefully (recording is optional).
// ─────────────────────────────────────────────────────────────────────────────

const DB_NAME = 'mpf-audio'
const DB_VERSION = 1
const STORE = 'recordings'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const out = fn(store)
    t.oncomplete = () => resolve(out?.result)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
  })
}

/** @param {string} id  @param {Blob} blob  @param {object} meta extra fields */
export async function saveRecording(id, blob, meta = {}) {
  const db = await openDb()
  try {
    await tx(db, 'readwrite', store =>
      store.put({ id, blob, mimeType: blob.type, createdAt: Date.now(), ...meta }))
    return id
  } finally { db.close() }
}

/** @returns {Promise<Blob|null>} */
export async function getRecording(id) {
  if (!id) return null
  try {
    const db = await openDb()
    try {
      const rec = await tx(db, 'readonly', store => store.get(id))
      return rec?.blob ?? null
    } finally { db.close() }
  } catch {
    return null
  }
}

export async function deleteRecording(id) {
  if (!id) return
  try {
    const db = await openDb()
    try { await tx(db, 'readwrite', store => store.delete(id)) }
    finally { db.close() }
  } catch { /* optional feature — ignore */ }
}
