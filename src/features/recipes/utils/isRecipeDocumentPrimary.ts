import type { Recipe } from '@/features/recipes/types/recipe.types'

const DOCUMENT_INGREDIENT = 'Ver documento anexo'
const DOCUMENT_PREP_PREFIX = 'Consulte o documento anexo'

export function isRecipeDocumentPrimary(recipe: Recipe): boolean {
  if (recipe.attachments.length === 0) {
    return false
  }

  const hasPlaceholderIngredient = recipe.ingredients.some(
    (item) => item.name.trim() === DOCUMENT_INGREDIENT,
  )
  const hasPlaceholderPrep = recipe.preparationMethod
    .trim()
    .startsWith(DOCUMENT_PREP_PREFIX)

  return hasPlaceholderIngredient || hasPlaceholderPrep
}
