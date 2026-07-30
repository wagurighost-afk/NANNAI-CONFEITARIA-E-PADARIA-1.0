import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { RECIPE_FILE_ACCEPT, RECIPE_FILE_MAX_SIZE_LABEL } from '@/features/recipes/constants/recipeFile.constants'
import { validateRecipeFile } from '@/features/recipes/utils/validateRecipeFile'

export interface MonthlyScheduleUploadProps {
  disabled?: boolean
  onUpload: (file: File) => Promise<void>
}

export function MonthlyScheduleUpload({ disabled = false, onUpload }: MonthlyScheduleUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File | null) => {
    if (!file) {
      return
    }

    const validationError = validateRecipeFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsUploading(true)
    try {
      await onUpload(file)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao importar escala.')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border p-4">
      <div className="mb-3">
        <p className="text-sm font-medium">Importar escala do mês</p>
        <p className="text-xs text-muted-foreground">
          PDF, XLS, XLSX, DOC ou DOCX — até {RECIPE_FILE_MAX_SIZE_LABEL}. Planilhas Excel importam
          folgas automaticamente.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={RECIPE_FILE_ACCEPT}
        className="sr-only"
        disabled={disabled || isUploading}
        onChange={(event) => {
          void handleFile(event.target.files?.[0] ?? null)
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled || isUploading}
        isLoading={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        Enviar escala
      </Button>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  )
}
