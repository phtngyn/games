/* eslint-disable react-perf/jsx-no-new-function-as-prop, react-perf/jsx-no-new-object-as-prop */
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Delete,
  Lightbulb,
  LockKeyhole,
  RefreshCw,
  Trophy,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'

import { useShellBar } from '@/app/shell/shell-bar-context'
import { answersMatch, normalizeAnswer } from '@/games/crossword/domain/answer'
import type { Cell, Direction, Puzzle } from '@/games/crossword/domain/crossword'
import { enterAtSelection, eraseAtSelection } from '@/games/crossword/domain/input'
import { isLevelId, LEVELS, levelById, type LevelId } from '@/games/crossword/domain/levels'
import { areAllCellsLocked } from '@/games/crossword/domain/progress'
import { getPuzzle } from '@/games/crossword/domain/puzzles'
import { useSound } from '@/platform/audio/sound-context'
import { VirtualKeyboard, type VirtualKeyboardAction } from '@/ui/game'

const cellKey = (row: number, col: number) => `${row}:${col}`
const deleteAction: VirtualKeyboardAction = {
  value: 'BACKSPACE',
  label: <Delete className="size-5" />,
  accessibleLabel: 'Delete letter',
}
const checkAction: VirtualKeyboardAction = {
  value: 'CHECK',
  label: 'Check',
}

function LevelSelector({ onSelect }: { onSelect: (level: LevelId) => void }) {
  const selectLevel = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isLevelId(event.currentTarget.value)) onSelect(event.currentTarget.value)
    },
    [onSelect],
  )

  return (
    <section className="grid min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] place-items-center py-8">
      <div className="w-full">
        <div className="mb-10">
          <h1 className="text-5xl leading-none font-black tracking-[-0.065em]">Crossword</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            A fresh Vietnamese crossword whenever you want.
          </p>
        </div>
        <p className="mb-2.5 text-xs font-medium text-muted-foreground">Level</p>
        <div className="grid gap-2.5" aria-label="Choose level">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              type="button"
              value={level.id}
              onClick={selectLevel}
              data-cuelume-toggle="page"
              data-cuelume-hover="tick"
              className="group flex min-h-20 items-center justify-between rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:ring-2 focus-visible:outline-none"
            >
              <span>
                <span className="block text-2xl font-bold tracking-tight">{level.label}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {level.description}
                </span>
              </span>
              <span className="grid size-8 place-items-center rounded-lg border text-sm text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

type Notice = { id: number; message: string; success: boolean }

function CrosswordGame({ levelId, onBack }: { levelId: LevelId; onBack: () => void }) {
  const [seed, setSeed] = useState(
    () => crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now(),
  )
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [lockedCells, setLockedCells] = useState<Set<string>>(() => new Set())
  const [selected, setSelected] = useState<Cell | null>(null)
  const [direction, setDirection] = useState<Direction>('across')
  const [checked, setChecked] = useState(false)
  const [hintCount, setHintCount] = useState(0)
  const [notice, setNotice] = useState<Notice | null>(null)
  const setShellBar = useShellBar()
  const sound = useSound()
  const notify = useCallback((message: string, success: boolean) => {
    setNotice((current) => ({ id: (current?.id ?? 0) + 1, message, success }))
  }, [])

  const resetState = useCallback((nextPuzzle?: Puzzle) => {
    setAnswers({})
    setLockedCells(new Set())
    setSelected(nextPuzzle?.firstCell ?? null)
    setDirection('across')
    setChecked(false)
    setHintCount(0)
    setNotice(null)
  }, [])
  const newPuzzle = useCallback(() => {
    setPuzzle(null)
    resetState()
    setSeed(crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now())
    sound.play('release')
  }, [resetState, sound])
  const requestHint = useCallback(() => {
    if (!puzzle) return
    const cells = puzzle.grid.flatMap((row, rowIndex) =>
      row.flatMap((cell, colIndex) =>
        cell ? [{ key: cellKey(rowIndex, colIndex), solution: cell.solution }] : [],
      ),
    )
    const correct = cells
      .filter(({ key, solution }) => answers[key] && answersMatch(answers[key] ?? '', solution))
      .map(({ key }) => key)
    const nextLocked = new Set([...lockedCells, ...correct])
    const revealCandidates = cells.filter(({ key }) => !nextLocked.has(key))
    const reveal =
      (hintCount + 1) % 10 === 0
        ? revealCandidates[Math.floor(Math.random() * revealCandidates.length)]
        : undefined
    if (reveal) {
      nextLocked.add(reveal.key)
      setAnswers((current) => ({ ...current, [reveal.key]: normalizeAnswer(reveal.solution) }))
    }
    const newlyLocked = correct.filter((key) => !lockedCells.has(key)).length
    setHintCount((count) => count + 1)
    setLockedCells(nextLocked)
    notify(
      reveal
        ? 'A random letter was revealed and locked.'
        : newlyLocked
          ? `${newlyLocked} correct ${newlyLocked === 1 ? 'letter was' : 'letters were'} locked.`
          : 'No new correct letters to lock.',
      Boolean(reveal || newlyLocked),
    )
    sound.play(reveal || newlyLocked ? 'success' : 'error')
  }, [answers, hintCount, lockedCells, notify, puzzle, sound])

  useEffect(() => {
    const controller = new AbortController()
    setLoadError(false)
    void getPuzzle(seed, levelId, controller.signal)
      .then((next) => {
        setPuzzle(next)
        resetState(next)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [levelId, resetState, seed])

  useEffect(() => {
    setShellBar({
      leading: (
        <button
          type="button"
          onClick={onBack}
          data-cuelume-toggle="page"
          className="flex min-h-11 items-center gap-2 rounded-full pr-3 focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-[1.125rem] text-muted-foreground" />
          <strong className="text-sm tracking-[-0.025em]">Crossword</strong>
        </button>
      ),
      trailing: (
        <>
          <button
            type="button"
            onClick={requestHint}
            disabled={!puzzle}
            data-cuelume-toggle="page"
            className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
            aria-label="Hint"
          >
            <Lightbulb className="size-[1.125rem]" />
          </button>
          <button
            type="button"
            onClick={newPuzzle}
            data-cuelume-toggle="page"
            className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="New puzzle"
          >
            <RefreshCw className="size-[1.125rem]" />
          </button>
        </>
      ),
    })
    return () => setShellBar(null)
  }, [newPuzzle, onBack, puzzle, requestHint, setShellBar])

  const activeEntry = useMemo(() => {
    if (!puzzle) return undefined
    if (!selected) return puzzle.entries[0]
    const matches = puzzle.entries.filter((entry) =>
      entry.cells.some((cell) => cell.row === selected.row && cell.col === selected.col),
    )
    return matches.find((entry) => entry.direction === direction) ?? matches[0] ?? puzzle.entries[0]
  }, [direction, puzzle, selected])
  const solved = Boolean(
    puzzle?.entries.every((entry) =>
      entry.cells.every((cell, index) =>
        answersMatch(answers[cellKey(cell.row, cell.col)] ?? '', entry.answer[index] ?? ''),
      ),
    ),
  )
  useEffect(() => {
    const timeout = notice ? window.setTimeout(() => setNotice(null), 2400) : undefined
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, [notice])
  useEffect(() => {
    if (solved) sound.play('success')
  }, [solved, sound])

  const move = useCallback(
    (offset: number) => {
      if (!activeEntry || !selected) return
      const index = activeEntry.cells.findIndex(
        (cell) => cell.row === selected.row && cell.col === selected.col,
      )
      for (
        let next = index + offset;
        next >= 0 && next < activeEntry.cells.length;
        next += offset
      ) {
        const cell = activeEntry.cells[next]
        if (cell && !lockedCells.has(cellKey(cell.row, cell.col))) {
          setSelected(cell)
          break
        }
      }
    },
    [activeEntry, lockedCells, selected],
  )
  const enterLetter = useCallback(
    (letter: string) => {
      if (!activeEntry || !selected) return
      const next = enterAtSelection({
        answers,
        cells: activeEntry.cells,
        letter,
        lockedCells,
        selected,
      })
      setAnswers(next.answers)
      setSelected(next.selected)
      setChecked(false)
      setNotice(null)
      sound.play('tick')
    },
    [activeEntry, answers, lockedCells, selected, sound],
  )
  const erase = useCallback(() => {
    if (!activeEntry || !selected) return
    const next = eraseAtSelection({
      answers,
      cells: activeEntry.cells,
      lockedCells,
      selected,
    })
    setAnswers(next.answers)
    setSelected(next.selected)
    setChecked(false)
    setNotice(null)
    sound.play('tick')
  }, [activeEntry, answers, lockedCells, selected, sound])
  const check = useCallback(() => {
    setChecked(true)
    notify(solved ? 'Puzzle complete!' : 'Some letters are still incorrect.', solved)
    sound.play(solved ? 'success' : 'error')
  }, [notify, solved, sound])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault()
        erase()
      } else if (event.key === 'ArrowLeft') {
        setDirection('across')
        move(-1)
      } else if (event.key === 'ArrowRight') {
        setDirection('across')
        move(1)
      } else if (event.key === 'ArrowUp') {
        setDirection('down')
        move(-1)
      } else if (event.key === 'ArrowDown') {
        setDirection('down')
        move(1)
      } else if (/^\p{L}$/u.test(event.key)) enterLetter(event.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enterLetter, erase, move])

  if (loadError)
    return (
      <section className="grid min-h-[70dvh] place-items-center text-center">
        <div>
          <h1 className="text-lg font-semibold">Puzzle unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">The dictionary could not be loaded.</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground"
            onClick={newPuzzle}
          >
            Try again
          </button>
        </div>
      </section>
    )
  if (!puzzle || !activeEntry)
    return (
      <div className="grid min-h-[70dvh] place-items-center text-sm text-muted-foreground">
        Generating a new puzzle…
      </div>
    )

  const currentIndex = puzzle.entries.indexOf(activeEntry)
  const selectEntry = (index: number) => {
    const entry = puzzle.entries[index]
    if (!entry) return
    setDirection(entry.direction)
    setSelected(entry.cells[0] ?? null)
  }
  const selectCell = (cell: Cell) => {
    if (selected?.row === cell.row && selected.col === cell.col) {
      const alternate = puzzle.entries.find(
        (entry) =>
          entry.direction !== direction &&
          entry.cells.some((item) => item.row === cell.row && item.col === cell.col),
      )
      if (alternate) setDirection(alternate.direction)
    } else {
      const entry = puzzle.entries.find((item) =>
        item.cells.some((candidate) => candidate.row === cell.row && candidate.col === cell.col),
      )
      if (entry) setDirection(entry.direction)
    }
    setSelected(cell)
  }
  const gridStyle = {
    aspectRatio: `${puzzle.width} / ${puzzle.height}`,
    gridTemplateColumns: `repeat(${puzzle.width}, minmax(0, 1fr))`,
  }

  return (
    <section className="relative flex min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col gap-2 pb-2">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          className="grid w-full max-w-[min(100%,32rem,55dvh)] gap-px border-2 border-zinc-950 bg-zinc-500 dark:border-zinc-500"
          style={gridStyle}
          aria-label="Crossword grid"
        >
          {puzzle.grid.flatMap((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const key = cellKey(rowIndex, colIndex)
              if (!cell)
                return <span className="aspect-square bg-zinc-950 dark:bg-black" key={key} />
              const isSelected = selected?.row === rowIndex && selected.col === colIndex
              const active = activeEntry.cells.some(
                (item) => item.row === rowIndex && item.col === colIndex,
              )
              const wrong =
                checked && answers[key] && !answersMatch(answers[key] ?? '', cell.solution)
              const locked = lockedCells.has(key)
              const tone = wrong
                ? 'bg-game-negative text-game-negative-foreground'
                : isSelected
                  ? 'bg-game-focus text-game-focus-foreground ring-2 ring-game-focus ring-inset'
                  : active
                    ? 'bg-game-active text-game-active-foreground'
                    : locked
                      ? 'bg-game-positive text-game-positive-foreground'
                      : 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white'
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => selectCell({ row: rowIndex, col: colIndex })}
                  className={[
                    'relative grid aspect-square place-items-center p-0 text-[clamp(.65rem,4vw,1.35rem)] font-semibold',
                    isSelected && 'z-10',
                    tone,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}`}
                  aria-current={isSelected ? 'true' : undefined}
                >
                  {cell.number ? (
                    <span className="absolute top-px left-0.5 text-[clamp(.35rem,1.5vw,.55rem)] leading-none">
                      {cell.number}
                    </span>
                  ) : null}
                  {answers[key] ?? ''}
                  {locked ? (
                    <LockKeyhole className="absolute right-px bottom-px size-2.5 opacity-60" />
                  ) : null}
                </button>
              )
            }),
          )}
        </div>
      </div>

      <output className="min-h-5 text-center text-xs font-medium" aria-live="polite">
        {notice?.message ?? ''}
      </output>
      <div className="grid min-h-20 grid-cols-[2.75rem_1fr_2.75rem] items-center rounded-xl bg-muted">
        <button
          type="button"
          className="grid size-11 place-items-center"
          onClick={() =>
            selectEntry((currentIndex - 1 + puzzle.entries.length) % puzzle.entries.length)
          }
          aria-label="Previous clue"
        >
          <ChevronLeft />
        </button>
        <div className="px-1 text-center">
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {activeEntry.number} {activeEntry.direction} · {activeEntry.displayLength}
          </p>
          <p className="line-clamp-2 text-sm leading-5">{activeEntry.clue}</p>
          {areAllCellsLocked(activeEntry.cells, lockedCells) ? (
            <p className="truncate text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {activeEntry.word}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center"
          onClick={() => selectEntry((currentIndex + 1) % puzzle.entries.length)}
          aria-label="Next clue"
        >
          <ChevronRight />
        </button>
      </div>
      <VirtualKeyboard
        onKey={(key) => {
          if (key === 'BACKSPACE') erase()
          else if (key === 'CHECK') check()
          else enterLetter(key)
        }}
        leadingAction={checkAction}
        trailingAction={deleteAction}
      />

      {solved ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-xl">
            <Trophy className="mx-auto size-10 text-amber-500" />
            <h2 className="mt-3 text-2xl font-bold">Puzzle complete!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {puzzle.entries.length} Vietnamese words · {levelById(levelId).label}
            </p>
            <button
              type="button"
              onClick={newPuzzle}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground"
            >
              New puzzle
            </button>
            <button
              type="button"
              onClick={onBack}
              className="mt-2 w-full rounded-lg border px-4 py-3 font-semibold"
            >
              Back to levels
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default function CrosswordScreen() {
  const [levelId, setLevelId] = useState<LevelId | null>(null)
  return levelId ? (
    <CrosswordGame levelId={levelId} onBack={() => setLevelId(null)} />
  ) : (
    <LevelSelector onSelect={setLevelId} />
  )
}
