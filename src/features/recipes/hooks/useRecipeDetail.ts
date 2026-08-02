import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { recipesService } from '@/features/recipes/services/recipes.service'
import { APP_ROUTES } from '@/core/constants'

const QUERY_KEY = ['recipes'] as const

export function useRecipeDetail(recipeId: string | undefined) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const recipeQuery = useQuery({
    queryKey: [...QUERY_KEY, 'detail', recipeId],
    queryFn: () => recipesService.getById(recipeId!, { recordView: true }),
    enabled: Boolean(recipeId),
  })

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const favoriteMutation = useMutation({
    mutationFn: () => recipesService.toggleFavorite(recipeId!),
    onSuccess: async (recipe) => {
      queryClient.setQueryData([...QUERY_KEY, 'detail', recipeId], recipe)
      await invalidate()
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => recipesService.archive(recipeId!),
    onSuccess: invalidate,
  })

  const duplicateMutation = useMutation({
    mutationFn: () => recipesService.duplicate(recipeId!),
    onSuccess: async (recipe) => {
      await invalidate()
      navigate(`${APP_ROUTES.recipes}/${recipe.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => recipesService.remove(recipeId!),
    onSuccess: async () => {
      await invalidate()
      navigate(APP_ROUTES.recipes)
    },
  })

  return {
    recipe: recipeQuery.data ?? null,
    isLoading: recipeQuery.isLoading,
    isError: recipeQuery.isError,
    refetch: recipeQuery.refetch,
    toggleFavorite: favoriteMutation.mutateAsync,
    archiveRecipe: archiveMutation.mutateAsync,
    duplicateRecipe: duplicateMutation.mutateAsync,
    deleteRecipe: deleteMutation.mutateAsync,
    isTogglingFavorite: favoriteMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isDuplicating: duplicateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
