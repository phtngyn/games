import type { Cell } from './crossword.js'

const cellKey = (cell: Cell) => `${cell.row}:${cell.col}`

export function areAllCellsLocked(cells: ReadonlyArray<Cell>, lockedCells: ReadonlySet<string>) {
  return cells.every((cell) => lockedCells.has(cellKey(cell)))
}
