import { Fragment } from 'react'
import { Input } from '@/components/ui'
import {
  WASTE_PHASE_LABELS,
  WASTE_PHASES,
} from '@/features/waste-control/constants/wasteControl.constants'
import type {
  WasteControlProduct,
  WastePhase,
  WastePhaseDraft,
} from '@/features/waste-control/types/wasteControl.types'
import { formatWasteMoney, roundWasteKg, roundWasteMoney } from '@/features/waste-control/utils/wasteControlFormat'

export interface WasteDailyColumnsTableProps {
  products: WasteControlProduct[]
  phaseDrafts: Record<WastePhase, WastePhaseDraft>
  onChange: (phase: WastePhase, productId: string, field: 'units' | 'wasteKg', value: number) => void
  search: string
}

function getEntry(
  drafts: Record<WastePhase, WastePhaseDraft>,
  phase: WastePhase,
  productId: string,
) {
  return drafts[phase][productId] ?? { units: 0, wasteKg: 0 }
}

function rowTotal(product: WasteControlProduct, drafts: Record<WastePhase, WastePhaseDraft>) {
  return roundWasteMoney(
    WASTE_PHASES.reduce((sum, phase) => {
      const entry = getEntry(drafts, phase, product.id)
      return sum + entry.wasteKg * product.unitPrice
    }, 0),
  )
}

export function WasteDailyColumnsTable({
  products,
  phaseDrafts,
  onChange,
  search,
}: WasteDailyColumnsTableProps) {
  const query = search.trim().toLowerCase()
  const filtered = query
    ? products.filter((product) => product.name.toLowerCase().includes(query))
    : products

  const phaseTotals = WASTE_PHASES.reduce(
    (acc, phase) => {
      let wasteKg = 0
      let cost = 0
      for (const product of filtered) {
        const entry = getEntry(phaseDrafts, phase, product.id)
        wasteKg += entry.wasteKg
        cost += entry.wasteKg * product.unitPrice
      }
      acc[phase] = { wasteKg: roundWasteKg(wasteKg), cost: roundWasteMoney(cost) }
      return acc
    },
    {} as Record<WastePhase, { wasteKg: number; cost: number }>,
  )

  const dayTotal = roundWasteMoney(
    WASTE_PHASES.reduce((sum, phase) => sum + phaseTotals[phase].cost, 0),
  )
  const dayWasteKg = roundWasteKg(
    WASTE_PHASES.reduce((sum, phase) => sum + phaseTotals[phase].wasteKg, 0),
  )

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        {WASTE_PHASES.map((phase) => (
          <span key={phase} className="rounded-lg bg-muted px-3 py-1">
            <strong>{WASTE_PHASE_LABELS[phase]}:</strong>{' '}
            {phaseTotals[phase].wasteKg} kg · {formatWasteMoney(phaseTotals[phase].cost)}
          </span>
        ))}
        <span className="rounded-lg bg-accent/10 px-3 py-1 text-accent">
          Dia: <strong>{formatWasteMoney(dayTotal)}</strong> · {dayWasteKg} kg
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/95 px-3 py-2 font-medium" rowSpan={2}>
                Item
              </th>
              <th className="px-3 py-2 font-medium" rowSpan={2}>
                Setor
              </th>
              <th className="px-3 py-2 font-medium" rowSpan={2}>
                Preço/kg
              </th>
              {WASTE_PHASES.map((phase) => (
                <th
                  key={phase}
                  className="border-l border-border/80 px-2 py-2 text-center font-medium"
                  colSpan={2}
                >
                  {WASTE_PHASE_LABELS[phase]}
                </th>
              ))}
              <th className="border-l border-border/80 px-3 py-2 font-medium" rowSpan={2}>
                Total (R$)
              </th>
            </tr>
            <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
              {WASTE_PHASES.map((phase) => (
                <Fragment key={phase}>
                  <th className="border-l border-border/80 px-2 py-1.5 font-medium">Un</th>
                  <th className="px-2 py-1.5 font-medium">Desp (kg)</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const total = rowTotal(product, phaseDrafts)
              return (
                <tr key={product.id} className="border-b border-border/60">
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2 font-medium">{product.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{product.sector}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatWasteMoney(product.unitPrice)}</td>
                  {WASTE_PHASES.map((phase) => {
                    const entry = getEntry(phaseDrafts, phase, product.id)
                    return (
                      <Fragment key={`${product.id}-${phase}`}>
                        <td className="border-l border-border/50 px-2 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            className="h-8 w-16 min-w-16 px-2 text-center"
                            value={entry.units || ''}
                            onChange={(event) => {
                              const value = Number(event.target.value)
                              onChange(
                                phase,
                                product.id,
                                'units',
                                Number.isFinite(value) ? Math.max(0, value) : 0,
                              )
                            }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Input
                            type="number"
                            min={0}
                            step={0.001}
                            inputMode="decimal"
                            className="h-8 w-20 min-w-20 px-2 text-center"
                            value={entry.wasteKg || ''}
                            onChange={(event) => {
                              const value = Number(event.target.value)
                              onChange(
                                phase,
                                product.id,
                                'wasteKg',
                                Number.isFinite(value) ? Math.max(0, value) : 0,
                              )
                            }}
                          />
                        </td>
                      </Fragment>
                    )
                  })}
                  <td className="border-l border-border/50 px-3 py-2 font-medium">{formatWasteMoney(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
