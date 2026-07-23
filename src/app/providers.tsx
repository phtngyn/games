import type { PropsWithChildren } from 'react'

import { SoundProvider } from '@/platform/audio/sound-provider'
import { ThemeProvider } from '@/theme/theme-provider'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SoundProvider>{children}</SoundProvider>
    </ThemeProvider>
  )
}
