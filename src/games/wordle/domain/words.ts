import rawWords4 from '../data/raw-words-4.json' with { type: 'json' }
import rawWords5 from '../data/raw-words-5.json' with { type: 'json' }
import rawWords6 from '../data/raw-words-6.json' with { type: 'json' }
import rawWords7 from '../data/raw-words-7.json' with { type: 'json' }
import words4 from '../data/words-4.json' with { type: 'json' }
import words5 from '../data/words-5.json' with { type: 'json' }
import words6 from '../data/words-6.json' with { type: 'json' }
import words7 from '../data/words-7.json' with { type: 'json' }
import type { WordLength } from './wordle'

type WordEntry = { definition: string; word: string }

const entriesByLength: Record<WordLength, WordEntry[]> = {
  4: words4,
  5: words5,
  6: words6,
  7: words7,
}

const acceptedByLength: Record<WordLength, string[]> = {
  4: rawWords4.map((word) => word.toUpperCase()),
  5: rawWords5.map((word) => word.toUpperCase()),
  6: rawWords6.map((word) => word.toUpperCase()),
  7: rawWords7.map((word) => word.toUpperCase()),
}

export function entriesFor(length: WordLength) {
  return entriesByLength[length].map((entry) => ({
    definition: entry.definition,
    word: entry.word.toUpperCase(),
  }))
}

export function acceptedGuessesFor(length: WordLength) {
  return acceptedByLength[length]
}
