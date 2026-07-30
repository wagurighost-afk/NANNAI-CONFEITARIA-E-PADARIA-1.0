import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recipesService } from '@/features/recipes/services/recipes.service'
import { computeRecipeKpis } from '@/features/recipes/utils/computeRecipeKpis'
import type {
  Recipe,
  RecipeFilters,
  RecipeSavePayload,
  RecipeViewMode,
} from '@/features/recipes/types/recipe.types'
import type { RecipeFormMode } from '@/features/recipes/components/RecipeForm'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'

const QUERY_KEY = ['recipes'] as const

const DEFAULT_FILTERS: RecipeFilters = {
  search: '',
  category: 'all',
  status: 'all',
}

export function useRecipes() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<RecipeViewMode>('cards')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false)
  const [formMode, setFormMode] = useState<RecipeFormMode>('document')
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [recipePendingDelete, setRecipePendingDelete] = useState<Recipe | null>(null)

  const allQuery = useQuery({
    queryKey: [...QUERY_KEY, 'all'],
    queryFn: () => recipesService.list(),
  })

  const listQuery = useQuery({
    queryKey: [...QUERY_KEY, 'filtered', filters],
    queryFn: () => recipesService.list(filters),
  })

  const kpis = useMemo(() => computeRecipeKpis(allQuery.data ?? []), [allQuery.data])

  const selectedRecipeQuery = useQuery({
    queryKey: [...QUERY_KEY, 'detail', selectedRecipeId],
    queryFn: () => recipesService.getById(selectedRecipeId!),
    enabled: Boolean(selectedRecipeId),
  })

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) {
      return null
    }
    if (selectedRecipeQuery.data) {
      return selectedRecipeQuery.data
    }
    const source = allQuery.data ?? listQuery.data ?? []
    return source.find((recipe) => recipe.id === selectedRecipeId) ?? null
  }, [allQuery.data, listQuery.data, selectedRecipeId, selectedRecipeQuery.data])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const saveMutation = useMutation({
    mutationFn: ({ payload, recipeId }: { payload: RecipeSavePayload; recipeId?: string }) =>
      recipesService.saveFromForm(payload, recipeId),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recipesService.remove(id),
    onSuccess: invalidate,
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => recipesService.archive(id),
    onSuccess: invalidate,
  })

  return {
    recipes: listQuery.data ?? [],
    kpis,
    isLoading: listQuery.isLoading,
    isKpisLoading: allQuery.isLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedRecipe,
    isSelectedRecipeLoading: selectedRecipeQuery.isLoading,
    selectRecipe: setSelectedRecipeId,
    isFormOpen,
    isCreateChoiceOpen,
    formMode,
    editingRecipe,
    openCreateChoice: () => {
      setIsCreateChoiceOpen(true)
    },
    closeCreateChoice: () => {
      setIsCreateChoiceOpen(false)
    },
    openCreateForm: (mode: RecipeFormMode) => {
      setFormMode(mode)
      setEditingRecipe(null)
      setIsCreateChoiceOpen(false)
      setIsFormOpen(true)
    },
    openEditForm: (recipe: Recipe) => {
      setFormMode(isRecipeDocumentPrimary(recipe) ? 'document' : 'manual')
      setEditingRecipe(recipe)
      setIsFormOpen(true)
    },
    closeForm: () => {
      setIsFormOpen(false)
      setIsCreateChoiceOpen(false)
      setEditingRecipe(null)
    },
    recipePendingDelete,
    requestDelete: setRecipePendingDelete,
    cancelDelete: () => {
      setRecipePendingDelete(null)
    },
    confirmDelete: async () => {
      if (!recipePendingDelete) {
        return
      }
      const id = recipePendingDelete.id
      setRecipePendingDelete(null)
      await deleteMutation.mutateAsync(id)
    },
    saveRecipe: saveMutation.mutateAsync,
    archiveRecipe: archiveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending,
  }
}
