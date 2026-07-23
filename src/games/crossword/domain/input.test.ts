import { describe, expect, it } from 'vite-plus/test'

import { eraseAtSelection, enterAtSelection } from './input.js'

describe('crossword input', () => {
  const cells = [
    { row: 0, col: 5 },
    { row: 1, col: 5 },
    { row: 2, col: 5 },
  ]

  it('enters a letter and advances within the active entry', () => {
    expect(
      enterAtSelection({
        answers: {},
        cells,
        letter: 'Q',
        lockedCells: new Set(),
        selected: cells[0],
      }),
    ).toEqual({
      answers: { '0:5': 'Q' },
      selected: cells[1],
    })
  })

  it('deletes the previous letter with one press when the selected cell is empty', () => {
    expect(
      eraseAtSelection({
        answers: { '0:5': 'Q' },
        cells,
        lockedCells: new Set(),
        selected: cells[1],
      }),
    ).toEqual({
      answers: {},
      selected: cells[0],
    })
  })

  it('deletes the selected letter without moving', () => {
    expect(
      eraseAtSelection({
        answers: { '1:5': 'Q' },
        cells,
        lockedCells: new Set(),
        selected: cells[1],
      }),
    ).toEqual({
      answers: {},
      selected: cells[1],
    })
  })

  it('does not delete a locked letter when there is no previous unlocked cell', () => {
    expect(
      eraseAtSelection({
        answers: { '0:5': 'Q' },
        cells,
        lockedCells: new Set(['0:5']),
        selected: cells[0],
      }),
    ).toEqual({
      answers: { '0:5': 'Q' },
      selected: cells[0],
    })
  })
})
