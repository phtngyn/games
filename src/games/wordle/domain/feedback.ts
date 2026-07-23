export type WordleOutcome = 'invalid' | 'lost' | 'won'

export function soundForKey(key: string) {
  return key === 'ENTER' ? ('release' as const) : ('tick' as const)
}

export function soundForOutcome(outcome: WordleOutcome) {
  return outcome === 'won' ? ('success' as const) : ('error' as const)
}

export function wordleRowAnimation({
  active,
  invalid,
  submitted,
}: {
  active: boolean
  invalid: boolean
  submitted: boolean
}) {
  if (active && invalid) return 'animate-wordle-shake'
  if (submitted) return 'animate-wordle-reveal'
  return ''
}
