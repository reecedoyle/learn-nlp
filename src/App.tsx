import { useEffect, useState } from 'react'
import type { LevelMeta } from './types'
import { Sparky } from './components/Sparky'
import { Intro } from './views/Intro'
import { Level0NextWord } from './levels/Level0NextWord'
import { Level1Tokens } from './levels/Level1Tokens'
import { Level2BeadModel } from './levels/Level2BeadModel'
import { Level3Context } from './levels/Level3Context'
import { Level4Temperature } from './levels/Level4Temperature'
import { Level5Embeddings } from './levels/Level5Embeddings'
import { Level6Attention } from './levels/Level6Attention'
import { Level7Training } from './levels/Level7Training'
import { Level8Turing } from './levels/Level8Turing'
import { Level9MultiplyAdd } from './levels/Level9MultiplyAdd'
import { Level10GpuRace } from './levels/Level10GpuRace'
import { Level11Memory } from './levels/Level11Memory'

const LEVELS: LevelMeta[] = [
  { id: 0, slug: 'next-word', title: 'Guess the Next Word', concept: 'Next-token prediction' },
  { id: 1, slug: 'tokens', title: 'Chop It Into Tokens', concept: 'Tokenization' },
  { id: 2, slug: 'bead-model', title: 'Build a Brain in a Jar', concept: 'How a model learns from text' },
  { id: 3, slug: 'context', title: 'Sparky\'s Short Memory', concept: 'Context window' },
  { id: 4, slug: 'temperature', title: 'Sparky\'s Mood Dial', concept: 'Temperature / sampling' },
  { id: 5, slug: 'embeddings', title: 'Sparky\'s Meaning Map', concept: 'Embeddings' },
  { id: 6, slug: 'attention', title: 'Sparky\'s Spotlight', concept: 'Attention' },
  { id: 7, slug: 'training', title: 'Watch Sparky Learn', concept: 'Training & loss' },
  { id: 8, slug: 'turing', title: 'The Turing Test', concept: 'Can Sparky fool you?' },
  { id: 9, slug: 'multiply-add', title: 'It\'s All Multiply-Add', concept: 'The one operation' },
  { id: 10, slug: 'gpu-race', title: 'CPU vs GPU Race', concept: 'Why AIs use GPUs' },
  { id: 11, slug: 'memory', title: 'Does Sparky Fit?', concept: 'Memory & model size' },
]

const STORAGE_KEY = 'sparky.completed.v1'
const NAV_KEY = 'sparky.nav.open'
type View = 'intro' | number

function loadCompleted(): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function viewToSlug(view: View): string {
  if (view === 'intro') return 'intro'
  return LEVELS.find((l) => l.id === view)?.slug ?? 'intro'
}

function hashToView(): View {
  const slug = window.location.hash.replace(/^#\/?/, '')
  if (!slug || slug === 'intro') return 'intro'
  return LEVELS.find((l) => l.slug === slug)?.id ?? 'intro'
}

export function App() {
  const [view, setView] = useState<View>(hashToView)
  const [completed, setCompleted] = useState<Set<number>>(loadCompleted)
  const [navOpen, setNavOpen] = useState<boolean>(() => {
    try {
      return JSON.parse(localStorage.getItem(NAV_KEY) ?? 'true')
    } catch {
      return true
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]))
  }, [completed])

  useEffect(() => {
    localStorage.setItem(NAV_KEY, JSON.stringify(navOpen))
  }, [navOpen])

  // Keep the URL hash and the view in sync, both ways (so refresh / back / forward
  // land on the same level).
  useEffect(() => {
    const onHash = () => setView(hashToView())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const slug = viewToSlug(view)
    if (window.location.hash.replace(/^#\/?/, '') !== slug) {
      window.location.hash = slug
    }
  }, [view])

  const markComplete = (id: number) => setCompleted((prev) => new Set(prev).add(id))
  const level = typeof view === 'number' ? LEVELS.find((l) => l.id === view) : undefined

  const badge = (l: LevelMeta) =>
    completed.has(l.id) ? '✓' : l.slug === 'turing' ? '★' : `L${l.id}`

  return (
    <div className="app">
      <header className="app-header">
        <button className="brand" onClick={() => setView('intro')}>
          <Sparky mood="happy" size={52} />
          <span>
            <span className="brand-title">Sparky</span>
            <span className="brand-sub">Build a Mind — how language models really work</span>
          </span>
        </button>
        <div className="progress-pill">
          {completed.size} / {LEVELS.length} levels complete
        </div>
      </header>

      <div className="layout">
        <aside className={'sidebar' + (navOpen ? '' : ' sidebar--collapsed')}>
          <button
            className="nav-toggle"
            onClick={() => setNavOpen((o) => !o)}
            title={navOpen ? 'Collapse menu' : 'Expand menu'}
            aria-label={navOpen ? 'Collapse menu' : 'Expand menu'}
          >
            {navOpen ? '«' : '»'}
          </button>

          <nav className="nav-list">
            <button
              className={'nav-item' + (view === 'intro' ? ' nav-item--active' : '')}
              onClick={() => setView('intro')}
              title="Meet Sparky"
            >
              <span className="nav-num">👋</span>
              <span className="nav-meta">
                <span className="nav-title">Meet Sparky</span>
                <span className="nav-concept">Who is this little robot?</span>
              </span>
            </button>
            {LEVELS.map((l) => (
              <div key={l.id} className="nav-row">
                {l.slug === 'multiply-add' && (
                  <div className="nav-divider">🛠️ Bonus · Engine Room</div>
                )}
                <button
                  className={'nav-item' + (l.id === view ? ' nav-item--active' : '')}
                  onClick={() => setView(l.id)}
                  title={`${l.title} — ${l.concept}`}
                >
                  <span className="nav-num">{badge(l)}</span>
                  <span className="nav-meta">
                    <span className="nav-title">{l.title}</span>
                    <span className="nav-concept">{l.concept}</span>
                  </span>
                </button>
              </div>
            ))}
          </nav>
        </aside>

        <main className="level-stage">
          {view === 'intro' && <Intro onStart={() => setView(0)} />}
          {level && <h2 className="level-heading">{level.title}</h2>}
          {view === 0 && <Level0NextWord onComplete={() => markComplete(0)} />}
          {view === 1 && <Level1Tokens onComplete={() => markComplete(1)} />}
          {view === 2 && <Level2BeadModel onComplete={() => markComplete(2)} />}
          {view === 3 && <Level3Context onComplete={() => markComplete(3)} />}
          {view === 4 && <Level4Temperature onComplete={() => markComplete(4)} />}
          {view === 5 && <Level5Embeddings onComplete={() => markComplete(5)} />}
          {view === 6 && <Level6Attention onComplete={() => markComplete(6)} />}
          {view === 7 && <Level7Training onComplete={() => markComplete(7)} />}
          {view === 8 && <Level8Turing onComplete={() => markComplete(8)} />}
        {view === 9 && <Level9MultiplyAdd onComplete={() => markComplete(9)} />}
        {view === 10 && <Level10GpuRace onComplete={() => markComplete(10)} />}
        {view === 11 && <Level11Memory onComplete={() => markComplete(11)} />}
        </main>
      </div>

      <footer className="app-footer">
        The whole journey: next-word prediction → tokens → bead jars → memory → temperature →
        meaning → attention → training → the Turing test. You built a mind. 🎓 Plus a bonus
        Engine Room on the hardware that runs it all (GPUs).
      </footer>
    </div>
  )
}
