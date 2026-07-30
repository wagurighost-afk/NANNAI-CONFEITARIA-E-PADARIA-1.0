import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'
import { storeAttachmentFile } from '@/features/recipes/storage/recipeStorePersistence'
import { resolveRecipeAttachmentKind } from '@/features/recipes/utils/recipeAttachmentKind'
import { validateRecipeFile } from '@/features/recipes/utils/validateRecipeFile'

export async function buildRecipeAttachmentFromFile(file: File): Promise<RecipeAttachment> {
  const validationError = validateRecipeFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const id = `att-${crypto.randomUUID()}`
  const fileUrl = await storeAttachmentFile(id, file)

  return {
    id,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    kind: resolveRecipeAttachmentKind(file.name),
    fileUrl,
    uploadedAt: new Date().toISOString(),
  }
}
