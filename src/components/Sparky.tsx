export type Mood = 'new' | 'happy' | 'thinking' | 'confused' | 'excited'

interface SparkyProps {
  mood?: Mood
  size?: number
}

/**
 * Sparky the robot — the character the kid is "raising." A just-switched-on
 * little AI with an empty brain. His face reacts to what happens so he feels
 * alive: sleepy/blank when new, thinking while the model runs, excited on a win,
 * confused on a miss.
 */
export function Sparky({ mood = 'happy', size = 96 }: SparkyProps) {
  const screen = '#7df9ff'
  const sparkColor = mood === 'excited' ? '#fde047' : mood === 'new' ? '#9ca3af' : '#c4b5fd'

  return (
    <svg
      width={size}
      height={size * (130 / 120)}
      viewBox="0 0 120 130"
      className={'sparky-svg' + (mood === 'excited' ? ' sparky-svg--excited' : '')}
      role="img"
      aria-label={`Sparky the robot looking ${mood}`}
    >
      {/* antenna + spark */}
      <line x1="60" y1="20" x2="60" y2="9" stroke="#9ca3af" strokeWidth="3" />
      <circle cx="60" cy="7" r="6" fill={sparkColor} className="sparky-spark" />

      {/* head */}
      <rect x="18" y="20" width="84" height="74" rx="18" fill="#b9a7f2" stroke="#8b73e0" strokeWidth="3" />
      {/* side bolts */}
      <circle cx="18" cy="57" r="5" fill="#8b73e0" />
      <circle cx="102" cy="57" r="5" fill="#8b73e0" />
      {/* feet */}
      <rect x="34" y="94" width="20" height="12" rx="5" fill="#8b73e0" />
      <rect x="66" y="94" width="20" height="12" rx="5" fill="#8b73e0" />

      {/* face screen */}
      <rect x="28" y="30" width="64" height="52" rx="12" fill="#1f2430" />

      {/* eyes + mouth by mood */}
      {mood === 'new' && (
        <>
          <path d="M 40 52 Q 46 57 52 52" stroke={screen} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 68 52 Q 74 57 80 52" stroke={screen} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <line x1="50" y1="70" x2="70" y2="70" stroke={screen} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {mood === 'happy' && (
        <>
          <circle cx="46" cy="51" r="5.5" fill={screen} />
          <circle cx="74" cy="51" r="5.5" fill={screen} />
          <path d="M 46 66 Q 60 76 74 66" stroke={screen} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'thinking' && (
        <>
          <circle cx="47" cy="48" r="4.5" fill={screen} />
          <circle cx="75" cy="48" r="4.5" fill={screen} />
          <line x1="52" y1="69" x2="68" y2="69" stroke={screen} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="86" cy="40" r="2.5" fill={screen} className="sparky-think-dot sparky-think-dot--1" />
          <circle cx="94" cy="33" r="3.5" fill={screen} className="sparky-think-dot sparky-think-dot--2" />
        </>
      )}
      {mood === 'confused' && (
        <>
          <circle cx="46" cy="51" r="5.5" fill={screen} />
          <line x1="68" y1="51" x2="80" y2="51" stroke={screen} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 48 70 Q 54 64 60 70 T 72 70" stroke={screen} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {mood === 'excited' && (
        <>
          <circle cx="46" cy="50" r="6.5" fill={screen} />
          <circle cx="74" cy="50" r="6.5" fill={screen} />
          <circle cx="44" cy="48" r="2" fill="#1f2430" />
          <circle cx="72" cy="48" r="2" fill="#1f2430" />
          <path d="M 44 64 Q 60 82 76 64 Z" fill={screen} />
        </>
      )}
    </svg>
  )
}
