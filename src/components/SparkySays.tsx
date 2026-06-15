import type { ReactNode } from 'react'
import { Sparky, type Mood } from './Sparky'

interface SparkySaysProps {
  mood?: Mood
  size?: number
  children: ReactNode
}

/**
 * Sparky talking to the kid: the mascot next to a speech bubble. This is how
 * Sparky narrates the whole game in first person, so he reads as a character
 * the kid is raising rather than just a label on a screen.
 */
export function SparkySays({ mood = 'happy', size = 84, children }: SparkySaysProps) {
  return (
    <div className="sparky-says">
      <Sparky mood={mood} size={size} />
      <div className="speech-bubble">{children}</div>
    </div>
  )
}
