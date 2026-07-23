import { normalizeAnswer } from './answer.js'

export type Direction = 'across' | 'down'
export type Cell = { row: number; col: number }
export type Word = { word: string; clue: string }

type PreparedWord = Word & {
  answer: string
  answerLength: number
  wordCount: number
  clueQuality: number
  crossingScore: number
}

type Placement = Word & {
  answer: string
  row: number
  col: number
  direction: Direction
}

export type PuzzleEntry = Placement & {
  number: number
  cells: Array<Cell>
  displayLength: string
}

type GridCell = {
  solution: string
  number?: number
}

export type Puzzle = {
  width: number
  height: number
  grid: Array<Array<GridCell | null>>
  entries: Array<PuzzleEntry>
  firstCell: Cell
  cellCount: number
}

const GRID_SIZE = 25
const answerOf = normalizeAnswer

const randomOf = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

const shuffled = <Item>(words: ReadonlyArray<Item>, seed: number) => {
  const output = [...words]
  const random = randomOf(seed)
  for (let index = output.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    const current = output[index]
    const replacement = output[other]
    if (current && replacement) {
      output[index] = replacement
      output[other] = current
    }
  }
  return output
}

const clueQualityOf = (clue: string) => {
  let score = 100
  if (clue.length < 20) score -= 20 - clue.length
  if (clue.length > 100) score -= clue.length - 100
  if (/^\s*(?:d|dt|đ|đg|đgt|đt|t|tt|tr|trgt|tht)\.?\s+/iu.test(clue)) score -= 35
  if (/(?:^|\s)[1-9][.)]\s/u.test(clue)) score -= 20
  if (/[;:*]/u.test(clue)) score -= 5
  if ((clue.match(/[()]/gu)?.length ?? 0) > 2) score -= 5
  return score
}

const prepareWords = (words: ReadonlyArray<Word>) => {
  const eligible = words
    .map((word) => {
      const answer = answerOf(word.word)
      const wordCount = word.word.replaceAll('-', ' ').split(/\s+/).length
      return {
        ...word,
        answer,
        answerLength: answer.length,
        wordCount,
        clueQuality: clueQualityOf(word.clue),
        crossingScore: 0,
      }
    })
    .filter(
      (candidate) =>
        candidate.answerLength >= 4 &&
        candidate.answerLength <= 10 &&
        candidate.wordCount <= 3 &&
        candidate.clue.length <= 150,
    )

  const letterFrequency = new Map<string, number>()
  eligible.forEach(({ answer }) => {
    new Set(answer).forEach((letter) => {
      letterFrequency.set(letter, (letterFrequency.get(letter) ?? 0) + 1)
    })
  })
  const mostCommonLetter = Math.max(...letterFrequency.values())

  eligible.forEach((candidate) => {
    const distinctLetters = new Set(candidate.answer)
    const commonality = [...distinctLetters].reduce(
      (total, letter) => total + (letterFrequency.get(letter) ?? 0) / mostCommonLetter,
      0,
    )
    candidate.crossingScore = distinctLetters.size * 2 + commonality
  })
  return eligible
}

const candidateRank = (candidate: PreparedWord) =>
  candidate.clueQuality + candidate.crossingScore * 2

const candidatePool = (eligible: ReadonlyArray<PreparedWord>, seed: number) => {
  const buckets = [
    { words: eligible.filter(({ answerLength }) => answerLength <= 5), count: 22 },
    {
      words: eligible.filter(({ answerLength }) => answerLength >= 6 && answerLength <= 7),
      count: 34,
    },
    { words: eligible.filter(({ answerLength }) => answerLength >= 8), count: 24 },
  ]

  return buckets.flatMap(({ words, count }, bucketIndex) => {
    const highQualityPool = words
      .toSorted((left, right) => candidateRank(right) - candidateRank(left))
      .slice(0, 4_000)
    return shuffled(highQualityPool, seed + bucketIndex * 10_000).slice(0, count)
  })
}

const canPlace = (
  grid: Array<Array<string | null>>,
  answer: string,
  row: number,
  col: number,
  direction: Direction,
) => {
  const dr = direction === 'down' ? 1 : 0
  const dc = direction === 'across' ? 1 : 0
  const beforeRow = row - dr
  const beforeCol = col - dc
  const afterRow = row + dr * answer.length
  const afterCol = col + dc * answer.length
  if (
    row < 0 ||
    col < 0 ||
    afterRow >= GRID_SIZE ||
    afterCol >= GRID_SIZE ||
    grid[beforeRow]?.[beforeCol] ||
    grid[afterRow]?.[afterCol]
  )
    return false

  let intersections = 0
  for (let index = 0; index < answer.length; index += 1) {
    const cellRow = row + dr * index
    const cellCol = col + dc * index
    const existing = grid[cellRow]?.[cellCol]
    if (existing && existing !== answer[index]) return false
    if (existing) {
      intersections += 1
    } else if (direction === 'across') {
      if (grid[cellRow - 1]?.[cellCol] || grid[cellRow + 1]?.[cellCol]) return false
    } else if (grid[cellRow]?.[cellCol - 1] || grid[cellRow]?.[cellCol + 1]) {
      return false
    }
  }
  return intersections > 0
}

export function createPuzzle(words: ReadonlyArray<Word>, target = 9): Puzzle {
  const grid = Array.from({ length: GRID_SIZE }, () => Array<string | null>(GRID_SIZE).fill(null))
  const candidates = words
    .map((word) => ({ ...word, answer: answerOf(word.word) }))
    .toSorted((a, b) => b.answer.length - a.answer.length)
  const first = candidates.shift()
  if (!first) throw new Error('At least one word is required')

  const placements: Array<Placement> = [
    {
      ...first,
      row: Math.floor(GRID_SIZE / 2),
      col: Math.floor((GRID_SIZE - first.answer.length) / 2),
      direction: 'across',
    },
  ]

  const write = (placement: Placement) => {
    const dr = placement.direction === 'down' ? 1 : 0
    const dc = placement.direction === 'across' ? 1 : 0
    placement.answer.split('').forEach((letter, index) => {
      grid[placement.row + dr * index][placement.col + dc * index] = letter
    })
  }
  write(placements[0])

  while (placements.length < target) {
    let best: { candidateIndex: number; placement: Placement; score: number } | null = null
    const currentMinRow = Math.min(...placements.map((item) => item.row))
    const currentMinCol = Math.min(...placements.map((item) => item.col))
    const currentMaxRow = Math.max(
      ...placements.map(
        (item) => item.row + (item.direction === 'down' ? item.answer.length - 1 : 0),
      ),
    )
    const currentMaxCol = Math.max(
      ...placements.map(
        (item) => item.col + (item.direction === 'across' ? item.answer.length - 1 : 0),
      ),
    )
    for (const [candidateIndex, candidate] of candidates.entries()) {
      for (const placed of placements) {
        for (let own = 0; own < candidate.answer.length; own += 1) {
          for (let other = 0; other < placed.answer.length; other += 1) {
            if (candidate.answer[own] !== placed.answer[other]) continue
            const direction: Direction = placed.direction === 'across' ? 'down' : 'across'
            const row =
              direction === 'down'
                ? placed.row - own
                : placed.row + (placed.direction === 'down' ? other : 0)
            const col =
              direction === 'across'
                ? placed.col - own
                : placed.col + (placed.direction === 'across' ? other : 0)
            if (!canPlace(grid, candidate.answer, row, col, direction)) continue
            const dr = direction === 'down' ? 1 : 0
            const dc = direction === 'across' ? 1 : 0
            const intersections = candidate.answer
              .split('')
              .filter((_, index) => grid[row + dr * index]?.[col + dc * index]).length
            const minRow = Math.min(currentMinRow, row)
            const minCol = Math.min(currentMinCol, col)
            const maxRow = Math.max(currentMaxRow, row + dr * (candidate.answer.length - 1))
            const maxCol = Math.max(currentMaxCol, col + dc * (candidate.answer.length - 1))
            const width = maxCol - minCol + 1
            const height = maxRow - minRow + 1
            const score =
              intersections * 1000 -
              width * height * 10 -
              Math.abs(width - height) * 10 +
              candidate.answer.length
            if (!best || score > best.score) {
              best = { candidateIndex, placement: { ...candidate, row, col, direction }, score }
            }
          }
        }
      }
    }
    if (!best) break
    write(best.placement)
    placements.push(best.placement)
    candidates.splice(best.candidateIndex, 1)
  }

  const minRow = Math.min(...placements.map((item) => item.row))
  const minCol = Math.min(...placements.map((item) => item.col))
  const maxRow = Math.max(
    ...placements.map(
      (item) => item.row + (item.direction === 'down' ? item.answer.length - 1 : 0),
    ),
  )
  const maxCol = Math.max(
    ...placements.map(
      (item) => item.col + (item.direction === 'across' ? item.answer.length - 1 : 0),
    ),
  )
  const starts = new Map<string, number>()
  let nextNumber = 1
  const sorted = [...placements].toSorted((a, b) => a.row - b.row || a.col - b.col)
  sorted.forEach((placement) => {
    const key = `${placement.row}:${placement.col}`
    if (!starts.has(key)) starts.set(key, nextNumber++)
  })

  const entries: Array<PuzzleEntry> = placements
    .map((placement): PuzzleEntry => {
      const dr = placement.direction === 'down' ? 1 : 0
      const dc = placement.direction === 'across' ? 1 : 0
      return {
        word: placement.word,
        clue: placement.clue,
        answer: placement.answer,
        direction: placement.direction,
        row: placement.row - minRow,
        col: placement.col - minCol,
        number: starts.get(`${placement.row}:${placement.col}`) ?? 0,
        cells: placement.answer.split('').map((_, index) => ({
          row: placement.row - minRow + dr * index,
          col: placement.col - minCol + dc * index,
        })),
        displayLength: placement.word
          .split(/[\s-]+/)
          .map((part) => Array.from(part).length)
          .join(', '),
      }
    })
    .toSorted((a, b) => a.number - b.number || (a.direction === 'across' ? -1 : 1))

  const output = Array.from({ length: maxRow - minRow + 1 }, () =>
    Array<GridCell | null>(maxCol - minCol + 1).fill(null),
  )
  entries.forEach((entry) => {
    entry.cells.forEach((cell, index) => {
      output[cell.row][cell.col] = {
        solution: entry.answer[index],
        number: index === 0 ? entry.number : output[cell.row]?.[cell.col]?.number,
      }
    })
  })

  return {
    width: maxCol - minCol + 1,
    height: maxRow - minRow + 1,
    grid: output,
    entries,
    firstCell: entries[0]?.cells[0] ?? { row: 0, col: 0 },
    cellCount: output.flat().filter(Boolean).length,
  }
}

export function generatePuzzle(words: ReadonlyArray<Word>, target = 8, seed = 0): Puzzle {
  const eligible = prepareWords(words)

  let best: Puzzle | null = null
  let bestScore = Number.NEGATIVE_INFINITY
  for (let attempt = 0; attempt < 256; attempt += 1) {
    const candidates = candidatePool(eligible, seed + attempt)
    const puzzle = createPuzzle(candidates, target)
    const density = puzzle.cellCount / (puzzle.width * puzzle.height)
    const clueQuality =
      puzzle.entries.reduce((total, entry) => total + clueQualityOf(entry.clue), 0) /
      puzzle.entries.length
    const answerLengths = puzzle.entries.map(({ answer }) => answer.length)
    const lengthSpread = Math.max(...answerLengths) - Math.min(...answerLengths)
    const score =
      puzzle.entries.length * 10_000 -
      puzzle.width * puzzle.height * 10 -
      Math.abs(puzzle.width - puzzle.height) * 20 +
      density * 100 +
      clueQuality * 5 -
      lengthSpread * 5
    if (score > bestScore) {
      best = puzzle
      bestScore = score
    }
    if (
      puzzle.entries.length === target &&
      puzzle.width <= 13 &&
      puzzle.height <= 13 &&
      Math.max(puzzle.width, puzzle.height) / Math.min(puzzle.width, puzzle.height) <= 1.8
    )
      return puzzle
  }

  if (best?.entries.length === target) return best
  throw new Error('Unable to generate a compact puzzle from this dictionary shard')
}
