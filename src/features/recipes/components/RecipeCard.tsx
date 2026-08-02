import { Star } from 'lucide-react'
import { Badge, Card, CardContent, Checkbox } from '@/components/ui'
import type { Recipe } from '@/features/recipes/types/recipe.types'
import { getRecipeAttachmentBadge } from '@/features/recipes/utils/getRecipeAttachmentLabel'
import { isRecipeDocumentPrimary } from '@/features/recipes/utils/isRecipeDocumentPrimary'
import { cn } from '@/utils/cn'

interface RecipeCardProps {
  recipe: Recipe
  selectionMode?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onToggleSelection?: () => void
  onToggleFavorite?: () => void
}

export function RecipeCard({
  recipe,
  selectionMode = false,
  isSelected = false,
  onSelect,
  onToggleSelection,
  onToggleFavorite,
}: RecipeCardProps) {
  const attachmentBadge = getRecipeAttachmentBadge(recipe)
  const documentPrimary = isRecipeDocumentPrimary(recipe)

  return (
    <Card
      className={cn('cursor-pointer transition hover:shadow-md', isSelected && 'ring-2 ring-accent')}
      onClick={() => {
        if (selectionMode) {
          onToggleSelection?.()
          return
        }
        onSelect?.()
      }}
    >
      <CardContent className="space-y-2 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            {selectionMode ? (
              <div
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggleSelection?.()}
                  aria-label={`Selecionar ${recipe.name}`}
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-medium">{recipe.name}</p>
              <p className="text-xs text-muted-foreground">{recipe.recipeCode}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onToggleFavorite ? (
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted/50 hover:text-accent"
                aria-label={recipe.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                onClick={(event) => {
                  event.stopPropagation()
                  onToggleFavorite()
                }}
              >
                <Star className={cn('size-4', recipe.isFavorite && 'fill-accent text-accent')} />
              </button>
            ) : null}
            <Badge variant={recipe.status === 'Ativa' ? 'success' : 'muted'}>{recipe.status}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {recipe.category}
          {!documentPrimary ? ` · ${recipe.prepTimeMinutes} min · ${recipe.yield}` : ' · Ficha anexa'}
        </p>
        <div className="flex flex-wrap gap-2">
          {attachmentBadge ? <Badge variant="accent">Ficha {attachmentBadge}</Badge> : null}
          {!attachmentBadge ? <Badge variant="muted">Cadastro manual</Badge> : null}
          {(recipe.usageCount ?? 0) > 0 ? (
            <Badge variant="muted">{recipe.usageCount} uso{(recipe.usageCount ?? 0) === 1 ? '' : 's'}</Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
