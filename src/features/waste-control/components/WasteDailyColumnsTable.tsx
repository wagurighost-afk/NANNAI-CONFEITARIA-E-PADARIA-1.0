import { Badge, Input } from '@/components/ui'
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
  /** Bloqueia entrada/reposição/finalização até haver um responsável presente selecionado. */
  disabled?: boolean
}

const PHASE_HINTS: Record<WastePhase, string> = {
  entrada: 'und',
  reposicao: 'und',
  finalizacao: 'kg',
}

function productCost(product: WasteControlProduct): number {
  const value = Number(product.unitPrice)
  return Number.isFinite(value) ? value : 0
}

function getEntry(
  drafts: Record<WastePhase, WastePhaseDraft>,
  phase: WastePhase,
  productId: string,
) {
  return drafts[phase][productId] ?? { units: 0, wasteKg: 0 }
}

/** Um número por etapa: entrada/reposição = unidades, finalização = desperdício (kg). */
function getPhaseValue(
  drafts: Record<WastePhase, WastePhaseDraft>,
  phase: WastePhase,
  productId: string,
): number {
  const entry = getEntry(drafts, phase, productId)
  return phase === 'finalizacao' ? entry.wasteKg : entry.units
}

function rowTotal(product: WasteControlProduct, drafts: Record<WastePhase, WastePhaseDraft>) {
  const wasteKg = getPhaseValue(drafts, 'finalizacao', product.id)
  return roundWasteMoney(wasteKg * productCost(product))
}

export function WasteDailyColumnsTable({
  products,
  phaseDrafts,
  onChange,
  search,
  disabled = false,
}: WasteDailyColumnsTableProps) {
  const query = search.trim().toLowerCase()
  const filtered = query
    ? products.filter((product) => product.name.toLowerCase().includes(query))
    : products

  const phaseTotals = WASTE_PHASES.reduce(
    (acc, phase) => {
      let amount = 0
      let cost = 0
      for (const product of filtered) {
        const value = getPhaseValue(phaseDrafts, phase, product.id)
        amount += value
        if (phase === 'finalizacao') {
          cost += value * productCost(product)
        }
      }
      acc[phase] = {
        amount: phase === 'finalizacao' ? roundWasteKg(amount) : Math.round(amount),
        cost: roundWasteMoney(cost),
      }
      return acc
    },
    {} as Record<WastePhase, { amount: number; cost: number }>,
  )

  const dayTotal = phaseTotals.finalizacao.cost
  const dayWasteKg = phaseTotals.finalizacao.amount

  const handleValueChange = (phase: WastePhase, productId: string, value: number) => {
    if (phase === 'finalizacao') {
      onChange(phase, productId, 'wasteKg', value)
      return
    }
    onChange(phase, productId, 'units', value)
  }

  if (disabled) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 px-4 py-10 text-center text-sm text-amber-900">
        Selecione o responsável presente para liberar a contagem de entrada, reposição e
        finalização deste buffet.
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum produto encontrado. Cadastre ou ative itens em <strong>Cadastro de Produtos</strong>.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center text-sm font-medium tracking-wide text-foreground">
        {WASTE_PHASE_LABELS.entrada}
        <span className="mx-2 text-muted-foreground">→</span>
        {WASTE_PHASE_LABELS.reposicao}
        <span className="mx-2 text-muted-foreground">→</span>
        {WASTE_PHASE_LABELS.finalizacao}
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg bg-muted px-3 py-1">
          <strong>Entrada:</strong> {phaseTotals.entrada.amount} und
        </span>
        <span className="rounded-lg bg-muted px-3 py-1">
          <strong>Reposição:</strong> {phaseTotals.reposicao.amount} und
        </span>
        <span className="rounded-lg bg-muted px-3 py-1">
          <strong>Finalização:</strong> {phaseTotals.finalizacao.amount} kg ·{' '}
          {formatWasteMoney(phaseTotals.finalizacao.cost)}
        </span>
        <span className="rounded-lg bg-accent/10 px-3 py-1 text-accent">
          Custo do dia: <strong>{formatWasteMoney(dayTotal)}</strong> · {dayWasteKg} kg
        </span>
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
              <th className="sticky left-0 z-10 bg-muted/95 px-4 py-3 text-left font-semibold">
                Produto
              </th>
              <th className="px-3 py-3 text-right font-semibold">Custo/porção</th>
              <th className="border-l border-border/80 px-3 py-3 text-center font-semibold text-foreground">
                Entrada
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">(und)</span>
              </th>
              <th className="border-l border-border/80 px-3 py-3 text-center font-semibold text-foreground">
                Reposição
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">(und)</span>
              </th>
              <th className="border-l border-border/80 px-3 py-3 text-center font-semibold text-foreground">
                Finalização
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">(kg)</span>
              </th>
              <th className="border-l border-border/80 px-3 py-3 text-center font-semibold">Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-border/60">
                <td className="sticky left-0 z-10 bg-surface px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-medium leading-snug">{product.name}</p>
                    {product.origin === 'Manual' ? (
                      <Badge variant="accent">Manual</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.sector}</p>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
                  {formatWasteMoney(productCost(product))}
                </td>
                {WASTE_PHASES.map((phase) => (
                  <td key={`${product.id}-${phase}`} className="border-l border-border/50 px-2 py-2 text-center">
                    <Input
                      type="number"
                      min={0}
                      step={phase === 'finalizacao' ? 0.001 : 1}
                      inputMode="decimal"
                      className="mx-auto h-9 w-20 text-center"
                      value={getPhaseValue(phaseDrafts, phase, product.id) || ''}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        handleValueChange(
                          phase,
                          product.id,
                          Number.isFinite(value) ? Math.max(0, value) : 0,
                        )
                      }}
                    />
                  </td>
                ))}
                <td className="border-l border-border/50 px-3 py-2 text-center font-medium tabular-nums">
                  {formatWasteMoney(rowTotal(product, phaseDrafts))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        <div className="grid grid-cols-[1fr_repeat(3,3.5rem)] gap-1 px-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="text-left">Produto</span>
          <span>Ent.</span>
          <span>Rep.</span>
          <span>Fin.</span>
        </div>
        {filtered.map((product) => (
          <div key={product.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium leading-snug">{product.name}</p>
                  {product.origin === 'Manual' ? (
                    <Badge variant="accent">Manual</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">{product.sector}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatWasteMoney(productCost(product))}
              </p>
            </div>
            <div className="grid grid-cols-[1fr_repeat(3,3.5rem)] items-center gap-1">
              <span className="text-xs text-muted-foreground">/porção</span>
              {WASTE_PHASES.map((phase) => (
                <Input
                  key={`${product.id}-m-${phase}`}
                  type="number"
                  min={0}
                  step={phase === 'finalizacao' ? 0.001 : 1}
                  inputMode="decimal"
                  className="h-9 px-1 text-center text-sm"
                  aria-label={`${product.name} ${WASTE_PHASE_LABELS[phase]}`}
                  value={getPhaseValue(phaseDrafts, phase, product.id) || ''}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    handleValueChange(
                      phase,
                      product.id,
                      Number.isFinite(value) ? Math.max(0, value) : 0,
                    )
                  }}
                />
              ))}
            </div>
            <p className="mt-2 text-right text-xs text-muted-foreground">
              Total: {formatWasteMoney(rowTotal(product, phaseDrafts))}
              <span className="ml-1 text-[10px]">({PHASE_HINTS.finalizacao} na finalização)</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
