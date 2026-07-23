import { lazy } from 'react'

import type { GameDefinition } from '@/games/game-definition'
import { WordleLogo } from '@/games/wordle/wordle-logo'

export const wordle = {
  id: 'wordle',
  path: 'wordle',
  title: 'Wordle',
  description: 'Find the hidden word in a handful of guesses.',
  Icon: WordleLogo,
  Screen: lazy(() => import('./screens/wordle-screen')),
} satisfies GameDefinition
