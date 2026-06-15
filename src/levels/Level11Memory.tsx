import { useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

interface Brain {
  name: string
  params: string
  gb: number // memory needed (≈ 2 bytes per number, fp16)
  note: string
}

interface Device {
  name: string
  gb: number
  emoji: string
}

const BRAINS: Brain[] = [
  { name: 'Sparky (the one you raised)', params: '~80 million', gb: 0.16, note: 'tiny — fits almost anywhere' },
  { name: 'Full GPT-2', params: '1.5 billion', gb: 3, note: 'fits on a good laptop' },
  { name: 'A big open model', params: '70 billion', gb: 140, note: 'needs serious data-center GPUs' },
  { name: 'A ChatGPT-class model', params: '~1.8 trillion', gb: 3600, note: 'needs a whole rack — a data centre' },
]

const DEVICES: Device[] = [
  { name: 'Phone', gb: 6, emoji: '📱' },
  { name: 'Gaming laptop', gb: 16, emoji: '💻' },
  { name: 'One data-centre GPU', gb: 80, emoji: '🖥️' },
  { name: 'A rack of 8 GPUs', gb: 640, emoji: '🗄️' },
]

function fmt(gb: number): string {
  if (gb < 1) return `${Math.round(gb * 1000)} MB`
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`
  return `${gb} GB`
}

export function Level11Memory({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [brainIdx, setBrainIdx] = useState(0)
  const [seen, setSeen] = useState<Set<number>>(new Set([0]))
  const [won, setWon] = useState(false)

  const brain = BRAINS[brainIdx]
  const smallest = DEVICES.find((d) => d.gb >= brain.gb)

  const pickBrain = (i: number) => {
    setBrainIdx(i)
    setSeen((prev) => {
      const next = new Set(prev).add(i)
      if (next.size === BRAINS.length && !won) {
        setWon(true)
        onComplete()
      }
      return next
    })
  }

  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="happy">
          One last hardware secret: all my “beads” — the millions or billions of weights I learned —
          have to be <strong>held in the GPU's memory</strong> the whole time I'm thinking. The bigger
          my brain, the more memory I need, and the more chips it takes to hold me. 🧠
        </SparkySays>

        <div className="explain-card">
          <h4>📦 Why a model has to “fit”</h4>
          <p>
            Every weight is a number, and a number takes up space. A model with a billion weights needs
            about <strong>2 gigabytes</strong> just to sit there. Tiny me fits on almost anything — but
            a ChatGPT-sized brain needs <em>way</em> more memory than any single computer has. That's
            why the biggest AIs live in data centres, not on your phone.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Let's see what fits! →
        </button>
      </div>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : 'happy'} size={72}>
        {won
          ? '🎉 Now you see the whole picture: a brain is only as runnable as the memory you can give it. Tiny me fits in your pocket; ChatGPT needs a building full of GPUs!'
          : 'Pick a brain and see how much memory it needs — and what it takes to hold it. Check out all four!'}
      </SparkySays>

      <div className="scoreboard">🧠 Brains explored: {seen.size} / {BRAINS.length}</div>

      <div className="chip-row" style={{ marginBottom: 10 }}>
        {BRAINS.map((b, i) => (
          <button
            key={b.name}
            className={'chip' + (i === brainIdx ? ' chip--active' : '') + (seen.has(i) ? ' chip--seen' : '')}
            onClick={() => pickBrain(i)}
          >
            {seen.has(i) ? '✓ ' : ''}{b.params}
          </button>
        ))}
      </div>

      <div className="mem-card">
        <div className="mem-card-title">
          <strong>{brain.name}</strong> · {brain.params} weights → needs{' '}
          <strong>{fmt(brain.gb)}</strong> of memory
        </div>

        <div className="fit-list">
          {DEVICES.map((d) => {
            const fits = d.gb >= brain.gb
            const needed = Math.ceil(brain.gb / d.gb)
            const fillPct = Math.min(100, (brain.gb / d.gb) * 100)
            return (
              <div key={d.name} className="fit-row">
                <span className="fit-device">{d.emoji} {d.name}<br /><span className="fit-cap">{fmt(d.gb)}</span></span>
                <span className="fit-bar-track">
                  <span
                    className={'fit-bar ' + (fits ? 'fit-bar--ok' : 'fit-bar--over')}
                    style={{ width: `${fillPct}%` }}
                  />
                </span>
                <span className={'fit-verdict ' + (fits ? 'fit-verdict--ok' : 'fit-verdict--over')}>
                  {fits ? '✓ fits' : `need ${needed}×`}
                </span>
              </div>
            )
          })}
        </div>

        <p className="hint">
          {smallest
            ? `Smallest thing that runs it on its own: ${smallest.emoji} ${smallest.name}. ${brain.note}.`
            : `Too big for even a rack of 8 GPUs — you'd need ${Math.ceil(brain.gb / DEVICES[DEVICES.length - 1].gb)} whole racks. ${brain.note}.`}
        </p>
      </div>

      {won && (
        <div className="verdict verdict--win">
          🎓 That's the engine room! Everything Sparky thinks is <strong>multiply-and-add</strong>, done
          billions of times; <strong>GPUs</strong> do those in giant parallel crowds; and the model's
          weights must <strong>fit in their memory</strong>. Fast chips + lots of memory = the muscle
          behind every AI. You've now seen the mind <em>and</em> the machine. 🏆
        </div>
      )}
    </div>
  )
}
