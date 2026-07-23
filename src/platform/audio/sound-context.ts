import type { SoundName } from 'cuelume'
import { createContext, useContext } from 'react'

export type Sound = {
  enabled: boolean
  play: (name: SoundName) => void
  toggle: () => void
}

export const SoundContext = createContext<Sound | null>(null)

export function useSound() {
  const sound = useContext(SoundContext)
  if (!sound) throw new Error('useSound must be used within SoundProvider')
  return sound
}
