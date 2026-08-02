/** Extrai temperatura de texto livre (ex.: "180°C", "350 graus"). */
export function extractTemperatureFromText(text: string): string | null {
  const match =
    text.match(/\d+\s*°\s*[CcFf]?/i) ??
    text.match(/\d+\s*graus?(?:\s+celsius)?/i) ??
    text.match(/temperatura\s*:\s*([^\n]+)/i)

  if (!match) {
    return null
  }

  return (match[1] ?? match[0]).trim()
}

/** Divide modo de preparo em etapas numeradas, parágrafos ou linhas. */
export function parsePreparationSteps(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  const numbered = trimmed.split(/\n(?=\d+[\.\)]\s)/)
  if (numbered.length > 1) {
    return numbered
      .map((step) => step.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((step) => step.length > 0)
  }

  const paragraphs = trimmed.split(/\n\n+/).map((part) => part.trim()).filter(Boolean)
  if (paragraphs.length > 1) {
    return paragraphs
  }

  const lines = trimmed.split(/\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length > 1) {
    return lines
  }

  return [trimmed]
}
