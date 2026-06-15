import type { Distribution } from '../types'
import { applyTemperature, sample } from './distribution'

/**
 * A tiny language model the kid builds *by hand* in Level 2.
 *
 * It is a Markov model: for every word (or pair of words) seen in the training
 * text, we keep a jar of "what word came next, and how many times." Generating
 * text = start at a word, draw a bead from its jar, walk to that word's jar,
 * repeat. This is literally what a giant LLM does, just with one or two words of
 * context instead of thousands, and with counted beads instead of learned math.
 */

export const START = '◆'

export function tokenizeWords(text: string): string[] {
  // Words and sentence-ending punctuation become their own tokens.
  return text.toLowerCase().match(/[a-z']+|[.!?]/g) ?? []
}

export class BeadModel {
  /** order 1 = bigram (look at last word), 2 = trigram (last two words). */
  readonly order: number
  /** context key -> (next word -> count) */
  readonly jars = new Map<string, Map<string, number>>()
  private trainingText = ''

  constructor(order = 1) {
    this.order = order
  }

  private keyFor(context: string[]): string {
    return context.slice(-this.order).join(' ')
  }

  /** Read a piece of text and count every transition into the jars. */
  train(text: string): void {
    this.trainingText += ' ' + text.toLowerCase()
    const words = tokenizeWords(text)
    const padded = [...Array(this.order).fill(START), ...words]
    for (let i = this.order; i < padded.length; i++) {
      const key = this.keyFor(padded.slice(i - this.order, i))
      const next = padded[i]
      const jar = this.jars.get(key) ?? new Map<string, number>()
      jar.set(next, (jar.get(next) ?? 0) + 1)
      this.jars.set(key, jar)
    }
  }

  /** The jar for a given context, as a probability distribution. */
  distribution(context: string[]): Distribution {
    const jar = this.jars.get(this.keyFor(context))
    if (!jar) return []
    const total = [...jar.values()].reduce((a, b) => a + b, 0)
    return [...jar.entries()]
      .map(([label, count]) => ({ label, prob: count / total }))
      .sort((a, b) => b.prob - a.prob)
  }

  /** Raw counts for a context (used to draw the literal jar of beads). */
  counts(context: string[]): Array<{ label: string; count: number }> {
    const jar = this.jars.get(this.keyFor(context))
    if (!jar) return []
    return [...jar.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }

  /** Every context the model knows a jar for. */
  knownContexts(): string[] {
    return [...this.jars.keys()].filter((k) => !k.includes(START))
  }

  generate(startWords: string[], maxWords: number, temperature = 1): string[] {
    // Seed with `order` START tokens so the opening jar key matches how training
    // padded the text (a trigram's first jar is keyed "◆ ◆", not "◆").
    let context = startWords.length ? [...startWords] : Array<string>(this.order).fill(START)
    const out: string[] = []
    for (let i = 0; i < maxWords; i++) {
      let dist = this.distribution(context)
      if (dist.length === 0) break
      if (temperature !== 1) dist = applyTemperature(dist, temperature)
      const bead = sample(dist)
      if (!bead) break
      out.push(bead.label)
      if (bead.label === '.' || bead.label === '!' || bead.label === '?') {
        if (out.length >= 4) break
      }
      context = [...context, bead.label]
    }
    return out
  }

  /** True if this exact phrase never appeared in the training text. */
  isNovel(phrase: string): boolean {
    const norm = (s: string) => tokenizeWords(s).join(' ')
    return !norm(this.trainingText).includes(norm(phrase))
  }
}

/** Pretty-print generated tokens back into a readable sentence. */
export function detokenize(tokens: string[]): string {
  return tokens
    .join(' ')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/^\w/, (c) => c.toUpperCase())
}
