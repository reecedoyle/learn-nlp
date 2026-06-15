import { useState } from 'react'
import { SparkySays } from '../components/SparkySays'

interface Props {
  onComplete: () => void
}

interface Round {
  q: string
  human: string
  bot: string
  tell: string
}

/** Each round pits a human-ish answer against a bot-ish one. The bot "tells":
 *  no real opinions/feelings, generic filler, stiff formality, explaining its own
 *  nature, deflecting to limitations. The kid learns to spot them. */
const ROUNDS: Round[] = [
  {
    q: "What's your favourite food?",
    human: 'Pizza, obviously 🍕 — my mum makes the best one on Fridays.',
    bot: 'As a language model, I enjoy many foods that humans eat.',
    tell: 'A real person just names a favourite and a memory. Sparky dodges having an opinion — and the phrase “as a language model” is a dead giveaway.',
  },
  {
    q: 'What did you do this weekend?',
    human: 'Mostly football in the rain, then way too much hot chocolate.',
    bot: 'I spent my weekend engaging in various activities and relaxing at home.',
    tell: '“Various activities” is empty filler. Sparky stays vague so he can’t get caught on a detail; a human names specific things.',
  },
  {
    q: "What's 7 times 8?",
    human: "Uh… 56? Maths isn’t really my thing.",
    bot: '7 times 8 equals 56. Is there anything else you would like to calculate?',
    tell: 'Instant, perfectly formal, and offering more help. People hesitate, joke, or admit they’re unsure — Sparky never does.',
  },
  {
    q: 'Do you ever get scared?',
    human: 'Yeah — big dogs freak me out, not gonna lie.',
    bot: 'I do not experience fear, as I do not have feelings or a physical body.',
    tell: 'Sparky can’t claim a real fear, so he explains his own nature instead of answering like a person would.',
  },
  {
    q: "What's the weather like where you are?",
    human: 'Grey and drizzly, classic. I want summer back.',
    bot: 'I am not able to access real-time weather information for your location.',
    tell: 'Sparky deflects to what he can’t do. A person just glances outside and complains.',
  },
  {
    q: 'Did you like the film?',
    human: 'Honestly? I fell asleep halfway through 😅',
    bot: 'The film received generally positive reviews and was praised for its visuals.',
    tell: 'Asked for a feeling, Sparky reports facts and reviews. Humans give a personal, slightly embarrassing opinion.',
  },
  {
    q: "What's your name?",
    human: 'Maya! Everyone spells it wrong though, so annoying.',
    bot: 'You can call me Assistant. How can I help you today?',
    tell: 'A functional name plus “how can I help you” — Sparky is in helper-mode. A person volunteers a personal gripe.',
  },
  {
    q: 'Tell me about your morning.',
    human: 'Slept through my alarm and burnt the toast. Great start.',
    bot: 'My morning was productive and I completed several important tasks.',
    tell: 'Polished and positive with zero specifics. Real mornings have little disasters; Sparky smooths everything out.',
  },
]

const NUM = 6

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export function Level8Turing({ onComplete }: Props) {
  const [phase, setPhase] = useState<'learn' | 'play'>('learn')
  const [order] = useState(() => shuffle(ROUNDS.map((_, i) => i)).slice(0, NUM))
  const [botSides] = useState(() => order.map(() => (Math.random() < 0.5 ? 'A' : 'B')))
  const [pos, setPos] = useState(0)
  const [picked, setPicked] = useState<'A' | 'B' | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const round = ROUNDS[order[pos]]
  const botSide = botSides[pos]
  const answerA = botSide === 'A' ? round.bot : round.human
  const answerB = botSide === 'A' ? round.human : round.bot

  const pick = (side: 'A' | 'B') => {
    if (picked) return
    setPicked(side)
    if (side === botSide) setScore((s) => s + 1)
  }

  const next = () => {
    if (pos + 1 >= order.length) {
      setFinished(true)
      onComplete()
    } else {
      setPos((p) => p + 1)
      setPicked(null)
    }
  }

  // ---- Intro ----
  if (phase === 'learn') {
    return (
      <div className="level">
        <SparkySays mood="excited">
          You did it — you raised me from an empty robot into a real little mind! For my final test,
          there's a famous challenge dreamed up by <strong>Alan Turing</strong>: can a machine chat so
          well that a human can't tell it's a machine? It's called the <strong>Turing Test</strong>. 🤖
        </SparkySays>

        <div className="explain-card">
          <h4>🎭 From Turing Tumble to the Turing Test</h4>
          <p>
            You started on a marble machine called <em>Turing Tumble</em>, named after Alan Turing —
            the man who basically invented the idea of computers. His big question was: if you talk to
            something hidden behind a wall and can't tell whether it's a person or a machine… does it
            matter? That's the test you're about to run.
          </p>
        </div>

        <div className="explain-card">
          <h4>🕵️ Now YOU be the judge</h4>
          <p>
            I'll show you a question and <strong>two answers</strong> — one from a real human, one from
            me trying my hardest to sound human. <strong>You</strong> decide which one is the robot.
            Watch for the “tells”: I'm bad at opinions, feelings, and silly little details!
          </p>
        </div>

        <button className="btn btn-primary btn-big" onClick={() => setPhase('play')}>
          Start the Turing Test →
        </button>
      </div>
    )
  }

  // ---- Finale ----
  if (finished) {
    const great = score >= Math.ceil(order.length * 0.7)
    return (
      <div className="level">
        <SparkySays mood="excited" size={92}>
          You caught the robot <strong>{score} / {order.length}</strong> times!{' '}
          {great
            ? 'You’ve got a sharp eye for spotting AI. 🕵️'
            : 'I fooled you more than once — see how tricky this gets?'}
        </SparkySays>

        <div className="verdict verdict--win">
          🎓 <strong>You built a mind.</strong> You started with a switched-on robot with an empty
          brain, and taught me, level by level: to guess the next word, to chop text into tokens, to
          fill jars from counting, to remember, to pick boldly or safely, to map meaning, to focus,
          and finally to <em>learn from being wrong</em>. Everything ChatGPT does is these same ideas —
          just enormously bigger.
        </div>

        <div className="explain-card">
          <h4>💡 The real lesson</h4>
          <p>
            Today's best AIs are <em>so</em> good that even grown-ups often can't tell them from a
            human. That's exactly why understanding how they work — like you now do — is a kind of
            superpower. You don't just use the magic… <strong>you know the trick.</strong> ✨
          </p>
        </div>

        <p className="hint">🏆 Course complete. Thanks for raising me, teacher. — Sparky</p>
      </div>
    )
  }

  // ---- A round ----
  const revealed = picked !== null
  const correct = revealed && picked === botSide
  const card = (side: 'A' | 'B', text: string) => {
    const isBot = side === botSide
    let cls = 'turing-card'
    if (revealed) cls += isBot ? ' turing-card--bot' : ' turing-card--human'
    else cls += ' turing-card--pick'
    if (picked === side) cls += ' turing-card--picked'
    return (
      <button className={cls} onClick={() => pick(side)} disabled={revealed}>
        <span className="turing-label">{side}</span>
        <span className="turing-text">“{text}”</span>
        {revealed && <span className="turing-verdict">{isBot ? '🤖 Sparky (AI)' : '🧑 Human'}</span>}
      </button>
    )
  }

  return (
    <div className="level">
      <SparkySays mood={revealed ? (correct ? 'happy' : 'confused') : 'thinking'} size={72}>
        {!revealed && 'One of these answers is from a real human. The other is me, faking it. Which one is the robot?'}
        {revealed && correct && 'Caught me! 🎯 That was me — you spotted the tell.'}
        {revealed && !correct && 'Got you! That human answer fooled you — the OTHER one was me. 😄'}
      </SparkySays>

      <div className="scoreboard">
        Round {pos + 1} / {order.length} · caught the robot {score} times
      </div>

      <div className="prompt-card">
        <span className="prompt-text">{round.q}</span>
      </div>

      <p className="hint">Tap the answer you think is Sparky (the AI):</p>
      <div className="turing-answers">
        {card('A', answerA)}
        {card('B', answerB)}
      </div>

      {revealed && (
        <>
          <div className={'verdict ' + (correct ? 'verdict--win' : 'verdict--miss')}>
            <strong>The tell:</strong> {round.tell}
          </div>
          <button className="btn btn-primary" onClick={next}>
            {pos + 1 >= order.length ? 'See your result →' : 'Next question →'}
          </button>
        </>
      )}
    </div>
  )
}
