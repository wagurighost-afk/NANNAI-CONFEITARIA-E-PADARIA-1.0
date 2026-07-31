import { ExternalLink } from 'lucide-react'
import { RecipeWordPreview } from '@/features/recipes/components/RecipeWordPreview'
import { usePopDocPreview } from '@/features/pop/hooks/usePopDocPreview'
import { Skeleton } from '@/components/ui'

export interface PopDocumentPreviewProps {
  fileUrl: string
  fileName: string
}

export function PopDocumentPreview({ fileUrl, fileName }: PopDocumentPreviewProps) {
  const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin}${fileUrl}`
  const { data, isLoading, error } = usePopDocPreview(fileUrl)

  if (isLoading) {
    return <Skeleton variant="rectangular" height={480} />
  }

  if (error || !data) {
    return (
      <div className="flex h-[min(50vh,480px)] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-foreground">Não foi possível exibir o POP na tela</p>
        <p className="text-xs text-muted-foreground">{error ?? 'Documento indisponível.'}</p>
        <a
          href={absoluteUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          <ExternalLink className="size-4" />
          Abrir documento
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <RecipeWordPreview html={data.html} className="h-[min(70vh,720px)] rounded-xl border border-border" />
      <div className="flex justify-center">
        <a
          href={absoluteUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-muted"
        >
          <ExternalLink className="size-4" />
          Abrir no Word / celular
        </a>
      </div>
    </div>
  )
}
