import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/ui'
import {
  WASTE_BUFFET_LABELS,
  WASTE_PHASE_LABELS,
} from '@/features/waste-control/constants/wasteControl.constants'
import type { WasteControlMonthlySummary } from '@/features/waste-control/types/wasteControl.types'
import { formatWasteMoney, formatWasteKg } from '@/features/waste-control/utils/wasteControlFormat'

export interface WasteMonthlyChartsProps {
  summary: WasteControlMonthlySummary
}

export function WasteMonthlyCharts({ summary }: WasteMonthlyChartsProps) {
  const sectorData = [
    { name: 'Confeitaria', total: summary.sectorTotals.Confeitaria },
    { name: 'Padaria', total: summary.sectorTotals.Padaria },
  ]

  const buffetData = [
    { name: WASTE_BUFFET_LABELS.cafe, total: summary.buffetTotals.cafe },
    { name: WASTE_BUFFET_LABELS.cha, total: summary.buffetTotals.cha },
    { name: WASTE_BUFFET_LABELS.jantar, total: summary.buffetTotals.jantar },
  ]

  const phaseData = [
    { name: WASTE_PHASE_LABELS.entrada, total: summary.phaseTotals.entrada },
    { name: WASTE_PHASE_LABELS.reposicao, total: summary.phaseTotals.reposicao },
    { name: WASTE_PHASE_LABELS.finalizacao, total: summary.phaseTotals.finalizacao },
  ]

  const dailyMap = new Map<number, { day: number; cafe: number; cha: number; jantar: number }>()
  for (const day of summary.days) {
    const current = dailyMap.get(day.dayNumber) ?? { day: day.dayNumber, cafe: 0, cha: 0, jantar: 0 }
    if (day.buffet === 'cafe') {
      current.cafe += day.dayTotal
    } else if (day.buffet === 'cha') {
      current.cha += day.dayTotal
    } else {
      current.jantar += day.dayTotal
    }
    dailyMap.set(day.dayNumber, current)
  }
  const dailyTrend = [...dailyMap.values()].sort((a, b) => a.day - b.day)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Desperdício por setor" description="Custo total no mês (R$)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatWasteMoney(Number(value ?? 0))} />
              <Bar dataKey="total" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Buffets do dia" description="Café da Manhã, Chá e Jantar — custo mensal">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buffetData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatWasteMoney(Number(value ?? 0))} />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard title="Por etapa do dia" description="Entrada, reposição e finalização">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={phaseData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatWasteMoney(Number(value ?? 0))} />
              <Bar dataKey="total" fill="#c45c26" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Evolução diária"
        description={`Total mensal: ${formatWasteMoney(summary.monthTotal)} · ${formatWasteKg(summary.monthWasteKg)}`}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" label={{ value: 'Dia', position: 'insideBottom', offset: -4 }} />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => formatWasteMoney(Number(value ?? 0))} />
              <Legend />
              <Line type="monotone" dataKey="cafe" name={WASTE_BUFFET_LABELS.cafe} stroke="#8b5e34" strokeWidth={2} />
              <Line type="monotone" dataKey="cha" name={WASTE_BUFFET_LABELS.cha} stroke="hsl(var(--accent))" strokeWidth={2} />
              <Line type="monotone" dataKey="jantar" name={WASTE_BUFFET_LABELS.jantar} stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}
