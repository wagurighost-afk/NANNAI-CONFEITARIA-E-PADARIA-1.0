import { useMemo, useState } from 'react'
import { Camera, Video, X } from 'lucide-react'
import { Button, Input, Select, TextArea } from '@/components/ui'
import { BUG_PRIORITY_OPTIONS } from '@/features/bugs/constants/bugOptions'
import type { BugModuleOption, CreateBugFormInput } from '@/features/bugs/types/bug.types'
import { detectClientEnvironment } from '@/features/bugs/utils/detectClientEnvironment'

const MAX_IMAGES = 3
const MAX_IMAGE_SIZE_MB = 10
const MAX_VIDEO_SIZE_MB = 80

export interface BugReportFormProps {
  modules: BugModuleOption[]
  disabled?: boolean
  isSubmitting?: boolean
  onSubmit: (input: CreateBugFormInput) => Promise<void>
}

export function BugReportForm({
  modules,
  disabled = false,
  isSubmitting = false,
  onSubmit,
}: BugReportFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [moduleId, setModuleId] = useState('outro')
  const [priority, setPriority] = useState<CreateBugFormInput['priority']>('media')
  const [images, setImages] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const environment = useMemo(() => detectClientEnvironment(), [])
  const moduleOptions = useMemo(
    () => modules.map((module) => ({ value: module.id, label: module.name })),
    [modules],
  )

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  )

  const handleImagesChange = (files: FileList | null) => {
    if (!files) {
      return
    }

    const next = [...images]
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        setError('Envie apenas imagens nos anexos de foto.')
        return
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Cada imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB} MB.`)
        return
      }
      if (next.length >= MAX_IMAGES) {
        break
      }
      next.push(file)
    }

    setError(null)
    setImages(next)
  }

  const handleVideoChange = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('video/')) {
      setError('O vídeo deve estar em um formato válido.')
      return
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setError(`O vídeo deve ter no máximo ${MAX_VIDEO_SIZE_MB} MB.`)
      return
    }

    setError(null)
    setVideo(file)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Informe um título para o bug.')
      return
    }
    if (!description.trim()) {
      setError('Descreva o problema encontrado.')
      return
    }
    if (images.length === 0) {
      setError('Anexe pelo menos uma imagem do problema.')
      return
    }

    setError(null)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        moduleId,
        priority,
        images,
        ...(video ? { video } : {}),
      })

      setTitle('')
      setDescription('')
      setModuleId('outro')
      setPriority('media')
      setImages([])
      setVideo(null)
    } catch {
      // Erro tratado pelo componente pai.
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
      <div>
        <h2 className="text-base font-semibold">Reportar novo bug</h2>
        <p className="text-sm text-muted-foreground">
          Descreva o problema com o máximo de detalhes. SO, navegador e versão do app são
          detectados automaticamente.
        </p>
      </div>

      <Input
        label="Título"
        value={title}
        disabled={disabled || isSubmitting}
        placeholder="Ex.: Erro ao salvar produção do turno da manhã"
        onChange={(event) => setTitle(event.target.value)}
      />

      <TextArea
        label="Descrição"
        rows={4}
        value={description}
        disabled={disabled || isSubmitting}
        placeholder="Passos para reproduzir, comportamento esperado e o que aconteceu..."
        onChange={(event) => setDescription(event.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Módulo"
          value={moduleId}
          options={moduleOptions}
          disabled={disabled || isSubmitting}
          onChange={(event) => setModuleId(event.target.value)}
        />
        <Select
          label="Prioridade"
          value={priority}
          options={BUG_PRIORITY_OPTIONS}
          disabled={disabled || isSubmitting}
          onChange={(event) =>
            setPriority(event.target.value as CreateBugFormInput['priority'])
          }
        />
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-muted/10 p-3 text-sm sm:grid-cols-3">
        <Info label="Sistema operacional" value={environment.os} />
        <Info label="Navegador" value={environment.browser} />
        <Info label="Versão do app" value={environment.appVersion} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Imagens (obrigatório)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || isSubmitting || images.length >= MAX_IMAGES}
          className="block w-full text-sm"
          onChange={(event) => handleImagesChange(event.target.files)}
        />
        <p className="text-xs text-muted-foreground">
          Até {MAX_IMAGES} imagens, {MAX_IMAGE_SIZE_MB} MB cada.
        </p>
        {imagePreviews.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={preview.url} className="relative">
                <img
                  src={preview.url}
                  alt=""
                  className="size-20 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow"
                  onClick={() => setImages((current) => current.filter((_, i) => i !== index))}
                  aria-label="Remover imagem"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Camera className="size-4" aria-hidden />
            Nenhuma imagem anexada.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Vídeo (opcional)</label>
        <input
          type="file"
          accept="video/*"
          disabled={disabled || isSubmitting}
          className="block w-full text-sm"
          onChange={(event) => handleVideoChange(event.target.files)}
        />
        {video ? (
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="inline-flex items-center gap-2 truncate">
              <Video className="size-4 shrink-0" aria-hidden />
              {video.name}
            </span>
            <button type="button" onClick={() => setVideo(null)} aria-label="Remover vídeo">
              <X className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button disabled={disabled || isSubmitting} onClick={() => void handleSubmit()}>
        {isSubmitting ? 'Enviando...' : 'Reportar bug'}
      </Button>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
