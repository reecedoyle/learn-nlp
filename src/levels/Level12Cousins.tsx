import { useEffect, useMemo, useRef, useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

type ArchId = 'rnn' | 'lstm' | 'cnn' | 'transformer' | 'diffusion'

interface Arch {
  id: ArchId
  name: string
  emoji: string
  speed: string
  good: string
  bad: string
  how: string
}

const ARCHES: Arch[] = [
  {
    id: 'rnn', name: 'RNN', emoji: '🔁', speed: '🐢 one word at a time',
    how: 'Reads left-to-right, carrying a memory note it updates at every word. Watch the older words fade — it forgets the start.',
    good: 'Natural for sequences; small and simple.',
    bad: 'Forgets the beginning, and must read in order, so it’s slow.',
  },
  {
    id: 'lstm', name: 'LSTM', emoji: '📒', speed: '🐢 one word at a time',
    how: 'An RNN with a gated notebook. It chooses to KEEP important words (📌 “fox”) bright while the filler fades.',
    good: 'Remembers important words far longer than a plain RNN.',
    bad: 'Still one word at a time; trickier machinery.',
  },
  {
    id: 'cnn', name: 'CNN', emoji: '🔎', speed: '⚡ all at once (parallel)',
    how: 'Slides a small window over a few words at a time, hunting for local patterns — and it can check every position at once.',
    good: 'Fast and parallel; brilliant at images and local patterns.',
    bad: 'Only sees small neighbourhoods — weak at long-range meaning.',
  },
  {
    id: 'transformer', name: 'Transformer', emoji: '🕸️', speed: '⚡ all at once (parallel)',
    how: 'Every word looks at every other word at the same time (attention). That web is how it ties a whole sentence together. This is Sparky!',
    good: 'Sees everything at once; parallel, scales hugely — king of language.',
    bad: 'Hungry for data and compute; cost grows fast with length.',
  },
  {
    id: 'diffusion', name: 'Diffusion', emoji: '🎨', speed: '🖌️ many small steps',
    how: 'A totally different job: it makes pictures. It starts from pure random noise and cleans it up, step by step, into an image.',
    good: 'Makes stunning images and video from a text description.',
    bad: 'Slow (lots of steps) and very compute-hungry.',
  },
]

const WORDS = ['The', 'quick', 'brown', 'fox', 'jumps', 'high']
const KEY = 3 // "fox" — the word an LSTM chooses to remember

// SVG sequence-view layout
const SLOT = 92
const TILE_W = 82
const TILE_H = 38
const TILE_Y = 112
const VBW = WORDS.length * SLOT
const cx = (i: number) => i * SLOT + TILE_W / 2

// Diffusion target: a little smiley on an 11×11 grid
const GRID = 11
function targetColor(x: number, y: number): string {
  const dx = x - 5
  const dy = y - 5
  if (dx * dx + dy * dy > 25) return '#eef2ff' // background
  if ((x === 3 && y === 4) || (x === 7 && y === 4)) return '#1f2430' // eyes
  if (y === 7 && x >= 3 && x <= 7) return '#1f2430' // mouth
  return '#fbbf24' // face
}
const NOISE = ['#cbd5e1', '#94a3b8', '#e2e8f0', '#fca5a5', '#a7f3d0', '#fcd34d']

export function Level12Cousins({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [arch, setArch] = useState<ArchId>('rnn')
  const [progress, setProgress] = useState(1)
  const [seen, setSeen] = useState<Set<ArchId>>(new Set(['rnn']))
  const [won, setWon] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const meta = ARCHES.find((a) => a.id === arch)!
  const current = Math.min(WORDS.length - 1, Math.floor(progress * WORDS.length))

  // Stable per-pixel noise + reveal order for diffusion.
  const diff = useMemo(() => {
    const cells = []
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        cells.push({ x, y, noise: NOISE[Math.floor(Math.random() * NOISE.length)], thresh: Math.random() })
    return cells
  }, [])

  const play = () => {
    if (timer.current) clearInterval(timer.current)
    setProgress(0)
    let p = 0
    timer.current = setInterval(() => {
      p = Math.min(1, p + 0.025)
      setProgress(p)
      if (p >= 1 && timer.current) clearInterval(timer.current)
    }, 40)
  }

  const pick = (id: ArchId) => {
    setArch(id)
    setSeen((prev) => {
      const next = new Set(prev).add(id)
      if (next.size === ARCHES.length && !won) {
        setWon(true)
        onComplete()
      }
      return next
    })
    play()
  }

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="happy">
          Time to meet my <strong>cousins</strong>! 👋 I'm a <strong>Transformer</strong>, but I'm not
          the only kind of AI brain. Each cousin is a different answer to the same question:{' '}
          <em>how do you read something and decide what matters?</em>
        </SparkySays>
        <div className="explain-card">
          <h4>🧬 A family of brains</h4>
          <p>
            Some read word-by-word keeping a memory (RNNs, LSTMs). Some scan little windows and are
            wizards at images (CNNs). One looks at everything at once — me, the Transformer. And one
            doesn't read at all; it <em>paints</em> from noise (Diffusion). Pick each one and watch how
            it works.
          </p>
        </div>
        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Meet the cousins! →
        </button>
      </div>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : 'happy'} size={72}>
        {won
          ? '🎉 You met the whole family! Different brains for different jobs — but they all learn by adjusting numbers, just like you taught me to.'
          : 'Pick a cousin to see how it works. Hit replay to watch the animation again — and meet all five to finish.'}
      </SparkySays>

      <div className="scoreboard">🧬 Cousins met: {seen.size} / {ARCHES.length}</div>

      <div className="chip-row" style={{ marginBottom: 10 }}>
        {ARCHES.map((a) => (
          <button
            key={a.id}
            className={'chip' + (a.id === arch ? ' chip--active' : '') + (seen.has(a.id) ? ' chip--seen' : '')}
            onClick={() => pick(a.id)}
          >
            {a.emoji} {a.name}
          </button>
        ))}
      </div>

      <div className="arch-stage">
        {arch === 'diffusion' ? (
          <div className="diff-grid">
            {diff.map((c, i) => (
              <span
                key={i}
                className="diff-cell"
                style={{ background: progress >= c.thresh ? targetColor(c.x, c.y) : c.noise }}
              />
            ))}
          </div>
        ) : (
          <svg viewBox={`0 0 ${VBW} 160`} className="arch-svg" role="img" aria-label={`${meta.name} reading a sentence`}>
            {/* transformer: all-to-all attention web */}
            {arch === 'transformer' &&
              WORDS.flatMap((_, i) =>
                WORDS.slice(i + 1).map((__, k) => {
                  const j = i + 1 + k
                  const midX = (cx(i) + cx(j)) / 2
                  const lift = TILE_Y - (j - i) * 15
                  return (
                    <path
                      key={`${i}-${j}`}
                      d={`M${cx(i)},${TILE_Y} Q${midX},${lift} ${cx(j)},${TILE_Y}`}
                      fill="none" stroke="#6d28d9" strokeWidth="1.5" opacity={progress * 0.5}
                    />
                  )
                }),
              )}

            {/* rnn / lstm: a memory note travelling left → right */}
            {(arch === 'rnn' || arch === 'lstm') && (
              <>
                <line x1={cx(0)} y1={70} x2={cx(current)} y2={70} stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx={cx(current)} cy={70} r="13" fill="#6d28d9" />
                <text x={cx(current)} y={75} textAnchor="middle" fontSize="13" fill="#fff">🧠</text>
              </>
            )}

            {/* cnn: a sliding 3-word window */}
            {arch === 'cnn' && (
              <rect
                x={Math.max(0, cx(current) - SLOT * 1.5)} y={TILE_Y - 8}
                width={SLOT * 3 - (SLOT - TILE_W)} height={TILE_H + 16}
                rx="10" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeDasharray="6 4"
              />
            )}

            {/* word tiles */}
            {WORDS.map((w, i) => {
              let op = 1
              let active = false
              if (arch === 'rnn') { const read = i <= current; op = read ? Math.max(0.3, 1 - (current - i) * 0.18) : 0.28; active = i === current }
              else if (arch === 'lstm') { const read = i <= current; op = i === KEY ? 1 : read ? Math.max(0.3, 1 - (current - i) * 0.18) : 0.28; active = i === current }
              else if (arch === 'cnn') { const inWin = Math.abs(i - current) <= 1; op = inWin ? 1 : 0.4; active = inWin }
              return (
                <g key={i} opacity={op}>
                  <rect x={i * SLOT} y={TILE_Y} width={TILE_W} height={TILE_H} rx="9"
                    fill="#ede9fe" stroke={active ? '#6d28d9' : '#ddd6fe'} strokeWidth={active ? 3 : 1} />
                  <text x={cx(i)} y={TILE_Y + 24} textAnchor="middle" fontSize="15" fill="#312e5e">{w}</text>
                  {arch === 'lstm' && i === KEY && <text x={cx(i)} y={TILE_Y - 6} textAnchor="middle" fontSize="14">📌</text>}
                </g>
              )
            })}
          </svg>
        )}
      </div>

      <button className="btn" onClick={play}>▶ Replay</button>

      <div className="arch-card">
        <div className="arch-card-head">
          <span className="arch-card-name">{meta.emoji} {meta.name}</span>
          <span className="arch-speed">{meta.speed}</span>
        </div>
        <p className="arch-how">{meta.how}</p>
        <div className="arch-pros">
          <div><span className="arch-good">✅ Great at:</span> {meta.good}</div>
          <div><span className="arch-bad">⚠️ Watch out:</span> {meta.bad}</div>
        </div>
      </div>

      {won && (
        <div className="verdict verdict--win">
          🎓 Five cousins, five strategies. Next: figure out which brain is best for which job — and
          why mine (the Transformer) ended up running almost everything.
        </div>
      )}
    </div>
  )
}
