import { FileSpreadsheet, FileText, FileType, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { RECIPE_FILE_MAX_SIZE_LABEL } from '@/features/recipes/constants/recipeFile.constants'
import { useRecipeFileUpload } from '@/features/recipes/hooks/useRecipeFileUpload'
import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'
import { cn } from '@/utils/cn'

export interface RecipeDocumentUploadProps {
  existingAttachment?: RecipeAttachment | null
  disabled?: boolean
  onNameSuggestion?: (name: string) => void
  onFileChange?: (file: File | null, removeExisting: boolean) => void
  className?: string
}

function AttachmentIcon({ kind }: { kind: RecipeAttachment['kind'] | 'unknown' }) {
  if (kind === 'excel') {
    return <FileSpreadsheet className="size-5" />
  }
  if (kind === 'word') {
    return <FileType className="size-5" />
  }
  return <FileText className="size-5" />
}

export function RecipeDocumentUpload({
  existingAttachment = null,
  disabled = false,
  onNameSuggestion,
  onFileChange,
  className,
}: RecipeDocumentUploadProps) {
  const upload = useRecipeFileUpload({
    existingAttachment,
    ...(onNameSuggestion ? { onNameSuggestion } : {}),
  })

  const notifyChange = (file: File | null, removeExisting: boolean) => {
    onFileChange?.(file, removeExisting)
  }

  const kind = upload.selectedFile
    ? upload.displayType === 'Excel'
      ? 'excel'
      : upload.displayType === 'Word'
        ? 'word'
        : 'pdf'
    : (upload.activeAttachment?.kind ?? 'pdf')

  return (
    <div className={cn('space-y-3 rounded-xl border border-dashed border-border p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Documento da ficha técnica</p>
          <p className="text-xs text-muted-foreground">
            PDF, XLS, XLSX, DOC ou DOCX — até {RECIPE_FILE_MAX_SIZE_LABEL}
          </p>
        </div>
        <Upload className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>

      <input
        ref={upload.inputRef}
        type="file"
        accept={upload.accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null
          upload.handleFileChange(file)
          notifyChange(file, false)
        }}
      />

      {upload.hasAttachment ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-surface p-2 text-muted-foreground">
              <AttachmentIcon kind={kind} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{upload.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {upload.displayType} · {upload.displaySize}
              </p>
            </div>
          </div>
          {!disabled ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2"
              aria-label="Remover arquivo"
              onClick={() => {
                if (upload.selectedFile) {
                  upload.clearSelectedFile()
                  notifyChange(null, upload.removeExisting)
                  return
                }
                upload.markExistingForRemoval()
                notifyChange(null, true)
              }}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={upload.openFilePicker}
        >
          <Upload className="size-4" />
          Selecionar arquivo
        </Button>
      )}

      {upload.error ? <p className="text-xs text-danger">{upload.error}</p> : null}
    </div>
  )
}
