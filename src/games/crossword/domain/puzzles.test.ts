import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vite-plus/test'

import { generatePuzzle, type Word } from './crossword.js'
import { LEVELS } from './levels.js'

const dictionaryPath = path.resolve(import.meta.dirname, '../../../../public/dictionary.json')
const isWord = (value: unknown): value is Word =>
  typeof value === 'object' &&
  value !== null &&
  'word' in value &&
  typeof value.word === 'string' &&
  'clue' in value &&
  typeof value.clue === 'string'

describe('dictionary', () => {
  it('contains clean entries and generates compact fields', async () => {
    const dictionary: unknown = JSON.parse(await readFile(dictionaryPath, 'utf8'))
    if (!Array.isArray(dictionary) || !dictionary.every(isWord))
      throw new Error('Invalid test dictionary')

    expect(dictionary.length).toBeGreaterThan(25_000)
    expect(
      dictionary.some(({ clue }) => /từ cũ|phương ngữ/iu.test(clue)),
      'obsolete and dialect definitions',
    ).toBe(false)
    expect(
      dictionary.some(({ clue }) => /^\s*(?:d|dt|đ|đg|đgt|đt|t|tt|tr|trgt|tht)\.?\s+/iu.test(clue)),
      'dictionary labels at the beginning of clues',
    ).toBe(false)
    expect(
      dictionary.some(({ clue }) => /^\s*(?:\d+|[IVX]+)[.)]?\s+/u.test(clue)),
      'sense numbers at the beginning of clues',
    ).toBe(false)

    for (const [levelIndex, level] of LEVELS.entries()) {
      for (let sample = 0; sample < 16; sample += 1) {
        const seed = 20_000 + sample + levelIndex * 16
        const puzzle = generatePuzzle(dictionary, level.answerCount, seed)

        expect(puzzle.entries).toHaveLength(level.answerCount)
        expect(puzzle.entries.every(({ answer }) => /^[A-Z]+$/.test(answer))).toBe(true)
        expect(puzzle.grid.flat().every((cell) => !cell || /^[A-Z]$/.test(cell.solution))).toBe(
          true,
        )
        expect(puzzle.width, level.id).toBeLessThanOrEqual(13)
        expect(puzzle.height, level.id).toBeLessThanOrEqual(13)
      }
    }
  })
})
