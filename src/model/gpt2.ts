import {
  AutoTokenizer,
  AutoModelForCausalLM,
  type PreTrainedTokenizer,
  type PreTrainedModel,
} from '@huggingface/transformers'
import type { Distribution } from '../types'

/**
 * A wrapper around a REAL language model running in the browser.
 *
 * distilgpt2 is a small, real GPT-2 (~330MB download, cached after first load).
 * Everything Sparky shows from here on — the next-word jar, the probabilities —
 * is the genuine output of a real neural network, not a fake. That is the point:
 * the kid is poking at the actual thing, just a smaller cousin of ChatGPT.
 */
const MODEL_ID = 'Xenova/distilgpt2'

let tokenizer: PreTrainedTokenizer | null = null
let model: PreTrainedModel | null = null
let loadPromise: Promise<void> | null = null
let tokenizerPromise: Promise<void> | null = null

export type ProgressFn = (info: { status: string; progress?: number }) => void

/** One piece of chopped-up text: the token's readable text and its ID number. */
export interface TokenPiece {
  id: number
  text: string
}

/**
 * Load ONLY the tokenizer (a couple of MB), not the whole 330MB brain. Level 1
 * just needs to chop text into tokens, so a kid who jumps straight here doesn't
 * have to download the full model. If Level 0 already woke the full brain, the
 * tokenizer is already in memory and this returns instantly.
 */
export function loadTokenizer(onProgress?: ProgressFn): Promise<void> {
  if (tokenizer) return Promise.resolve()
  if (tokenizerPromise) return tokenizerPromise
  tokenizerPromise = (async () => {
    onProgress?.({ status: 'Teaching Sparky to chop words…' })
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
      progress_callback: (p: any) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          onProgress?.({ status: 'Downloading Sparky’s word-chopper…', progress: p.progress })
        }
      },
    })
    onProgress?.({ status: 'Ready!', progress: 100 })
  })()
  return tokenizerPromise
}

export function isTokenizerLoaded(): boolean {
  return tokenizer !== null
}

/**
 * Chop text into tokens exactly the way the real GPT-2 does. Each piece carries
 * the ID number the model actually sees — the words Sparky reads are really
 * just these numbers. A leading space is part of the token (that's why GPT-2
 * writes " cat" not "cat"), so we keep it for display.
 */
export function tokenize(text: string): TokenPiece[] {
  if (!tokenizer) throw new Error('Tokenizer not loaded yet')
  const ids: number[] = tokenizer.encode(text)
  return ids.map((id) => ({ id, text: tokenizer!.decode([id]) }))
}

export function loadGpt2(onProgress?: ProgressFn): Promise<void> {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    onProgress?.({ status: 'Downloading Sparky’s big brain…' })
    tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, {
      progress_callback: (p: any) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          onProgress?.({ status: 'Downloading tokenizer…', progress: p.progress })
        }
      },
    })
    model = await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
      dtype: 'q8',
      progress_callback: (p: any) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          onProgress?.({ status: 'Downloading brain…', progress: p.progress })
        }
      },
    })
    onProgress?.({ status: 'Ready!', progress: 100 })
  })()
  return loadPromise
}

export function isLoaded(): boolean {
  return tokenizer !== null && model !== null
}

/**
 * Ask the real model: given this text, what word comes next? Returns the
 * top-k most likely next tokens as a jar of beads.
 */
export async function predictNext(text: string, k = 8): Promise<Distribution> {
  if (!tokenizer || !model) throw new Error('Model not loaded yet')

  const inputs = await tokenizer(text === '' ? '\n' : text)
  const output: any = await model(inputs)
  const logitsTensor = output.logits
  const dims: number[] = logitsTensor.dims // [1, seq, vocab]
  const seq = dims[1]
  const vocab = dims[2]
  const data: Float32Array = logitsTensor.data
  const offset = (seq - 1) * vocab

  // Softmax over the final position, then pick the top-k.
  let max = -Infinity
  for (let i = 0; i < vocab; i++) max = Math.max(max, data[offset + i])
  let sum = 0
  for (let i = 0; i < vocab; i++) sum += Math.exp(data[offset + i] - max)

  // Track top-k by logit (equivalently by prob).
  const top: Array<{ id: number; prob: number }> = []
  for (let i = 0; i < vocab; i++) {
    const prob = Math.exp(data[offset + i] - max) / sum
    if (top.length < k) {
      top.push({ id: i, prob })
      if (top.length === k) top.sort((a, b) => a.prob - b.prob)
    } else if (prob > top[0].prob) {
      top[0] = { id: i, prob }
      top.sort((a, b) => a.prob - b.prob)
    }
  }
  top.sort((a, b) => b.prob - a.prob)

  return top.map(({ id, prob }) => ({
    label: tokenizer!.decode([id]),
    prob,
  }))
}

/** Run the model once and hand back the final-position logits. */
async function lastLogits(text: string): Promise<{ data: Float32Array; offset: number; vocab: number }> {
  if (!tokenizer || !model) throw new Error('Model not loaded yet')
  const inputs = await tokenizer(text === '' ? '\n' : text)
  const output: any = await model(inputs)
  const dims: number[] = output.logits.dims
  return { data: output.logits.data, offset: (dims[1] - 1) * dims[2], vocab: dims[2] }
}

function softmaxAt(data: Float32Array, offset: number, vocab: number, id: number): number {
  let max = -Infinity
  for (let i = 0; i < vocab; i++) max = Math.max(max, data[offset + i])
  let sum = 0
  for (let i = 0; i < vocab; i++) sum += Math.exp(data[offset + i] - max)
  return Math.exp(data[offset + id] - max) / sum
}

/** Sparky's single most likely next token for this text (used by Level 6). */
export async function topNextToken(text: string): Promise<{ id: number; label: string; prob: number }> {
  const { data, offset, vocab } = await lastLogits(text)
  let id = 0
  for (let i = 1; i < vocab; i++) if (data[offset + i] > data[offset + id]) id = i
  return { id, label: tokenizer!.decode([id]), prob: softmaxAt(data, offset, vocab, id) }
}

/** Probability the model assigns to a SPECIFIC next token id (for occlusion). */
export async function probOfNext(text: string, id: number): Promise<number> {
  const { data, offset, vocab } = await lastLogits(text)
  return softmaxAt(data, offset, vocab, id)
}
