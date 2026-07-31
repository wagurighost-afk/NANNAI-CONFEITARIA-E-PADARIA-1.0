import { useEffect, useState } from 'react'
import { parseWordBlob } from '@/features/recipes/utils/parseWordPreview'
import type { WordPreviewData } from '@/features/recipes/utils/parseWordPreview'

const previewCache = new Map<string, WordPreviewData>()

async function loadPopPreview(fileUrl: string): Promise<WordPreviewData> {
  const cached = previewCache.get(fileUrl)
  if (cached) {
    return cached
  }

  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error('Não foi possível carregar o documento POP.')
  }

  const blob = await response.blob()
  const data = await parseWordBlob(blob)
  previewCache.set(fileUrl, data)
  return data
}

export function usePopDocPreview(fileUrl: string | null) {
  const [data, setData] = useState<WordPreviewData | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(fileUrl))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!fileUrl) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    loadPopPreview(fileUrl)
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
  }, [fileUrl])

  return { data, isLoading, error }
}
