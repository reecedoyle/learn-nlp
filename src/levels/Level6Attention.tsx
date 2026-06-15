import { useEffect, useMemo, useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

/**
 * A TRANSPARENT toy of self-attention (a teaching model, not GPT-2's own learned
 * weights — those aren't even exposed by the in-browser model). The kid plays the
 * attention head: they give each earlier word a relevance score, a real softmax
 * turns the scores into weights that sum to 1, and the most-weighted word is who
 * Sparky decides the pronoun "it" points to. This shows the actual machinery
 * (score → softmax → weighted focus) — the real Sparky just learns the scores.
 */
interface Puzzle {
  words: string[]
  query: number // index of the word doing the looking ("it")
  candidates: number[] // the things "it" could be
  answer: number // the correct referent
  why: string
}

const PUZZLES: Puzzle[] = [
  {
    words: 'The trophy did not fit in the box because it was too big'.split(' '),
    query: 9,
    candidates: [1, 7],
    answer: 1,
    why: 'Only the trophy can be “too big” to fit — so “it” must be the trophy.',
  },
  {
    words: 'The cat knocked the glass off the table and it broke'.split(' '),
    query: 9,
    candidates: [1, 4, 7],
    answer: 4,
    why: 'A glass is the thing that breaks — so “it” is the glass.',
  },
  {
    words: 'Sparky gave the puppy a bone because it was hungry'.split(' '),
    query: 7,
    candidates: [3, 5],
    answer: 3,
    why: 'The hungry one that wants the bone is the puppy, not the bone itself.',
  },
]

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores)
  const exps = scores.map((s) => Math.exp(s - max))
  const sum = exps.reduce((a, b) => a + b, 0) || 1
  return exps.map((e) => e / sum)
}

export function Level6Attention({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const puzzle = PUZZLES[puzzleIdx]
  const n = puzzle.words.length

  // One relevance score per word; the query word itself is never scored.
  const [scores, setScores] = useState<number[]>(() => Array(n).fill(1))
  const [won, setWon] = useState(false)

  // Attention weights from a real softmax over every word except the query.
  const weights = useMemo(() => {
    const ctx = scores.map((s, i) => (i === puzzle.query ? -Infinity : s))
    return softmax(ctx)
  }, [scores, puzzle.query])

  const maxW = Math.max(...weights)
  const argmax = weights.indexOf(maxW)
  const resolvedCorrect = argmax === puzzle.answer

  useEffect(() => {
    if (resolvedCorrect && !won) {
      setWon(true)
      onComplete()
    }
  }, [resolvedCorrect, won, onComplete])

  const bump = (i: number) => {
    if (i === puzzle.query) return
    setScores((prev) => prev.map((s, j) => (j === i ? Math.min(10, s + 2) : s)))
  }
  const reset = () => setScores(Array(n).fill(1))

  const changePuzzle = (idx: number) => {
    setPuzzleIdx(idx)
    setScores(Array(PUZZLES[idx].words.length).fill(1))
    setWon(false)
  }

  // ---- Teaching phase ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="thinking">
          To understand a word, I look <em>back</em> at the others and decide which ones matter for it.
          I give each a <strong>relevance score</strong>, turn those into a <strong>spotlight</strong>,
          and focus where it's brightest. That spotlight is <strong>attention</strong>. 🔦
        </SparkySays>

        <div className="explain-card">
          <h4>🔦 How the spotlight works</h4>
          <p>
            Say I hit the word <strong>“it”</strong> — who does “it” mean? I score every other word for
            how relevant it is, then a rule called <strong>softmax</strong> turns those scores into a
            spotlight that always adds up to <strong>100%</strong>. Whatever I shine brightest on, that's
            what “it” means to me.
          </p>
        </div>

        <div className="explain-card">
          <h4>🕹️ You be the attention head</h4>
          <p>
            Here's the honest bit: the <em>real</em> me learns these scores by myself from reading
            mountains of text. In this puzzle, <strong>you</strong> get to be my attention head — you
            aim the spotlight, and you'll watch the softmax and the focus happen for real.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Let me aim Sparky's spotlight! →
        </button>
      </div>
    )
  }

  const candWords = puzzle.candidates.map((i) => puzzle.words[i]).join(', ')
  const argmaxIsCandidate = puzzle.candidates.includes(argmax)

  return (
    <div className="level">
      <SparkySays mood={won ? 'excited' : 'happy'} size={72}>
        {won
          ? `🎉 You aimed the spotlight at “${puzzle.words[puzzle.answer]}”, so that's who “it” means! See how the scores became a spotlight that adds to 100%, and the brightest word won? That's attention — and you ran it by hand!`
          : 'Tap the earlier words to shine more spotlight on them. Your goal: make Sparky look hardest at the word that “it” really means.'}
      </SparkySays>

      <div className="chip-row" style={{ marginBottom: 8 }}>
        {PUZZLES.map((_, i) => (
          <button
            key={i}
            className={'chip' + (i === puzzleIdx ? ' chip--active' : '')}
            onClick={() => changePuzzle(i)}
          >
            puzzle {i + 1}
          </button>
        ))}
      </div>

      <p className="hint">
        Who could <strong>“it”</strong> be? → <strong>{candWords}</strong>. Tap a word to brighten
        Sparky's spotlight on it (tap a few times for more). The spotlight always adds up to 100%.
      </p>

      <div className="att-sentence">
        {puzzle.words.map((w, i) => {
          if (i === puzzle.query) {
            return <span key={i} className="att-query">{w}</span>
          }
          const heat = weights[i] / (maxW || 1)
          const isCand = puzzle.candidates.includes(i)
          return (
            <button
              key={i}
              className={'att-word' + (isCand ? ' att-word--cand' : '')}
              style={{
                background: `rgba(245, 158, 11, ${0.08 + heat * 0.85})`,
                color: heat > 0.55 ? '#1f2430' : undefined,
              }}
              onClick={() => bump(i)}
              title={`${(weights[i] * 100).toFixed(0)}% of the spotlight`}
            >
              {w}
              <span className="att-pct">{(weights[i] * 100).toFixed(0)}%</span>
            </button>
          )
        })}
      </div>

      <div className="att-controls">
        <button className="btn" onClick={reset}>🔄 Even out the spotlight</button>
      </div>

      <div className={'att-readout' + (won ? ' att-readout--win' : '')}>
        🔦 Brightest word: <strong>{puzzle.words[argmax]}</strong> ({(maxW * 100).toFixed(0)}%)
        <div style={{ marginTop: 6 }}>
          {won ? (
            <>✅ So Sparky reads <strong>“it” = {puzzle.words[puzzle.answer]}</strong>. {puzzle.why}</>
          ) : argmaxIsCandidate ? (
            <>
              Sparky now thinks <strong>“it” = {puzzle.words[argmax]}</strong>. Hmm — does that make
              sense in the sentence? If not, shine your light on the other option.
            </>
          ) : (
            <>
              Sparky's staring hardest at <strong>“{puzzle.words[argmax]}”</strong> — but “it” has to be
              a <em>thing</em>. Aim the spotlight at one of: <strong>{candWords}</strong>.
            </>
          )}
        </div>
      </div>

      {won && (
        <div className="verdict verdict--win">
          🎓 That's <strong>attention</strong>: score the words, soft­max the scores into a spotlight
          that sums to 100%, and the focus decides the meaning. Inside the real me this runs hundreds
          of times per word — but the machinery is exactly what you just did by hand. Try another
          puzzle, or move on!
        </div>
      )}
    </div>
  )
}
