import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAppTodayIso } from '@/core/constants/appDate'
import { resolveEmployeeForUser } from '@/core/auth/employeeResolver'
import type { CommentFeedItem } from '@/features/comments/types/commentFeed.types'
import { productionService } from '@/features/production/services/production.service'
import {
  canCommentOnProduction,
  canManageProduction,
} from '@/features/production/utils/productionPermissions'
import type { ProductionDay } from '@/features/production/types/production.types'
import { useAuth } from '@/hooks/useAuth'

const COMMENTS_QUERY_KEY = ['comments-feed'] as const

export interface CommentsFeedFilters {
  date: string
  search: string
}

function buildFeed(productions: ProductionDay[]): CommentFeedItem[] {
  return productions
    .flatMap((production) =>
      (production.comments ?? []).map((comment) => ({
        ...comment,
        productionId: production.id,
        productionCode: production.productionCode,
        employeeName: production.employeeName,
        date: production.date,
        shift: production.shift,
        sector: production.sector,
      })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function useCommentsFeed() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const employee = resolveEmployeeForUser(user)
  const isChef = canManageProduction(user)
  const [filters, setFilters] = useState<CommentsFeedFilters>({
    date: getAppTodayIso(),
    search: '',
  })

  const productionsQuery = useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, 'productions', filters.date],
    queryFn: () =>
      productionService.list({
        search: '',
        date: filters.date,
        shift: 'all',
        sector: 'all',
        employeeId: 'all',
        status: 'all',
      }),
  })

  const visibleProductions = useMemo(() => {
    const list = productionsQuery.data ?? []
    if (isChef) {
      return list
    }
    return list.filter((production) => production.employeeId === employee?.id)
  }, [productionsQuery.data, isChef, employee?.id])

  const feed = useMemo(() => {
    const items = buildFeed(visibleProductions)
    const search = filters.search.trim().toLowerCase()
    if (!search) {
      return items
    }

    return items.filter(
      (item) =>
        item.message.toLowerCase().includes(search) ||
        item.authorName.toLowerCase().includes(search) ||
        item.employeeName.toLowerCase().includes(search) ||
        item.productionCode.toLowerCase().includes(search),
    )
  }, [visibleProductions, filters.search])

  const activeProduction = useMemo(() => {
    const today = getAppTodayIso()
    if (filters.date !== today || !employee) {
      return null
    }

    return (
      visibleProductions.find(
        (production) =>
          production.employeeId === employee.id && canCommentOnProduction(user, production),
      ) ?? null
    )
  }, [visibleProductions, filters.date, employee, user])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: COMMENTS_QUERY_KEY })
    await queryClient.invalidateQueries({ queryKey: ['production'] })
  }

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
    onSuccess: invalidate,
  })

  return {
    feed,
    filters,
    setFilters,
    isLoading: productionsQuery.isLoading,
    isChef,
    activeProduction,
    canComment: activeProduction ? canCommentOnProduction(user, activeProduction) : false,
    addComment: addCommentMutation.mutateAsync,
    isSending: addCommentMutation.isPending,
  }
}
