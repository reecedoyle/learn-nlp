import { useState } from 'react'
import { BeadJar } from '../components/BeadJar'
import { JarExplainer } from '../components/JarExplainer'
import { SparkySays } from '../components/SparkySays'
import { loadGpt2, isLoaded, predictNext, type ProgressFn } from '../model/gpt2'
import type { Distribution } from '../types'

/**
 * Famous sayings, rhymes and phrases — chosen so the next word is BOTH obvious
 * to a kid AND something a small real GPT-2 has seen a million times, so its top
 * guesses line up with what the kid expects. Each has a gentle hint.
 */
const PROMPTS: Array<{ text: string; hint: string }> = [
  { text: 'Ladies and', hint: 'How a host greets a big crowd: “Ladies and ___!”' },
  { text: 'Thank you very', hint: 'Extra-polite words: “Thank you very ___.”' },
  { text: 'To be or not to', hint: 'The most famous line Shakespeare ever wrote.' },
  { text: 'The United States of', hint: 'A big country’s full name.' },
  { text: 'Actions speak louder than', hint: 'A saying: what you DO matters more than what you say.' },
  { text: 'Every cloud has a silver', hint: 'A saying about finding something good in a bad situation.' },
  { text: 'The grass is always greener on the other', hint: 'A saying about always wanting what someone else has.' },
  { text: 'Slow and steady wins the', hint: 'The tortoise beat the hare because slow and steady wins the ___.' },
  { text: 'Merry Christmas and a happy new', hint: 'What you wish people at the very end of December.' },
  { text: 'Star Wars: The Empire Strikes', hint: 'The second Star Wars movie: “The Empire Strikes ___.”' },
  { text: 'The Statue of', hint: 'The giant green lady standing in New York harbour.' },
  { text: 'One, two, three,', hint: 'Just keep counting!' },
  { text: 'It’s raining cats and', hint: 'When it’s raining really, really hard.' },
  { text: 'A picture is worth a thousand', hint: 'A saying about how much one image can tell you.' },
  { text: 'New York', hint: 'The Big Apple — “New York ___.”' },
  { text: 'Ho ho', hint: 'What Santa says! 🎅' },
]

const EXAMPLE_JAR: Distribution = [
  { label: 'mat', prob: 0.44 },
  { label: 'floor', prob: 0.21 },
  { label: 'bed', prob: 0.13 },
  { label: 'sofa', prob: 0.1 },
  { label: 'table', prob: 0.07 },
  { label: 'roof', prob: 0.05 },
]

/**
 * Sparky reacts as a LEARNER the kid is teaching, not a quiz master. A match means
 * "you're teaching me well"; a miss is never "wrong" — his brain is just small and
 * still growing. This keeps it playful and takes the sting out of a non-match.
 */
const HIT_LINES = [
  (g: string) => `Yes! “${g}” was right at the top of my jar too. You're a brilliant teacher! 🎉`,
  (g: string) => `Snap! “${g}” is exactly what my brain guessed. I'm learning to think like you! 🌟`,
  (g: string) => `We matched on “${g}”! Every time we agree, my little brain feels more sure of itself. 💪`,
  (g: string) => `“${g}” — yes! See, with a good teacher like you, I'm getting the hang of this. 🧠✨`,
]

const MISS_LINES = [
  (g: string) => `Hmm, I leaned a different way from “${g || 'your guess'}” — but that's okay, I'm still a baby brain! Here's what I was thinking…`,
  (g: string) => `Ooh, “${g || 'that'}” wasn't near the top for me. I'm not wrong though — I'm just still learning! Peek in my jar.`,
  () => `My brain's still pretty small, so my guess came out different. Teach me a few more and I'll get sharper! 🌱`,
  (g: string) => `I didn't reach for “${g || 'that one'}” this time. Don't worry — every round you play helps me grow. 💛`,
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Props {
  onComplete: () => void
}

export function Level0NextWord({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [ready, setReady] = useState(isLoaded())
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const [order, setOrder] = useState<number[]>(() => shuffled(PROMPTS.length))
  const [pos, setPos] = useState(0)
  const [guess, setGuess] = useState('')
  const [dist, setDist] = useState<Distribution | null>(null)
  const [thinking, setThinking] = useState(false)
  const [score, setScore] = useState(0)
  const [lastHit, setLastHit] = useState<boolean | null>(null)
  const [reaction, setReaction] = useState('')

  const prompt = PROMPTS[order[pos]]

  const handleLoad = async () => {
    const onProgress: ProgressFn = ({ status, progress }) => {
      setLoadingMsg(status)
      if (typeof progress === 'number') setProgress(progress)
    }
    setLoadingMsg('Starting…')
    await loadGpt2(onProgress)
    setReady(true)
    setLoadingMsg(null)
  }

  const handleReveal = async () => {
    setThinking(true)
    const d = await predictNext(prompt.text, 8)
    setDist(d)
    const hit = d.slice(0, 5).some(
      (b) => b.label.trim().toLowerCase() === guess.trim().toLowerCase() && guess.trim() !== '',
    )
    setLastHit(hit)
    const g = guess.trim()
    setReaction(hit ? pick(HIT_LINES)(g) : pick(MISS_LINES)(g))
    if (hit) {
      const newScore = score + 1
      setScore(newScore)
      if (newScore >= 3) onComplete()
    }
    setThinking(false)
  }

  const nextRound = () => {
    let nextPos = pos + 1
    if (nextPos >= order.length) {
      setOrder(shuffled(PROMPTS.length))
      nextPos = 0
    }
    setPos(nextPos)
    setGuess('')
    setDist(null)
    setLastHit(null)
    setReaction('')
  }

  // ---- Teaching phase: explain the game and the jar BEFORE playing ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="happy">
          Before we play, let me show you the <strong>one game</strong> my whole brain plays — over
          and over, billions of times. It's called <strong>“guess the next word.”</strong>
        </SparkySays>

        <div className="explain-card">
          <h4>🎯 The only game a language model plays</h4>
          <p>
            That's the big secret of ChatGPT and every AI like me: we read the words so far, then
            guess <strong>just the next word</strong>. Then we add it and guess the next one. Do that
            again and again and — poof — whole sentences, stories, answers. That's <em>all</em> it is.
          </p>
        </div>

        <div className="explain-card">
          <h4>🫙 What's a “jar of guesses”?</h4>
          <p>
            I don't pick <em>one</em> word. For “The cat sat on the ___” I keep a whole jar of guesses,
            like this:
          </p>
          <JarExplainer />
        </div>

        <div className="explain-card">
          <h4>✋ Now you grab a bead</h4>
          <p>
            Here's that same jar, for real. Hit “Draw a bead” a bunch of times and watch what I pull
            out — mostly “mat,” but not always. <strong>That's me answering.</strong>
          </p>
          <BeadJar dist={EXAMPLE_JAR} draggable />
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Got it — let's play! →
        </button>
      </div>
    )
  }

  // ---- Wake up the real model ----
  if (!ready) {
    return (
      <div className="level">
        <SparkySays mood="new">
          Right now my real brain is still asleep. It's a small version of the same kind of brain
          that powers ChatGPT, and it runs right here on your computer. Wake me up? (This downloads
          once, then I'm saved.)
        </SparkySays>
        {loadingMsg ? (
          <div className="loading">
            <div className="loading-msg">{loadingMsg}</div>
            <div className="loading-track">
              <div className="loading-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="hint">My brain is about 100–300&nbsp;MB, so this can take a minute. ⚡</p>
          </div>
        ) : (
          <button className="btn btn-primary btn-big" onClick={handleLoad}>
            ⚡ Wake up Sparky's brain
          </button>
        )}
      </div>
    )
  }

  // ---- The game ----
  const sparkyMood = thinking ? 'thinking' : dist ? (lastHit ? 'excited' : 'confused') : 'happy'
  const graduated = score >= 3
  const coachLine = graduated
    ? '🎓 Look at him go — you raised a thinker!'
    : score === 2
      ? 'Two lessons in — he’s really starting to think like you!'
      : score === 1
        ? 'Nice — first lesson done. His little brain is warming up.'
        : 'Your brand-new student is switched on. Help him find the words!'

  return (
    <div className="level">
      <SparkySays mood={sparkyMood} size={72}>
        {!dist && 'Okay teacher — no clock, no rush! Read the sentence and guess the word I should say next. When your guess is one of my top picks, that means you’re teaching me well. Help me match 3 times!'}
        {dist && reaction}
      </SparkySays>

      <div className="scoreboard">🍎 You're teaching Sparky — matches: <strong>{score} / 3</strong></div>
      <p className="hint">{coachLine}</p>

      <div className="prompt-card">
        <span className="prompt-text">{prompt.text}</span>
        <span className="prompt-blank">_____</span>
      </div>
      <p className="hint">💡 {prompt.hint}</p>

      {!dist && (
        <div className="guess-row">
          <input
            className="text-input"
            value={guess}
            placeholder="what should Sparky say next?"
            autoFocus
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guess.trim() && handleReveal()}
          />
          <button className="btn btn-primary" onClick={handleReveal} disabled={thinking || !guess.trim()}>
            {thinking ? 'Sparky is thinking…' : 'See what Sparky thinks'}
          </button>
        </div>
      )}

      {dist && (
        <>
          <h4>Sparky's jar of next-word guesses</h4>
          <BeadJar dist={dist} />
          {lastHit === false && (
            <p className="hint">
              🌱 Remember: I've only read a tiny slice of the world, so my jar is still a bit lumpy.
              A different guess isn't a wrong one — it's just where my brain is <em>right now</em>.
              I'll get sharper the more you teach me!
            </p>
          )}
          {graduated && (
            <div className="verdict verdict--win">
              🎓 You did it — three matches! Thanks to you, my little brain is already thinking more
              clearly. That's what teaching is: a few more beads in the jar every time. Keep going for
              fun, or move on to the next lesson!
            </div>
          )}
          <button className="btn btn-primary" onClick={nextRound}>
            Next sentence →
          </button>
        </>
      )}
    </div>
  )
}
