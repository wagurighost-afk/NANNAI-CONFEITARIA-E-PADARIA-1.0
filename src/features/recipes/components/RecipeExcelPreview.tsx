import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui'
import {
  columnLabel,
  type ExcelCell,
  type ExcelPreviewData,
  type ExcelRowKind,
} from '@/features/recipes/utils/parseExcelPreview'
import { cn } from '@/utils/cn'

const ZOOM_LEVELS = [0.85, 1, 1.15, 1.3] as const

export interface RecipeExcelPreviewProps {
  data: ExcelPreviewData
  className?: string
}

function getVisibleColumnCount(rows: ExcelCell[][]): number {
  return rows.reduce((max, row) => Math.max(max, row.length), 0)
}

function rowClassName(rowKind: ExcelRowKind, rowIndex: number): string {
  if (rowKind === 'section') {
    return 'bg-accent/15'
  }
  if (rowKind === 'header') {
    return 'bg-muted/70'
  }
  if (rowKind === 'empty') {
    return 'bg-muted/10'
  }
  return rowIndex % 2 === 0 ? 'bg-surface' : 'bg-surface-elevated/70'
}

function cellClassName(cell: ExcelCell, rowKind: ExcelRowKind): string {
  if (rowKind === 'section') {
    return 'text-center font-display text-sm font-semibold text-foreground'
  }
  if (rowKind === 'header') {
    return 'font-semibold text-foreground'
  }
  if (cell.kind === 'numeric') {
    return 'text-right font-mono tabular-nums text-foreground'
  }
  if (!cell.value) {
    return 'text-muted-foreground/30'
  }
  return 'text-foreground'
}

export function RecipeExcelPreview({ data, className }: RecipeExcelPreviewProps) {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(1)
  const sheet = data.sheets[activeSheetIndex] ?? data.sheets[0]
  const zoom = ZOOM_LEVELS[zoomIndex] ?? 1

  const columnCount = useMemo(
    () => (sheet ? getVisibleColumnCount(sheet.rows) : 0),
    [sheet],
  )

  if (!sheet) {
    return (
      <p className="p-6 text-sm text-muted-foreground">Nenhuma aba encontrada na planilha.</p>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden bg-[#f6f1ea]', className)}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 py-2">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{sheet.name}</p>
          <p className="text-xs text-muted-foreground">
            {sheet.totalRows} linhas · {sheet.totalCols} colunas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((current) => Math.max(0, current - 1))}
            aria-label="Diminuir zoom"
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-12 text-center text-xs font-medium text-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 px-0"
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((current) => Math.min(ZOOM_LEVELS.length - 1, current + 1))}
            aria-label="Aumentar zoom"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain p-3">
        <div
          className="inline-block min-w-full max-w-none rounded-xl border border-border bg-surface-elevated shadow-sm"
          style={{ fontSize: `${0.875 * zoom}rem` }}
        >
          <table className="w-max min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 w-12 border border-border bg-muted px-2 py-2 text-center text-[11px] font-semibold text-muted-foreground">
                  #
                </th>
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <th
                    key={colIndex}
                    className="min-w-[140px] border border-border bg-muted px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {columnLabel(colIndex)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((row, rowIndex) => {
                const rowKind = sheet.rowKinds[rowIndex] ?? 'data'

                if (rowKind === 'section') {
                  const title = row.find((cell) => cell.value)?.value ?? ''
                  return (
                    <tr key={rowIndex} className="bg-accent/15">
                      <td className="sticky left-0 z-10 border border-border bg-muted/80 px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">
                        {rowIndex + 1}
                      </td>
                      <td
                        colSpan={columnCount}
                        className="border border-border px-4 py-3 text-center font-display text-base font-semibold tracking-wide text-foreground"
                      >
                        {title}
                      </td>
                    </tr>
                  )
                }

                if (rowKind === 'empty') {
                  return (
                    <tr key={rowIndex} className={rowClassName(rowKind, rowIndex)}>
                      <td className="sticky left-0 z-10 border border-border bg-muted/80 px-2 py-1 text-center text-[11px] text-muted-foreground">
                        {rowIndex + 1}
                      </td>
                      <td
                        colSpan={columnCount}
                        className="border border-border px-3 py-1 text-xs text-muted-foreground/40"
                      >
                        &nbsp;
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={rowIndex} className={rowClassName(rowKind, rowIndex)}>
                    <td className="sticky left-0 z-10 border border-border bg-muted/80 px-2 py-2 text-center text-[11px] font-medium text-muted-foreground">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => {
                      if (cell.skip) {
                        return null
                      }

                      return (
                        <td
                          key={colIndex}
                          colSpan={cell.colSpan}
                          rowSpan={cell.rowSpan}
                          className={cn(
                            'border border-border px-3 py-2 align-middle whitespace-pre-wrap break-words',
                            cellClassName(cell, rowKind),
                          )}
                        >
                          {cell.value || (rowKind === 'data' ? '' : '\u00a0')}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data.sheets.length > 1 ? (
        <div className="flex min-w-0 max-w-full flex-wrap gap-1 border-t border-border bg-muted/40 px-3 py-2">
          {data.sheets.map((item, index) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveSheetIndex(index)}
              className={cn(
                'max-w-full truncate rounded-t-lg border border-b-0 px-4 py-2 text-xs font-medium transition-colors',
                index === activeSheetIndex
                  ? 'border-border bg-surface-elevated text-foreground shadow-sm'
                  : 'border-transparent bg-transparent text-muted-foreground hover:bg-surface/80 hover:text-foreground',
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      {sheet.truncatedRows || sheet.truncatedCols ? (
        <p className="border-t border-border bg-surface px-4 py-2 text-xs text-muted-foreground">
          Exibindo até {sheet.rows.length} linhas e {columnCount} colunas de {sheet.totalRows} ×{' '}
          {sheet.totalCols} células.
        </p>
      ) : null}
    </div>
  )
}
