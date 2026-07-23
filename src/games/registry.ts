import { crossword } from '@/games/crossword'
import type { GameDefinition } from '@/games/game-definition'
import { wordle } from '@/games/wordle'

export const games = [wordle, crossword] satisfies readonly GameDefinition[]
