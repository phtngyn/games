import { describe, expect, it } from 'vitest'

import { soundForKey, soundForOutcome, wordleRowAnimation } from './feedback'

describe('Wordle feedback', () => {
  it('maps every game interaction to the shared app sound palette', () => {
    expect(soundForKey('A')).toBe('tick')
    expect(soundForKey('BACKSPACE')).toBe('tick')
    expect(soundForKey('ENTER')).toBe('release')
    expect(soundForOutcome('invalid')).toBe('error')
    expect(soundForOutcome('won')).toBe('success')
    expect(soundForOutcome('lost')).toBe('error')
  })

  it('animates only the active invalid row and newly submitted rows', () => {
    expect(wordleRowAnimation({ active: true, invalid: true, submitted: false })).toBe(
      'animate-wordle-shake',
    )
    expect(wordleRowAnimation({ active: false, invalid: true, submitted: false })).toBe('')
    expect(wordleRowAnimation({ active: false, invalid: false, submitted: true })).toBe(
      'animate-wordle-reveal',
    )
  })
})
