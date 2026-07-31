import { useCallback, useEffect, useRef, useState } from 'react'
import {
  EMPLOYEE_PHOTO_ACCEPT,
  EMPLOYEE_PHOTO_MAX_SIZE,
  EMPLOYEE_PHOTO_MAX_SIZE_LABEL,
} from '@/features/employees/constants/employeePhoto.constants'
import { resolveEmployeePhotoUrl } from '@/features/employees/utils/employeePhoto'

function validatePhoto(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Selecione apenas imagens (JPG, PNG ou WebP).'
  }

  if (file.size > EMPLOYEE_PHOTO_MAX_SIZE) {
    return `A foto deve ter no máximo ${EMPLOYEE_PHOTO_MAX_SIZE_LABEL}.`
  }

  return null
}

export interface UseEmployeePhotoOptions {
  existingPhotoUrl?: string | undefined
}

export function useEmployeePhoto({ existingPhotoUrl }: UseEmployeePhotoOptions = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined)
  const [existingPreviewUrl, setExistingPreviewUrl] = useState<string | undefined>(undefined)
  const [removeExisting, setRemoveExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    void resolveEmployeePhotoUrl(existingPhotoUrl).then((url) => {
      if (!cancelled) {
        setExistingPreviewUrl(url)
      }
    })

    return () => {
      cancelled = true
    }
  }, [existingPhotoUrl])

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const clearSelectedFile = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = undefined
    }
    setSelectedFile(null)
    setPreviewUrl(undefined)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) {
        return
      }

      const validationError = validatePhoto(file)
      if (validationError) {
        setError(validationError)
        return
      }

      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }

      const nextPreview = URL.createObjectURL(file)
      previewRef.current = nextPreview
      setSelectedFile(file)
      setPreviewUrl(nextPreview)
      setRemoveExisting(false)
      setError(null)
    },
    [],
  )

  const markExistingForRemoval = useCallback(() => {
    clearSelectedFile()
    setRemoveExisting(true)
    setExistingPreviewUrl(undefined)
  }, [clearSelectedFile])

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const reset = useCallback(() => {
    clearSelectedFile()
    setRemoveExisting(false)
    setError(null)
  }, [clearSelectedFile])

  const displayUrl = removeExisting ? previewUrl : (previewUrl ?? existingPreviewUrl)
  const hasPhoto = Boolean(displayUrl)

  return {
    selectedFile,
    removeExisting,
    displayUrl,
    hasPhoto,
    error,
    inputRef,
    accept: EMPLOYEE_PHOTO_ACCEPT,
    handleFileChange,
    markExistingForRemoval,
    openFilePicker,
    reset,
    clearSelectedFile,
  }
}
