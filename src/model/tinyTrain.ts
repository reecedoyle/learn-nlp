import type { Distribution } from '../types'
import { sample } from './distribution'
import { START, tokenizeWords, detokenize } from './beadModel'

/**
 * A tiny but REAL trainable next-word model for Level 7. Unlike Level 2 (which
 * just COUNTS beads), this one *learns by being wrong*: it starts with empty,
 * uniform jars, guesses, measures how wrong it was (cross-entropy loss), and
 * nudges its numbers a little in the right direction — exactly like a real LLM,
 * just with one word of context and a handful of words. Watch the loss drop.
 *
 * Mechanically it's a softmax classifier per context (logits W[ctx] → softmax →
 * jar), trained with plain gradient descent on cross-entropy.
 */
export class TinyTrainer {
  readonly vocab: string[]
  readonly contexts: string[]
  readonly initialLoss: number
  private vIdx = new Map<string, number>()
  private cIdx = new Map<string, number>()
  private W: number[][]
  private pairs: Array<[number, number]> = []

  constructor(corpus: string) {
    const sentences = corpus
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)

    const vocabSet = new Set<string>()
    const ctxSet = new Set<string>()
    const rawPairs: Array<[string, string]> = []
    for (const s of sentences) {
      const w = [START, ...tokenizeWords(s)]
      for (let i = 1; i < w.length; i++) {
        ctxSet.add(w[i - 1])
        vocabSet.add(w[i])
        rawPairs.push([w[i - 1], w[i]])
      }
    }
    this.vocab = [...vocabSet]
    this.contexts = [...ctxSet]
    this.vocab.forEach((w, i) => this.vIdx.set(w, i))
    this.contexts.forEach((w, i) => this.cIdx.set(w, i))
    this.pairs = rawPairs.map(([c, n]) => [this.cIdx.get(c)!, this.vIdx.get(n)!])
    this.W = this.contexts.map(() => new Array(this.vocab.length).fill(0))
    // Empty jars = uniform guesses, so the starting loss is exactly log(vocab).
    this.initialLoss = Math.log(this.vocab.length)
  }

  private softmax(row: number[]): number[] {
    const m = Math.max(...row)
    const e = row.map((x) => Math.exp(x - m))
    const s = e.reduce((a, b) => a + b, 0) || 1
    return e.map((x) => x / s)
  }

  /** One pass of gradient descent over all word-pairs. Returns the new loss.
   *  lr is kept gentle (0.1) so the loss falls gradually over ~a dozen rounds —
   *  enough for the kid to actually watch it learn, not converge in two clicks. */
  trainRound(lr = 0.1): number {
    for (const [ci, ni] of this.pairs) {
      const p = this.softmax(this.W[ci])
      for (let k = 0; k < this.vocab.length; k++) {
        this.W[ci][k] -= lr * (p[k] - (k === ni ? 1 : 0))
      }
    }
    return this.loss()
  }

  /** Average cross-entropy: how surprised Sparky is by the real next words. */
  loss(): number {
    let total = 0
    for (const [ci, ni] of this.pairs) {
      const p = this.softmax(this.W[ci])
      total += -Math.log(p[ni] + 1e-12)
    }
    return total / this.pairs.length
  }

  /** The current jar (next-word distribution) after a context word. */
  jar(ctxWord: string): Distribution {
    const ci = this.cIdx.get(ctxWord)
    if (ci === undefined) return []
    const p = this.softmax(this.W[ci])
    return this.vocab
      .map((label, k) => ({ label, prob: p[k] }))
      .sort((a, b) => b.prob - a.prob)
  }

  /** Context words the kid can peek at (skip the START marker). */
  knownContexts(): string[] {
    return this.contexts.filter((c) => c !== START)
  }

  /** Generate a sentence by drawing from the current jars. */
  generate(maxWords = 14): string {
    const out: string[] = []
    let ctx = START
    for (let i = 0; i < maxWords; i++) {
      const ci = this.cIdx.get(ctx)
      if (ci === undefined) break
      const bead = sample(this.jar(ctx))
      if (!bead) break
      out.push(bead.label)
      if (/[.!?]/.test(bead.label) && out.length >= 4) break
      ctx = bead.label
    }
    return detokenize(out)
  }

  reset(): void {
    this.W = this.contexts.map(() => new Array(this.vocab.length).fill(0))
  }
}
