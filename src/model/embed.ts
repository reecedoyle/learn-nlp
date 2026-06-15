import { pipeline } from '@huggingface/transformers'

/**
 * A REAL embedding model running in the browser (all-MiniLM-L6-v2, ~25MB).
 * It turns any word into a list of 384 numbers — a point in "meaning space."
 * Words used in similar ways end up with similar number-lists, which is why
 * `king - man + woman` lands right next to `queen`. This is genuinely measured
 * from text the model read, not staged. Used by Level 5 (the meaning map).
 */
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2'

let extractor: any = null
let loadPromise: Promise<void> | null = null

export type ProgressFn = (info: { status: string; progress?: number }) => void

export function loadEmbedder(onProgress?: ProgressFn): Promise<void> {
  if (extractor) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    onProgress?.({ status: 'Waking Sparky’s meaning-sense…' })
    extractor = await pipeline('feature-extraction', MODEL_ID, {
      dtype: 'q8',
      progress_callback: (p: any) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          onProgress?.({ status: 'Downloading meaning-map brain…', progress: p.progress })
        }
      },
    })
    onProgress?.({ status: 'Ready!', progress: 100 })
  })()
  return loadPromise
}

export function isEmbedderLoaded(): boolean {
  return extractor !== null
}

/** Embed many words at once; returns one normalised 384-vector per word. */
export async function embedWords(words: string[]): Promise<number[][]> {
  if (!extractor) throw new Error('Embedder not loaded yet')
  const out: any = await extractor(words, { pooling: 'mean', normalize: true })
  const [n, dim] = out.dims as [number, number]
  const data: Float32Array = out.data
  const vecs: number[][] = []
  for (let i = 0; i < n; i++) vecs.push(Array.from(data.slice(i * dim, (i + 1) * dim)))
  return vecs
}

/** Dot product. For normalised vectors this is cosine similarity (−1..1). */
export function cosine(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

/**
 * Project high-dimensional vectors down to 2D for the map, via PCA. We use the
 * Gram-matrix trick (n×n, cheap for a few dozen words) + power iteration to pull
 * out the top two principal components. Coordinates are the PCA scores.
 */
export function pca2d(V: number[][]): Array<{ x: number; y: number }> {
  const n = V.length
  const d = V[0].length
  const mean = new Array(d).fill(0)
  for (const v of V) for (let j = 0; j < d; j++) mean[j] += v[j] / n
  const X = V.map((v) => v.map((x, j) => x - mean[j]))

  const G: number[][] = []
  for (let i = 0; i < n; i++) {
    G[i] = new Array(n)
    for (let j = 0; j < n; j++) {
      let s = 0
      for (let k = 0; k < d; k++) s += X[i][k] * X[j][k]
      G[i][j] = s
    }
  }

  const topEig = (M: number[][]) => {
    let v = M.map(() => Math.random() - 0.5)
    for (let it = 0; it < 120; it++) {
      const Mv = M.map((row) => row.reduce((s, x, k) => s + x * v[k], 0))
      const norm = Math.sqrt(Mv.reduce((s, x) => s + x * x, 0)) || 1
      v = Mv.map((x) => x / norm)
    }
    const Mv = M.map((row) => row.reduce((s, x, k) => s + x * v[k], 0))
    const lambda = v.reduce((s, x, i) => s + x * Mv[i], 0)
    return { v, lambda }
  }

  const e1 = topEig(G)
  const G2 = G.map((row, i) => row.map((x, j) => x - e1.lambda * e1.v[i] * e1.v[j]))
  const e2 = topEig(G2)
  const s1 = Math.sqrt(Math.max(e1.lambda, 1e-9))
  const s2 = Math.sqrt(Math.max(e2.lambda, 1e-9))
  return V.map((_, i) => ({ x: e1.v[i] * s1, y: e2.v[i] * s2 }))
}

/**
 * A projection tailored to ONE analogy (a − b + c). The x-axis is the b→c
 * direction itself, so that step is horizontal; the y-axis is the part of (a−b)
 * perpendicular to it. In this view a∥b∥c∥answer form a parallelogram and the
 * two analogy arrows come out parallel — revealing the real high-D relationship
 * that a generic PCA flattens to a random angle. Any leftover tilt is genuine.
 */
export function analogyProject(
  V: number[][],
  ai: number,
  bi: number,
  ci: number,
): Array<{ x: number; y: number }> {
  const b = V[bi]
  const sub = (p: number[], q: number[]) => p.map((x, i) => x - q[i])
  const dot = (p: number[], q: number[]) => p.reduce((s, x, i) => s + x * q[i], 0)
  const unit = (p: number[]) => {
    const n = Math.sqrt(dot(p, p)) || 1
    return p.map((x) => x / n)
  }
  const u1 = unit(sub(V[ci], b))
  const r = sub(V[ai], b)
  const proj = dot(r, u1)
  const u2 = unit(r.map((x, i) => x - proj * u1[i]))
  // Negate y so the "+ c" row sits visually above the b→c baseline.
  return V.map((w) => ({ x: dot(sub(w, b), u1), y: -dot(sub(w, b), u2) }))
}
