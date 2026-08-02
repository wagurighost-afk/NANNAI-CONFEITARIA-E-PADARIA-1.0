import { useMemo, useState } from 'react'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import type {
  RecipeRoundingMode,
  RecipeScalingBasis,
  RecipeScalingViewMode,
} from '@/features/recipes/types/recipeScaling.types'
import {
  formatScalingFactor,
  getRecipeScalingBases,
  getScalingFactor,
  isBasisAvailable,
  scaleIngredients,
  scaleParsedSheet,
  scaleWeightLabel,
  scaleYieldLabel,
} from '@/features/recipes/utils/scaleRecipe'
import type { ParsedRecipeSheet } from '@/features/recipes/utils/parseRecipeFromSheet'
import type { ScaledSheetSection } from '@/features/recipes/utils/scaleRecipe'

const ROUNDING_STORAGE_KEY = 'nannai-recipe-scaling-rounding'

function readStoredRounding(): RecipeRoundingMode {
  if (typeof window === 'undefined') {
    return 'decimal1'
  }
  const stored = window.localStorage.getItem(ROUNDING_STORAGE_KEY)
  const allowed: RecipeRoundingMode[] = ['none', 'integer', 'decimal1', 'decimal2', 'ceil', 'floor']
  return allowed.includes(stored as RecipeRoundingMode) ? (stored as RecipeRoundingMode) : 'decimal1'
}

function pickDefaultBasis(bases: ReturnType<typeof getRecipeScalingBases>): RecipeScalingBasis {
  if (bases.quantity !== null) {
    return 'quantity'
  }
  if (bases.weight !== null) {
    return 'weight'
  }
  if (bases.portions !== null) {
    return 'portions'
  }
  return 'quantity'
}

export function useRecipeScaling(recipe: Recipe, parsedSheet: ParsedRecipeSheet | null) {
  const bases = useMemo(() => getRecipeScalingBases(recipe), [recipe])

  const [viewMode, setViewMode] = useState<RecipeScalingViewMode>('readonly')
  const [basis, setBasis] = useState<RecipeScalingBasis>(() => pickDefaultBasis(bases))
  const [targetInput, setTargetInput] = useState('')
  const [rounding, setRoundingState] = useState<RecipeRoundingMode>(readStoredRounding)

  const effectiveBasis = isBasisAvailable(basis, bases) ? basis : pickDefaultBasis(bases)

  const factor = useMemo(() => {
    if (viewMode === 'readonly') {
      return 1
    }
    return getScalingFactor(effectiveBasis, bases, targetInput) ?? 1
  }, [viewMode, effectiveBasis, bases, targetInput])

  const isScalingActive = viewMode === 'calculation' && factor !== 1

  const scaledIngredients = useMemo(
    () => (isScalingActive ? scaleIngredients(recipe.ingredients, factor, rounding) : recipe.ingredients),
    [factor, isScalingActive, recipe.ingredients, rounding],
  )

  const scaledSheet = useMemo(() => {
    if (!parsedSheet) {
      return null
    }
    return isScalingActive ? scaleParsedSheet(parsedSheet, factor, rounding) : null
  }, [factor, isScalingActive, parsedSheet, rounding])

  const scaledYieldLabel = useMemo(() => {
    if (!isScalingActive) {
      return recipe.yield?.trim() || '—'
    }
    if (effectiveBasis === 'quantity') {
      return scaleYieldLabel(recipe.yield, factor, rounding, targetInput)
    }
    return scaleYieldLabel(recipe.yield, factor, rounding)
  }, [effectiveBasis, factor, isScalingActive, recipe.yield, rounding, targetInput])

  const scaledWeightLabel = useMemo(() => {
    const original = recipe.finalWeight?.trim() || '—'
    if (!isScalingActive || original === '—') {
      return original
    }
    if (effectiveBasis === 'weight') {
      return scaleWeightLabel(recipe.finalWeight, factor, rounding, targetInput) ?? original
    }
    return scaleWeightLabel(recipe.finalWeight, factor, rounding) ?? original
  }, [effectiveBasis, factor, isScalingActive, recipe.finalWeight, rounding, targetInput])

  const factorLabel = isScalingActive ? formatScalingFactor(factor) : null

  const setRounding = (value: RecipeRoundingMode) => {
    setRoundingState(value)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ROUNDING_STORAGE_KEY, value)
    }
  }

  const resetScaling = () => {
    setTargetInput('')
    setViewMode('readonly')
  }

  return {
    viewMode,
    setViewMode,
    basis: effectiveBasis,
    setBasis,
    targetInput,
    setTargetInput,
    rounding,
    setRounding,
    bases,
    factor,
    factorLabel,
    isScalingActive,
    scaledIngredients,
    scaledSheet,
    scaledYieldLabel,
    scaledWeightLabel,
    resetScaling,
    isBasisAvailable: (value: RecipeScalingBasis) => isBasisAvailable(value, bases),
  }
}

export type { ScaledSheetSection }
