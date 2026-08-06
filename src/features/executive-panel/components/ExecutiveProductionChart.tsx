import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/ui'
import type { ExecutiveProductionDayPoint } from '@/features/executive-panel/types/executivePanel.types'

export interface ExecutiveProductionChartProps {
  data: ExecutiveProductionDayPoint[]
}

export function ExecutiveProductionChart({ data }: ExecutiveProductionChartProps) {
  const chartData = data.map((point) => ({
    ...point,
    label: point.date.slice(8, 10),
  }))

  return (
    <ChartCard title="Produção diária" description="Previstas, concluídas, pendentes e atrasadas">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" name="Concluídas" stackId="a" fill="#2f6b4f" radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" name="Pendentes" stackId="a" fill="#b8894a" />
            <Bar dataKey="delayed" name="Atrasadas" stackId="a" fill="#b42318" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
