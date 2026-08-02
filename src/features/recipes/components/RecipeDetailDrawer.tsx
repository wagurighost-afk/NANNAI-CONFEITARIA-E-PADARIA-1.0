import { Star } from 'lucide-react'
import { Button } from '@/components/ui'
import { RecipeProductionView } from '@/features/recipes/components/RecipeProductionView'
import { RecipeSpreadsheetView } from '@/features/recipes/components/RecipeSpreadsheetView'
import { RecipeViewModeToggle } from '@/features/recipes/components/RecipeViewModeToggle'
import { useRecipeViewMode } from '@/features/recipes/hooks/useRecipeViewMode'
import type { Recipe } from '@/features/recipes/types/recipe.types'

export interface RecipeDetailDrawerProps {
  recipe: Recipe
  canManage: boolean
  isTogglingFavorite: boolean
  isArchiving: boolean
  onToggleFavorite: () => Promise<void>
  onEdit: () => void
  onArchive: () => Promise<void>
  onDelete: () => void
}

export function RecipeDetailDrawer({
  recipe,
  canManage,
  isTogglingFavorite,
  isArchiving,
  onToggleFavorite,
  onEdit,
  onArchive,
  onDelete,
}: RecipeDetailDrawerProps) {
  const hasSpreadsheet = recipe.attachments.length > 0
  const { mode, setMode, canToggle, isCompact } = useRecipeViewMode(hasSpreadsheet)

  return (
    <div className="space-y-5 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Button
          variant="outline"
          size={isCompact ? 'md' : 'sm'}
          className="w-full sm:w-auto"
          isLoading={isTogglingFavorite}
          onClick={() => void onToggleFavorite()}
        >
          <Star className={recipe.isFavorite ? 'size-4 fill-accent text-accent' : 'size-4'} />
          {recipe.isFavorite ? 'Favorita' : 'Favoritar'}
        </Button>
        {canToggle ? <RecipeViewModeToggle mode={mode} onChange={setMode} /> : null}
      </div>

      {mode === 'production' ? (
        <RecipeProductionView recipe={recipe} kitchenMode={isCompact} />
      ) : (
        <RecipeSpreadsheetView recipe={recipe} />
      )}

      {canManage ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
          <Button variant="outline" size={isCompact ? 'md' : 'sm'} className="w-full sm:w-auto" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="outline"
            size={isCompact ? 'md' : 'sm'}
            className="w-full sm:w-auto"
            isLoading={isArchiving}
            onClick={() => void onArchive()}
          >
            Arquivar
          </Button>
          <Button
            variant="danger"
            size={isCompact ? 'md' : 'sm'}
            className="w-full sm:w-auto"
            onClick={onDelete}
          >
            Remover
          </Button>
        </div>
      ) : null}
    </div>
  )
}
