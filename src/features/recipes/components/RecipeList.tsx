import { memo, useCallback, useEffect, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { EmptyState } from '@/components/common'
import { Pagination, Skeleton, Spinner } from '@/components/ui'
import { getAppScrollElement } from '@/core/layout/appScroll'
import { RecipeCard } from '@/features/recipes/components/RecipeCard'
import { RecipeTable } from '@/features/recipes/components/RecipeTable'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Recipe } from '@/features/recipes/types/recipe.types'

interface RecipeListProps {
  recipes: Recipe[]
  total: number
  isLoading: boolean
  isMobile: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  selectionMode?: boolean
  isSelected: (id: string) => boolean
  onRecipeClick: (recipe: Recipe) => void
  onToggleSelection: (id: string) => void
  onToggleFavorite: (recipe: Recipe) => void
}

const CARD_ROW_HEIGHT = 172

const RecipeCardItem = memo(function RecipeCardItem({
  recipe,
  selectionMode,
  isSelected,
  onRecipeClick,
  onToggleSelection,
  onToggleFavorite,
}: {
  recipe: Recipe
  selectionMode: boolean
  isSelected: boolean
  onRecipeClick: (recipe: Recipe) => void
  onToggleSelection: (id: string) => void
  onToggleFavorite: (recipe: Recipe) => void
}) {
  const handleSelect = useCallback(() => {
    onRecipeClick(recipe)
  }, [onRecipeClick, recipe])

  const handleToggleSelection = useCallback(() => {
    onToggleSelection(recipe.id)
  }, [onToggleSelection, recipe.id])

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(recipe)
  }, [onToggleFavorite, recipe])

  return (
    <RecipeCard
      recipe={recipe}
      selectionMode={selectionMode}
      isSelected={isSelected}
      onSelect={handleSelect}
      onToggleSelection={handleToggleSelection}
      onToggleFavorite={handleToggleFavorite}
    />
  )
})

function RecipeCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={160} />
      ))}
    </div>
  )
}

function useScrollLoadMore({
  enabled,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  enabled: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}) {
  const isFetchingRef = useRef(isFetchingNextPage)
  const onLoadMoreRef = useRef(onLoadMore)

  isFetchingRef.current = isFetchingNextPage
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    if (!enabled || !hasNextPage || !onLoadMore) {
      return
    }

    const scrollEl = getAppScrollElement()
    if (!scrollEl) {
      return
    }

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      if (scrollHeight - scrollTop - clientHeight < 400 && !isFetchingRef.current) {
        onLoadMoreRef.current?.()
      }
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      scrollEl.removeEventListener('scroll', onScroll)
    }
  }, [enabled, hasNextPage, onLoadMore])
}

function VirtualRecipeCards({
  recipes,
  selectionMode,
  isSelected,
  onRecipeClick,
  onToggleSelection,
  onToggleFavorite,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  total,
}: {
  recipes: Recipe[]
  selectionMode: boolean
  isSelected: (id: string) => boolean
  onRecipeClick: (recipe: Recipe) => void
  onToggleSelection: (id: string) => void
  onToggleFavorite: (recipe: Recipe) => void
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
  total: number
}) {
  const isTwoColumns = useMediaQuery('(min-width: 640px)')
  const columnCount = isTwoColumns ? 2 : 1
  const rowCount = Math.ceil(recipes.length / columnCount)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: getAppScrollElement,
    estimateSize: () => CARD_ROW_HEIGHT,
    overscan: 5,
  })

  useScrollLoadMore({
    enabled: Boolean(hasNextPage && onLoadMore),
    ...(hasNextPage !== undefined ? { hasNextPage } : {}),
    ...(isFetchingNextPage !== undefined ? { isFetchingNextPage } : {}),
    ...(onLoadMore ? { onLoadMore } : {}),
  })

  return (
    <>
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount
          const rowRecipes = recipes.slice(startIndex, startIndex + columnCount)

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {rowRecipes.map((recipe) => (
                <RecipeCardItem
                  key={recipe.id}
                  recipe={recipe}
                  selectionMode={selectionMode}
                  isSelected={isSelected(recipe.id)}
                  onRecipeClick={onRecipeClick}
                  onToggleSelection={onToggleSelection}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )
        })}
      </div>
      {hasNextPage && isFetchingNextPage ? (
        <div className="flex justify-center py-4">
          <Spinner className="size-6" />
        </div>
      ) : null}
      {total > 0 ? (
        <p className="pb-2 text-center text-xs text-muted-foreground">
          Exibindo {recipes.length} de {total}
        </p>
      ) : null}
    </>
  )
}

export function RecipeList({
  recipes,
  total,
  isLoading,
  isMobile,
  page,
  totalPages,
  onPageChange,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  selectionMode = false,
  isSelected,
  onRecipeClick,
  onToggleSelection,
  onToggleFavorite,
}: RecipeListProps) {
  if (isLoading && recipes.length === 0) {
    return isMobile ? <RecipeCardsSkeleton /> : <RecipeTable recipes={[]} isLoading selectionMode={selectionMode} isSelected={isSelected} onRowClick={onRecipeClick} onToggleSelection={onToggleSelection} onToggleFavorite={onToggleFavorite} />
  }

  if (!isLoading && recipes.length === 0) {
    return <EmptyState title="Nenhuma receita encontrada" description="Tente ajustar os filtros ou cadastre uma nova receita." />
  }

  if (isMobile) {
    return (
      <VirtualRecipeCards
        recipes={recipes}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onRecipeClick={onRecipeClick}
        onToggleSelection={onToggleSelection}
        onToggleFavorite={onToggleFavorite}
        total={total}
        {...(hasNextPage !== undefined ? { hasNextPage } : {})}
        {...(isFetchingNextPage !== undefined ? { isFetchingNextPage } : {})}
        {...(onLoadMore ? { onLoadMore } : {})}
      />
    )
  }

  return (
    <div className="space-y-4">
      <RecipeTable
        recipes={recipes}
        isLoading={isLoading}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onRowClick={onRecipeClick}
        onToggleSelection={onToggleSelection}
        onToggleFavorite={onToggleFavorite}
      />
      {totalPages > 1 ? (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      ) : null}
    </div>
  )
}
