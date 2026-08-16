import { ExternalLink, FileSpreadsheet, FileText, FileType } from 'lucide-react'
import { useState } from 'react'
import { Badge, Button, Modal, Skeleton } from '@/components/ui'
import { RecipeExcelPreview } from '@/features/recipes/components/RecipeExcelPreview'
import { OfficeOnlineDocPreview } from '@/features/recipes/components/OfficeOnlineDocPreview'
import { RecipeWordPreview } from '@/features/recipes/components/RecipeWordPreview'
import { useRecipeAttachmentPreview } from '@/features/recipes/hooks/useRecipeAttachmentPreview'
import { useRecipeExcelPreview } from '@/features/recipes/hooks/useRecipeExcelPreview'
import { useRecipeWordPreview } from '@/features/recipes/hooks/useRecipeWordPreview'
import { resolveAttachmentFileUrl } from '@/features/recipes/storage/recipeAttachmentBlobStore'
import type { RecipeAttachment } from '@/features/recipes/types/recipe.types'
import { formatRecipeFileSize, getRecipeFileExtensionLabel } from '@/features/recipes/utils/validateRecipeFile'
import { isLegacyWordDoc } from '@/features/recipes/utils/isLegacyWordDoc'
import { formatDateTimeBr } from '@/utils/formatDate'

const PREVIEW_HEIGHT = 'h-[min(70vh,720px)]'
const FULLSCREEN_HEIGHT = 'h-[min(85vh,960px)]'

function AttachmentIcon({ kind }: { kind: RecipeAttachment['kind'] }) {
  if (kind === 'excel') {
    return <FileSpreadsheet className="size-5" />
  }
  if (kind === 'word') {
    return <FileType className="size-5" />
  }
  return <FileText className="size-5" />
}

export interface RecipeDocumentViewerProps {
  attachment: RecipeAttachment
  compact?: boolean
}

function PdfPreview({ previewUrl, fileName, className }: { previewUrl: string; fileName: string; className?: string }) {
  return (
    <object
      data={`${previewUrl}#toolbar=0&navpanes=0`}
      type="application/pdf"
      className={className}
      aria-label={`Visualização: ${fileName}`}
    >
      <iframe src={previewUrl} title={`Visualização: ${fileName}`} className={className} />
    </object>
  )
}

function PreviewError({
  message,
  fileUrl,
  fileName,
}: {
  message: string
  fileUrl?: string | null
  fileName?: string
}) {
  return (
    <div className="flex h-[min(40vh,360px)] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-foreground">Não foi possível exibir a ficha na tela</p>
      <p className="text-xs text-muted-foreground">{message}</p>
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          {...(fileName ? { download: fileName } : {})}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          <ExternalLink className="size-4" />
          Abrir arquivo no celular
        </a>
      ) : null}
    </div>
  )
}

function RecipeAttachmentPreview({
  attachment,
  className,
}: {
  attachment: RecipeAttachment
  className?: string
}) {
  const pdfPreview = useRecipeAttachmentPreview(attachment.kind === 'pdf' ? attachment : null)
  const excelPreview = useRecipeExcelPreview(attachment.kind === 'excel' ? attachment : null)
  const wordPreview = useRecipeWordPreview(
    attachment.kind === 'word' && !isLegacyWordDoc(attachment.fileName) ? attachment : null,
  )
  const fileUrl = resolveAttachmentFileUrl(attachment.fileUrl)

  if (attachment.kind === 'excel') {
    if (excelPreview.isLoading) {
      return (
        <div className="space-y-3 p-4">
          <Skeleton variant="rectangular" className={className ?? PREVIEW_HEIGHT} />
          <p className="text-center text-xs text-muted-foreground">
            Carregando planilha… arquivos grandes podem levar alguns segundos.
          </p>
        </div>
      )
    }
    if (excelPreview.error || !excelPreview.data) {
      return (
        <PreviewError
          message={excelPreview.error ?? 'Planilha indisponível.'}
          fileUrl={fileUrl}
          fileName={attachment.fileName}
        />
      )
    }
    return <RecipeExcelPreview data={excelPreview.data} className={className ?? PREVIEW_HEIGHT} />
  }

  if (attachment.kind === 'word') {
    if (isLegacyWordDoc(attachment.fileName) && fileUrl) {
      return (
        <OfficeOnlineDocPreview
          fileUrl={fileUrl}
          fileName={attachment.fileName}
          className={className ?? PREVIEW_HEIGHT}
        />
      )
    }

    if (wordPreview.isLoading) {
      return <Skeleton variant="rectangular" className={className ?? PREVIEW_HEIGHT} />
    }
    if (wordPreview.error || !wordPreview.data) {
      if (fileUrl) {
        return (
          <OfficeOnlineDocPreview
            fileUrl={fileUrl}
            fileName={attachment.fileName}
            className={className ?? PREVIEW_HEIGHT}
          />
        )
      }
      return (
        <PreviewError
          message={wordPreview.error ?? 'Documento indisponível.'}
          fileUrl={fileUrl}
          fileName={attachment.fileName}
        />
      )
    }
    return <RecipeWordPreview html={wordPreview.data.html} className={className ?? PREVIEW_HEIGHT} />
  }

  if (pdfPreview.isLoading) {
    return <Skeleton variant="rectangular" className={className ?? PREVIEW_HEIGHT} />
  }
  if (pdfPreview.error || !pdfPreview.previewUrl) {
    return (
      <PreviewError
        message={pdfPreview.error ?? 'PDF indisponível.'}
        fileUrl={fileUrl ?? pdfPreview.previewUrl}
        fileName={attachment.fileName}
      />
    )
  }
  return (
    <PdfPreview
      previewUrl={pdfPreview.previewUrl}
      fileName={attachment.fileName}
      className={className ?? PREVIEW_HEIGHT}
    />
  )
}

export function RecipeDocumentViewer({ attachment, compact = false }: RecipeDocumentViewerProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const { previewUrl } = useRecipeAttachmentPreview(attachment)
  const openUrl = previewUrl ?? resolveAttachmentFileUrl(attachment.fileUrl)

  const openInNewTab = () => {
    if (!openUrl) {
      return
    }
    const link = document.createElement('a')
    link.href = openUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.download = attachment.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-w-0 max-w-full space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            <AttachmentIcon kind={attachment.kind} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{attachment.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {getRecipeFileExtensionLabel(attachment.fileName)} ·{' '}
              {formatRecipeFileSize(attachment.sizeBytes)} ·{' '}
              {formatDateTimeBr(attachment.uploadedAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">Ficha anexa</Badge>
          {!compact ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFullscreenOpen(true)}>
              Tela cheia
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" disabled={!openUrl} onClick={openInNewTab}>
            <ExternalLink className="size-4" />
            Abrir arquivo
          </Button>
        </div>
      </div>

      {!compact ? (
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-muted/20">
          <RecipeAttachmentPreview attachment={attachment} />
        </div>
      ) : null}

      <Modal
        open={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        title={attachment.fileName}
        description="Visualização da ficha técnica"
        size="lg"
      >
        <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border">
          <RecipeAttachmentPreview attachment={attachment} className={FULLSCREEN_HEIGHT} />
        </div>
      </Modal>
    </div>
  )
}

export interface RecipeAttachmentsListProps {
  attachments: RecipeAttachment[]
  compact?: boolean
}

export function RecipeAttachmentsList({ attachments, compact = false }: RecipeAttachmentsListProps) {
  if (attachments.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
  }

  return (
    <div className="space-y-6">
      {attachments.map((attachment) => (
        <RecipeDocumentViewer key={attachment.id} attachment={attachment} compact={compact} />
      ))}
    </div>
  )
}
