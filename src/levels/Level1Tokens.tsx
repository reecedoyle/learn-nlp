import { useEffect, useState } from 'react'
import { SparkySays } from '../components/SparkySays'
import {
  loadTokenizer,
  isTokenizerLoaded,
  tokenize,
  type ProgressFn,
  type TokenPiece,
} from '../model/gpt2'

interface Props {
  onComplete: () => void
}

const TOKEN_PALETTE = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

const DEFAULT_TEXT = 'Sparky loves jellybeans!'

/** Words to dare the kid to "shatter" — short common ones stay whole, long/weird ones explode. */
const SUGGESTIONS = ['the', 'cat', 'Sparky', 'jellybeans', 'antidisestablishmentarianism', 'supercalifragilistic']

/** Render one token as a coloured tile, making any leading space visible. */
function TokenTile({ piece, index }: { piece: TokenPiece; index: number }) {
  const color = TOKEN_PALETTE[index % TOKEN_PALETTE.length]
  const hasLeadingSpace = piece.text.startsWith(' ')
  const shown = piece.text.replace(/ /g, '·')
  return (
    <span className="token" style={{ background: color }}>
      <span className="token-text">{shown === '' ? '⏎' : shown}</span>
      <span className="token-id">#{piece.id}</span>
      {hasLeadingSpace && <span className="token-space-note">␠ space</span>}
    </span>
  )
}

export function Level1Tokens({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [ready, setReady] = useState(isTokenizerLoaded())
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const [text, setText] = useState(DEFAULT_TEXT)
  const [tokens, setTokens] = useState<TokenPiece[]>([])
  const [won, setWon] = useState(false)

  // The puzzle: a SINGLE word (no spaces) that Sparky must smash into 3+ pieces.
  const trimmed = text.trim()
  const isSingleWord = trimmed.length > 0 && !/\s/.test(trimmed)
  const shattered = isSingleWord && tokens.length >= 3

  // Re-chop whenever the text changes (once the chopper is awake).
  useEffect(() => {
    if (!ready) return
    setTokens(tokenize(text))
  }, [text, ready])

  useEffect(() => {
    if (shattered && !won) {
      setWon(true)
      onComplete()
    }
  }, [shattered, won, onComplete])

  const handleLoad = async () => {
    const onProgress: ProgressFn = ({ status, progress }) => {
      setLoadingMsg(status)
      if (typeof progress === 'number') setProgress(progress)
    }
    setLoadingMsg('Starting…')
    await loadTokenizer(onProgress)
    setReady(true)
    setLoadingMsg(null)
  }

  // ---- Teaching phase ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="confused">
          Here's something weird about me: <strong>I can't actually read letters.</strong> Before I
          can do anything with your text, I have to chop it into little puzzle-pieces called{' '}
          <strong>tokens</strong> — and each piece is really just a <strong>number</strong>.
        </SparkySays>

        <div className="explain-card">
          <h4>🔤 What's a token?</h4>
          <p>
            A token is a chunk of text — sometimes a whole word, sometimes just part of one. Common
            words like <code>the</code> or <code>cat</code> are a single token. But a long or unusual
            word gets smashed into several pieces, like <code>jelly</code> + <code>beans</code>.
          </p>
        </div>

        <div className="explain-card">
          <h4>🫙 Remember the beads?</h4>
          <p>
            In the last level, my jar was full of beads with <em>words</em> on them. Here's the truth:
            what's really written on each bead is a <strong>token number</strong>. Tokens are the
            alphabet I think in — everything I do starts by turning your words into these numbers.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Show me how you chop words! →
        </button>
      </div>
    )
  }

  // ---- Wake up the tokenizer ----
  if (!ready) {
    return (
      <div className="level">
        <SparkySays mood="new">
          Let me grab my word-chopper. It's tiny — just a few megabytes — so this is quick. (If you
          already woke my full brain in Level 0, I've got it ready.)
        </SparkySays>
        {loadingMsg ? (
          <div className="loading">
            <div className="loading-msg">{loadingMsg}</div>
            <div className="loading-track">
              <div className="loading-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-big" onClick={handleLoad}>
            🔤 Get Sparky's word-chopper
          </button>
        )}
      </div>
    )
  }

  // ---- The tokenizer sandbox + puzzle ----
  const charCount = text.length
  const sparkyMood = won ? 'excited' : shattered ? 'excited' : 'happy'

  return (
    <div className="level">
      <SparkySays mood={sparkyMood} size={72}>
        {!won &&
          'Type anything and watch me chop it into tokens! Each tile is one piece, with the number I really see underneath. Your challenge: find ONE word so long or weird that I have to break it into 3 or more pieces. 🧩'}
        {won &&
          `Whoa — “${trimmed}” shattered into ${tokens.length} tokens! Now you know: I don't read words, I read numbered pieces. The rarer the word, the more pieces it takes. You win this level! 🎉`}
      </SparkySays>

      <p className="level-intro">
        This is the <strong>real</strong> GPT-2 chopper — the exact same one from Level 0. Whatever you
        type, you're seeing the genuine tokens the model would read.
      </p>

      <h4>1. Type something for Sparky to chop</h4>
      <input
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a sentence or a word…"
      />
      <div className="chip-row" style={{ marginTop: 10 }}>
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => setText(s)}>
            {s}
          </button>
        ))}
      </div>

      <h4>2. How Sparky sees it</h4>
      <div className="token-row">
        {tokens.map((t, i) => (
          <TokenTile key={i} piece={t} index={i} />
        ))}
      </div>
      <div className="token-stats">
        <span>
          You typed <strong>{charCount}</strong> letter{charCount === 1 ? '' : 's'}
        </span>
        <span className="token-stats-arrow">→</span>
        <span>
          Sparky sees <strong>{tokens.length}</strong> token{tokens.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="challenge-card">
        {!isSingleWord && trimmed.length > 0 && (
          <p className="hint">
            That's more than one word. Try typing a <strong>single</strong> word with no spaces — then
            make it long or strange enough to shatter into 3+ pieces.
          </p>
        )}
        {isSingleWord && !shattered && (
          <p className="hint">
            “{trimmed}” only took <strong>{tokens.length}</strong> piece{tokens.length === 1 ? '' : 's'}.
            Try something longer or weirder — your full name, a made-up word, the longest word you know!
          </p>
        )}
        {won && (
          <div className="verdict verdict--win">
            🎉 <strong>“{trimmed}”</strong> broke into <strong>{tokens.length}</strong> tokens. Long and
            rare words cost more pieces — that's <strong>tokenization</strong>. Level complete!
          </div>
        )}
      </div>
    </div>
  )
}
