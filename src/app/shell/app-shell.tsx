import { Volume2, VolumeX } from 'lucide-react'
import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { useSound } from '@/platform/audio/sound-context'
import { ThemeToggle } from '@/theme/theme-toggle'

const gameLoadingFallback = (
  <div className="grid min-h-[70dvh] place-items-center text-sm text-muted-foreground">
    Loading game…
  </div>
)

export function AppShell() {
  const location = useLocation()
  const sound = useSound()
  const isHome = location.pathname === '/'

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-safe">
      <header className="flex h-14 shrink-0 items-center justify-between border-b">
        <Link
          to="/"
          className="rounded-md text-lg font-black tracking-tight outline-none focus-visible:ring-2"
        >
          {isHome ? 'Games' : '← Games'}
        </Link>
        <div className="flex gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={sound.toggle}
            className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={sound.enabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {sound.enabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <Suspense fallback={gameLoadingFallback}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
