import { lazy } from 'react'

import { CrosswordLogo } from '@/games/crossword/crossword-logo'
import type { GameDefinition } from '@/games/game-definition'

export const crossword = {
  id: 'crossword',
  path: 'crossword',
  title: 'Crossword',
  description: 'Fill the grid one clue at a time.',
  Icon: CrosswordLogo,
  Screen: lazy(() => import('./screens/crossword-screen')),
} satisfies GameDefinition
