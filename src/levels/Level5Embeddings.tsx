import { useMemo, useState } from 'react'
import { SparkySays } from '../components/SparkySays'
import { loadEmbedder, embedWords, cosine, pca2d, analogyProject, type ProgressFn } from '../model/embed'

interface Props {
  onComplete: () => void
}

interface WordDef {
  word: string
  cat: string
}

const WORDS: WordDef[] = [
  { word: 'king', cat: 'royal' }, { word: 'queen', cat: 'royal' },
  { word: 'prince', cat: 'royal' }, { word: 'princess', cat: 'royal' },
  { word: 'man', cat: 'people' }, { word: 'woman', cat: 'people' },
  { word: 'boy', cat: 'people' }, { word: 'girl', cat: 'people' },
  { word: 'dog', cat: 'animal' }, { word: 'cat', cat: 'animal' },
  { word: 'puppy', cat: 'animal' }, { word: 'kitten', cat: 'animal' },
  { word: 'lion', cat: 'animal' }, { word: 'tiger', cat: 'animal' },
  { word: 'apple', cat: 'fruit' }, { word: 'banana', cat: 'fruit' },
  { word: 'orange', cat: 'fruit' }, { word: 'grape', cat: 'fruit' },
  { word: 'car', cat: 'vehicle' }, { word: 'truck', cat: 'vehicle' },
  { word: 'bus', cat: 'vehicle' }, { word: 'train', cat: 'vehicle' },
  { word: 'happy', cat: 'emotion' }, { word: 'sad', cat: 'emotion' }, { word: 'angry', cat: 'emotion' },
  { word: 'hot', cat: 'scale' }, { word: 'cold', cat: 'scale' },
  { word: 'big', cat: 'scale' }, { word: 'small', cat: 'scale' },
  { word: 'red', cat: 'colour' }, { word: 'blue', cat: 'colour' },
  { word: 'green', cat: 'colour' }, { word: 'yellow', cat: 'colour' },
  { word: 'Paris', cat: 'place' }, { word: 'France', cat: 'place' },
  { word: 'London', cat: 'place' }, { word: 'England', cat: 'place' },
  { word: 'Tokyo', cat: 'place' }, { word: 'Japan', cat: 'place' },
  { word: 'water', cat: 'nature' }, { word: 'fire', cat: 'nature' },
  { word: 'sun', cat: 'nature' }, { word: 'moon', cat: 'nature' },
]

const CAT_COLOR: Record<string, string> = {
  royal: '#8b5cf6', people: '#6366f1', animal: '#10b981', fruit: '#f59e0b',
  vehicle: '#3b82f6', emotion: '#ec4899', scale: '#14b8a6', colour: '#ef4444',
  place: '#f97316', nature: '#0ea5e9',
}

const W = 600
const H = 410
const PAD = 48

export function Level5Embeddings({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [vecs, setVecs] = useState<number[][] | null>(null)
  const [coords, setCoords] = useState<Array<{ x: number; y: number }> | null>(null)

  const [selected, setSelected] = useState<string | null>(null)
  const [a, setA] = useState('king')
  const [b, setB] = useState('man')
  const [c, setC] = useState('woman')
  const [result, setResult] = useState<{ word: string; score: number } | null>(null)
  const [anaCoords, setAnaCoords] = useState<Array<{ x: number; y: number }> | null>(null)
  const [solved, setSolved] = useState(false)

  const idxOf = (word: string) => WORDS.findIndex((w) => w.word === word)

  // Scale coords into the SVG box. In analogy mode we use the tailored
  // projection and zoom to the four key words (others may fall off-frame);
  // otherwise we use the global PCA map and fit every word.
  const screen = useMemo(() => {
    const src = anaCoords ?? coords
    if (!src) return null
    let fit = src.map((_, i) => i)
    if (anaCoords && result) {
      fit = [idxOf(a), idxOf(b), idxOf(c), idxOf(result.word)].filter((i) => i >= 0)
    }
    let minX = Math.min(...fit.map((i) => src[i].x))
    let maxX = Math.max(...fit.map((i) => src[i].x))
    let minY = Math.min(...fit.map((i) => src[i].y))
    let maxY = Math.max(...fit.map((i) => src[i].y))
    const padX = (maxX - minX) * 0.18 || 1
    const padY = (maxY - minY) * 0.35 || 1
    minX -= padX; maxX += padX; minY -= padY; maxY += padY
    const sx = (W - 2 * PAD) / (maxX - minX || 1)
    const sy = (H - 2 * PAD) / (maxY - minY || 1)
    return src.map((p) => ({ x: PAD + (p.x - minX) * sx, y: PAD + (p.y - minY) * sy }))
  }, [coords, anaCoords, a, b, c, result])

  // Nearest neighbours of the clicked word (real cosine in 384-D).
  const neighbours = useMemo(() => {
    if (!vecs || selected === null) return []
    const si = idxOf(selected)
    return WORDS.map((w, i) => ({ i, word: w.word, s: cosine(vecs[si], vecs[i]) }))
      .filter((n) => n.i !== si)
      .sort((x, y) => y.s - x.s)
      .slice(0, 5)
  }, [vecs, selected])
  const neighbourSet = new Set(neighbours.map((n) => n.i))

  const handleLoad = async () => {
    setLoading(true)
    const onProgress: ProgressFn = ({ status, progress }) => {
      setLoadingMsg(status)
      if (typeof progress === 'number') setProgress(progress)
    }
    setLoadingMsg('Starting…')
    await loadEmbedder(onProgress)
    setLoadingMsg('Placing words on the map…')
    const v = await embedWords(WORDS.map((w) => w.word))
    setVecs(v)
    setCoords(pca2d(v))
    setLoading(false)
    setLoadingMsg(null)
  }

  const handleSolve = () => {
    if (!vecs) return
    const va = vecs[idxOf(a)], vb = vecs[idxOf(b)], vc = vecs[idxOf(c)]
    const q = va.map((x, i) => x - vb[i] + vc[i])
    const qn = Math.sqrt(q.reduce((s, x) => s + x * x, 0)) || 1
    const exclude = new Set([a, b, c])
    let best = { word: '', score: -Infinity }
    WORDS.forEach((w, i) => {
      if (exclude.has(w.word)) return
      const s = cosine(q, vecs[i]) / qn
      if (s > best.score) best = { word: w.word, score: s }
    })
    setResult(best)
    setSelected(null)
    // Rotate the map so the b→c step is horizontal — makes the two arrows parallel.
    setAnaCoords(analogyProject(vecs, idxOf(a), idxOf(b), idxOf(c)))
    if (!solved) {
      setSolved(true)
      onComplete()
    }
  }

  // ---- Teaching phase ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="happy">
          Time to peek at how I store <em>meaning</em>. I turn every word into a long list of numbers,
          which is really just <strong>a point on a giant map</strong>. The trick: words that mean
          similar things end up <strong>close together</strong>. 🗺️
        </SparkySays>

        <div className="explain-card">
          <h4>🗺️ A map of meaning (embeddings)</h4>
          <p>
            Nobody tells me where to put words — I learn it from reading. Because “dog” and “puppy”
            show up in the same kinds of sentences, they land near each other. This map is how I know
            which words are alike. It even lets me do word <em>arithmetic</em>…
          </p>
        </div>

        <div className="explain-card">
          <h4>➡️ Steps on the map are arrows</h4>
          <p>
            Here's the key idea: the <strong>step from one word to another is an arrow</strong> — a
            direction that <em>means</em> something. The arrow from <strong>man → woman</strong> means
            “make it the girl version.” And that same arrow shows up all over the map: it also points
            from <strong>boy → girl</strong> and <strong>prince → princess</strong>.
          </p>
        </div>

        <div className="explain-card">
          <h4>✨ The magic trick: word-maths</h4>
          <p>
            So start at <strong>king</strong> and follow that same “make it the girl version” arrow —
            where do you land? <strong>Queen!</strong> 👑 Written as maths:
          </p>
          <p style={{ textAlign: 'center', fontSize: 17, margin: '10px 0' }}>
            <strong>king − man + woman = queen</strong>
          </p>
          <p>
            <strong>Subtracting</strong> <code>man</code> and <strong>adding</strong> <code>woman</code>{' '}
            is just “take the man-ness out, put the woman-ness in” — swap the boy part for the girl
            part, keep everything else (the royal, crown-y part) the same. You'll do it with a{' '}
            <em>real</em> model in a sec, and see the two arrows line up.
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Show me Sparky's meaning map! →
        </button>
      </div>
    )
  }

  // ---- Wake the embedder ----
  if (!vecs || !screen) {
    return (
      <div className="level">
        <SparkySays mood="new">
          I need my “meaning-sense” awake for this — it's a small, real model (about 25&nbsp;MB) that
          turns words into points. Wake it up?
        </SparkySays>
        {loading ? (
          <div className="loading">
            <div className="loading-msg">{loadingMsg}</div>
            <div className="loading-track">
              <div className="loading-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <button className="btn btn-primary btn-big" onClick={handleLoad}>
            🗺️ Build Sparky's meaning map
          </button>
        )}
      </div>
    )
  }

  const resultIdx = result ? idxOf(result.word) : -1
  const anaSet = result ? new Set([idxOf(a), idxOf(b), idxOf(c), resultIdx]) : new Set<number>()

  // ---- The map ----
  return (
    <div className="level">
      <SparkySays mood={solved ? 'excited' : 'happy'} size={72}>
        {solved && result
          ? `🎉 ${a} − ${b} + ${c} = ${result.word}! I found that by doing actual maths on the points — no one taught me the answer. The map carries meaning. You win!`
          : 'This is my real meaning map. Tap any word to see its closest neighbours — then try the magic word-maths below!'}
      </SparkySays>

      <h4>1. Tap a word to see its nearest neighbours</h4>
      {anaCoords && (
        <p className="hint">
          🔄 I've <strong>rotated the map</strong> to look straight along the {b} → {c} direction, so
          the two arrows line up. (From the cluster angle they looked unrelated — that's just the 2D
          shadow of my 384-D space.) Tap any word to flip back to the full map.
        </p>
      )}
      <div className="emap-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="emap" role="img" aria-label="Word meaning map">
          <defs>
            <marker id="arrow-rule" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="#6366f1" />
            </marker>
            <marker id="arrow-apply" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="#059669" />
            </marker>
          </defs>
          {/* neighbour links */}
          {selected &&
            neighbours.map((n) => {
              const si = idxOf(selected)
              return (
                <line
                  key={n.i}
                  x1={screen[si].x} y1={screen[si].y}
                  x2={screen[n.i].x} y2={screen[n.i].y}
                  stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3"
                />
              )
            })}
          {/* analogy arrows: the rule (B→C) and the same step applied (A→answer) */}
          {result && resultIdx >= 0 && (
            <>
              <line
                x1={screen[idxOf(b)].x} y1={screen[idxOf(b)].y}
                x2={screen[idxOf(c)].x} y2={screen[idxOf(c)].y}
                stroke="#6366f1" strokeWidth={2.5} markerEnd="url(#arrow-rule)"
              />
              <line
                x1={screen[idxOf(a)].x} y1={screen[idxOf(a)].y}
                x2={screen[resultIdx].x} y2={screen[resultIdx].y}
                stroke="#059669" strokeWidth={2.5} markerEnd="url(#arrow-apply)"
              />
            </>
          )}
          {WORDS.map((w, i) => {
            const p = screen[i]
            const isSel = selected === w.word
            const isNeighbour = neighbourSet.has(i)
            const inAna = anaSet.has(i)
            const isAnswer = result && i === resultIdx
            const dim = (selected && !isSel && !isNeighbour) || (result && !inAna)
            return (
              <g key={w.word} className="emap-dot" onClick={() => { setSelected(isSel ? null : w.word); setResult(null); setAnaCoords(null) }}>
                <circle
                  cx={p.x} cy={p.y}
                  r={isSel || isAnswer ? 9 : 6}
                  fill={CAT_COLOR[w.cat]}
                  opacity={dim ? 0.18 : 1}
                  stroke={isAnswer ? '#059669' : isSel ? '#1f2430' : 'none'}
                  strokeWidth={isAnswer || isSel ? 3 : 0}
                />
                <text
                  x={p.x + 9} y={p.y + 4}
                  className="emap-label"
                  opacity={dim ? 0.25 : 1}
                  fontWeight={isSel || isAnswer || isNeighbour ? 700 : 400}
                >
                  {w.word}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="emap-legend">
        {Object.entries(CAT_COLOR).map(([cat, col]) => (
          <span key={cat} className="legend-tag">
            <span className="dot" style={{ background: col }} /> {cat}
          </span>
        ))}
      </div>

      {selected && (
        <p className="hint">
          Closest to <strong>{selected}</strong>:{' '}
          {neighbours.map((n) => `${n.word} (${n.s.toFixed(2)})`).join(' · ')}
        </p>
      )}

      <h4>2. Word-maths: follow the arrow</h4>
      <p className="hint">
        Subtracting two words gives you the <em>arrow</em> between them — a direction with a meaning.
        Below, Sparky takes the arrow from the <strong>2nd</strong> word to the <strong>3rd</strong>,
        and adds it to the <strong>1st</strong>. Start with the classic: <code>king − man + woman</code>.
      </p>
      <div className="analogy-row">
        <select value={a} onChange={(e) => setA(e.target.value)}>
          {WORDS.map((w) => <option key={w.word}>{w.word}</option>)}
        </select>
        <span className="analogy-op">−</span>
        <select value={b} onChange={(e) => setB(e.target.value)}>
          {WORDS.map((w) => <option key={w.word}>{w.word}</option>)}
        </select>
        <span className="analogy-op">+</span>
        <select value={c} onChange={(e) => setC(e.target.value)}>
          {WORDS.map((w) => <option key={w.word}>{w.word}</option>)}
        </select>
        <span className="analogy-op">=</span>
        <button className="btn btn-primary" onClick={handleSolve}>Solve ✨</button>
      </div>

      {result && (
        <div className={'verdict ' + (solved ? 'verdict--win' : '')}>
          <strong>{a} − {b} + {c} = {result.word}</strong> &nbsp;(closeness {result.score.toFixed(2)})
          <div style={{ marginTop: 8, fontWeight: 400 }}>
            See it as a journey on the map: the{' '}
            <span style={{ color: '#6366f1', fontWeight: 700 }}>indigo arrow</span> is the step from{' '}
            <strong>{b}</strong> to <strong>{c}</strong>. Now start at <strong>{a}</strong> and take
            that <em>exact same step</em> (the{' '}
            <span style={{ color: '#059669', fontWeight: 700 }}>green arrow</span>) — you land on{' '}
            <strong>{result.word}</strong>. The two arrows point the same way, because Sparky reused
            the same chunk of meaning. No one taught him the answer; it fell out of the maths.
          </div>
        </div>
      )}

      <p className="hint">
        Try <code>puppy − dog + cat</code>, or <code>Paris − France + Japan</code>. The map really
        does carry meaning — and it's the same idea that powers “words like this one” everywhere in AI.
      </p>
    </div>
  )
}
