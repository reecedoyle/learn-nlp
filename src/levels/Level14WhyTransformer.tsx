import { useEffect, useRef, useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

const WORDS = ['Sparky', 'reads', 'this', 'whole', 'sentence']
const WORKERS = 8

export function Level14WhyTransformer({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [mode, setMode] = useState<'rnn' | 'transformer' | null>(null)
  const [lit, setLit] = useState(0)
  const [running, setRunning] = useState(false)
  const [ranRnn, setRanRnn] = useState(false)
  const [ranTf, setRanTf] = useState(false)
  const [won, setWon] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timer.current) clearInterval(timer.current) }, [])

  const finishMaybe = (rnn: boolean, tf: boolean) => {
    if (rnn && tf && !won) {
      setWon(true)
      onComplete()
    }
  }

  const runRnn = () => {
    if (timer.current) clearInterval(timer.current)
    setMode('rnn')
    setLit(0)
    setRunning(true)
    let k = 0
    timer.current = setInterval(() => {
      k += 1
      setLit(k)
      if (k >= WORDS.length) {
        if (timer.current) clearInterval(timer.current)
        setRunning(false)
        setRanRnn(true)
        finishMaybe(true, ranTf)
      }
    }, 450)
  }

  const runTf = () => {
    if (timer.current) clearInterval(timer.current)
    setMode('transformer')
    setLit(WORDS.length) // all at once
    setRunning(false)
    setRanTf(true)
    finishMaybe(ranRnn, true)
  }

  const activeWorkers = mode === 'transformer' ? WORKERS : mode === 'rnn' ? 1 : 0

  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="thinking">
          Last question: <strong>why did Transformers take over almost everything?</strong> The answer
          isn't that they're smarter — it's that they fit the <em>hardware</em> perfectly. Remember the
          GPU crowd of workers? 🖥️
        </SparkySays>
        <div className="explain-card">
          <h4>⛓️ The problem with reading in order</h4>
          <p>
            An RNN reads word 2 only <em>after</em> word 1, word 3 after word 2… each step waits for the
            one before. So it can only ever keep <strong>one</strong> GPU worker busy — the giant crowd
            sits idle. A Transformer hands <strong>every</strong> word to the workers at the same time.
          </p>
        </div>
        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Show me the difference! →
        </button>
      </div>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : 'happy'} size={72}>
        {won
          ? '🎉 That’s it! The Transformer did in 1 step what took the RNN 5 — by using all the GPU workers at once. More words, more GPUs, all in parallel. That’s how AI got so big, so fast.'
          : 'Run the same sentence through both. Watch how many steps each takes — and how many GPU workers each can keep busy.'}
      </SparkySays>

      <div className="controls-row">
        <button className="btn btn-primary" onClick={runRnn} disabled={running}>🔁 Process with RNN</button>
        <button className="btn btn-primary" onClick={runTf} disabled={running}>🕸️ Process with Transformer</button>
      </div>

      <div className="why-sentence">
        {WORDS.map((w, i) => (
          <span key={i} className={'why-word' + (i < lit ? ' why-word--lit' : '')}>
            {w}
            {mode === 'rnn' && i < lit && i < WORDS.length - 1 && <span className="why-arrow">→</span>}
          </span>
        ))}
      </div>

      {mode && (
        <>
          <div className="why-stat">
            {mode === 'rnn'
              ? <>🐢 RNN: <strong>one word at a time</strong> · {Math.min(lit, WORDS.length)} / {WORDS.length} done · {WORDS.length} steps total</>
              : <>⚡ Transformer: <strong>all {WORDS.length} words at once</strong> · just 1 step!</>}
          </div>

          <div className="gpu-strip-label">GPU workers in use:</div>
          <div className="gpu-strip">
            {Array.from({ length: WORKERS }).map((_, i) => (
              <span key={i} className={'gpu-worker' + (i < activeWorkers ? ' gpu-worker--on' : '')} />
            ))}
          </div>
          <p className="hint">
            {mode === 'rnn'
              ? `Only 1 worker busy — the other ${WORKERS - 1} sit idle, waiting their turn. What a waste!`
              : 'Every worker busy at once — the whole crowd works in parallel.'}
          </p>
        </>
      )}

      <div className="why-track">
        <span className={'mood-chip' + (ranRnn ? ' mood-chip--done' : '')}>{ranRnn ? '✓' : '○'} 🔁 tried RNN</span>
        <span className={'mood-chip' + (ranTf ? ' mood-chip--done' : '')}>{ranTf ? '✓' : '○'} 🕸️ tried Transformer</span>
      </div>

      {won && (
        <>
          <div className="explain-card">
            <h4>📜 The moment it changed (2017)</h4>
            <p>
              A famous paper called <em>“Attention Is All You Need”</em> threw out the step-by-step
              reading and kept only attention — so everything runs in parallel. Suddenly you could train
              on the whole internet using thousands of GPUs at once. That's the spark behind GPT,
              ChatGPT, and me. 🤖
            </p>
          </div>
          <div className="verdict verdict--win">
            🎓 You've now seen the mind, the machine, <em>and</em> the family tree. Transformers won
            because they turn language into work a GPU crowd can do all at once. Chapter complete!
          </div>
        </>
      )}
    </div>
  )
}
