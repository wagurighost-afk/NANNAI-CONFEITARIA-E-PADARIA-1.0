import { useEffect, useState } from 'react'
import { getAttachmentBlob, fetchAttachmentBlob } from '@/features/recipes/storage/recipeAttachmentBlobStore'
import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'
import {
  parseExcelBlob,
  type ExcelPreviewData,
} from '@/features/recipes/utils/parseExcelPreview'

const excelPreviewCache = new Map<string, ExcelPreviewData>()

async function loadExcelPreview(attachment: RecipeAttachment): Promise<ExcelPreviewData> {
  const cached = excelPreviewCache.get(attachment.id)
  if (cached) {
    return cached
  }

  const blob = await getAttachmentBlob(attachment.id)
  const resolvedBlob = blob ?? (await fetchAttachmentBlob(attachment))
  if (!resolvedBlob) {
    throw new Error('Arquivo da planilha não encontrado. Envie o documento novamente.')
  }

  const data = await parseExcelBlob(resolvedBlob)
  excelPreviewCache.set(attachment.id, data)
  return data
}

export function useRecipeExcelPreview(attachment: RecipeAttachment | null) {
  const [data, setData] = useState<ExcelPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(attachment))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!attachment || attachment.kind !== 'excel') {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    loadExcelPreview(attachment)
      .then((preview) => {
        if (!cancelled) {
          setData(preview)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Não foi possível ler a planilha.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [attachment])

  return { data, isLoading, error }
}
