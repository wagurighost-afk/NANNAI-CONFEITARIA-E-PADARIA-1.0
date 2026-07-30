import type { Recipe, RecipeAttachmentKind } from '@/features/recipes/types/recipe.types'

const KIND_LABELS: Record<RecipeAttachmentKind, string> = {
  pdf: 'PDF',
  excel: 'Excel',
  word: 'Word',
}

export function getRecipeAttachmentKindLabel(kind: RecipeAttachmentKind): string {
  return KIND_LABELS[kind]
}

export function getRecipeAttachmentBadge(recipe: Recipe): string | null {
  const attachment = recipe.attachments[0]
  if (!attachment) {
    return null
  }

  return getRecipeAttachmentKindLabel(attachment.kind)
}
