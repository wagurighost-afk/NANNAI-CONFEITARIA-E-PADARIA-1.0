import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { buildLabelLayout } from '@/features/labels/layout/labelLayoutEngine'
import { readPreferredLabelSize } from '@/features/labels/constants/labelSizes'
import type { LabelFieldData, LabelRecord } from '@/features/labels/types/label.types'
import type { NiimbotPrintSize } from '@/services/niimbot/printModels'
import { cn } from '@/utils/cn'

export interface LabelPreviewProps {
  data: LabelFieldData
  qrPayload: string
  size?: NiimbotPrintSize
  copies?: number
  className?: string
}

export function LabelPreview({
  data,
  qrPayload,
  size,
  copies = 1,
  className,
}: LabelPreviewProps) {
  const resolvedSize = size ?? readPreferredLabelSize(203)
  const layout = useMemo(
    () => buildLabelLayout({ size: resolvedSize, data }),
    [data, resolvedSize],
  )
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(qrPayload, {
      width: layout.qr.size,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (active) {
        setQrDataUrl(url)
      }
    })
    return () => {
      active = false
    }
  }, [layout.qr.size, qrPayload])

  const aspectRatio = resolvedSize.w_mm / resolvedSize.h_mm
  const contentWidth = layout.dimensions.width - layout.dimensions.padding * 2

  return (
    <div
      className={cn('mx-auto w-full', className)}
      style={{ maxWidth: `${Math.min(420, resolvedSize.w_mm * 6)}px` }}
    >
      <div
        className="relative overflow-hidden rounded-xl border-2 border-[#1f160f]/15 bg-white text-[#1f160f] shadow-sm"
        style={{ aspectRatio }}
      >
        <div
          className="absolute inset-0 flex flex-col"
          style={{ padding: `${(layout.dimensions.padding / layout.dimensions.width) * 100}%` }}
        >
          <div
            className="flex flex-col items-center justify-center text-center"
            style={{
              minHeight: `${(layout.productName.areaHeight / layout.dimensions.height) * 100}%`,
            }}
          >
            {layout.productName.lines.map((line, index) => (
              <p
                key={`${line.text}-${index}`}
                className="w-full font-bold leading-none"
                style={{
                  fontSize: `${(line.fontSize / contentWidth) * 100}cqmin`,
                  marginBottom: `${((line.lineHeight - line.fontSize) / layout.dimensions.height) * 100}%`,
                }}
              >
                {line.text}
              </p>
            ))}
          </div>

          <div className="text-center">
            {layout.details.map((row, index) => (
              <p
                key={`${row.text}-${index}`}
                className="font-medium leading-snug"
                style={{ fontSize: `${(row.fontSize / contentWidth) * 100}cqmin` }}
              >
                {row.text}
              </p>
            ))}
          </div>

          <div className="mt-auto flex justify-center pt-1">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code da etiqueta"
                style={{
                  width: `${(layout.qr.size / layout.dimensions.width) * 100}%`,
                  aspectRatio: '1 / 1',
                }}
              />
            ) : (
              <div
                className="rounded bg-muted"
                style={{
                  width: `${(layout.qr.size / layout.dimensions.width) * 100}%`,
                  aspectRatio: '1 / 1',
                }}
                aria-hidden
              />
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {resolvedSize.label}
        {copies > 1 ? ` · ${copies} cópia(s)` : ''}
      </p>
    </div>
  )
}

interface LabelPrintSheetProps {
  record: LabelRecord
  copies: number
  size?: NiimbotPrintSize
}

export function LabelPrintSheet({ record, copies, size }: LabelPrintSheetProps) {
  const items = Array.from({ length: Math.max(1, copies) })

  return (
    <div id="label-print-content" className="hidden print:block">
      {items.map((_, index) => (
        <div key={`${record.id}-${index}`} className="label-print-page break-after-page p-4">
          <LabelPreview
            data={record.data}
            qrPayload={record.qrPayload}
            {...(size ? { size } : {})}
          />
        </div>
      ))}
    </div>
  )
}
