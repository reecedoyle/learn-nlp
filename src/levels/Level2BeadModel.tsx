import { useMemo, useState } from 'react'
import { BeadModel, detokenize, tokenizeWords } from '../model/beadModel'
import { SparkySays } from '../components/SparkySays'
import { SPARKY_CORPUS } from '../data/corpus'
import type { Distribution } from '../types'

interface Props {
  onComplete: () => void
}

export function Level2BeadModel({ onComplete }: Props) {
  const [corpus, setCorpus] = useState(SPARKY_CORPUS)
  const [order, setOrder] = useState(1)
  const [model, setModel] = useState<BeadModel | null>(null)
  const [inspect, setInspect] = useState<string | null>(null)
  const [sentence, setSentence] = useState<string | null>(null)
  const [novel, setNovel] = useState<boolean | null>(null)

  const handleTrain = () => {
    const m = new BeadModel(order)
    // Train sentence by sentence so START tokens reset between sentences.
    corpus
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => m.train(s))
    setModel(m)
    setInspect(m.knownContexts()[0] ?? null)
    setSentence(null)
    setNovel(null)
  }

  const handleGenerate = () => {
    if (!model) return
    const tokens = model.generate([], 12, 1)
    const text = detokenize(tokens)
    setSentence(text)
    const isNew = model.isNovel(text)
    setNovel(isNew)
    if (isNew) onComplete()
  }

  const inspectCounts = useMemo(() => {
    if (!model || !inspect) return []
    return model.counts(inspect.split(' '))
  }, [model, inspect])

  const maxCount = Math.max(1, ...inspectCounts.map((c) => c.count))

  // Show the *raw counts* as a jar — this is the level where the kid sees that a
  // probability is just "how many beads of each colour I dropped in."
  const inspectDist: Distribution = useMemo(() => {
    const total = inspectCounts.reduce((a, b) => a + b.count, 0) || 1
    return inspectCounts.map((c) => ({ label: c.label, prob: c.count / total }))
  }, [inspectCounts])

  return (
    <div className="level">
      <SparkySays mood={sentence ? (novel ? 'excited' : 'confused') : model ? 'happy' : 'new'}>
        {!model &&
          'In the last level you poked at my real brain. Now YOU build one for me from scratch — no magic at all. Just give me some text and we’ll count beads together.'}
        {model && !sentence &&
          'You filled my jars! Peek inside one below to see what I learned, then make me say something.'}
        {sentence && novel &&
          'I made up a sentence nobody taught me! That’s called generalization — I recombined the beads into something new. 🎉'}
        {sentence && novel === false &&
          'That one I just copied from the text you gave me. Hit generate again — eventually I’ll mix the beads into something brand new.'}
      </SparkySays>

      <p className="level-intro">
        Here's the no-magic version of my brain: we read the text and, for every word, drop a bead in
        a jar for whatever word came next. To talk, I just draw beads. ChatGPT does exactly this —
        only it reads the whole internet and looks at thousands of words at once instead of just{' '}
        {order === 1 ? 'one' : 'two'}.
      </p>

      <h4>1. Sparky's training text</h4>
      <textarea
        className="corpus-input"
        value={corpus}
        rows={6}
        onChange={(e) => setCorpus(e.target.value)}
      />

      <div className="controls-row">
        <label className="order-toggle">
          Memory:
          <select value={order} onChange={(e) => setOrder(Number(e.target.value))}>
            <option value={1}>look at last 1 word (bigram)</option>
            <option value={2}>look at last 2 words (trigram)</option>
          </select>
        </label>
        <button className="btn btn-primary" onClick={handleTrain}>
          📚 Teach Sparky (count the beads)
        </button>
      </div>

      {model && (
        <>
          <h4>2. Peek inside a jar</h4>
          <p className="hint">
            Pick a word Sparky knows. The jar shows every word that followed it, and how many beads
            (times) it saw each one.
          </p>
          <div className="chip-row">
            {model.knownContexts().slice(0, 24).map((ctx) => (
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
            <div className="jar-counts">
              <div className="jar-counts-title">
                After <strong>“{inspect}”</strong>, Sparky saw:
              </div>
              {inspectCounts.map((c, i) => (
                <div key={c.label + i} className="count-row">
                  <span className="count-word">{c.label}</span>
                  <span className="count-beads">
                    {Array.from({ length: c.count }).map((_, j) => (
                      <span key={j} className="count-bead" />
                    ))}
                  </span>
                  <span className="count-num">
                    {c.count} → {((inspectDist[i]?.prob ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              <div className="hint">
                Biggest jar entry here: {maxCount} bead{maxCount === 1 ? '' : 's'}. More beads = more
                likely Sparky picks it.
              </div>
            </div>
          )}

          <h4>3. Let Sparky talk</h4>
          <button className="btn btn-primary" onClick={handleGenerate}>
            💬 Generate a sentence
          </button>
          {sentence && (
            <div className="generated">
              <div className="generated-text">“{sentence}”</div>
              {novel ? (
                <div className="verdict verdict--win">
                  🎉 Sparky just made up a brand-new sentence that wasn't in the training text — but
                  it still makes sense. That's <strong>generalization</strong>. You win this level!
                </div>
              ) : (
                <div className="verdict verdict--miss">
                  That sentence was copied straight from the training text. Try generating again —
                  Sparky will eventually recombine the beads into something new.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!model && tokenizeWords(corpus).length > 0 && (
        <p className="hint">Sparky's text has {tokenizeWords(corpus).length} words ready to count.</p>
      )}
    </div>
  )
}
