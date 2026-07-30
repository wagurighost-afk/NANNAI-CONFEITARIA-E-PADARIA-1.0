import { useEffect, useState } from 'react'
import { fetchAttachmentBlob, getAttachmentBlob } from '@/features/recipes/storage/recipeAttachmentBlobStore'
import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'
import {
  parseWordBlob,
  type WordPreviewData,
} from '@/features/recipes/utils/parseWordPreview'

const wordPreviewCache = new Map<string, WordPreviewData>()

async function loadWordPreview(attachment: RecipeAttachment): Promise<WordPreviewData> {
  const cached = wordPreviewCache.get(attachment.id)
  if (cached) {
    return cached
  }

  const blob = await getAttachmentBlob(attachment.id)
  const resolvedBlob = blob ?? (await fetchAttachmentBlob(attachment))
  if (!resolvedBlob) {
    throw new Error('Arquivo do documento não encontrado. Envie o documento novamente.')
  }

  const isLegacyDoc = attachment.fileName.toLowerCase().endsWith('.doc')
  if (isLegacyDoc) {
    throw new Error('Arquivos .doc antigos não são suportados. Salve como .docx para visualizar aqui.')
  }

  const data = await parseWordBlob(resolvedBlob)
  wordPreviewCache.set(attachment.id, data)
  return data
}

export function useRecipeWordPreview(attachment: RecipeAttachment | null) {
  const [data, setData] = useState<WordPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(attachment))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!attachment || attachment.kind !== 'word') {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    loadWordPreview(attachment)
      .then((preview) => {
        if (!cancelled) {
          setData(preview)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : 'Não foi possível ler o documento.')
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
