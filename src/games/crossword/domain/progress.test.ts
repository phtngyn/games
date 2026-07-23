import { describe, expect, it } from 'vite-plus/test'

import { areAllCellsLocked } from './progress.js'

describe('areAllCellsLocked', () => {
  const cells = [
    { row: 1, col: 2 },
    { row: 1, col: 3 },
  ]

  it('does not reveal a word when only some of its cells are locked', () => {
    expect(areAllCellsLocked(cells, new Set(['1:2']))).toBe(false)
  })

  it('reveals a word when every cell is locked', () => {
    expect(areAllCellsLocked(cells, new Set(['1:2', '1:3']))).toBe(true)
  })
})
