const CODE_PREFIX = 'ING-'
const CODE_PAD_LENGTH = 6

/**
 * Formats a sequential number into an internal ingredient code.
 * Example: 1 → ING-000001
 */
export function formatIngredientCode(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Sequência de código de ingrediente inválida.')
  }

  return `${CODE_PREFIX}${String(sequence).padStart(CODE_PAD_LENGTH, '0')}`
}

/**
 * Extracts the numeric sequence from an ingredient code.
 */
export function parseIngredientCodeSequence(code: string): number {
  const match = /^ING-(\d+)$/.exec(code)
  if (!match?.[1]) {
    return 0
  }

  return Number.parseInt(match[1], 10)
}

export function getNextIngredientCode(existingCodes: readonly string[]): string {
  const maxSequence = existingCodes.reduce((max, code) => {
    const sequence = parseIngredientCodeSequence(code)
    return sequence > max ? sequence : max
  }, 0)

  return formatIngredientCode(maxSequence + 1)
}
