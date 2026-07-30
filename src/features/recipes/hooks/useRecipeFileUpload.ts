import { useCallback, useRef, useState } from 'react'
import { RECIPE_FILE_ACCEPT } from '@/features/recipes/constants/recipeFile.constants'
import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'
import {
  fileNameWithoutExtension,
  formatRecipeFileSize,
  getRecipeFileExtensionLabel,
  validateRecipeFile,
} from '@/features/recipes/utils/validateRecipeFile'

interface UseRecipeFileUploadOptions {
  existingAttachment?: RecipeAttachment | null
  onNameSuggestion?: (name: string) => void
}

export function useRecipeFileUpload({
  existingAttachment = null,
  onNameSuggestion,
}: UseRecipeFileUploadOptions = {}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [removeExisting, setRemoveExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeAttachment = removeExisting ? null : existingAttachment
  const previewFile = selectedFile
  const hasAttachment = Boolean(previewFile || activeAttachment)

  const reset = useCallback(() => {
    setSelectedFile(null)
    setRemoveExisting(false)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const handleFileChange = useCallback(
    (file: File | null) => {
      if (!file) {
        setSelectedFile(null)
        setError(null)
        return
      }

      const validationError = validateRecipeFile(file)
      if (validationError) {
        setError(validationError)
        setSelectedFile(null)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
        return
      }

      setError(null)
      setSelectedFile(file)
      setRemoveExisting(false)
      onNameSuggestion?.(fileNameWithoutExtension(file.name))
    },
    [onNameSuggestion],
  )

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const markExistingForRemoval = useCallback(() => {
    setRemoveExisting(true)
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  const displayName = previewFile?.name ?? activeAttachment?.fileName ?? ''
  const displaySize = previewFile
    ? formatRecipeFileSize(previewFile.size)
    : activeAttachment
      ? formatRecipeFileSize(activeAttachment.sizeBytes)
      : ''
  const displayType = displayName ? getRecipeFileExtensionLabel(displayName) : ''

  return {
    inputRef,
    accept: RECIPE_FILE_ACCEPT,
    selectedFile,
    removeExisting,
    error,
    hasAttachment,
    displayName,
    displaySize,
    displayType,
    activeAttachment,
    reset,
    handleFileChange,
    openFilePicker,
    clearSelectedFile,
    markExistingForRemoval,
  }
}
