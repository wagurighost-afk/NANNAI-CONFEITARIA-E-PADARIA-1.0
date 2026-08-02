import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useRecipeExcelPreview } from '@/features/recipes/hooks/useRecipeExcelPreview'
import { useRecipeWordPreview } from '@/features/recipes/hooks/useRecipeWordPreview'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { parseRecipeFromExcelData } from '@/features/recipes/utils/parseRecipeFromSheet'
import { extractTemperatureFromText, parsePreparationSteps } from '@/features/recipes/utils/parsePreparationSteps'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { popService } from '@/features/pop/services/pop.service'
import type { PopDocument } from '@/features/pop/types/pop.types'

export function useRecipeProductionData(recipe: Recipe) {
  const attachment = recipe.attachments[0] ?? null
  const excelPreview = useRecipeExcelPreview(attachment?.kind === 'excel' ? attachment : null)
  const wordPreview = useRecipeWordPreview(attachment?.kind === 'word' ? attachment : null)

  const popsQuery = useQuery({
    queryKey: ['pop', 'list'],
    queryFn: () => popService.list(),
    staleTime: 5 * 60_000,
  })

  const parsedSheet = useMemo(() => {
    if (attachment?.kind !== 'excel' || !excelPreview.data) {
      return null
    }
    return parseRecipeFromExcelData(excelPreview.data)
  }, [attachment?.kind, excelPreview.data])

  const preparationSteps = useMemo(
    () => parsePreparationSteps(recipe.preparationMethod),
    [recipe.preparationMethod],
  )

  const temperature = useMemo(() => {
    if (recipe.temperature?.trim()) {
      return recipe.temperature.trim()
    }
    if (parsedSheet?.temperature?.trim()) {
      return parsedSheet.temperature.trim()
    }
    return extractTemperatureFromText(recipe.preparationMethod) ?? extractTemperatureFromText(recipe.notes)
  }, [parsedSheet?.temperature, recipe.notes, recipe.preparationMethod, recipe.temperature])

  const relatedPops = useMemo((): PopDocument[] => {
    const all = popsQuery.data ?? []
    const ids = recipe.relatedPopIds ?? []
    if (ids.length === 0) {
      return []
    }
    return all.filter((pop) => ids.includes(pop.id))
  }, [popsQuery.data, recipe.relatedPopIds])

  const isDocumentPrimary = isRecipeDocumentPrimary(recipe)
  const hasStructuredIngredients =
    !isDocumentPrimary && recipe.ingredients.some((item) => item.name.trim().length > 0)
  const hasParsedIngredients = Boolean(parsedSheet && parsedSheet.sections.length > 0)

  return {
    attachment,
    parsedSheet,
    preparationSteps,
    temperature,
    relatedPops,
    isLoadingSheet: attachment?.kind === 'excel' && excelPreview.isLoading,
    sheetError: attachment?.kind === 'excel' ? excelPreview.error : null,
    wordHtml: attachment?.kind === 'word' ? wordPreview.data?.html : null,
    isLoadingWord: attachment?.kind === 'word' && wordPreview.isLoading,
    hasStructuredIngredients,
    hasParsedIngredients,
    isDocumentPrimary,
  }
}
