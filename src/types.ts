/**
 * The spine of the whole game: every model's answer is "a jar of weighted
 * beads." A Bead is one possible next word and how likely it is. Tokenization,
 * embeddings, attention, temperature and training are all just different ways
 * of deciding what's on the beads and how many of each go in the jar.
 */
export interface Bead {
  /** The word (or token) written on the bead. */
  label: string
  /** How likely this word is to come next, 0..1. */
  prob: number
}

export type Distribution = Bead[]

export interface LevelMeta {
  id: number
  /** Short slug used in the URL hash and progress storage. */
  slug: string
  title: string
  /** The LLM concept this level teaches. */
  concept: string
}
