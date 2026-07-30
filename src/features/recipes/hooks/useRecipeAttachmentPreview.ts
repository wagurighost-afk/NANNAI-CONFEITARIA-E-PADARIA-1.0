import { useEffect, useState } from 'react'
import { resolveAttachmentPreviewUrl } from '@/features/recipes/storage/recipeAttachmentBlobStore'
import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'

export function useRecipeAttachmentPreview(attachment: RecipeAttachment | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(attachment))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!attachment) {
      setPreviewUrl(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    resolveAttachmentPreviewUrl(attachment.id, attachment.fileUrl)
      .then((url) => {
        if (cancelled) {
          return
        }
        if (!url) {
          setPreviewUrl(null)
          setError('Documento não encontrado. Envie o arquivo novamente.')
          return
        }
        setPreviewUrl(url)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null)
          setError('Não foi possível carregar o documento.')
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

  return { previewUrl, isLoading, error }
}
