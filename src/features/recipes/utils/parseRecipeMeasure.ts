const NUMBER_PATTERN = /(\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?)/

function normalizeNumberToken(token: string): number | null {
  const trimmed = token.trim()
  if (!trimmed) {
    return null
  }

  let normalized = trimmed
  if (normalized.includes('.') && normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  } else if (normalized.includes(',')) {
    normalized = normalized.replace(',', '.')
  }

  const value = Number(normalized)
  return Number.isFinite(value) && value > 0 ? value : null
}

/** Extrai o primeiro número positivo de um texto com formatação brasileira. */
export function parseLocalizedNumber(value: string): number | null {
  const match = value.trim().match(NUMBER_PATTERN)
  if (!match?.[1]) {
    return null
  }
  return normalizeNumberToken(match[1])
}

export function extractTextSuffix(value: string): string {
  const match = value.trim().match(NUMBER_PATTERN)
  if (!match || match.index === undefined) {
    return value.trim()
  }
  return value.slice(match.index + match[0].length).trim()
}

export function parseYieldQuantity(yieldText: string): { value: number; suffix: string } | null {
  const trimmed = yieldText.trim()
  if (!trimmed) {
    return null
  }

  const value = parseLocalizedNumber(trimmed)
  if (value === null) {
    return null
  }

  const suffix = extractTextSuffix(trimmed) || 'unidades'
  return { value, suffix }
}

export function parseFinalWeight(weightText: string | undefined): { value: number; suffix: string } | null {
  const trimmed = weightText?.trim()
  if (!trimmed) {
    return null
  }

  const value = parseLocalizedNumber(trimmed)
  if (value === null) {
    return null
  }

  const suffix = extractTextSuffix(trimmed) || 'g'
  return { value, suffix }
}

export function parsePortionsFromYield(yieldText: string): number | null {
  const trimmed = yieldText.trim()
  if (!trimmed) {
    return null
  }

  const portionMatch = trimmed.match(/(\d+(?:,\d+)?)\s*porç(?:ão|ões)?/i)
  if (portionMatch?.[1]) {
    return normalizeNumberToken(portionMatch[1])
  }

  return parseLocalizedNumber(trimmed)
}

export interface ParsedQuantityString {
  number: number
  prefix: string
  suffix: string
}

/** Separa número e texto em valores como "500 g" ou "1,5 kg". */
export function parseQuantityString(value: string): ParsedQuantityString | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = trimmed.match(NUMBER_PATTERN)
  if (!match?.[1] || match.index === undefined) {
    return null
  }

  const number = normalizeNumberToken(match[1])
  if (number === null) {
    return null
  }

  return {
    number,
    prefix: trimmed.slice(0, match.index),
    suffix: trimmed.slice(match.index + match[0].length),
  }
}
