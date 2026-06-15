import { Sparky } from '../components/Sparky'
import { SparkySays } from '../components/SparkySays'
import { JarExplainer } from '../components/JarExplainer'

interface IntroProps {
  onStart: () => void
}

const JOURNEY = [
  { emoji: '🔤', text: 'Chop sentences into pieces I can read' },
  { emoji: '🫙', text: 'Build my first tiny brain out of jars' },
  { emoji: '🗺️', text: 'Learn which words mean similar things' },
  { emoji: '🔦', text: 'Figure out which words to pay attention to' },
  { emoji: '🎓', text: 'Learn from my mistakes, like real training' },
  { emoji: '🤖', text: 'Chat well enough to fool a human!' },
]

export function Intro({ onStart }: IntroProps) {
  return (
    <div className="intro">
      <div className="intro-hero">
        <Sparky mood="new" size={150} />
        <div>
          <h2 className="intro-title">Meet Sparky</h2>
          <p className="intro-tagline">A robot who was just switched on… with a totally empty brain.</p>
        </div>
      </div>

      <SparkySays mood="new" size={92}>
        Hi! I'm <strong>Sparky</strong>. ⚡ Someone just turned me on, but… my brain is empty. I can't
        read, I can't talk, I don't know a single word. <strong>But you can teach me!</strong> Every
        puzzle you solve adds a real piece to my brain. By the end, I'll talk like the AIs the
        grown-ups use — and you'll know exactly how I work, because <em>you built me.</em>
      </SparkySays>

      <div className="intro-card">
        <h3>🫙 My biggest secret</h3>
        <p>
          Here's the trick to how I think: I <strong>never</strong> know the one right answer. My
          whole brain is just <strong>jars full of guesses</strong>. Here's what's going on in my head
          when I read “The cat sat on the ___”:
        </p>
        <JarExplainer />
        <p className="intro-secret-note">
          <em>Every single thing I learn is just changing what's in the jars.</em> Keep this picture in
          your head — it's the secret to all of it. 🫙
        </p>
      </div>

      <div className="intro-card">
        <h3>🚀 What you'll teach me</h3>
        <ul className="journey">
          {JOURNEY.map((j) => (
            <li key={j.text}>
              <span className="journey-emoji">{j.emoji}</span>
              {j.text}
            </li>
          ))}
        </ul>
      </div>

      <button className="btn btn-primary btn-big" onClick={onStart}>
        Let's start teaching Sparky →
      </button>
    </div>
  )
}
