export function normalizeAnswer(value: string) {
  return value
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .replaceAll(/[Đđ]/g, 'D')
    .toUpperCase()
    .replaceAll(/[^A-Z]/g, '')
}

export function answersMatch(input: string, solution: string) {
  return normalizeAnswer(input) === normalizeAnswer(solution)
}
