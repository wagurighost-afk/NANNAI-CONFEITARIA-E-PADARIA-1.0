import { useCallback, useEffect, useRef, useState } from 'react'
import {
  COMMENT_PHOTO_ACCEPT,
  COMMENT_PHOTO_MAX_COUNT,
  COMMENT_PHOTO_MAX_SIZE,
  COMMENT_PHOTO_MAX_SIZE_LABEL,
} from '@/features/production/constants/commentPhoto.constants'

export interface CommentPhotoDraft {
  id: string
  file: File
  previewUrl: string
}

function validatePhoto(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Selecione apenas imagens (JPG, PNG ou WebP).'
  }

  if (file.size > COMMENT_PHOTO_MAX_SIZE) {
    return `Cada foto deve ter no máximo ${COMMENT_PHOTO_MAX_SIZE_LABEL}.`
  }

  return null
}

export function useShiftCommentPhotos() {
  const [photos, setPhotos] = useState<CommentPhotoDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<CommentPhotoDraft[]>([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl)
      })
    }
  }, [])

  const clearPhotos = useCallback(() => {
    setPhotos((current) => {
      current.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl)
      })
      return []
    })
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const addFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files)
    if (incoming.length === 0) {
      return
    }

    setPhotos((current) => {
      const availableSlots = COMMENT_PHOTO_MAX_COUNT - current.length
      if (availableSlots <= 0) {
        setError(`Você pode anexar no máximo ${COMMENT_PHOTO_MAX_COUNT} fotos por comentário.`)
        return current
      }

      const nextPhotos = [...current]
      const batch = incoming.slice(0, availableSlots)

      for (const file of batch) {
        const validationError = validatePhoto(file)
        if (validationError) {
          setError(validationError)
          return current
        }

        nextPhotos.push({
          id: `draft-${crypto.randomUUID()}`,
          file,
          previewUrl: URL.createObjectURL(file),
        })
      }

      if (incoming.length > availableSlots) {
        setError(`Somente ${availableSlots} foto(s) foram adicionadas (limite de ${COMMENT_PHOTO_MAX_COUNT}).`)
      } else {
        setError(null)
      }

      return nextPhotos
    })
  }, [])

  const removePhoto = useCallback((id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
      }
      return current.filter((photo) => photo.id !== id)
    })
    setError(null)
  }, [])

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return {
    photos,
    error,
    inputRef,
    accept: COMMENT_PHOTO_ACCEPT,
    maxCount: COMMENT_PHOTO_MAX_COUNT,
    canAddMore: photos.length < COMMENT_PHOTO_MAX_COUNT,
    addFiles,
    removePhoto,
    openFilePicker,
    clearPhotos,
  }
}
