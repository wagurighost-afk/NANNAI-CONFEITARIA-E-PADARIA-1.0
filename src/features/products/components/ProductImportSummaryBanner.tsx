import type { ProductImportSummary } from '@/features/products/types/product.types'
import { formatDateTimeBr } from '@/utils/formatDate'

export function ProductImportSummaryBanner({ summary }: { summary: ProductImportSummary }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">Resultado da importação — {summary.partLabel}</p>
      <p className="mt-1 text-muted-foreground">
        <span className="text-foreground">{summary.created}</span> cadastrados ·{' '}
        <span className="text-foreground">{summary.updated}</span> atualizados ·{' '}
        <span className="text-foreground">{summary.ignored}</span> ignorados
        {summary.importedAt ? ` · ${formatDateTimeBr(summary.importedAt)}` : null}
      </p>
    </div>
  )
}
