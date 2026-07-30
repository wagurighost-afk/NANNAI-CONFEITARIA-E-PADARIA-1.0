const CODE_PREFIX = 'REC'
const CODE_PAD = 6

export function formatRecipeCode(sequence: number): string {
  return `${CODE_PREFIX}-${String(sequence).padStart(CODE_PAD, '0')}`
}

export function getNextRecipeCode(existingCodes: readonly string[]): string {
  const max = existingCodes.reduce((acc, code) => {
    const match = code.match(/REC-(\d+)/)
    if (!match?.[1]) {
      return acc
    }
    return Math.max(acc, Number.parseInt(match[1], 10))
  }, 0)
  return formatRecipeCode(max + 1)
}
