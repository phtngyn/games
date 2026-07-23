import { normalizeAnswer } from './answer.js'
import type { Cell } from './crossword.js'

type InputState = {
  answers: Readonly<Record<string, string>>
  cells: ReadonlyArray<Cell>
  lockedCells: ReadonlySet<string>
  selected: Cell
}

type EnterInput = InputState & {
  letter: string
}

type InputResult = {
  answers: Record<string, string>
  selected: Cell
}

const cellKey = (cell: Cell) => `${cell.row}:${cell.col}`

const adjacentUnlockedCell = (
  cells: ReadonlyArray<Cell>,
  selected: Cell,
  offset: -1 | 1,
  lockedCells: ReadonlySet<string>,
) => {
  const selectedIndex = cells.findIndex(
    (cell) => cell.row === selected.row && cell.col === selected.col,
  )
  for (let index = selectedIndex + offset; index >= 0 && index < cells.length; index += offset) {
    const cell = cells[index]
    if (cell && !lockedCells.has(cellKey(cell))) return cell
  }
  return undefined
}

export function enterAtSelection({
  answers,
  cells,
  letter,
  lockedCells,
  selected,
}: EnterInput): InputResult {
  const key = cellKey(selected)
  if (lockedCells.has(key))
    return {
      answers: { ...answers },
      selected: adjacentUnlockedCell(cells, selected, 1, lockedCells) ?? selected,
    }

  const typedLetter = normalizeAnswer(letter)
  if (!typedLetter) return { answers: { ...answers }, selected }

  return {
    answers: { ...answers, [key]: typedLetter },
    selected: adjacentUnlockedCell(cells, selected, 1, lockedCells) ?? selected,
  }
}

export function eraseAtSelection({
  answers,
  cells,
  lockedCells,
  selected,
}: InputState): InputResult {
  const currentKey = cellKey(selected)
  const target =
    !lockedCells.has(currentKey) && answers[currentKey]
      ? selected
      : adjacentUnlockedCell(cells, selected, -1, lockedCells)
  if (!target) return { answers: { ...answers }, selected }
  const nextAnswers = { ...answers }
  delete nextAnswers[cellKey(target)]
  return { answers: nextAnswers, selected: target }
}
