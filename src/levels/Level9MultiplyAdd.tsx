import { useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

interface Problem {
  inputs: number[]
  weights: number[]
}

function makeProblem(): Problem {
  const r = () => 1 + Math.floor(Math.random() * 5)
  return { inputs: [r(), r(), r()], weights: [r(), r(), r()] }
}

const NEEDED = 3

export function Level9MultiplyAdd({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [problem, setProblem] = useState<Problem>(makeProblem)
  const [guess, setGuess] = useState('')
  const [checked, setChecked] = useState(false)
  const [solved, setSolved] = useState(0)
  const [won, setWon] = useState(false)

  const answer = problem.inputs.reduce((s, x, i) => s + x * problem.weights[i], 0)
  const correct = checked && Number(guess) === answer

  const check = () => {
    if (guess.trim() === '') return
    setChecked(true)
    if (Number(guess) === answer) {
      const n = solved + 1
      setSolved(n)
      if (n >= NEEDED && !won) {
        setWon(true)
        onComplete()
      }
    }
  }

  const nextProblem = () => {
    setProblem(makeProblem())
    setGuess('')
    setChecked(false)
  }

  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="happy">
          Welcome to my engine room! 🛠️ Before we talk about the hardware, here's a secret about what
          my “thinking” actually is: it's all built from <strong>one tiny move</strong> — multiply some
          numbers by weights, then add them up. That's it.
        </SparkySays>

        <div className="explain-card">
          <h4>✖️➕ Multiply-and-add is everything</h4>
          <p>
            You've already done this all over the place! Every <strong>bead jar</strong>, every
            <strong> attention spotlight</strong> score, every <strong>training nudge</strong> — under
            the hood they're all the same thing: take a list of numbers, multiply each by a weight, and
            add up the results. One of these is called a <strong>neuron</strong>.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Let me try one by hand! →
        </button>
      </div>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : correct ? 'happy' : checked ? 'confused' : 'thinking'} size={72}>
        {won
          ? `🎉 You did ${NEEDED} of them! Now the mind-bender: to read ONE word, a small me does this multiply-and-add hundreds of millions of times. Big models like ChatGPT do trillions — per word.`
          : 'Be a neuron! Multiply each number by the weight under it, then add the three results. What do you get?'}
      </SparkySays>

      <div className="scoreboard">🧮 Neurons computed: {solved} / {NEEDED}</div>

      <div className="neuron">
        {problem.inputs.map((x, i) => (
          <div key={i} className="neuron-term">
            <span className="neuron-in">{x}</span>
            <span className="neuron-x">×</span>
            <span className="neuron-w">{problem.weights[i]}</span>
            {i < problem.inputs.length - 1 && <span className="neuron-plus">+</span>}
          </div>
        ))}
        <span className="neuron-eq">=</span>
        <input
          className="text-input neuron-input"
          value={guess}
          inputMode="numeric"
          placeholder="?"
          disabled={checked}
          onChange={(e) => setGuess(e.target.value.replace(/[^0-9]/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && !checked && check()}
        />
      </div>

      {!checked ? (
        <button className="btn btn-primary" onClick={check} disabled={guess.trim() === ''}>
          Check
        </button>
      ) : (
        <>
          <div className={'verdict ' + (correct ? 'verdict--win' : 'verdict--miss')}>
            {correct ? '✅ Spot on! ' : `Not quite — it's ${answer}. `}
            {problem.inputs.map((x, i) => `${x}×${problem.weights[i]}`).join(' + ')} ={' '}
            {problem.inputs.map((x, i) => x * problem.weights[i]).join(' + ')} = <strong>{answer}</strong>.
          </div>
          {!won && (
            <button className="btn btn-primary" onClick={nextProblem}>
              Next neuron →
            </button>
          )}
        </>
      )}

      {won && (
        <>
          <div className="explain-card">
            <h4>🤯 The scale problem</h4>
            <p>
              You took a few seconds per neuron. If you did multiply-adds by hand at 5 seconds each,
              reading a <em>single word</em> with a small model would take you{' '}
              <strong>more than 20 years</strong>. A whole sentence? Longer than human history. Sparky
              does it in the blink of an eye — and the next level shows the hardware trick that makes
              that possible.
            </p>
          </div>
          <div className="verdict verdict--win">
            🎓 Everything an AI “thinks” is a mountain of these little multiply-adds. That's the whole
            job — just an unimaginable number of them. On to the hardware!
          </div>
        </>
      )}
    </div>
  )
}
