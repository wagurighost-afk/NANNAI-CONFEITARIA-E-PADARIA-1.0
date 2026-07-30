export const RECIPE_FILE_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.doc', '.docx'] as const

export type RecipeFileExtension = (typeof RECIPE_FILE_EXTENSIONS)[number]

export const RECIPE_FILE_ACCEPT = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',')

export const RECIPE_FILE_MAX_SIZE_BYTES = 500 * 1024 * 1024 // 500 MB

export const RECIPE_FILE_MAX_SIZE_LABEL = '500 MB'

export const RECIPE_FILE_EXTENSION_LABELS: Record<RecipeFileExtension, string> = {
  '.pdf': 'PDF',
  '.xls': 'Excel',
  '.xlsx': 'Excel',
  '.doc': 'Word',
  '.docx': 'Word',
}
