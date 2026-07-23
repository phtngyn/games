# Games

A mobile-first React home for small games.

## Commands

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
```

## Structure

- `src/app` owns routing, providers, the collection screen, and the application shell.
- `src/games` owns the registry and one self-contained module per game.
- `src/platform` owns capabilities available to games, such as sound and future persistence.
- `src/theme` owns global appearance and theme preference.
- `src/ui` is reserved for shared visual modules and shadcn primitives.

The game-agnostic QWERTY keyboard lives in `src/ui/game`. Games supply optional leading and trailing
action keys plus neutral key tones; the keyboard owns its letter layout, touch interaction, and
accessibility. Map domain states such as Wordle's letter results to keyboard tones inside the game,
not inside the shared module.

Each game exposes one small `GameDefinition` to the registry. Everything else remains private to
that game. Add `domain`, `application`, and `screens` directories inside a game as they become
useful:

- `domain`: pure rules and state transitions without React.
- `application`: orchestration, persistence, and React hooks.
- `screens`: route-level rendering.

Do not extract a module into `platform` or `ui` until at least two games need the same behavior.
