import type {
  ParsedRecipeSheet,
  RecipeSheetIngredient,
  RecipeSheetSection,
} from '@/features/recipes/utils/parseRecipeFromSheet'
import type { Recipe, RecipeIngredient } from '@/features/recipes/types/recipe.types'
import type {
  RecipeRoundingMode,
  RecipeScalingBases,
  RecipeScalingBasis,
} from '@/features/recipes/types/recipeScaling.types'
import {
  parseFinalWeight,
  parseLocalizedNumber,
  parsePortionsFromYield,
  parseQuantityString,
  parseYieldQuantity,
} from '@/features/recipes/utils/parseRecipeMeasure'

export function applyRounding(value: number, mode: RecipeRoundingMode): number {
  switch (mode) {
    case 'integer':
      return Math.round(value)
    case 'decimal1':
      return Math.round(value * 10) / 10
    case 'decimal2':
      return Math.round(value * 100) / 100
    case 'ceil':
      return Math.ceil(value * 100) / 100
    case 'floor':
      return Math.floor(value * 100) / 100
    case 'none':
    default:
      return value
  }
}

export function formatScaledNumber(value: number, mode: RecipeRoundingMode): string {
  const rounded = applyRounding(value, mode)

  if (mode === 'integer') {
    return rounded.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }

  if (mode === 'decimal1') {
    return rounded.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
  }

  if (mode === 'decimal2' || mode === 'ceil' || mode === 'floor') {
    return rounded.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const fixed = rounded.toFixed(4).replace(/\.?0+$/, '')
  return fixed.replace('.', ',')
}

export function getRecipeScalingBases(recipe: Recipe): RecipeScalingBases {
  const yieldParsed = parseYieldQuantity(recipe.yield)
  const weightParsed = parseFinalWeight(recipe.finalWeight)
  const portions = parsePortionsFromYield(recipe.yield)

  return {
    quantity: yieldParsed?.value ?? null,
    quantityLabel: yieldParsed ? `${yieldParsed.value} ${yieldParsed.suffix}` : recipe.yield || '—',
    weight: weightParsed?.value ?? null,
    weightLabel: weightParsed ? `${weightParsed.value} ${weightParsed.suffix}` : recipe.finalWeight?.trim() || '—',
    portions,
    portionsLabel: portions !== null ? `${portions} porções` : '—',
  }
}

export function getScalingFactor(
  basis: RecipeScalingBasis,
  bases: RecipeScalingBases,
  targetInput: string,
): number | null {
  const target = parseLocalizedNumber(targetInput)
  if (target === null || target <= 0) {
    return null
  }

  const baseValue =
    basis === 'quantity' ? bases.quantity : basis === 'weight' ? bases.weight : bases.portions

  if (baseValue === null || baseValue <= 0) {
    return null
  }

  return target / baseValue
}

export function scaleIngredientQuantity(
  quantity: number,
  factor: number,
  rounding: RecipeRoundingMode,
): number {
  return applyRounding(quantity * factor, rounding)
}

export function scaleIngredients(
  ingredients: RecipeIngredient[],
  factor: number,
  rounding: RecipeRoundingMode,
): RecipeIngredient[] {
  if (factor === 1) {
    return ingredients
  }

  return ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: scaleIngredientQuantity(ingredient.quantity, factor, rounding),
  }))
}

export function scaleQuantityLabel(
  original: string,
  factor: number,
  rounding: RecipeRoundingMode,
): string {
  if (factor === 1) {
    return original
  }

  const parsed = parseQuantityString(original)
  if (!parsed) {
    return original
  }

  const scaled = scaleIngredientQuantity(parsed.number, factor, rounding)
  return `${parsed.prefix}${formatScaledNumber(scaled, rounding)}${parsed.suffix}`.trim()
}

export function scaleYieldLabel(
  yieldText: string,
  factor: number,
  rounding: RecipeRoundingMode,
  targetInput?: string,
): string {
  if (factor === 1) {
    return yieldText
  }

  const target = targetInput ? parseLocalizedNumber(targetInput) : null
  const parsed = parseYieldQuantity(yieldText)
  if (!parsed) {
    return yieldText
  }

  const scaledValue = target ?? scaleIngredientQuantity(parsed.value, factor, rounding)
  return `${formatScaledNumber(scaledValue, rounding)} ${parsed.suffix}`.trim()
}

export function scaleWeightLabel(
  weightText: string | undefined,
  factor: number,
  rounding: RecipeRoundingMode,
  targetInput?: string,
): string | undefined {
  if (!weightText?.trim()) {
    return weightText
  }

  if (factor === 1) {
    return weightText
  }

  const target = targetInput ? parseLocalizedNumber(targetInput) : null
  const parsed = parseFinalWeight(weightText)
  if (!parsed) {
    return weightText
  }

  const scaledValue = target ?? scaleIngredientQuantity(parsed.value, factor, rounding)
  return `${formatScaledNumber(scaledValue, rounding)} ${parsed.suffix}`.trim()
}

function findBaseScaleLabel(scaleLabels: string[]): string | null {
  if (scaleLabels.length === 0) {
    return null
  }

  const x1 = scaleLabels.find((label) => /^x\s*1([.,]0+)?$/i.test(label.trim()))
  return x1 ?? scaleLabels[0] ?? null
}

export interface ScaledSheetIngredient extends RecipeSheetIngredient {
  scaledValue: string | null
  baseLabel: string | null
}

export interface ScaledSheetSection extends Omit<RecipeSheetSection, 'items'> {
  items: ScaledSheetIngredient[]
  activeScaleLabel: string | null
}

export function scaleParsedSheet(
  parsedSheet: ParsedRecipeSheet,
  factor: number,
  rounding: RecipeRoundingMode,
): ParsedRecipeSheet & { sections: ScaledSheetSection[] } {
  if (factor === 1) {
    return {
      ...parsedSheet,
      sections: parsedSheet.sections.map((section) => ({
        ...section,
        activeScaleLabel: findBaseScaleLabel(section.scaleLabels),
        items: section.items.map((item) => ({
          ...item,
          scaledValue: null,
          baseLabel: findBaseScaleLabel(section.scaleLabels),
        })),
      })),
    }
  }

  return {
    ...parsedSheet,
    sections: parsedSheet.sections.map((section) => scaleParsedSection(section, factor, rounding)),
  }
}

function scaleParsedSection(
  section: RecipeSheetSection,
  factor: number,
  rounding: RecipeRoundingMode,
): ScaledSheetSection {
  const baseLabel = findBaseScaleLabel(section.scaleLabels)

  return {
    ...section,
    activeScaleLabel: baseLabel,
    items: section.items.map((item) => {
      const baseQuantity = baseLabel
        ? item.quantities.find((entry) => entry.label.trim().toLowerCase() === baseLabel.trim().toLowerCase())
        : item.quantities[0]

      if (!baseQuantity?.value) {
        return { ...item, scaledValue: null, baseLabel }
      }

      const parsed = parseQuantityString(baseQuantity.value)
      if (!parsed) {
        return { ...item, scaledValue: scaleQuantityLabel(baseQuantity.value, factor, rounding), baseLabel }
      }

      const scaled = scaleIngredientQuantity(parsed.number, factor, rounding)
      const scaledValue = `${parsed.prefix}${formatScaledNumber(scaled, rounding)}${parsed.suffix}`.trim()
      return { ...item, scaledValue, baseLabel }
    }),
  }
}

export function formatScalingFactor(factor: number): string {
  return `×${formatScaledNumber(factor, 'decimal2')}`
}

export function isBasisAvailable(basis: RecipeScalingBasis, bases: RecipeScalingBases): boolean {
  if (basis === 'quantity') {
    return bases.quantity !== null
  }
  if (basis === 'weight') {
    return bases.weight !== null
  }
  return bases.portions !== null
}
