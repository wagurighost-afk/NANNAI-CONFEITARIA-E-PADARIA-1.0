const CODE_PREFIX = 'PRD'
const CODE_PAD = 6

export function formatProductionCode(sequence: number): string {
  return `${CODE_PREFIX}-${String(sequence).padStart(CODE_PAD, '0')}`
}

export function getNextProductionCode(existingCodes: readonly string[]): string {
  const max = existingCodes.reduce((acc, code) => {
    const match = code.match(/PRD-(\d+)/)
    if (!match?.[1]) {
      return acc
    }
    return Math.max(acc, Number.parseInt(match[1], 10))
  }, 0)

  return formatProductionCode(max + 1)
}
