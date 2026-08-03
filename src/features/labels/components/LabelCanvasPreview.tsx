import { useEffect, useState } from 'react'
import { renderNiimbotLabelDataUrl } from '@/features/labels/printer/renderNiimbotLabel'
import type { LabelFieldData } from '@/features/labels/types/label.types'
import type { NiimbotPrintSize } from '@/services/niimbot/printModels'
import { cn } from '@/utils/cn'

export interface LabelCanvasPreviewProps {
  data: LabelFieldData
  qrPayload: string
  size: NiimbotPrintSize
  copies?: number
  className?: string
}

/**
 * Pré-visualização fiel ao que será enviado para a NIIMBOT (mesmo renderer do canvas).
 */
export function LabelCanvasPreview({
  data,
  qrPayload,
  size,
  copies = 1,
  className,
}: LabelCanvasPreviewProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setError(null)

    void renderNiimbotLabelDataUrl({ size, data, qrPayload })
      .then((url) => {
        if (active) {
          setDataUrl(url)
        }
      })
      .catch((renderError: unknown) => {
        if (active) {
          setDataUrl(null)
          setError(
            renderError instanceof Error
              ? renderError.message
              : 'Não foi possível gerar a pré-visualização.',
          )
        }
      })

    return () => {
      active = false
    }
  }, [data, qrPayload, size])

  const aspectRatio = size.w_mm / size.h_mm

  return (
    <div className={cn('mx-auto w-full', className)} style={{ maxWidth: '420px' }}>
      <div
        className="overflow-hidden rounded-xl border-2 border-[#1f160f]/15 bg-white shadow-sm"
        style={{ aspectRatio }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Pré-visualização da etiqueta"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center bg-muted/30 text-xs text-muted-foreground">
            {error ?? 'Gerando pré-visualização…'}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {size.label} · visualização real de impressão
        {copies > 1 ? ` · ${copies} cópia(s)` : ''}
      </p>
    </div>
  )
}
