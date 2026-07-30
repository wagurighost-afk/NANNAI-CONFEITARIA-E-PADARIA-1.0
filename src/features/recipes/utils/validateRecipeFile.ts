import {
  RECIPE_FILE_EXTENSIONS,
  RECIPE_FILE_EXTENSION_LABELS,
  RECIPE_FILE_MAX_SIZE_BYTES,
  RECIPE_FILE_MAX_SIZE_LABEL,
  type RecipeFileExtension,
} from '@/features/recipes/constants/recipeFile.constants'

function getExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index === -1) {
    return ''
  }
  return fileName.slice(index).toLowerCase()
}

export function isAllowedRecipeFileExtension(extension: string): extension is RecipeFileExtension {
  return RECIPE_FILE_EXTENSIONS.includes(extension as RecipeFileExtension)
}

export function validateRecipeFile(file: File): string | null {
  const extension = getExtension(file.name)

  if (!isAllowedRecipeFileExtension(extension)) {
    return 'Formato não permitido. Envie PDF, XLS, XLSX, DOC ou DOCX.'
  }

  if (file.size > RECIPE_FILE_MAX_SIZE_BYTES) {
    return `Arquivo muito grande. Tamanho máximo: ${RECIPE_FILE_MAX_SIZE_LABEL}.`
  }

  if (file.size === 0) {
    return 'O arquivo está vazio.'
  }

  return null
}

export function formatRecipeFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getRecipeFileExtensionLabel(fileName: string): string {
  const extension = getExtension(fileName)
  if (!isAllowedRecipeFileExtension(extension)) {
    return 'Documento'
  }
  return RECIPE_FILE_EXTENSION_LABELS[extension]
}

export function fileNameWithoutExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  if (index <= 0) {
    return fileName
  }
  return fileName.slice(0, index)
}
