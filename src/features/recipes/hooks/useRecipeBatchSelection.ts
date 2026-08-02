import { useCallback, useMemo, useState } from 'react'
import type { Recipe } from '@/features/recipes/types/recipe.types'

export function useRecipeBatchSelection(recipes: Recipe[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState(false)

  const toggleRecipe = useCallback((recipeId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(recipeId)) {
        next.delete(recipeId)
      } else {
        next.add(recipeId)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(recipes.filter((recipe) => recipe.status === 'Ativa').map((recipe) => recipe.id)))
  }, [recipes])

  const selectedRecipes = useMemo(
    () => recipes.filter((recipe) => selectedIds.has(recipe.id)),
    [recipes, selectedIds],
  )

  const isSelected = useCallback((recipeId: string) => selectedIds.has(recipeId), [selectedIds])

  return {
    selectionMode,
    setSelectionMode,
    selectedIds,
    selectedRecipes,
    selectedCount: selectedIds.size,
    toggleRecipe,
    clearSelection,
    selectAllVisible,
    isSelected,
  }
}
