import { useMemo, useRef, useState } from 'react'
import { BeadJar } from '../components/BeadJar'
import { SparkySays } from '../components/SparkySays'
import { TinyTrainer } from '../model/tinyTrain'
import { SPARKY_CORPUS } from '../data/corpus'

interface Props {
  onComplete: () => void
}

const CW = 380
const CH = 130

export function Level7Training({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const trainer = useRef<TinyTrainer>(null as unknown as TinyTrainer)
  if (!trainer.current) trainer.current = new TinyTrainer(SPARKY_CORPUS)
  const t = trainer.current

  const target = useMemo(() => t.initialLoss * 0.45, [t])

  const [rounds, setRounds] = useState(0)
  const [loss, setLoss] = useState(t.initialLoss)
  const [history, setHistory] = useState<number[]>([t.initialLoss])
  const [inspect, setInspect] = useState<string>(t.knownContexts()[0] ?? '')
  const [sentence, setSentence] = useState<string | null>(null)
  const [won, setWon] = useState(false)

  const teach = (n: number) => {
    let l = loss
    const hist = [...history]
    for (let i = 0; i < n; i++) {
      l = t.trainRound()
      hist.push(l)
    }
    setRounds((r) => r + n)
    setLoss(l)
    setHistory(hist)
    setSentence(null)
    if (l <= target && !won) {
      setWon(true)
      onComplete()
    }
  }

  const restart = () => {
    t.reset()
    setRounds(0)
    setLoss(t.initialLoss)
    setHistory([t.initialLoss])
    setSentence(null)
    setWon(false)
  }

  // ---- Teaching phase ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="new">
          In level 2 you filled my jars by <em>counting</em>. But I can't count the whole internet at
          once! Real brains like mine learn a different way: <strong>guess, see how wrong we were,
          and nudge</strong> — over and over and over. 🎓
        </SparkySays>

        <div className="explain-card">
          <h4>📉 What's “loss”?</h4>
          <p>
            Loss is just <strong>how wrong I am</strong> — how surprised I am by the real next word. I
            start with empty jars (every word equally likely), so I'm very surprised and my loss is
            high. Each round I nudge my beads toward the words that actually came next, and my loss
            drops. <strong>Watching the loss fall is watching me learn.</strong>
          </p>
        </div>

        <div className="explain-card">
          <h4>🎯 Your job</h4>
          <p>
            Teach me round after round and watch two things: the <strong>loss line slide down</strong>,
            and a <strong>jar go from flat to peaked</strong> as I figure out what usually comes next.
            Get my loss low enough and I'll start talking sense!
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Let's teach Sparky! →
        </button>
      </div>
    )
  }

  // ---- Training ----
  const lossPct = Math.min(100, Math.max(0, (loss / t.initialLoss) * 100))
  const jar = inspect ? t.jar(inspect) : []

  // Loss curve points
  const maxL = t.initialLoss
  const pts = history
    .map((l, i) => {
      const x = 8 + (i / Math.max(1, history.length - 1)) * (CW - 16)
      const y = 8 + (1 - l / maxL) * (CH - 16)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const targetY = 8 + (1 - target / maxL) * (CH - 16)

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : rounds === 0 ? 'new' : 'thinking'} size={72}>
        {won
          ? `🎉 My loss dropped from ${t.initialLoss.toFixed(2)} all the way to ${loss.toFixed(2)} — I learned! Nobody hand-filled my jars; I found the beads myself by guessing and nudging ${rounds} times. That's training!`
          : rounds === 0
            ? 'My jars are empty — every word is equally likely, so I babble. Hit “Teach a round” and watch my loss (how wrong I am) start to fall!'
            : `Loss is dropping — keep going! Each round I nudge my beads a little closer to the real words.`}
      </SparkySays>

      <div className="train-top">
        <div className="train-stat">
          <div className="train-stat-num">{loss.toFixed(2)}</div>
          <div className="train-stat-label">loss (how wrong) · round {rounds}</div>
          <div className="loss-meter">
            <div className="loss-meter-fill" style={{ width: `${lossPct}%` }} />
          </div>
        </div>
        <svg viewBox={`0 0 ${CW} ${CH}`} className="loss-curve" role="img" aria-label="Loss over time">
          <line x1="8" y1={targetY} x2={CW - 8} y2={targetY} stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" />
          <text x={CW - 10} y={targetY - 4} className="loss-target-label">win line</text>
          {history.length > 1 && <polyline points={pts} fill="none" stroke="#6d28d9" strokeWidth="2.5" />}
          {history.length > 1 && pts && (
            <circle
              cx={pts.split(' ').slice(-1)[0].split(',')[0]}
              cy={pts.split(' ').slice(-1)[0].split(',')[1]}
              r="4" fill="#6d28d9"
            />
          )}
        </svg>
      </div>

      <div className="controls-row">
        <button className="btn btn-primary" onClick={() => teach(1)}>🎓 Teach a round</button>
        <button className="btn btn-primary" onClick={() => teach(10)}>⏩ Teach 10 rounds</button>
        <button className="btn" onClick={restart}>🔄 Forget everything</button>
      </div>

      <h4>Peek inside a jar as Sparky learns</h4>
      <p className="hint">
        Pick a word — its jar starts flat (all guesses equal) and grows a clear favourite as the loss
        falls. That's a bead pile forming, all by itself.
      </p>
      <div className="chip-row">
        {t.knownContexts().slice(0, 16).map((ctx) => (
          <button
            key={ctx}
            className={'chip' + (inspect === ctx ? ' chip--active' : '')}
            onClick={() => setInspect(ctx)}
          >
            {ctx}
          </button>
        ))}
      </div>
      {inspect && (
        <>
          <div className="jar-counts-title" style={{ margin: '10px 0 4px' }}>
            After <strong>“{inspect}”</strong>, Sparky now expects:
          </div>
          <BeadJar dist={jar.slice(0, 6)} />
        </>
      )}

      <h4>Let Sparky talk</h4>
      <button className="btn btn-primary" onClick={() => setSentence(t.generate())}>
        💬 Generate a sentence
      </button>
      {sentence && (
        <div className="generated">
          <div className="generated-text">“{sentence}”</div>
          <p className="hint">
            {rounds < 4
              ? 'Pretty garbled, right? I haven’t learned much yet — teach me more rounds!'
              : 'Getting better! The more rounds you teach me, the more sense I make.'}
          </p>
        </div>
      )}

      {won && (
        <div className="verdict verdict--win">
          🎓 That's <strong>training</strong>: start clueless, guess, measure the loss, nudge the
          numbers, repeat. A real LLM does this with billions of beads over the whole internet for
          weeks — but the idea is exactly what you just watched. Level complete!
        </div>
      )}
    </div>
  )
}
