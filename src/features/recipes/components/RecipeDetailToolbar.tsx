import { Archive, Copy, Pencil, Printer, Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { printRecipeContent } from '@/features/recipes/utils/printRecipe'
import { cn } from '@/utils/cn'

export interface RecipeDetailToolbarProps {
  recipe: Recipe
  canManage: boolean
  isTogglingFavorite?: boolean
  isArchiving?: boolean
  isDuplicating?: boolean
  className?: string
  onEdit?: () => void
  onArchive?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onToggleFavorite?: () => void
}

export function RecipeDetailToolbar({
  recipe,
  canManage,
  isTogglingFavorite = false,
  isArchiving = false,
  isDuplicating = false,
  className,
  onEdit,
  onArchive,
  onDuplicate,
  onDelete,
  onToggleFavorite,
}: RecipeDetailToolbarProps) {
  return (
    <div
      className={cn(
        'no-print flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-3 sm:flex-row sm:flex-wrap',
        className,
      )}
    >
      <Button
        variant="outline"
        size="md"
        className="w-full sm:w-auto"
        isLoading={isTogglingFavorite}
        onClick={onToggleFavorite}
      >
        <Star className={recipe.isFavorite ? 'size-4 fill-accent text-accent' : 'size-4'} />
        {recipe.isFavorite ? 'Favorita' : 'Favoritar'}
      </Button>

      <Button variant="outline" size="md" className="w-full sm:w-auto" onClick={printRecipeContent}>
        <Printer className="size-4" />
        Imprimir
      </Button>

      {canManage ? (
        <>
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
            isLoading={isDuplicating}
            onClick={onDuplicate}
          >
            <Copy className="size-4" />
            Duplicar
          </Button>
          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
            isLoading={isArchiving}
            onClick={onArchive}
            disabled={recipe.status === 'Arquivada'}
          >
            <Archive className="size-4" />
            Arquivar
          </Button>
          <Button variant="outline" size="md" className="w-full sm:w-auto" onClick={onEdit}>
            <Pencil className="size-4" />
            Editar
          </Button>
          <Button variant="danger" size="md" className="w-full sm:w-auto" onClick={onDelete}>
            <Trash2 className="size-4" />
            Remover
          </Button>
        </>
      ) : null}
    </div>
  )
}
