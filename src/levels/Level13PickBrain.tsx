import { useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

interface Brain {
  id: string
  emoji: string
  name: string
}

const BRAINS: Brain[] = [
  { id: 'rnn', emoji: '🔁', name: 'RNN' },
  { id: 'lstm', emoji: '📒', name: 'LSTM' },
  { id: 'cnn', emoji: '🔎', name: 'CNN' },
  { id: 'transformer', emoji: '🕸️', name: 'Transformer' },
  { id: 'diffusion', emoji: '🎨', name: 'Diffusion' },
]

interface Task {
  q: string
  answers: string[] // any of these counts as right
  why: string
}

const TASKS: Task[] = [
  { q: 'Find the cat hiding in this photo 🐱', answers: ['cnn'],
    why: 'A photo is a grid of pixels full of local patterns — ears, whiskers, edges. That’s exactly what a CNN’s sliding window is built to spot.' },
  { q: 'Turn the words “a red dragon” into a picture 🐉', answers: ['diffusion'],
    why: 'Making a brand-new image from a description is a diffusion model’s party trick — it cleans random noise into a picture.' },
  { q: 'Write a long story that stays on topic 📖', answers: ['transformer'],
    why: 'Staying consistent over many sentences means every word must “see” every other — that’s attention, the Transformer’s superpower.' },
  { q: 'Predict tomorrow’s temperature from a stream of daily readings 🌡️', answers: ['lstm', 'rnn'],
    why: 'A stream of values in order is a time-series — an RNN/LSTM walks through it keeping a running memory.' },
  { q: 'Autocomplete on a tiny smartwatch with barely any memory ⌚', answers: ['rnn', 'lstm'],
    why: 'A small, simple RNN sips memory and handles one word at a time — ideal for a tiny device.' },
  { q: 'Translate a whole paragraph at once 🌍', answers: ['transformer'],
    why: 'Translation needs the whole sentence’s meaning together — Transformers take it all in at once, in parallel.' },
]

const NUM = 5

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export function Level13PickBrain({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [order] = useState(() => shuffle(TASKS.map((_, i) => i)).slice(0, NUM))
  const [pos, setPos] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const task = TASKS[order[pos]]
  const revealed = picked !== null
  const correct = revealed && task.answers.includes(picked)

  const pick = (id: string) => {
    if (revealed) return
    setPicked(id)
    if (task.answers.includes(id)) setScore((s) => s + 1)
  }

  const next = () => {
    if (pos + 1 >= order.length) {
      setFinished(true)
      onComplete()
    } else {
      setPos((p) => p + 1)
      setPicked(null)
    }
  }

  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="thinking">
          Now you know the cousins — let's see if you can pick the <strong>right brain for the
          job</strong>. Each one was invented to be brilliant at something. Match the tool to the task!
          🧰
        </SparkySays>
        <div className="explain-card">
          <h4>🧰 Right tool, right job</h4>
          <p>
            (Heads-up: these days a big Transformer can have a go at almost anything — but each cousin
            was <em>built</em> to shine at one kind of job, and that's what we're after here.)
          </p>
        </div>
        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Start matching! →
        </button>
      </div>
    )
  }

  if (finished) {
    const great = score >= Math.ceil(order.length * 0.7)
    return (
      <div className="level">
        <SparkySays mood="excited" size={88}>
          You matched <strong>{score} / {order.length}</strong>!{' '}
          {great ? 'You really know the family now. 🧬' : 'Good effort — flip back to the cousins to study their strengths!'}
        </SparkySays>
        <div className="verdict verdict--win">
          🎓 Different brains, different superpowers: CNNs for images, RNNs/LSTMs for streams in order,
          Diffusion for making pictures, and Transformers for understanding whole chunks of language at
          once. One last question: <em>why</em> did Transformers take over almost everything? Next level!
        </div>
      </div>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={revealed ? (correct ? 'excited' : 'confused') : 'thinking'} size={72}>
        {!revealed && 'Which brain is the best tool for this job?'}
        {revealed && correct && 'Nailed it! 🎯'}
        {revealed && !correct && `Good guess, but ${BRAINS.find((b) => task.answers.includes(b.id))!.name} is the classic fit here.`}
      </SparkySays>

      <div className="scoreboard">Task {pos + 1} / {order.length} · score {score}</div>

      <div className="prompt-card"><span className="prompt-text">{task.q}</span></div>

      <p className="hint">Pick the brain built for this:</p>
      <div className="brain-options">
        {BRAINS.map((b) => {
          const isAnswer = task.answers.includes(b.id)
          let cls = 'brain-btn'
          if (revealed && isAnswer) cls += ' brain-btn--right'
          else if (revealed && picked === b.id) cls += ' brain-btn--wrong'
          return (
            <button key={b.id} className={cls} onClick={() => pick(b.id)} disabled={revealed}>
              <span className="brain-emoji">{b.emoji}</span>
              {b.name}
            </button>
          )
        })}
      </div>

      {revealed && (
        <>
          <div className={'verdict ' + (correct ? 'verdict--win' : 'verdict--miss')}>
            <strong>Why:</strong> {task.why}
          </div>
          <button className="btn btn-primary" onClick={next}>
            {pos + 1 >= order.length ? 'See your result →' : 'Next task →'}
          </button>
        </>
      )}
    </div>
  )
}
