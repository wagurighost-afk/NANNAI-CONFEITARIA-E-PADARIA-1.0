import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAppTodayIso } from '@/core/constants/appDate'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import { computeProductionKpis } from '@/features/production/utils/computeProductionKpis'
import {
  canEditProductionDay,
  canManageProduction,
} from '@/features/production/utils/productionPermissions'
import { productionService } from '@/features/production/services/production.service'
import type {
  CreateProductionInput,
  DuplicateProductionInput,
  ProductionDay,
  ProductionFilters,
  ProductionItemStatus,
  ProductionViewMode,
  UpdateProductionInput,
} from '@/features/production/types/production.types'
import { useAuth } from '@/hooks/useAuth'
import { usePermission } from '@/hooks/usePermission'

const PRODUCTION_QUERY_KEY = ['production'] as const

const DEFAULT_FILTERS: ProductionFilters = {
  search: '',
  date: getAppTodayIso(),
  shift: 'all',
  sector: 'all',
  employeeId: 'all',
  status: 'all',
}

export function useProduction() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { hasPermission } = usePermission()
  const employee = resolveEmployeeForUser(user)
  const isChef = canManageProduction(user)

  const [filters, setFilters] = useState<ProductionFilters>(() => ({
    ...DEFAULT_FILTERS,
    employeeId: isChef ? 'all' : (employee?.id ?? user?.employeeId ?? 'all'),
  }))
  const [viewMode, setViewMode] = useState<ProductionViewMode>('cards')
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<ProductionDay | null>(null)
  const [productionPendingDelete, setProductionPendingDelete] =
    useState<ProductionDay | null>(null)
  const [duplicateSource, setDuplicateSource] = useState<ProductionDay | null>(null)

  useEffect(() => {
    const today = getAppTodayIso()
    setFilters((current) => (current.date === today ? current : { ...current, date: today }))
  }, [])

  const effectiveFilters = useMemo<ProductionFilters>(() => {
    if (isChef) {
      return filters
    }

    return {
      ...filters,
      employeeId: employee?.id ?? user?.employeeId ?? 'none',
    }
  }, [filters, isChef, employee?.id, user?.employeeId])

  const allProductionQuery = useQuery({
    queryKey: [...PRODUCTION_QUERY_KEY, 'all'],
    queryFn: () => productionService.list(),
  })

  const productionQuery = useQuery({
    queryKey: [...PRODUCTION_QUERY_KEY, 'filtered', effectiveFilters],
    queryFn: () => productionService.list(effectiveFilters),
  })

  const kpis = useMemo(
    () => computeProductionKpis(allProductionQuery.data ?? []),
    [allProductionQuery.data],
  )

  const selectedProductionQuery = useQuery({
    queryKey: [...PRODUCTION_QUERY_KEY, 'detail', selectedProductionId],
    queryFn: () => productionService.getById(selectedProductionId!),
    enabled: Boolean(selectedProductionId),
  })

  const selectedProduction = useMemo(() => {
    if (!selectedProductionId) {
      return null
    }

    if (selectedProductionQuery.data) {
      return selectedProductionQuery.data
    }

    return productionQuery.data?.find((item) => item.id === selectedProductionId) ?? null
  }, [productionQuery.data, selectedProductionId, selectedProductionQuery.data])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: PRODUCTION_QUERY_KEY })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateProductionInput) => productionService.create(input),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductionInput }) =>
      productionService.update(id, input),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productionService.remove(id),
    onSuccess: invalidate,
  })

  const duplicateMutation = useMutation({
    mutationFn: (input: DuplicateProductionInput) => productionService.duplicate(input),
    onSuccess: invalidate,
  })

  const updateItemStatusMutation = useMutation({
    mutationFn: ({
      productionId,
      itemId,
      status,
    }: {
      productionId: string
      itemId: string
      status: ProductionItemStatus
    }) => productionService.updateItemStatus({ productionId, itemId, status }),
    onSuccess: async (updated) => {
      await queryClient.setQueryData(
        [...PRODUCTION_QUERY_KEY, 'detail', updated.id],
        updated,
      )
      await invalidate()
    },
  })

  const reorderMutation = useMutation({
    mutationFn: ({
      productionId,
      itemIds,
    }: {
      productionId: string
      itemIds: string[]
    }) => productionService.reorderItems({ productionId, itemIds }),
    onSuccess: async (updated) => {
      await queryClient.setQueryData(
        [...PRODUCTION_QUERY_KEY, 'detail', updated.id],
        updated,
      )
      await invalidate()
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: ({
      productionId,
      message,
      photos,
    }: {
      productionId: string
      message: string
      photos?: File[]
    }) =>
      productionService.addComment({
        productionId,
        authorId: user?.employeeId ?? user?.id ?? 'unknown',
        authorName: user?.name ?? 'Usuário',
        message,
        ...(photos && photos.length > 0 ? { photos } : {}),
      }),
    onSuccess: async (updated) => {
      await queryClient.setQueryData(
        [...PRODUCTION_QUERY_KEY, 'detail', updated.id],
        updated,
      )
      await invalidate()
    },
  })

  return {
    productions: productionQuery.data ?? [],
    kpis,
    isLoading: productionQuery.isLoading,
    isKpisLoading: allProductionQuery.isLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    selectedProduction,
    selectProduction: setSelectedProductionId,
    isFormOpen,
    editingProduction,
    openCreateForm: () => {
      setEditingProduction(null)
      setIsFormOpen(true)
    },
    openEditForm: (production: ProductionDay) => {
      setEditingProduction(production)
      setIsFormOpen(true)
    },
    closeForm: () => {
      setIsFormOpen(false)
      setEditingProduction(null)
    },
    productionPendingDelete,
    requestDelete: setProductionPendingDelete,
    cancelDelete: () => {
      setProductionPendingDelete(null)
    },
    confirmDelete: async () => {
      if (!productionPendingDelete) {
        return
      }
      const id = productionPendingDelete.id
      setProductionPendingDelete(null)
      setSelectedProductionId(null)
      await deleteMutation.mutateAsync(id)
    },
    duplicateSource,
    openDuplicate: setDuplicateSource,
    closeDuplicate: () => {
      setDuplicateSource(null)
    },
    createProduction: createMutation.mutateAsync,
    updateProduction: updateMutation.mutateAsync,
    duplicateProduction: duplicateMutation.mutateAsync,
    updateItemStatus: updateItemStatusMutation.mutateAsync,
    reorderItems: reorderMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      duplicateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    canManage: isChef && hasPermission('production:manage'),
    canUpdateItems:
      hasPermission('production:own') || hasPermission('production:manage'),
    canEditSelectedProduction: (production: ProductionDay | null) =>
      production ? canEditProductionDay(user, production) : false,
    currentEmployeeId: employee?.id ?? user?.employeeId ?? null,
  }
}
