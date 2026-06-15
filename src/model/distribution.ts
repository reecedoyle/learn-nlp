import type { Bead, Distribution } from '../types'

/**
 * Re-weight a distribution by "temperature", exactly like a real LLM.
 *  - T -> 0   : always pick the single most likely bead (greedy, gets stuck in loops)
 *  - T = 1    : pick beads in proportion to how likely they are
 *  - T  > 1   : flatten everything out (wild, creative, often nonsense)
 *
 * We treat log(prob) as the model's "logits" and re-softmax them at the given
 * temperature, which matches what production samplers do.
 */
export function applyTemperature(dist: Distribution, temperature: number): Distribution {
  if (dist.length === 0) return dist
  const T = Math.max(temperature, 1e-3)
  const logits = dist.map((b) => Math.log(Math.max(b.prob, 1e-12)) / T)
  const max = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return dist.map((b, i) => ({ label: b.label, prob: exps[i] / sum }))
}

/** Draw one bead from the jar, respecting the probabilities. */
export function sample(dist: Distribution): Bead | null {
  if (dist.length === 0) return null
  const total = dist.reduce((a, b) => a + b.prob, 0)
  let r = Math.random() * total
  for (const bead of dist) {
    r -= bead.prob
    if (r <= 0) return bead
  }
  return dist[dist.length - 1]
}
