import { Grid2X2 } from 'lucide-react'
import { lazy } from 'react'

import type { GameDefinition } from '@/games/game-definition'

export const wordle = {
  id: 'wordle',
  path: 'wordle',
  title: 'Wordle',
  description: 'Find the hidden word in a handful of guesses.',
  Icon: Grid2X2,
  Screen: lazy(() => import('./screens/wordle-screen')),
} satisfies GameDefinition
