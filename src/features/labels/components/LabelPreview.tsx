import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { LabelFieldData, LabelRecord, LabelTemplateId } from '@/features/labels/types/label.types'
import { getLabelTemplate } from '@/features/labels/constants/labelTemplates'
import { formatDateBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

function LabelQrCode({ payload, size = 88 }: { payload: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void QRCode.toDataURL(payload, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (active) {
        setDataUrl(url)
      }
    })
    return () => {
      active = false
    }
  }, [payload, size])

  if (!dataUrl) {
    return <div className="size-[88px] rounded bg-muted" aria-hidden />
  }

  return <img src={dataUrl} alt="QR Code da etiqueta" className="size-[88px] rounded" />
}

interface LabelPreviewProps {
  templateId: LabelTemplateId
  data: LabelFieldData
  qrPayload: string
  copies?: number
  className?: string
}

export function LabelPreview({
  templateId,
  data,
  qrPayload,
  copies = 1,
  className,
}: LabelPreviewProps) {
  const template = getLabelTemplate(templateId)

  return (
    <div
      className={cn(
        'label-print-item mx-auto w-full max-w-[320px] overflow-hidden rounded-xl border-2 bg-white text-[#1f160f] shadow-sm',
        className,
      )}
      style={{ borderColor: template.accentColor }}
    >
      <div className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: template.accentColor }}>
        {template.name}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 p-3">
        <div className="min-w-0 space-y-2 text-xs">
          <div>
            <p className="text-[10px] uppercase text-[#6b5b4f]">Produto</p>
            <p className="font-display text-base font-semibold leading-tight">{data.productName}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Categoria" value={data.category} />
            <Field label="Peso" value={data.weight} />
            <Field label="Produção" value={formatDateBr(data.productionDate)} />
            <Field label="Hora" value={data.productionTime} />
            <Field label="Validade" value={formatDateBr(data.expiryDate)} />
            <Field label="Lote" value={data.batchNumber} />
            <Field label="Código" value={data.internalCode} />
            <Field label="Responsável" value={data.responsible} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <LabelQrCode payload={qrPayload} />
          {copies > 1 ? (
            <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium">{copies}x</span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase text-[#6b5b4f]">{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  )
}

interface LabelPrintSheetProps {
  record: LabelRecord
  copies: number
}

export function LabelPrintSheet({ record, copies }: LabelPrintSheetProps) {
  const items = Array.from({ length: Math.max(1, copies) })

  return (
    <div id="label-print-content" className="hidden print:block">
      {items.map((_, index) => (
        <div key={`${record.id}-${index}`} className="label-print-page break-after-page p-4">
          <LabelPreview
            templateId={record.templateId}
            data={record.data}
            qrPayload={record.qrPayload}
          />
        </div>
      ))}
    </div>
  )
}
