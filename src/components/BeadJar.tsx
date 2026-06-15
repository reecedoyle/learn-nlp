import { useMemo, useState } from 'react'
import type { Distribution } from '../types'
import { applyTemperature, sample } from '../model/distribution'

const PALETTE = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length]
}

interface BeadJarProps {
  dist: Distribution
  /** Total beads to draw in the jar illustration. */
  totalBeads?: number
  /** Show the "draw a bead" button. */
  draggable?: boolean
  temperature?: number
  onDraw?: (label: string) => void
}

/**
 * THE spine component. A probability distribution drawn as a literal jar of
 * coloured beads, plus a legend of words with proportional bars. Reused by every
 * level: GPT-2's next-word jar, the hand-built model's jar, temperature, etc.
 */
export function BeadJar({
  dist,
  totalBeads = 48,
  draggable = false,
  temperature = 1,
  onDraw,
}: BeadJarProps) {
  const [drawn, setDrawn] = useState<string | null>(null)

  const effective = useMemo(
    () => (temperature === 1 ? dist : applyTemperature(dist, temperature)),
    [dist, temperature],
  )

  // Turn probabilities into a whole number of beads per word for the picture.
  const beads = useMemo(() => {
    const arr: { color: string; label: string }[] = []
    effective.forEach((b, i) => {
      const n = Math.max(b.prob > 0 ? 1 : 0, Math.round(b.prob * totalBeads))
      for (let j = 0; j < n; j++) arr.push({ color: colorFor(i), label: b.label })
    })
    return arr.slice(0, totalBeads)
  }, [effective, totalBeads])

  const handleDraw = () => {
    const bead = sample(effective)
    if (!bead) return
    setDrawn(bead.label)
    onDraw?.(bead.label)
  }

  if (dist.length === 0) {
    return <div className="jar-empty">This jar is empty — Sparky never saw what comes next here.</div>
  }

  return (
    <div className="beadjar">
      <div className="jar-illustration" aria-hidden>
        <div className="jar-glass">
          {beads.map((b, i) => (
            <span key={i} className="bead" style={{ background: b.color }} title={b.label} />
          ))}
        </div>
        <div className="jar-base" />
      </div>

      <div className="jar-legend">
        {effective.map((b, i) => (
          <div
            key={b.label + i}
            className={'legend-row' + (drawn === b.label ? ' legend-row--drawn' : '')}
          >
            <span className="legend-swatch" style={{ background: colorFor(i) }} />
            <span className="legend-word">{b.label === ' ' ? '␠' : b.label}</span>
            <span className="legend-bar-track">
              <span className="legend-bar" style={{ width: `${b.prob * 100}%`, background: colorFor(i) }} />
            </span>
            <span className="legend-pct">{(b.prob * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {draggable && (
        <div className="jar-draw">
          <button className="btn btn-draw" onClick={handleDraw}>
            🎲 Draw a bead
          </button>
          {drawn !== null && (
            <span className="drawn-result">
              Sparky picked: <strong>{drawn === ' ' ? '␠(space)' : drawn}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
