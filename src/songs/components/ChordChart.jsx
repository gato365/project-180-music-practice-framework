// ─────────────────────────────────────────────────────────────────────────────
// ChordChart.jsx — lead sheet style chord chart display
//
// Layout: sections labeled A/B/C, measures in rows of 4 or 8,
// each measure divided into beat-slots showing chord symbols.
// Active chord glows during playback.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react'
import { prettyChord } from '../utils/chordUtils'

const MEASURES_PER_ROW = 4

function ChordSlot({ slot, isActive, sectionColor, onClickChord, beatsPerBar }) {
  const widthPct = `${(slot.beats / beatsPerBar) * 100}%`
  const pretty   = prettyChord(slot.chord)

  // Split root from quality for styled display
  const rootMatch = pretty.match(/^([A-G][♭♯]?)(.*)$/)
  const root    = rootMatch?.[1] ?? pretty
  const quality = rootMatch?.[2] ?? ''

  return (
    <div
      className={`chord-slot ${isActive ? 'chord-slot--active' : ''}`}
      style={{
        width:           widthPct,
        '--slot-color':  sectionColor,
        borderLeftColor: isActive ? sectionColor : 'transparent',
        background:      isActive ? sectionColor + '1a' : 'transparent',
      }}
      onClick={() => onClickChord?.(slot.chord)}
      role="button"
      aria-label={`Chord ${slot.chord}, ${slot.beats} beats`}
      title={`${slot.chord} — ${slot.beats} beat${slot.beats !== 1 ? 's' : ''}`}
    >
      <span className="chord-root">{root}</span>
      {quality && <span className="chord-quality">{quality}</span>}
    </div>
  )
}

function Measure({ measure, measureNum, isActive, sectionColor, activeSlotIdx, onClickChord, beatsPerBar, showBarNums }) {
  return (
    <div className={`measure ${isActive ? 'measure--active' : ''}`}>
      {showBarNums && <div className="measure-num">{measureNum}</div>}
      <div className="measure-slots">
        {measure.map((slot, si) => (
          <ChordSlot
            key={si}
            slot={slot}
            isActive={isActive && activeSlotIdx === si}
            sectionColor={sectionColor}
            onClickChord={onClickChord}
            beatsPerBar={beatsPerBar}
          />
        ))}
      </div>
    </div>
  )
}

function Section({ section, sectionIdx, activeInfo, color, onClickChord, beatsPerBar, showBarNums, globalMeasureStart }) {
  const isActiveSection = activeInfo?.sectionIdx === sectionIdx
  const rows = []
  for (let i = 0; i < section.measures.length; i += MEASURES_PER_ROW) {
    rows.push(section.measures.slice(i, i + MEASURES_PER_ROW))
  }

  return (
    <div className="section-block">
      {/* Section header */}
      <div className="section-header" style={{ '--sec-color': color }}>
        <div className="section-label" style={{ background: color, color: '#0d0f14' }}>
          {section.label}
          {section.repeat && <span className="section-repeat">×2</span>}
        </div>
        {section.notes && (
          <span className="section-note">{section.notes}</span>
        )}
        <span className="section-bar-count">{section.measures.length} bars</span>
      </div>

      {/* Measure rows */}
      {rows.map((rowMeasures, rowIdx) => (
        <div key={rowIdx} className="measure-row">
          {rowMeasures.map((measure, mInRow) => {
            const mi      = rowIdx * MEASURES_PER_ROW + mInRow
            const isActM  = isActiveSection && activeInfo?.measureIdx === mi
            return (
              <Measure
                key={mi}
                measure={measure}
                measureNum={globalMeasureStart + mi + 1}
                isActive={isActM}
                activeSlotIdx={isActM ? activeInfo?.slotIdx : -1}
                sectionColor={color}
                onClickChord={onClickChord}
                beatsPerBar={beatsPerBar}
                showBarNums={showBarNums}
              />
            )
          })}
          {/* Fill empty slots in the last row */}
          {rowMeasures.length < MEASURES_PER_ROW &&
            Array.from({ length: MEASURES_PER_ROW - rowMeasures.length }).map((_, i) => (
              <div key={`empty-${i}`} className="measure measure--empty" />
            ))
          }
        </div>
      ))}
    </div>
  )
}

// Section color palette
const SECTION_COLORS = ['#f59e0b','#c084fc','#38bdf8','#34d399','#fb923c','#f472b6']

/**
 * @param {object}   props.standard    — standard data (already transposed)
 * @param {object}   props.activeInfo  — { sectionIdx, measureIdx, slotIdx } | null
 * @param {function} props.onClickChord — called with chord symbol
 * @param {boolean}  props.showBarNums
 */
export default function ChordChart({ standard, activeInfo, onClickChord, showBarNums = true }) {
  if (!standard) return null
  const { sections, beatsPerBar } = standard

  let measureCounter = 0

  return (
    <div className="chord-chart">
      {sections.map((section, si) => {
        const start  = measureCounter
        measureCounter += section.measures.length
        return (
          <Section
            key={si}
            section={section}
            sectionIdx={si}
            activeInfo={activeInfo}
            color={SECTION_COLORS[si % SECTION_COLORS.length]}
            onClickChord={onClickChord}
            beatsPerBar={beatsPerBar}
            showBarNums={showBarNums}
            globalMeasureStart={start}
          />
        )
      })}
    </div>
  )
}
