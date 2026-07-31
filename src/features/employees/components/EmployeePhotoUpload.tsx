import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { Avatar } from '@/components/ui/Avatar'
import { EMPLOYEE_PHOTO_MAX_SIZE_LABEL } from '@/features/employees/constants/employeePhoto.constants'
import { useEmployeePhoto } from '@/features/employees/hooks/useEmployeePhoto'
import { cn } from '@/utils/cn'

export interface EmployeePhotoUploadProps {
  employeeName?: string
  existingPhotoUrl?: string | undefined
  disabled?: boolean
  compact?: boolean
  className?: string
  onPhotoChange?: (input: { file: File | null; removeExisting: boolean }) => void
}

export function EmployeePhotoUpload({
  employeeName = 'Colaborador',
  existingPhotoUrl,
  disabled = false,
  compact = false,
  className,
  onPhotoChange,
}: EmployeePhotoUploadProps) {
  const photo = useEmployeePhoto({ existingPhotoUrl })

  const notifyChange = (file: File | null, removeExisting: boolean) => {
    onPhotoChange?.({ file, removeExisting })
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <button
          type="button"
          disabled={disabled}
          onClick={photo.openFilePicker}
          className={cn(
            'group relative shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          )}
          aria-label={photo.hasPhoto ? 'Trocar foto do colaborador' : 'Adicionar foto do colaborador'}
        >
          <Avatar
            src={photo.displayUrl}
            alt={employeeName}
            size={compact ? 'md' : 'lg'}
            className={cn(
              !compact && 'size-24 text-2xl',
              'ring-2 ring-border transition group-hover:ring-accent/60',
            )}
          />
          {!disabled ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/35">
              <Camera className="size-5 text-white opacity-0 transition group-hover:opacity-100" />
            </span>
          ) : null}
        </button>

        <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
          <div>
            <p className="text-sm font-medium text-foreground">Foto do colaborador</p>
            <p className="text-xs text-muted-foreground">
              Toque na foto ou use os botões abaixo. JPG, PNG ou WebP — até{' '}
              {EMPLOYEE_PHOTO_MAX_SIZE_LABEL}.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={photo.openFilePicker}
            >
              <ImagePlus className="size-4" />
              {photo.hasPhoto ? 'Trocar foto' : 'Escolher foto'}
            </Button>

            {photo.hasPhoto && !disabled ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (photo.selectedFile) {
                    photo.clearSelectedFile()
                    notifyChange(null, photo.removeExisting)
                    return
                  }
                  photo.markExistingForRemoval()
                  notifyChange(null, true)
                }}
              >
                <Trash2 className="size-4" />
                Remover
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={photo.inputRef}
        type="file"
        accept={photo.accept}
        capture="environment"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null
          photo.handleFileChange(file)
          notifyChange(file, false)
        }}
      />

      {photo.error ? <p className="text-xs text-danger">{photo.error}</p> : null}
    </div>
  )
}
