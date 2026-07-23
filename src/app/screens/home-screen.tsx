import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { games } from '@/games/registry'

export function HomeScreen() {
  return (
    <section className="py-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-muted-foreground">Pick something to play</p>
        <h1 className="mt-1 text-4xl font-black tracking-[-0.05em]">Small games, big breaks.</h1>
      </div>

      <div className="grid gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            to={`/${game.path}`}
            data-cuelume-toggle="page"
            data-cuelume-hover="tick"
            className="group flex min-h-28 items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm transition hover:border-foreground/20 hover:bg-muted/50 focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <game.Icon className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-bold">{game.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{game.description}</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  )
}
