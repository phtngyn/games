import { ArrowLeft, Volume2, VolumeX } from 'lucide-react'
import { Suspense, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { ShellBarContext, type ShellBarOverride } from '@/app/shell/shell-bar-context'
import { useSound } from '@/platform/audio/sound-context'
import { ThemeToggle } from '@/theme/theme-toggle'

const gameLoadingFallback = (
  <div className="grid min-h-[70dvh] place-items-center text-sm text-muted-foreground">
    Loading game…
  </div>
)

function SoundToggle() {
  const sound = useSound()

  return (
    <button
      type="button"
      onClick={sound.toggle}
      className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:outline-none"
      aria-label={sound.enabled ? 'Mute sounds' : 'Enable sounds'}
    >
      {sound.enabled ? (
        <Volume2 className="size-[1.125rem]" />
      ) : (
        <VolumeX className="size-[1.125rem]" />
      )}
    </button>
  )
}

export function AppShell() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [shellBar, setShellBar] = useState<ShellBarOverride | null>(null)
  const setShellBarValue = useMemo(() => setShellBar, [])

  return (
    <ShellBarContext value={setShellBarValue}>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-safe">
        <header className="flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center justify-between pt-safe">
          {shellBar?.leading ?? (
            <Link
              to="/"
              className="flex min-h-11 items-center gap-2 rounded-full pr-3 text-sm font-semibold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
              aria-label={isHome ? 'Games home' : 'Back to all games'}
            >
              {!isHome && <ArrowLeft className="size-[1.125rem] text-muted-foreground" />}
              <span>{isHome ? 'Games' : 'All games'}</span>
            </Link>
          )}
          <div className="flex items-center">
            {shellBar?.trailing}
            <ThemeToggle />
            <SoundToggle />
          </div>
        </header>
        <main className="min-h-0 flex-1 pb-safe">
          <Suspense fallback={gameLoadingFallback}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ShellBarContext>
  )
}
