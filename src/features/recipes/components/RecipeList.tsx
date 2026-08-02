import { useEffect, useRef } from 'react'
import { EmptyState } from '@/components/common'
import { Pagination, Skeleton, Spinner } from '@/components/ui'
import { RecipeCard } from '@/features/recipes/components/RecipeCard'
import { RecipeTable } from '@/features/recipes/components/RecipeTable'
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

function RecipeCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={160} />
      ))}
    </div>
  )
}

function InfiniteScrollSentinel({
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
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled || !hasNextPage || !onLoadMore) {
      return
    }

    const element = sentinelRef.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !isFetchingNextPage) {
          onLoadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [enabled, hasNextPage, isFetchingNextPage, onLoadMore])

  if (!enabled || !hasNextPage) {
    return null
  }

  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {isFetchingNextPage ? <Spinner className="size-6" /> : null}
    </div>
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
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              selectionMode={selectionMode}
              isSelected={isSelected(recipe.id)}
              onSelect={() => onRecipeClick(recipe)}
              onToggleSelection={() => onToggleSelection(recipe.id)}
              onToggleFavorite={() => onToggleFavorite(recipe)}
            />
          ))}
        </div>
        {hasNextPage && onLoadMore ? (
          <InfiniteScrollSentinel
            enabled
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage ?? false}
            onLoadMore={onLoadMore}
          />
        ) : null}
        {total > 0 ? (
          <p className="pb-2 text-center text-xs text-muted-foreground">
            Exibindo {recipes.length} de {total}
          </p>
        ) : null}
      </>
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
