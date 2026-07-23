import { Link } from 'react-router-dom'

export function NotFoundScreen() {
  return (
    <section className="grid min-h-[70dvh] place-items-center text-center">
      <div>
        <p className="text-6xl font-black">404</p>
        <p className="mt-2 text-muted-foreground">This game could not be found.</p>
        <Link className="mt-6 inline-block font-semibold underline underline-offset-4" to="/">
          Back to games
        </Link>
      </div>
    </section>
  )
}
