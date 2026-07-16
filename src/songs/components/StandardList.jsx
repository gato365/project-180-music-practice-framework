// StandardList.jsx — searchable, filterable list of jazz standards
import React, { useState, useMemo } from 'react'
import { STANDARDS } from '../data/standards'

const STYLE_COLORS = {
  'Ballad':          '#c084fc',
  'Swing':           '#f59e0b',
  'Bossa Nova':      '#34d399',
  'Modal / Hard Bop':'#60a5fa',
  'Bebop Blues':     '#fb923c',
  'Funk / Soul Jazz':'#f472b6',
  'Modal / Post-Bop':'#a78bfa',
  'Modal / Funk':    '#38bdf8',
  'Ballad / Swing':  '#e879f9',
  'Modal / Waltz':   '#4ade80',
}

export function styleColor(style) {
  return STYLE_COLORS[style] ?? '#9ca3af'
}

export default function StandardList({ selectedId, onSelect }) {
  const [query,  setQuery]  = useState('')
  const [filter, setFilter] = useState('all')  // tag or 'all'

  const FILTER_OPTIONS = [
    { id: 'all',       label: 'All' },
    { id: 'minor',     label: 'Minor' },
    { id: 'modal',     label: 'Modal' },
    { id: 'blues',     label: 'Blues' },
    { id: 'ballad',    label: 'Ballad' },
    { id: 'bebop',     label: 'Bebop' },
    { id: 'swing',     label: 'Swing' },
    { id: 'latin',     label: 'Latin' },
  ]

  const filtered = useMemo(() => {
    let list = STANDARDS
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.composer.toLowerCase().includes(q) ||
        s.keyCenter.toLowerCase().includes(q)
      )
    }
    if (filter !== 'all') {
      list = list.filter(s => s.tags.includes(filter))
    }
    return list
  }, [query, filter])

  return (
    <aside className="std-list">
      {/* Brand */}
      <div className="std-brand">
        <div className="std-brand-mark">♩</div>
        <div>
          <div className="std-brand-title">Jazz Changes</div>
          <div className="std-brand-sub">Chord Practice · {STANDARDS.length} Standards</div>
        </div>
      </div>

      {/* Search */}
      <div className="std-search-wrap">
        <input
          className="std-search"
          type="search"
          placeholder="Search tunes, composers…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Search standards"
        />
      </div>

      {/* Filter pills */}
      <div className="std-filters">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.id}
            className={`std-filter-pill ${filter === f.id ? 'std-filter-pill--on' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="std-scroll">
        {filtered.length === 0 && (
          <div className="std-empty">No tunes match "{query}"</div>
        )}
        {filtered.map(s => {
          const isActive = s.id === selectedId
          const color    = styleColor(s.style)
          return (
            <button
              key={s.id}
              className={`std-item ${isActive ? 'std-item--active' : ''}`}
              style={{ '--item-color': color }}
              onClick={() => onSelect(s.id)}
              aria-pressed={isActive}
            >
              <div className="std-item-dot" style={{ background: color }} />
              <div className="std-item-body">
                <div className="std-item-title">{s.title}</div>
                <div className="std-item-meta">
                  <span>{s.composer}</span>
                  <span className="std-item-key">{s.keyCenter}</span>
                  <span className="std-item-time">{s.timeSignature}</span>
                </div>
                <div className="std-item-style" style={{ color }}>{s.style}</div>
              </div>
              <div className="std-item-year">{s.year}</div>
            </button>
          )
        })}
      </div>

      <div className="std-footer">
        Tenor sax transposition available in the header controls
      </div>
    </aside>
  )
}
