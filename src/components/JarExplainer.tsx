/**
 * A single annotated picture that explains the whole jar-of-beads idea before
 * the kid touches anything. It walks left-to-right: a sentence with a blank →
 * Sparky thinks → a jar where each colour is a possible next word and the number
 * of beads is how sure he is. Callouts spell out "more beads = more sure," and
 * the caption explains that answering = grabbing one bead at random.
 */

interface Cluster {
  color: string
  count: number
  label: string
  note: string
}

const CLUSTERS: Cluster[] = [
  { color: '#ef4444', count: 12, label: '“mat”', note: 'very sure!' },
  { color: '#3b82f6', count: 6, label: '“floor”', note: 'maybe' },
  { color: '#10b981', count: 3, label: '“bed”', note: 'probably not' },
  { color: '#8b5cf6', count: 1, label: '“roof”', note: 'almost never' },
]

const INNER_LEFT = 316
const PER_ROW = 6
const PITCH = 20
const R = 8
const JAR_RIGHT = 460

export function JarExplainer() {
  // Lay the beads out cluster by cluster, top to bottom, and remember where the
  // middle of each cluster is so we can point a callout at it.
  const beads: Array<{ x: number; y: number; color: string }> = []
  const callouts: Array<{ y: number; color: string; label: string; note: string }> = []
  let curY = 116
  for (const c of CLUSTERS) {
    const rows = Math.ceil(c.count / PER_ROW)
    let placed = 0
    for (let row = 0; row < rows; row++) {
      const inRow = Math.min(PER_ROW, c.count - placed)
      for (let col = 0; col < inRow; col++) {
        beads.push({ x: INNER_LEFT + col * PITCH + R, y: curY + row * PITCH + R, color: c.color })
      }
      placed += inRow
    }
    const h = rows * PITCH
    callouts.push({ y: curY + h / 2, color: c.color, label: c.label, note: c.note })
    curY += h + 10
  }

  return (
    <figure className="jar-explainer">
      <svg viewBox="0 0 700 330" role="img" aria-label="How Sparky's jar of guesses works">
        {/* sentence box */}
        <rect x="12" y="150" width="232" height="74" rx="14" fill="#fafafe" stroke="#e7e5ee" strokeWidth="2" />
        <text x="128" y="182" textAnchor="middle" fontSize="18" fill="#1f2430" fontFamily="inherit">
          The cat sat on the
        </text>
        <text x="128" y="208" textAnchor="middle" fontSize="20" fontWeight="700" fill="#6d28d9" fontFamily="inherit">
          _____ ?
        </text>

        {/* arrow */}
        <text x="276" y="178" textAnchor="middle" fontSize="13" fill="#6b7280" fontFamily="inherit">
          Sparky
        </text>
        <text x="276" y="192" textAnchor="middle" fontSize="13" fill="#6b7280" fontFamily="inherit">
          thinks…
        </text>
        <line x1="250" y1="200" x2="298" y2="200" stroke="#9ca3af" strokeWidth="3" />
        <polygon points="298,194 308,200 298,206" fill="#9ca3af" />

        {/* jar */}
        <rect x="292" y="86" width="176" height="16" rx="8" fill="#cbd5e1" />
        <rect x="300" y="96" width="160" height="212" rx="22" fill="rgba(226,232,240,0.45)" stroke="#cbd5e1" strokeWidth="3" />
        {beads.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r={R} fill={b.color} />
            <circle cx={b.x - 2.5} cy={b.y - 2.5} r={2.2} fill="rgba(255,255,255,0.55)" />
          </g>
        ))}

        {/* callouts */}
        {callouts.map((c, i) => (
          <g key={i}>
            <line x1={JAR_RIGHT + 2} y1={c.y} x2={490} y2={c.y} stroke={c.color} strokeWidth="2" />
            <circle cx={JAR_RIGHT + 2} cy={c.y} r={3} fill={c.color} />
            <text x={498} y={c.y + 5} fontSize="16" fontFamily="inherit">
              <tspan fontWeight="700" fill="#1f2430">{c.label}</tspan>
              <tspan fill="#6b7280"> — {c.note}</tspan>
            </text>
          </g>
        ))}
      </svg>

      <figcaption>
        Each <strong>colour</strong> is a word that could come next. The <strong>number of beads</strong>{' '}
        is how sure Sparky is — lots of red beads means he really thinks it's “mat.” To answer, he
        shuts his eyes and <strong>grabs one bead</strong>. He'll usually pull red… but every so often a
        surprise. <em>That's why an AI doesn't always say the exact same thing!</em>
      </figcaption>
    </figure>
  )
}
