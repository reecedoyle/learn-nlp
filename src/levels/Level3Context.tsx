import { useEffect, useState } from 'react'
import { BeadJar } from '../components/BeadJar'
import { SparkySays } from '../components/SparkySays'
import { loadGpt2, isLoaded, predictNext, type ProgressFn } from '../model/gpt2'
import type { Distribution } from '../types'

interface Props {
  onComplete: () => void
}

/**
 * Each scene states a secret early, then asks for it again. The kid can SEE the
 * secret word in the sentence — the puzzle is that SPARKY can only read the words
 * inside his memory window. Slide the window so it reaches back far enough and the
 * secret word pops into his guess jar. Thresholds were measured against the real
 * distilgpt2 (see notes in the chat that built this): dragon recalls at ~10 words,
 * cave at ~11 — both snap in sharply, which makes the memory edge easy to find.
 */
interface Scene {
  id: string
  emoji: string
  question: string
  /** Full text fed to the model (windowed). The secret word lives near the start. */
  text: string
  /** The word we hope Sparky recalls once it's back in view. */
  secret: string
}

const SCENES: Scene[] = [
  {
    id: 'password',
    emoji: '🐉',
    question: 'Can Sparky remember the secret password?',
    text: 'The secret password is dragon. Please remember it. The password is',
    secret: 'dragon',
  },
  {
    id: 'treasure',
    emoji: '🗺️',
    question: 'Can Sparky remember where the treasure is?',
    text: 'The treasure is hidden in the cave. To get the treasure you must go to the',
    secret: 'cave',
  },
]

function words(text: string): string[] {
  return text.split(/\s+/)
}

export function Level3Context({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [ready, setReady] = useState(isLoaded())
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const [sceneIdx, setSceneIdx] = useState(0)
  const scene = SCENES[sceneIdx]
  const allWords = words(scene.text)
  const [windowSize, setWindowSize] = useState(4)
  const [dist, setDist] = useState<Distribution | null>(null)
  const [thinking, setThinking] = useState(false)
  const [won, setWon] = useState(false)

  const start = Math.max(0, allWords.length - windowSize)
  const windowedText = allWords.slice(start).join(' ')
  const remembered =
    !!dist && dist.slice(0, 5).some((b) => b.label.trim().toLowerCase() === scene.secret)

  // Re-ask the real model whenever the window (or scene) changes. Debounced so
  // dragging the slider doesn't fire dozens of inferences; `ignore` drops any
  // stale answer that resolves after the window moved again.
  useEffect(() => {
    if (!ready) return
    let ignore = false
    setThinking(true)
    const id = setTimeout(async () => {
      const d = await predictNext(windowedText, 8)
      if (ignore) return
      setDist(d)
      setThinking(false)
    }, 220)
    return () => {
      ignore = true
      clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize, sceneIdx, ready])

  useEffect(() => {
    if (remembered && !won) {
      setWon(true)
      onComplete()
    }
  }, [remembered, won, onComplete])

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

  const switchScene = (i: number) => {
    setSceneIdx(i)
    setWindowSize(4)
    setDist(null)
    setWon(false)
  }

  // ---- Teaching phase ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="thinking">
          Here's a thing that surprises people: I can't remember <em>everything</em> you tell me. I can
          only look at the last chunk of words at once — that chunk is called my{' '}
          <strong>context window</strong>. Anything older scrolls out and I just… forget it. 😅
        </SparkySays>

        <div className="explain-card">
          <h4>🪟 What's a context window?</h4>
          <p>
            It's how far back I can see while I fill my next-word jar. Real me can hold about{' '}
            <strong>1,000 words</strong> at once. When a chat gets longer than that, the oldest words
            fall out the back — which is exactly why a chatbot sometimes forgets what you said way
            earlier!
          </p>
        </div>

        <div className="explain-card">
          <h4>🫙 Only what I can see fills the jar</h4>
          <p>
            Remember: my answer is a jar of beads. Only the words <em>inside</em> my window get to drop
            beads in. If the important word has scrolled out of view, it can't help me — so I end up
            guessing. Let's shrink my memory way down so you can watch it happen.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Let's test Sparky's memory! →
        </button>
      </div>
    )
  }

  // ---- Wake up the real model ----
  if (!ready) {
    return (
      <div className="level">
        <SparkySays mood="new">
          I need my real brain awake for this one. (If you woke me in an earlier level, I'm ready to
          go!)
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

  // ---- The memory puzzle ----
  const sparkyMood = thinking ? 'thinking' : won ? 'excited' : remembered ? 'excited' : 'confused'

  return (
    <div className="level">
      <SparkySays mood={sparkyMood} size={72}>
        {won
          ? `${scene.emoji} I remember now — it's “${scene.secret}”! Once you gave me enough memory to see that part of the sentence, the word dropped right into my jar. THAT'S a context window. 🎉`
          : thinking
            ? 'Hmm, let me read what I can see…'
            : remembered
              ? `Got it — “${scene.secret}”!`
              : 'I can only read the glowing words below — the faded ones have scrolled out of my memory. Drag my memory wider until I can see the secret, and watch my jar!'}
      </SparkySays>

      <div className="chip-row" style={{ marginBottom: 6 }}>
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            className={'chip' + (i === sceneIdx ? ' chip--active' : '')}
            onClick={() => switchScene(i)}
          >
            {s.emoji} {s.id}
          </button>
        ))}
      </div>
      <p className="level-intro">{scene.question}</p>

      <h4>1. What Sparky can see</h4>
      <div className="mem-sentence">
        {allWords.map((w, i) => {
          const inView = i >= start
          const isSecret = w.toLowerCase().replace(/[^a-z]/g, '') === scene.secret
          return (
            <span
              key={i}
              className={
                'mem-word' +
                (inView ? ' mem-word--in' : ' mem-word--out') +
                (isSecret ? ' mem-word--secret' : '')
              }
            >
              {w}
            </span>
          )
        })}
        <span className="mem-blank">＿＿</span>
      </div>

      <div className="mem-controls">
        <label>
          🧠 Sparky's memory: <strong>{windowSize}</strong> word{windowSize === 1 ? '' : 's'}
        </label>
        <input
          type="range"
          min={3}
          max={allWords.length}
          value={windowSize}
          onChange={(e) => setWindowSize(Number(e.target.value))}
        />
        <span className="hint">← less memory · more memory →</span>
      </div>

      <h4>2. Sparky's next-word jar (from only what he can see)</h4>
      {dist ? <BeadJar dist={dist} /> : <p className="hint">Reading…</p>}

      {won ? (
        <div className="verdict verdict--win">
          🎉 You found Sparky's memory edge! With a big enough window, “{scene.secret}” is back in
          view and lands in his jar. With a small one, it's gone — that's why long chats make an AI
          forget. Level complete!{' '}
          {sceneIdx === 0 && 'Try the treasure map for another go. 🗺️'}
        </div>
      ) : (
        <p className="hint">
          {remembered
            ? '✓ It’s in his jar!'
            : '🌱 Not in his jar yet. The secret word might even be glowing, but I sometimes need to see enough of the phrase around it before it clicks — give me a little more memory.'}
        </p>
      )}
    </div>
  )
}
