// StandardHeader.jsx — display metadata for the selected standard
import React, { useState } from 'react'
import { styleColor } from './StandardList'

export default function StandardHeader({ standard, transposedKey }) {
  const [showNotes, setShowNotes] = useState(false)
  if (!standard) return null

  const color = styleColor(standard.style)

  return (
    <div className="std-header" style={{ '--hdr-color': color }}>
      <div className="std-hdr-main">
        <div className="std-hdr-left">
          <h1 className="std-hdr-title">{standard.title}</h1>
          <div className="std-hdr-meta">
            <span className="std-hdr-composer">{standard.composer}</span>
            <span className="std-hdr-dot">·</span>
            <span className="std-hdr-year">{standard.year}</span>
            <span className="std-hdr-dot">·</span>
            <span className="std-hdr-style" style={{ color }}>{standard.style}</span>
            <span className="std-hdr-dot">·</span>
            <span className="std-hdr-time">{standard.timeSignature}</span>
          </div>
          {/* Tags */}
          <div className="std-hdr-tags">
            {standard.tags.map(tag => (
              <span key={tag} className="std-hdr-tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="std-hdr-right">
          <div className="std-key-box" style={{ borderColor: color + '66' }}>
            <span className="std-key-label">Key Center</span>
            <span className="std-key-val" style={{ color }}>{transposedKey ?? standard.keyCenter}</span>
          </div>
          {standard.notes && (
            <button
              className="std-notes-btn"
              onClick={() => setShowNotes(n => !n)}
            >
              {showNotes ? '▲ Hide notes' : '▼ Practice notes'}
            </button>
          )}
        </div>
      </div>

      {showNotes && standard.notes && (
        <div className="std-practice-notes" style={{ borderColor: color + '44' }}>
          <span className="std-practice-icon">♩</span>
          <p>{standard.notes}</p>
        </div>
      )}
    </div>
  )
}
