import { ExternalLink } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface OfficeOnlineDocPreviewProps {
  fileUrl: string
  fileName: string
  className?: string
}

function buildOfficeViewerUrl(fileUrl: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
}

function buildGoogleViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`
}

export function OfficeOnlineDocPreview({ fileUrl, fileName, className }: OfficeOnlineDocPreviewProps) {
  const officeUrl = buildOfficeViewerUrl(fileUrl)

  return (
    <div className="space-y-3">
      <iframe
        src={officeUrl}
        title={`Visualização: ${fileName}`}
        className={cn('w-full rounded-xl border border-border bg-white', className)}
      />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-muted-foreground">
          Arquivo Word (.doc). Se a visualização não carregar, abra o arquivo no celular.
        </p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          <ExternalLink className="size-4" />
          Abrir no Word / celular
        </a>
        <a
          href={buildGoogleViewerUrl(fileUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent underline-offset-2 hover:underline"
        >
          Tentar visualizador alternativo
        </a>
      </div>
    </div>
  )
}
