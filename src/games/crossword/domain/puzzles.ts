import { generatePuzzle, type Puzzle, type Word } from './crossword.js'
import { levelById, type LevelId } from './levels.js'

const isWord = (value: unknown): value is Word =>
  typeof value === 'object' &&
  value !== null &&
  'word' in value &&
  typeof value.word === 'string' &&
  'clue' in value &&
  typeof value.clue === 'string'

async function readJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error(`Could not load ${path}`)
  return response.json()
}

export async function getPuzzle(
  seed: number,
  levelId: LevelId,
  signal?: AbortSignal,
): Promise<Puzzle> {
  const words = await readJson('/dictionary.json', signal)
  if (!Array.isArray(words) || !words.every(isWord)) throw new Error('The dictionary is invalid')
  return generatePuzzle(words, levelById(levelId).answerCount, seed)
}
