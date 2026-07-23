export const LEVELS = [
  {
    id: 'easy',
    label: 'Easy',
    description: '6 answers',
    answerCount: 6,
  },
  {
    id: 'medium',
    label: 'Medium',
    description: '8 answers',
    answerCount: 8,
  },
  {
    id: 'hard',
    label: 'Hard',
    description: '10 answers',
    answerCount: 10,
  },
] as const

export type Level = (typeof LEVELS)[number]
export type LevelId = Level['id']

export const isLevelId = (value: string): value is LevelId =>
  LEVELS.some((level) => level.id === value)

export const levelById = (id: LevelId): Level =>
  LEVELS.find((level) => level.id === id) ?? LEVELS[1]
