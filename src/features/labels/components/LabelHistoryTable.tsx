import { Printer, RotateCcw } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import { getLabelTemplateName } from '@/features/labels/constants/labelTemplates'
import type { LabelRecord } from '@/features/labels/types/label.types'
import { formatDateBr, formatDateTimeBr } from '@/utils/formatDate'

interface LabelHistoryTableProps {
  items: LabelRecord[]
  onReprint: (record: LabelRecord) => void
  onPreview: (record: LabelRecord) => void
}

export function LabelHistoryTable({ items, onReprint, onPreview }: LabelHistoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Nenhuma etiqueta impressa ainda.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated">
      <table className="min-w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Produto</th>
            <th className="px-4 py-3">Modelo</th>
            <th className="px-4 py-3">Lote</th>
            <th className="px-4 py-3">Validade</th>
            <th className="px-4 py-3">Impressão</th>
            <th className="px-4 py-3">Cópias</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((record) => (
            <tr key={record.id} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{record.data.productName}</div>
                <div className="text-xs text-muted-foreground">{record.data.internalCode}</div>
              </td>
              <td className="px-4 py-3">
                <Badge variant="muted">{getLabelTemplateName(record.templateId)}</Badge>
              </td>
              <td className="px-4 py-3">{record.data.batchNumber}</td>
              <td className="px-4 py-3">{formatDateBr(record.data.expiryDate)}</td>
              <td className="px-4 py-3">
                <div>{formatDateTimeBr(record.printedAt)}</div>
                <div className="text-xs text-muted-foreground">{record.printedByName}</div>
              </td>
              <td className="px-4 py-3">{record.copies}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => onPreview(record)}>
                    Ver
                  </Button>
                  <Button type="button" size="sm" onClick={() => onReprint(record)}>
                    <RotateCcw className="size-4" />
                    Reimprimir
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LabelHistoryEmptyAction({ onCreate }: { onCreate: () => void }) {
  return (
    <Button type="button" onClick={onCreate}>
      <Printer className="size-4" />
      Nova etiqueta
    </Button>
  )
}
