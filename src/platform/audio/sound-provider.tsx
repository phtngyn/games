import { bind, play, setEnabled, type SoundName } from 'cuelume'
import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

import { SoundContext } from '@/platform/audio/sound-context'

const STORAGE_KEY = 'games:preferences:sound'

function loadPreference() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'false'
  } catch {
    return true
  }
}

export function SoundProvider({ children }: PropsWithChildren) {
  const [enabled, setSoundEnabled] = useState(loadPreference)

  useEffect(() => {
    setEnabled(enabled)
    bind()
  }, [enabled])

  const playSound = useCallback((name: SoundName) => play(name), [])
  const toggle = useCallback(() => {
    setSoundEnabled((current) => {
      const next = !current
      setEnabled(next)
      if (next) play('toggle')
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Sound remains available when storage is unavailable.
      }
      return next
    })
  }, [])
  const value = useMemo(() => ({ enabled, play: playSound, toggle }), [enabled, playSound, toggle])

  return <SoundContext value={value}>{children}</SoundContext>
}
