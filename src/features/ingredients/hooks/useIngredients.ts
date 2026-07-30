import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateIngredientInput,
  Ingredient,
  IngredientFilters,
  IngredientViewMode,
  UpdateIngredientInput,
} from '@/features/ingredients/types/ingredient.types'
import { ingredientsService } from '@/features/ingredients/services/ingredients.service'
import { computeIngredientKpis } from '@/features/ingredients/utils/computeIngredientKpis'

const INGREDIENTS_QUERY_KEY = ['ingredients'] as const

const DEFAULT_FILTERS: IngredientFilters = {
  search: '',
  category: 'all',
  status: 'all',
  supplier: 'all',
  unit: 'all',
}

export function useIngredients() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<IngredientFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<IngredientViewMode>('cards')
  const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [ingredientPendingDelete, setIngredientPendingDelete] = useState<Ingredient | null>(null)

  const allIngredientsQuery = useQuery({
    queryKey: [...INGREDIENTS_QUERY_KEY, 'all'],
    queryFn: () => ingredientsService.list(),
  })

  const ingredientsQuery = useQuery({
    queryKey: [...INGREDIENTS_QUERY_KEY, 'filtered', filters],
    queryFn: () => ingredientsService.list(filters),
  })

  const kpis = useMemo(
    () => computeIngredientKpis(allIngredientsQuery.data ?? []),
    [allIngredientsQuery.data],
  )

  const suppliers = useMemo(() => {
    const values = new Set((allIngredientsQuery.data ?? []).map((item) => item.supplier))
    return [...values].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [allIngredientsQuery.data])

  const selectedIngredient = useMemo(() => {
    if (!selectedIngredientId || !ingredientsQuery.data) {
      return null
    }
    return ingredientsQuery.data.find((item) => item.id === selectedIngredientId) ?? null
  }, [ingredientsQuery.data, selectedIngredientId])

  const createMutation = useMutation({
    mutationFn: (input: CreateIngredientInput) => ingredientsService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIngredientInput }) =>
      ingredientsService.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ingredientsService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INGREDIENTS_QUERY_KEY })
    },
  })

  return {
    ingredients: ingredientsQuery.data ?? [],
    kpis,
    suppliers,
    isLoading: ingredientsQuery.isLoading,
    isKpisLoading: allIngredientsQuery.isLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedIngredient,
    selectIngredient: (id: string | null) => {
      setSelectedIngredientId(id)
    },
    isFormOpen,
    editingIngredient,
    openCreateForm: () => {
      setEditingIngredient(null)
      setIsFormOpen(true)
    },
    openEditForm: (ingredient: Ingredient) => {
      setEditingIngredient(ingredient)
      setIsFormOpen(true)
    },
    closeForm: () => {
      setIsFormOpen(false)
      setEditingIngredient(null)
    },
    ingredientPendingDelete,
    requestDelete: (ingredient: Ingredient) => {
      setIngredientPendingDelete(ingredient)
    },
    cancelDelete: () => {
      setIngredientPendingDelete(null)
    },
    confirmDelete: async () => {
      if (!ingredientPendingDelete) {
        return
      }
      const id = ingredientPendingDelete.id
      await deleteMutation.mutateAsync(id)
      setIngredientPendingDelete(null)
      if (selectedIngredientId === id) {
        setSelectedIngredientId(null)
      }
    },
    createIngredient: createMutation.mutateAsync,
    updateIngredient: updateMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export type UseIngredientsReturn = ReturnType<typeof useIngredients>
