import type { ExcelPreviewData, ExcelSheetPreview } from '@/features/recipes/utils/parseExcelPreview'

export interface RecipeSheetQuantity {
  label: string
  value: string
}

export interface RecipeSheetIngredient {
  name: string
  quantities: RecipeSheetQuantity[]
}

export interface RecipeSheetSection {
  title: string
  scaleLabels: string[]
  items: RecipeSheetIngredient[]
}

export interface ParsedRecipeSheet {
  dish?: string
  chef?: string
  category?: string
  temperature?: string
  sections: RecipeSheetSection[]
}

function sheetToMatrix(sheet: ExcelSheetPreview): string[][] {
  return sheet.rows.map((row) => row.map((cell) => cell.value.trim()))
}

function isScaleLabel(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return /^x\s*\d+([.,]\d+)?$/.test(normalized)
}

function isSectionTitle(row: string[]): string | null {
  const cells = row.filter((cell) => cell.length > 0)
  if (cells.length === 0) {
    return null
  }
  if (cells.length === 1) {
    return cells[0] ?? null
  }
  if (cells.length === 2 && cells[0] && cells[1] && cells[0].length > cells[1].length) {
    return cells[0]
  }
  return null
}

function extractMetadata(line: string): Partial<Pick<ParsedRecipeSheet, 'dish' | 'chef' | 'category' | 'temperature'>> {
  const normalized = line.trim()
  const dishMatch = normalized.match(/^prato\s*:\s*(.+)$/i)
  if (dishMatch?.[1]) {
    return { dish: dishMatch[1].trim() }
  }
  const categoryMatch = normalized.match(/^categoria\s*:\s*(.+)$/i)
  if (categoryMatch?.[1]) {
    return { category: categoryMatch[1].trim() }
  }
  const chefMatch = normalized.match(/^chef\s*:\s*(.+)$/i)
  if (chefMatch?.[1]) {
    return { chef: chefMatch[1].trim() }
  }
  const temperatureMatch = normalized.match(/^temperatura\s*:\s*(.+)$/i)
  if (temperatureMatch?.[1]) {
    return { temperature: temperatureMatch[1].trim() }
  }
  if (/^chef\s+/i.test(normalized)) {
    return { chef: normalized.replace(/^chef\s+/i, '').trim() }
  }
  return {}
}

function findScaleLabels(row: string[]): string[] {
  return row
    .slice(1)
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
}

function isIngredientHeaderRow(row: string[]): boolean {
  const first = row[0]?.trim().toLowerCase() ?? ''
  return first.includes('ingrediente') || row.slice(1).some((cell) => isScaleLabel(cell))
}

function parseIngredientRow(
  row: string[],
  scaleLabels: string[],
): RecipeSheetIngredient | null {
  const name = row[0]?.trim() ?? ''
  if (!name || /^ingrediente/i.test(name)) {
    return null
  }

  const values = row.slice(1).map((cell) => cell.trim())
  const quantities: RecipeSheetQuantity[] = []

  scaleLabels.forEach((label, index) => {
    const value = values[index] ?? ''
    if (value) {
      quantities.push({ label, value })
    }
  })

  if (quantities.length === 0) {
    const fallback = values.find((value) => value.length > 0)
    if (fallback) {
      quantities.push({ label: 'Qtd', value: fallback })
    }
  }

  if (quantities.length === 0) {
    return null
  }

  return { name, quantities }
}

export function parseRecipeFromMatrix(matrix: string[][]): ParsedRecipeSheet {
  const result: ParsedRecipeSheet = { sections: [] }
  let currentSection: RecipeSheetSection | null = null
  let pendingScaleLabels: string[] = []

  for (const row of matrix) {
    const line = row.filter((cell) => cell.length > 0).join(' · ')
    if (line) {
      Object.assign(result, extractMetadata(line))
      for (const cell of row) {
        Object.assign(result, extractMetadata(cell))
      }
    }

    const sectionTitle = isSectionTitle(row)
    if (sectionTitle && !isIngredientHeaderRow(row)) {
      const normalized = sectionTitle.trim()
      if (!/^(prato|chef|categoria)\s*:/i.test(normalized)) {
        currentSection = {
          title: normalized,
          scaleLabels: [],
          items: [],
        }
        result.sections.push(currentSection)
        pendingScaleLabels = []
        continue
      }
    }

    if (isIngredientHeaderRow(row)) {
      pendingScaleLabels = findScaleLabels(row)
      if (currentSection) {
        currentSection.scaleLabels = pendingScaleLabels
      } else {
        currentSection = {
          title: 'Ingredientes',
          scaleLabels: pendingScaleLabels,
          items: [],
        }
        result.sections.push(currentSection)
      }
      continue
    }

    if (!currentSection) {
      continue
    }

    const labels = currentSection.scaleLabels.length > 0 ? currentSection.scaleLabels : pendingScaleLabels
    const ingredient = parseIngredientRow(row, labels)
    if (ingredient) {
      currentSection.items.push(ingredient)
    }
  }

  result.sections = result.sections.filter((section) => section.items.length > 0)

  return result
}

export function parseRecipeFromExcelData(data: ExcelPreviewData): ParsedRecipeSheet {
  const sheet = data.sheets[0]
  if (!sheet) {
    return { sections: [] }
  }
  return parseRecipeFromMatrix(sheetToMatrix(sheet))
}
