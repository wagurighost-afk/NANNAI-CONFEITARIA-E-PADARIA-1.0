import { Input } from '@/components/ui'
import type { WasteControlProduct } from '@/features/waste-control/types/wasteControl.types'
import { formatWasteMoney, roundWasteKg, roundWasteMoney } from '@/features/waste-control/utils/wasteControlFormat'

export interface WasteDailyPhaseTableProps {
  products: WasteControlProduct[]
  values: Record<string, { units: number; wasteKg: number }>
  onChange: (productId: string, field: 'units' | 'wasteKg', value: number) => void
  search: string
}

export function WasteDailyPhaseTable({
  products,
  values,
  onChange,
  search,
}: WasteDailyPhaseTableProps) {
  const query = search.trim().toLowerCase()
  const filtered = query
    ? products.filter((product) => product.name.toLowerCase().includes(query))
    : products

  const phaseTotal = filtered.reduce((sum, product) => {
    const entry = values[product.id] ?? { units: 0, wasteKg: 0 }
    return sum + roundWasteMoney(entry.wasteKg * product.unitPrice)
  }, 0)

  const phaseWasteKg = filtered.reduce((sum, product) => {
    const entry = values[product.id] ?? { units: 0, wasteKg: 0 }
    return sum + entry.wasteKg
  }, 0)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-lg bg-muted px-3 py-1">
          Desperdício: <strong>{roundWasteKg(phaseWasteKg)} kg</strong>
        </span>
        <span className="rounded-lg bg-accent/10 px-3 py-1 text-accent">
          Custo: <strong>{formatWasteMoney(phaseTotal)}</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Item</th>
              <th className="px-3 py-2 font-medium">Setor</th>
              <th className="px-3 py-2 font-medium">Unidades</th>
              <th className="px-3 py-2 font-medium">Desperdício (kg)</th>
              <th className="px-3 py-2 font-medium">Preço/kg</th>
              <th className="px-3 py-2 font-medium">Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const entry = values[product.id] ?? { units: 0, wasteKg: 0 }
              const total = roundWasteMoney(entry.wasteKg * product.unitPrice)
              return (
                <tr key={product.id} className="border-b border-border/60">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{product.sector}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      className="w-24"
                      value={entry.units || ''}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        onChange(product.id, 'units', Number.isFinite(value) ? Math.max(0, value) : 0)
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.001}
                      inputMode="decimal"
                      className="w-28"
                      value={entry.wasteKg || ''}
                      onChange={(event) => {
                        const value = Number(event.target.value)
                        onChange(product.id, 'wasteKg', Number.isFinite(value) ? Math.max(0, value) : 0)
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{formatWasteMoney(product.unitPrice)}</td>
                  <td className="px-3 py-2 font-medium">{formatWasteMoney(total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
