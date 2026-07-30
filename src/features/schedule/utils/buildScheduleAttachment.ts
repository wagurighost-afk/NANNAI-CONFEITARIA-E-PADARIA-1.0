import { validateRecipeFile } from '@/features/recipes/utils/validateRecipeFile'
import { resolveRecipeAttachmentKind } from '@/features/recipes/utils/recipeAttachmentKind'
import {
  getOrCreateScheduleObjectUrl,
  saveScheduleAttachmentBlob,
} from '@/features/schedule/storage/scheduleAttachmentBlobStore'
import type { MonthlyScheduleAttachment } from '@/features/schedule/types/monthlySchedule.types'

export async function buildScheduleAttachmentFromFile(file: File): Promise<MonthlyScheduleAttachment> {
  const validationError = validateRecipeFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const id = `sch-att-${crypto.randomUUID()}`
  await saveScheduleAttachmentBlob(id, file)

  return {
    id,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    kind: resolveRecipeAttachmentKind(file.name),
    fileUrl: getOrCreateScheduleObjectUrl(id, file),
    uploadedAt: new Date().toISOString(),
  }
}
