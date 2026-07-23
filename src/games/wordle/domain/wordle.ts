export const WORD_LENGTHS = [4, 5, 6, 7] as const
export const MAX_GUESSES = 6

export type WordLength = (typeof WORD_LENGTHS)[number]
export type LetterState = 'absent' | 'correct' | 'present'

const priority: Record<LetterState, number> = { absent: 1, present: 2, correct: 3 }

export function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array.from({ length: answer.length }, () => 'absent')
  const remaining = new Map<string, number>()

  for (let index = 0; index < answer.length; index += 1) {
    if (guess[index] === answer[index]) result[index] = 'correct'
    else {
      const letter = answer[index]
      if (letter) remaining.set(letter, (remaining.get(letter) ?? 0) + 1)
    }
  }

  for (let index = 0; index < answer.length; index += 1) {
    const letter = guess[index]
    if (!letter || result[index] === 'correct') continue
    const count = remaining.get(letter) ?? 0
    if (count > 0) {
      result[index] = 'present'
      remaining.set(letter, count - 1)
    }
  }

  return result
}

export function keyboardStates(guesses: string[], answer: string) {
  const states: Record<string, LetterState> = {}
  for (const guess of guesses) {
    scoreGuess(guess, answer).forEach((state, index) => {
      const letter = guess[index]
      const previous = letter ? states[letter] : undefined
      if (letter && (!previous || priority[state] > priority[previous])) states[letter] = state
    })
  }
  return states
}
