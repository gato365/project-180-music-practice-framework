// ─────────────────────────────────────────────────────────────────────────────
// coverage.js — what has actually been practiced, and how recently?
//
// Walks the session history (newest first or any order) and produces the
// recency/frequency maps the planner ranks against. The Progress tab uses the
// same stats for its coverage view, so what the user sees as "neglected" is
// exactly what the planner will surface next.
// ─────────────────────────────────────────────────────────────────────────────

import { KEY_IDS } from '../theory/scales.js'

const DAY_MS = 86400000

export function daysSince(ts, now = Date.now()) {
  if (!ts) return null
  return (now - ts) / DAY_MS
}

/**
 * @param {Array} sessions  session records with { timestamp, items[] }
 * @returns {{
 *   keys:        { [keyId]: { lastTs, count, count7d } },
 *   types:       { [keyId]: { [typeId]: lastTs } },
 *   forms:       { [keyId]: { [formId]: lastTs } },
 *   patterns:    { [patternId]: { lastTs, count } },
 *   patternKeys: { [patternId]: { [keyId]: lastTs } },
 * }}
 */
export function coverageStats(sessions = [], now = Date.now()) {
  const keys = {}
  KEY_IDS.forEach(k => { keys[k] = { lastTs: null, count: 0, count7d: 0 } })
  const types = {}
  const forms = {}
  const patterns = {}
  const patternKeys = {}

  for (const s of sessions) {
    const ts = typeof s.timestamp === 'string' ? Date.parse(s.timestamp) : s.timestamp
    if (!ts || !Array.isArray(s.items)) continue
    const within7d = now - ts <= 7 * DAY_MS

    for (const it of s.items) {
      if (it.skipped) continue
      const k = it.keyId
      if (k && keys[k]) {
        keys[k].count += 1
        if (within7d) keys[k].count7d += 1
        if (!keys[k].lastTs || ts > keys[k].lastTs) keys[k].lastTs = ts
      }
      if (it.kind === 'scale' && k) {
        types[k] = types[k] || {}
        if (!types[k][it.scaleType] || ts > types[k][it.scaleType]) types[k][it.scaleType] = ts
        forms[k] = forms[k] || {}
        if (!forms[k][it.form] || ts > forms[k][it.form]) forms[k][it.form] = ts
      }
      if (it.kind === 'pattern' && it.patternId) {
        const p = patterns[it.patternId] = patterns[it.patternId] || { lastTs: null, count: 0 }
        p.count += 1
        if (!p.lastTs || ts > p.lastTs) p.lastTs = ts
        patternKeys[it.patternId] = patternKeys[it.patternId] || {}
        const pk = patternKeys[it.patternId]
        if (k && (!pk[k] || ts > pk[k])) pk[k] = ts
      }
    }
  }

  return { keys, types, forms, patterns, patternKeys }
}
