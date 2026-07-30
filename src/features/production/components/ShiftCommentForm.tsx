import { useState } from 'react'
import { Camera, X } from 'lucide-react'
import { Button, TextArea } from '@/components/ui'
import {
  COMMENT_PHOTO_MAX_COUNT,
  COMMENT_PHOTO_MAX_SIZE_LABEL,
} from '@/features/production/constants/commentPhoto.constants'
import { useShiftCommentPhotos } from '@/features/production/hooks/useShiftCommentPhotos'
import { shiftCommentSchema } from '@/features/production/schemas/production.schema'

export interface ShiftCommentSubmitInput {
  message: string
  photos: File[]
}

export interface ShiftCommentFormProps {
  disabled?: boolean
  isSending?: boolean
  onSubmit: (input: ShiftCommentSubmitInput) => Promise<void>
}

export function ShiftCommentForm({
  disabled = false,
  isSending = false,
  onSubmit,
}: ShiftCommentFormProps) {
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const photoUpload = useShiftCommentPhotos()

  const handleSubmit = async () => {
    const validation = shiftCommentSchema.safeParse({
      message,
      photoCount: photoUpload.photos.length,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message ?? 'Comentário inválido.')
      return
    }

    setFormError(null)

    try {
      await onSubmit({
        message: message.trim(),
        photos: photoUpload.photos.map((photo) => photo.file),
      })
      setMessage('')
      photoUpload.clearPhotos()
    } catch {
      // Erros de envio são tratados pelo componente pai.
    }
  }

  const displayError = formError ?? photoUpload.error

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-dashed border-border p-4">
      <TextArea
        label="Novo comentário do turno"
        rows={3}
        value={message}
        disabled={disabled || isSending}
        placeholder="Descreva o andamento, pendências ou observações do turno..."
        onChange={(event) => {
          setMessage(event.target.value)
          if (formError) {
            setFormError(null)
          }
        }}
      />

      <input
        ref={photoUpload.inputRef}
        type="file"
        accept={photoUpload.accept}
        multiple
        className="sr-only"
        disabled={disabled || isSending || !photoUpload.canAddMore}
        onChange={(event) => {
          const files = event.target.files
          if (files) {
            photoUpload.addFiles(files)
          }
          event.target.value = ''
        }}
      />

      {photoUpload.photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {photoUpload.photos.map((photo) => (
            <div
              key={photo.id}
              className="relative overflow-hidden rounded-lg border border-border"
            >
              <img
                src={photo.previewUrl}
                alt={photo.file.name}
                className="aspect-square w-full object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 bg-surface/90 px-2"
                aria-label={`Remover ${photo.file.name}`}
                disabled={disabled || isSending}
                onClick={() => {
                  photoUpload.removePhoto(photo.id)
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={disabled || isSending || !photoUpload.canAddMore}
          onClick={photoUpload.openFilePicker}
        >
          <Camera className="size-4" />
          Adicionar fotos
        </Button>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          Até {COMMENT_PHOTO_MAX_COUNT} fotos · {COMMENT_PHOTO_MAX_SIZE_LABEL} cada
        </p>
      </div>

      {displayError ? <p className="text-xs text-danger">{displayError}</p> : null}

      <Button
        type="button"
        className="w-full sm:w-auto"
        isLoading={isSending}
        disabled={disabled}
        onClick={handleSubmit}
      >
        Enviar comentário
      </Button>
    </div>
  )
}
