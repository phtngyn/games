export default function CrosswordScreen() {
  return (
    <section className="grid min-h-[calc(100dvh-3.5rem)] place-items-center py-8 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Game module ready</p>
        <h1 className="mt-2 text-5xl font-black tracking-[-0.06em]">Crossword</h1>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
          This module can evolve independently while using the shared platform capabilities.
        </p>
      </div>
    </section>
  )
}
