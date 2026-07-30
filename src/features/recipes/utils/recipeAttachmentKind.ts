import type { RecipeAttachmentKind } from '@/features/recipes/types/recipe.types'
import { isAllowedRecipeFileExtension } from '@/features/recipes/utils/validateRecipeFile'

export function resolveRecipeAttachmentKind(fileName: string): RecipeAttachmentKind {
  const extension = fileName.slice(fileName.lastIndexOf('.')).toLowerCase()

  if (!isAllowedRecipeFileExtension(extension)) {
    return 'pdf'
  }

  if (extension === '.pdf') {
    return 'pdf'
  }

  if (extension === '.xls' || extension === '.xlsx') {
    return 'excel'
  }

  return 'word'
}
