import { ArrowLeft, Delete, Lightbulb, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'

import { useShellBar } from '@/app/shell/shell-bar-context'
import { soundForKey, soundForOutcome, wordleRowAnimation } from '@/games/wordle/domain/feedback'
import {
  keyboardStates,
  MAX_GUESSES,
  scoreGuess,
  WORD_LENGTHS,
  type LetterState,
  type WordLength,
} from '@/games/wordle/domain/wordle'
import { acceptedGuessesFor, entriesFor } from '@/games/wordle/domain/words'
import { useSound } from '@/platform/audio/sound-context'
import { VirtualKeyboard, type VirtualKeyboardAction, type VirtualKeyTone } from '@/ui/game'

type GameState = 'lost' | 'playing' | 'won'
const boardColumns: Record<WordLength, string> = {
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
}
const enterAction: VirtualKeyboardAction = { value: 'ENTER', label: 'Enter' }
const deleteAction: VirtualKeyboardAction = {
  value: 'BACKSPACE',
  label: <Delete className="size-5" />,
  accessibleLabel: 'Delete letter',
}

function randomIndex(length: number, except?: number) {
  if (length < 2) return 0
  let next = Math.floor(Math.random() * length)
  while (next === except) next = Math.floor(Math.random() * length)
  return next
}

function LengthSelector({ onSelect }: { onSelect: (length: WordLength) => void }) {
  const selectLength = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const length = Number(event.currentTarget.value)
      const selected = WORD_LENGTHS.find((candidate) => candidate === length)
      if (selected) onSelect(selected)
    },
    [onSelect],
  )

  return (
    <section className="grid min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] place-items-center py-8">
      <div className="w-full">
        <div className="mb-10">
          <h1 className="text-5xl leading-none font-black tracking-[-0.065em]">Wordle</h1>
          <p className="mt-3 text-sm text-muted-foreground">Six tries. One word.</p>
        </div>
        <p className="mb-2.5 text-xs font-medium text-muted-foreground">Word length</p>
        <div className="grid grid-cols-2 gap-2.5" aria-label="Choose word length">
          {WORD_LENGTHS.map((length) => (
            <button
              key={length}
              type="button"
              value={length}
              onClick={selectLength}
              data-cuelume-toggle="page"
              data-cuelume-hover="tick"
              className="group flex min-h-20 items-center justify-between rounded-xl border bg-card p-4 text-left transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="text-2xl font-bold tracking-tight">{length}</span>
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

function Board({
  answer,
  currentGuess,
  guesses,
  invalidAttempt,
  wordLength,
}: {
  answer: string
  currentGuess: string
  guesses: string[]
  invalidAttempt: number
  wordLength: WordLength
}) {
  return (
    <div
      className="grid w-full max-w-[min(100%,22.5rem,62dvh)] grid-rows-6 gap-1.5"
      aria-label="Word grid"
    >
      {Array.from({ length: MAX_GUESSES }, (unusedRow, rowIndex) => {
        const submitted = guesses[rowIndex]
        const word = submitted ?? (rowIndex === guesses.length ? currentGuess : '')
        const states = submitted ? scoreGuess(submitted, answer) : []

        return (
          <div
            key={`${rowIndex}-${rowIndex === guesses.length ? invalidAttempt : 0}`}
            className={`grid gap-1.5 ${boardColumns[wordLength]} ${wordleRowAnimation({
              active: rowIndex === guesses.length,
              invalid: invalidAttempt > 0,
              submitted: Boolean(submitted),
            })}`}
          >
            {Array.from({ length: wordLength }, (unusedColumn, columnIndex) => {
              const letter = word[columnIndex] ?? ''
              const state = states[columnIndex]
              const tone =
                state === 'correct'
                  ? 'border-game-positive bg-game-positive text-game-positive-foreground'
                  : state === 'present'
                    ? 'border-game-warning bg-game-warning text-game-warning-foreground'
                    : state === 'absent'
                      ? 'border-game-muted bg-game-muted text-game-muted-foreground'
                      : letter
                        ? 'scale-[1.025] border-foreground/30 bg-card'
                        : 'border-border bg-card'

              return (
                <div
                  key={columnIndex}
                  className={`grid aspect-square place-items-center rounded-md border-2 text-[clamp(1.1rem,6vw,1.8rem)] font-bold transition-all ${tone}`}
                  aria-label={letter ? `${letter}${state ? `, ${state}` : ''}` : 'empty'}
                >
                  {letter}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function WordleGame({ onBack, wordLength }: { onBack: () => void; wordLength: WordLength }) {
  const entries = useMemo(() => entriesFor(wordLength), [wordLength])
  const validWords = useMemo(() => new Set(acceptedGuessesFor(wordLength)), [wordLength])
  const [answerIndex, setAnswerIndex] = useState(() => randomIndex(entries.length))
  const answer = entries[answerIndex]?.word ?? ''
  const definition = entries[answerIndex]?.definition ?? ''
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameState, setGameState] = useState<GameState>('playing')
  const [message, setMessage] = useState('')
  const [invalidAttempt, setInvalidAttempt] = useState(0)
  const [hintState, setHintState] = useState<'confirming' | 'idle' | 'revealed'>('idle')
  const setShellBar = useShellBar()
  const sound = useSound()

  const newGame = useCallback(() => {
    setAnswerIndex((current) => randomIndex(entries.length, current))
    setGuesses([])
    setCurrentGuess('')
    setGameState('playing')
    setMessage('')
    setInvalidAttempt(0)
    setHintState('idle')
  }, [entries.length])
  const requestHint = useCallback(
    () => setHintState((state) => (state === 'idle' ? 'confirming' : 'revealed')),
    [],
  )

  const handleKey = useCallback(
    (key: string) => {
      if (gameState !== 'playing') return
      sound.play(soundForKey(key))
      if (key === 'BACKSPACE') {
        setCurrentGuess((guess) => guess.slice(0, -1))
        return
      }
      if (key === 'ENTER') {
        if (currentGuess.length !== wordLength) {
          setMessage('Not enough letters')
          setInvalidAttempt((attempt) => attempt + 1)
          sound.play(soundForOutcome('invalid'))
          return
        }
        if (!validWords.has(currentGuess)) {
          setMessage('Not in word list')
          setInvalidAttempt((attempt) => attempt + 1)
          sound.play(soundForOutcome('invalid'))
          return
        }
        const nextGuesses = [...guesses, currentGuess]
        const won = currentGuess === answer
        setInvalidAttempt(0)
        setGuesses(nextGuesses)
        setCurrentGuess('')
        if (won || nextGuesses.length === MAX_GUESSES) {
          const nextState: GameState = won ? 'won' : 'lost'
          setGameState(nextState)
          setMessage(won ? (nextGuesses.length <= 2 ? 'Brilliant!' : 'Splendid!') : answer)
          sound.play(soundForOutcome(nextState))
        }
        return
      }
      if (/^[A-Z]$/.test(key)) {
        setMessage('')
        setCurrentGuess((guess) => (guess.length < wordLength ? `${guess}${key}` : guess))
      }
    },
    [answer, currentGuess, gameState, guesses, sound, validWords, wordLength],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase()
      if (/^[A-Z]$/.test(key) || key === 'ENTER' || key === 'BACKSPACE') {
        event.preventDefault()
        handleKey(key)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKey])

  const tones = useMemo(() => {
    const toneForState: Record<LetterState, VirtualKeyTone> = {
      absent: 'muted',
      correct: 'positive',
      present: 'warning',
    }
    return Object.fromEntries(
      Object.entries(keyboardStates(guesses, answer)).map(([letter, state]) => [
        letter,
        toneForState[state],
      ]),
    )
  }, [answer, guesses])

  const shellBar = useMemo(
    () => ({
      leading: (
        <button
          type="button"
          onClick={onBack}
          data-cuelume-toggle="page"
          className="flex min-h-11 items-center gap-2 rounded-full pr-3 focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft className="size-[1.125rem] text-muted-foreground" />
          <strong className="text-sm tracking-[-0.025em]">Wordle</strong>
        </button>
      ),
      trailing: (
        <button
          type="button"
          onClick={newGame}
          data-cuelume-toggle="page"
          className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          aria-label="New game"
        >
          <RefreshCw className="size-4" />
        </button>
      ),
    }),
    [newGame, onBack],
  )

  useEffect(() => {
    setShellBar(shellBar)
    return () => setShellBar(null)
  }, [setShellBar, shellBar])

  return (
    <section className="relative flex min-h-[calc(100dvh-3.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-between gap-2 pt-6 pb-2">
        {message && (
          <output className="absolute top-1 z-20 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-md">
            {message}
          </output>
        )}
        <Board
          answer={answer}
          currentGuess={currentGuess}
          guesses={guesses}
          invalidAttempt={invalidAttempt}
          wordLength={wordLength}
        />
        <div className="flex min-h-10 items-center justify-center px-2 text-center">
          {hintState === 'revealed' ? (
            <p className="text-sm leading-5 text-muted-foreground">
              <strong className="text-foreground">A clue:</strong> {definition}
            </p>
          ) : (
            <button
              type="button"
              onClick={requestHint}
              className="flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <Lightbulb className="size-4" />
              {hintState === 'confirming' ? 'Reveal hint' : 'Hint'}
            </button>
          )}
        </div>
        <VirtualKeyboard
          onKey={handleKey}
          tones={tones}
          leadingAction={enterAction}
          trailingAction={deleteAction}
        />
      </div>
    </section>
  )
}

export default function WordleScreen() {
  const [wordLength, setWordLength] = useState<WordLength | null>(null)
  const backToLengths = useCallback(() => setWordLength(null), [])

  return wordLength ? (
    <WordleGame key={wordLength} wordLength={wordLength} onBack={backToLengths} />
  ) : (
    <LengthSelector onSelect={setWordLength} />
  )
}
