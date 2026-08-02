import { useCallback, useMemo, useState } from 'react'
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recipesService } from '@/features/recipes/services/recipes.service'
import type {
  Recipe,
  RecipeListQuery,
  RecipeQuickFilter,
  RecipeSavePayload,
  RecipeSortBy,
} from '@/features/recipes/types/recipe.types'
import { DEFAULT_RECIPE_LIST_QUERY } from '@/features/recipes/types/recipe.types'
import type { RecipeFormMode } from '@/features/recipes/components/RecipeForm'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { useDebouncedValue } from '@/hooks'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const QUERY_KEY = ['recipes'] as const
const PAGE_SIZE = 24

export function useRecipes() {
  const queryClient = useQueryClient()
  const isCompactList = useMediaQuery('(max-width: 1023px)')
  const [filters, setFiltersState] = useState<RecipeListQuery>(DEFAULT_RECIPE_LIST_QUERY)
  const debouncedSearch = useDebouncedValue(filters.search, 300)

  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false)
  const [formMode, setFormMode] = useState<RecipeFormMode>('document')
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [recipePendingDelete, setRecipePendingDelete] = useState<Recipe | null>(null)

  const queryParams = useMemo<RecipeListQuery>(
    () => ({
      ...filters,
      search: debouncedSearch,
      pageSize: PAGE_SIZE,
    }),
    [filters, debouncedSearch],
  )

  const statsQuery = useQuery({
    queryKey: [...QUERY_KEY, 'stats'],
    queryFn: () => recipesService.getStats(),
    staleTime: 60_000,
  })

  const listQuery = useQuery({
    queryKey: [...QUERY_KEY, 'list', queryParams],
    queryFn: () => recipesService.list(queryParams),
    enabled: !isCompactList,
    placeholderData: keepPreviousData,
  })

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...QUERY_KEY, 'infinite', queryParams],
    queryFn: ({ pageParam }) => recipesService.list({ ...queryParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled: isCompactList,
  })

  const recipes = useMemo(() => {
    if (isCompactList) {
      return infiniteQuery.data?.pages.flatMap((page) => page.items) ?? []
    }
    return listQuery.data?.items ?? []
  }, [isCompactList, infiniteQuery.data, listQuery.data])

  const total = isCompactList
    ? (infiniteQuery.data?.pages[0]?.total ?? 0)
    : (listQuery.data?.total ?? 0)

  const totalPages = isCompactList
    ? (infiniteQuery.data?.pages[0]?.totalPages ?? 0)
    : (listQuery.data?.totalPages ?? 0)

  const selectedRecipeQuery = useQuery({
    queryKey: [...QUERY_KEY, 'detail', selectedRecipeId],
    queryFn: () => recipesService.getById(selectedRecipeId!, { recordView: true }),
    enabled: Boolean(selectedRecipeId),
  })

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) {
      return null
    }
    if (selectedRecipeQuery.data) {
      return selectedRecipeQuery.data
    }
    return recipes.find((recipe) => recipe.id === selectedRecipeId) ?? null
  }, [recipes, selectedRecipeId, selectedRecipeQuery.data])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
  }

  const setFilters = useCallback((patch: Partial<RecipeListQuery>) => {
    setFiltersState((current) => ({
      ...current,
      ...patch,
      page: patch.page ?? 1,
    }))
  }, [])

  const setSearch = useCallback(
    (search: string) => {
      setFilters({ search, page: 1 })
    },
    [setFilters],
  )

  const setQuickFilter = useCallback(
    (quickFilter: RecipeQuickFilter) => {
      setFilters({
        quickFilter,
        status: quickFilter === 'archived' ? 'Arquivada' : 'all',
        page: 1,
      })
    },
    [setFilters],
  )

  const setSortBy = useCallback(
    (sortBy: RecipeSortBy) => {
      setFilters({ sortBy, page: 1 })
    },
    [setFilters],
  )

  const toggleSortOrder = useCallback(() => {
    setFiltersState((current) => ({
      ...current,
      sortOrder: current.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }, [])

  const setPage = useCallback(
    (page: number) => {
      setFilters({ page })
    },
    [setFilters],
  )

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

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => recipesService.toggleFavorite(id),
    onSuccess: async (recipe) => {
      await invalidate()
      if (selectedRecipeId === recipe.id) {
        queryClient.setQueryData([...QUERY_KEY, 'detail', recipe.id], recipe)
      }
    },
  })

  return {
    recipes,
    total,
    totalPages,
    page: filters.page,
    setPage,
    kpis: statsQuery.data ?? { total: 0, active: 0, archived: 0, favorites: 0 },
    isLoading: isCompactList ? infiniteQuery.isLoading : listQuery.isLoading,
    isFetching: isCompactList ? infiniteQuery.isFetching : listQuery.isFetching,
    isKpisLoading: statsQuery.isLoading,
    hasNextPage: infiniteQuery.hasNextPage,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    isCompactList,
    filters,
    setFilters,
    setSearch,
    setQuickFilter,
    setSortBy,
    toggleSortOrder,
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
    toggleFavorite: favoriteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isTogglingFavorite: favoriteMutation.isPending,
  }
}
