import { describe, expect, it } from 'vite-plus/test'

import { answersMatch, normalizeAnswer } from './answer.js'

describe('normalizeAnswer', () => {
  it.each([
    ['Đại Dương', 'DAIDUONG'],
    ['bình minh', 'BINHMINH'],
    ['cầu vồng', 'CAUVONG'],
    ['thư viện', 'THUVIEN'],
    ['quê-hương', 'QUEHUONG'],
    ['ớ, ứ, ệ', 'OUE'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected)
  })

  it('accepts an ASCII answer for a Vietnamese solution', () => {
    expect(answersMatch('DAIDUONG', 'Đại Dương')).toBe(true)
  })

  it('rejects a different base letter', () => {
    expect(answersMatch('DAIDUONG', 'Đại Tướng')).toBe(false)
  })
})
