# Sparky · Build a Mind

A level-based game that teaches a kid how modern LLMs work — by building one. The
spine of every level is the same image: **a model's answer is a jar of weighted
beads** (a probability distribution). Tokenization decides what's written on the
beads, embeddings decide which beads are similar, attention decides which past
words fill the jar, temperature decides how you pick, and training decides how many
of each bead go in.

## Run it

```bash
npm install
npm run dev      # open the printed localhost URL
```

The first time you open Level 0, Sparky downloads a **real** small GPT-2
(`distilgpt2`, ~100–300 MB) that then runs entirely in your browser — no API key,
no server, no per-use cost. It's cached after the first load.

```bash
npm run build    # static site in dist/ — deployable to GitHub Pages
npm run preview
```

## The course (nine core levels + a bonus hardware chapter)

| Level | Concept | What it proves |
|-------|---------|----------------|
| **L0 — Guess the Next Word** | Next-token prediction | Uses a *real* model: shows genuine GPT-2 next-word probabilities as a bead jar. Match a guess into Sparky's top 5 (prompts are vetted against the real model so the obvious word actually lands there). |
| **L1 — Chop It Into Tokens** | Tokenization | A live sandbox over the *real* GPT-2 tokenizer: type anything and watch it shatter into numbered token tiles. Win by finding a single word that breaks into 3+ tokens. |
| **L2 — Build a Brain in a Jar** | How a model learns from text | The kid hand-builds a bigram/trigram model by counting beads, peeks inside the jars, and makes it generate a brand-new sentence (generalization). |
| **L3 — Sparky's Short Memory** | Context window | A secret is stated early in a sentence, then asked for again. The kid drags a sliding "memory window" over the *real* model's input; the secret word only re-appears in Sparky's jar once the window reaches back far enough. Win by finding Sparky's memory edge. |
| **L4 — Sparky's Mood Dial** | Temperature / sampling | A dial morphs a funnel (fixed bead contents); the kid draws 20 beads and tallies them — ~all "mat" when the neck is pinched, an even spread when wide open. Win by drawing in all three moods (❄️ frozen / 😊 just right / 🔥 wild). |
| **L5 — Sparky's Meaning Map** | Embeddings | A *real* in-browser embedding model (all-MiniLM-L6-v2) embeds ~40 words; PCA projects them to a 2D map where similar words cluster. Tap a word for its true nearest neighbours; do live word-maths (`king − man + woman = queen`). Win by solving an analogy. |
| **L6 — Sparky's Spotlight** | Attention | A *transparent toy* of self-attention: the kid plays the attention head, scoring earlier words; a real softmax turns the scores into a spotlight that sums to 100%, and the brightest word is who the pronoun "it" refers to. Win by aiming the spotlight at the right word. (A teaching model of the mechanism — not GPT-2's own weights, which the in-browser model doesn't expose.) |
| **L7 — Watch Sparky Learn** | Training & loss | A tiny but *real* gradient-descent trainer (softmax-per-context, cross-entropy loss). Starting from empty/uniform jars, the kid teaches round after round and watches the **loss curve actually fall**, a peeked jar sharpen from flat to peaked, and generated text go from gibberish to sensible. Win by driving the loss below the line. |
| **★ L8 — The Turing Test** | Can a machine fool you? | The capstone. The kid plays the human judge: each round, a question with two answers (one human, one Sparky) — spot the bot, then learn the "tell". Ties Turing Tumble → Alan Turing → the Turing Test, and lands the lesson: today's AIs are so convincing that *understanding how they work* is the real superpower. |

### 🛠️ Bonus chapter — Engine Room (how the hardware works)

| Level | Concept | What it proves |
|-------|---------|----------------|
| **L9 — It's All Multiply-Add** | The one operation | Reveals that every jar, spotlight, and training nudge is built from one move: multiply numbers by weights and add them up. The kid computes a "neuron" by hand, then meets the scale (hundreds of millions of these per word). |
| **L10 — CPU vs GPU Race** | Why AIs use GPUs | A live race: a batch of identical multiply-add jobs done by a CPU (1 worker, sequential) vs a GPU (many workers, parallel). Crank the batch up and watch the GPU win by its core-count. Teaches throughput-on-identical-work, not "smarter". |
| **L11 — Does Sparky Fit?** | Memory & model size | The model's weights must fit in GPU memory. The kid compares brains (tiny → ChatGPT-class) against devices (phone → an 8-GPU rack) and sees why the biggest models need a data centre, not a phone. |

### 🧬 Bonus chapter — Brain Family (other AI architectures)

| Level | Concept | What it proves |
|-------|---------|----------------|
| **L12 — Meet the Cousins** | RNN · LSTM · CNN · Transformer · Diffusion | A visualizer: pick a "cousin" and watch how it processes the same sentence — an RNN's fading memory note, an LSTM's kept word, a CNN's sliding window, a Transformer's all-to-all web, and a Diffusion model denoising a picture from static. Each with a strength/weakness card. |
| **L13 — Pick the Right Brain** | Which brain for which job | A matching game: tasks → best-fit architecture (cat photo → CNN, "a red dragon" → Diffusion, long story → Transformer, sensor stream → RNN/LSTM…), with the reasoning revealed each round. |
| **L14 — Why Transformers Won** | Sequential vs parallel | Process the same sentence with an RNN (one word at a time → one GPU worker busy, the rest idle) vs a Transformer (all words at once → the whole GPU crowd working). Ties back to the Engine Room and the 2017 "Attention Is All You Need" moment. |

Every level is the same bead-jar idea seen from a new angle — some poke at a real
in-browser model (GPT-2, MiniLM), some are built by hand, one is a transparent toy
of the mechanism. Together they take a kid from "what is a language model?" to
having built and judged one.

## Project layout

```
src/
  types.ts                 the Bead / Distribution spine
  model/
    distribution.ts        temperature + sampling (shared by all levels)
    beadModel.ts           hand-built bigram/trigram model (Level 2)
    gpt2.ts                real distilgpt2 in the browser (transformers.js)
  components/BeadJar.tsx    THE reusable jar-of-beads visual
  levels/                  one file per level
  data/corpus.ts           Sparky's starter training text (swap in your own!)
```

## Planned levels (the full course)

Tokenization · Context window · Temperature/sampling · Embeddings (meaning map) ·
Attention (who is "it"?) · Training (watch the loss drop) · **Turing-test capstone**.
