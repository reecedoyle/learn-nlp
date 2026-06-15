import { useMemo, useState } from 'react'
import { SparkySays } from '../components/SparkySays'
import { applyTemperature, sample } from '../model/distribution'
import type { Distribution } from '../types'

interface Props {
  onComplete: () => void
}

/** The fixed jar — same beads, same counts, ALWAYS. The dial never touches what's
 *  inside; it only changes the funnel Sparky pours them through. (The classic
 *  "The cat sat on the ___" jar from Level 0.) */
const EXAMPLE_JAR: Distribution = [
  { label: 'mat', prob: 0.44 },
  { label: 'floor', prob: 0.21 },
  { label: 'bed', prob: 0.13 },
  { label: 'sofa', prob: 0.1 },
  { label: 'table', prob: 0.07 },
  { label: 'roof', prob: 0.05 },
]

const PALETTE = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899']
const TOTAL_BEADS = 40
const DRAWS = 20

type Zone = 'frozen' | 'just' | 'wild'

const MOODS: Record<Zone, { emoji: string; name: string; blurb: string }> = {
  frozen: {
    emoji: '❄️',
    name: 'Frozen',
    blurb: 'My funnel is pinched to a tiny hole, right over my biggest pile — so almost only my favourite bead squeezes out. Safe and predictable, but I just repeat myself.',
  },
  just: {
    emoji: '😊',
    name: 'Just right',
    blurb: 'My funnel is a sensible width: mostly favourites get out, with the odd surprise. This is where I sound most like a real writer.',
  },
  wild: {
    emoji: '🔥',
    name: 'Wild',
    blurb: 'My funnel is wide open, so even the tiniest piles can tumble out. Super creative… but this is where I start babbling nonsense.',
  },
}

function zoneOf(t: number): Zone {
  if (t <= 0.4) return 'frozen'
  if (t >= 1.15) return 'wild'
  return 'just'
}

/** Sparky's flask: fixed beads sedimented in the bowl (biggest pile at the
 *  bottom, nearest the exit), and a neck whose width is the temperature dial. */
function FlaskJar({ temp }: { temp: number }) {
  // Bead positions never depend on temperature — only the neck does.
  const beads = useMemo(() => {
    const colors: string[] = []
    EXAMPLE_JAR.forEach((b, i) => {
      const n = Math.max(1, Math.round(b.prob * TOTAL_BEADS))
      for (let j = 0; j < n; j++) colors.push(PALETTE[i])
    })
    const perRow = 9
    const gap = 17
    return colors.map((color, idx) => {
      const row = Math.floor(idx / perRow)
      const col = idx % perRow
      return {
        color,
        cx: 60 + col * gap + (row % 2 ? gap / 2 : 0),
        cy: 138 - row * gap,
      }
    })
  }, [])

  const t01 = (temp - 0.1) / (1.6 - 0.1)
  const nh = 9 + t01 * 79 // neck half-width: pinched (low) → wide open (high)
  const cavity = `M40,150 L${130 - nh},198 L${130 - nh},214 L${130 + nh},214 L${130 + nh},198 L220,150 Z`

  return (
    <div className="flask-wrap">
      <svg viewBox="0 0 260 232" className="flask-svg" role="img" aria-label="Sparky's bead funnel">
        {/* Glass bowl holding the (fixed) beads */}
        <path
          d="M36,20 L36,150 L224,150 L224,20"
          fill="rgba(226,232,240,0.35)"
          stroke="#cbd5e1"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {beads.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r="7" fill={b.color} />
        ))}
        {/* The funnel neck — THIS is the temperature dial made visible */}
        <path d={cavity} fill="rgba(109,40,217,0.10)" stroke="#a78bfa" strokeWidth="4" strokeLinejoin="round" />
        {/* exit arrow */}
        <path d="M130,216 l0,10 M124,221 l6,6 l6,-6" stroke="#6d28d9" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function Level4Temperature({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [temp, setTemp] = useState(0.8)
  const [tally, setTally] = useState<Array<{ label: string; count: number }> | null>(null)
  const [visited, setVisited] = useState<Set<Zone>>(new Set())

  const zone = zoneOf(temp)
  const mood = MOODS[zone]
  const won = visited.size === 3

  // The funnel changes the odds — sampling from softmax(logits / T) is exactly
  // the math of "a narrower neck favours the biggest pile."
  const drawDist = useMemo(() => applyTemperature(EXAMPLE_JAR, temp), [temp])

  const handleGrab = () => {
    const counts = new Map<string, number>(EXAMPLE_JAR.map((b) => [b.label, 0]))
    for (let i = 0; i < DRAWS; i++) {
      const bead = sample(drawDist)
      if (bead) counts.set(bead.label, (counts.get(bead.label) ?? 0) + 1)
    }
    setTally(
      [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    )
    setVisited((prev) => {
      if (prev.has(zone)) return prev
      const next = new Set(prev).add(zone)
      if (next.size === 3) onComplete()
      return next
    })
  }

  // ---- Teaching phase ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="happy">
          You've seen my jar of guesses a bunch of times now. Here's the last secret: once I have the
          jar, I still have to <strong>pour it through a funnel and grab whatever drops out</strong> —
          and I can change the <em>shape</em> of that funnel. That shape is called{' '}
          <strong>temperature</strong>. 🌡️
        </SparkySays>

        <div className="explain-card">
          <h4>🌡️ Same beads, different funnel</h4>
          <p>
            The dial <strong>never</strong> changes what's in my jar — the beads and their piles stay
            exactly the same. It only changes my funnel. Pinch it <strong>narrow</strong> and almost
            only my biggest pile gets through (safe, but I repeat myself). Open it{' '}
            <strong>wide</strong> and even the tiny piles tumble out (creative, but I can babble
            nonsense). Same dial ChatGPT has.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Let me turn Sparky's dial! →
        </button>
      </div>
    )
  }

  // ---- The dial ----
  const maxCount = Math.max(1, ...(tally ?? []).map((t) => t.count))

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : 'happy'} size={72}>
        {won
          ? '🎉 You felt all three of my moods! The beads in the jar never changed — you only changed the shape of my funnel. That dial is temperature. You win!'
          : 'Drag my dial to reshape my funnel, then grab a handful of beads. The beads in my jar never change — only the funnel does! Visit all three moods to win.'}
      </SparkySays>

      <div className="prompt-card">
        <span className="prompt-text">The cat sat on the</span>
        <span className="prompt-blank">_____</span>
      </div>
      <p className="hint">
        My jar below holds my guesses for that next word — the same six beads, every single time.
      </p>

      <h4>1. Turn the dial — reshape Sparky's funnel</h4>
      <div className="temp-dial">
        <span className="temp-ends">❄️ pinched ········· wide open 🔥</span>
        <input
          className="temp-range"
          type="range"
          min={10}
          max={160}
          step={5}
          value={Math.round(temp * 100)}
          onChange={(e) => setTemp(Number(e.target.value) / 100)}
        />
        <span className="temp-value">🌡️ {temp.toFixed(2)}</span>
      </div>

      <div className="mood-blurb">
        <strong>{mood.emoji} {mood.name} mode:</strong> {mood.blurb}
      </div>

      <div className="flask-row">
        <FlaskJar temp={temp} />
        <div className="flask-side">
          <p className="hint" style={{ marginTop: 0 }}>
            👀 The beads never move — same six guesses, same piles, every single time. The{' '}
            <strong>only</strong> thing changing is the purple funnel's neck. Narrow neck sits right
            over my biggest pile (🟥 mat); a wide neck reaches everything.
          </p>
          <div className="jar-legend">
            {EXAMPLE_JAR.map((b, i) => (
              <div key={b.label} className="legend-row">
                <span className="legend-swatch" style={{ background: PALETTE[i] }} />
                <span className="legend-word">{b.label}</span>
                <span className="legend-bar-track">
                  <span className="legend-bar" style={{ width: `${b.prob * 100}%`, background: PALETTE[i] }} />
                </span>
                <span className="legend-pct">{(b.prob * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h4>2. Grab a handful and see what drops out</h4>
      <p className="hint">
        Every word Sparky writes is one grab through this funnel. Draw {DRAWS} beads at this setting —
        then reshape the funnel and draw again. Visit all three moods to win.
      </p>
      <button className="btn btn-primary" onClick={handleGrab}>
        🤚 Grab {DRAWS} beads ({mood.emoji} {mood.name})
      </button>

      {tally && (
        <div className="jar-counts">
          <div className="jar-counts-title">
            Out of {DRAWS} grabs at <strong>{mood.emoji} {mood.name}</strong> ({temp.toFixed(2)}):
          </div>
          {tally.map((t) => {
            const color = PALETTE[EXAMPLE_JAR.findIndex((b) => b.label === t.label)] ?? 'var(--accent)'
            return (
              <div key={t.label} className="count-row">
                <span className="count-word">{t.label}</span>
                <span className="count-beads">
                  {Array.from({ length: t.count }).map((_, j) => (
                    <span key={j} className="count-bead" style={{ background: color }} />
                  ))}
                </span>
                <span className="count-num">×{t.count}</span>
              </div>
            )
          })}
          <div className="hint">
            {zone === 'frozen' && 'See? Almost every grab is the same word. The pinched funnel only lets my favourite through — so I repeat myself.'}
            {zone === 'just' && 'A natural mix — mostly the favourites, with the odd surprise. This reads best.'}
            {zone === 'wild' && 'Look — even the rare beads dropped out. Fun, but this is where nonsense creeps in.'}
            {' '}Biggest pile this time: {maxCount} of {DRAWS}.
          </div>
        </div>
      )}

      <div className="mood-tracker">
        {(Object.keys(MOODS) as Zone[]).map((z) => (
          <span key={z} className={'mood-chip' + (visited.has(z) ? ' mood-chip--done' : '')}>
            {visited.has(z) ? '✓' : '○'} {MOODS[z].emoji} {MOODS[z].name}
          </span>
        ))}
      </div>

      {won && (
        <div className="verdict verdict--win">
          🎓 That's temperature: a pinched funnel = predictable and repetitive, a wide one = creative
          but chaotic, and a sweet spot in between that reads best. The jar of beads never changed —
          only the funnel did. Level complete!
        </div>
      )}
    </div>
  )
}
