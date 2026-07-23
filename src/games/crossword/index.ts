import { PanelsTopLeft } from 'lucide-react'
import { lazy } from 'react'

import type { GameDefinition } from '@/games/game-definition'

export const crossword = {
  id: 'crossword',
  path: 'crossword',
  title: 'Crossword',
  description: 'Fill the grid one clue at a time.',
  Icon: PanelsTopLeft,
  Screen: lazy(() => import('./screens/crossword-screen')),
} satisfies GameDefinition
