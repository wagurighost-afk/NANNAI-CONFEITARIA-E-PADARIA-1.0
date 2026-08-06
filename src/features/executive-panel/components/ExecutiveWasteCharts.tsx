import { useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard, Select } from '@/components/ui'
import type { ExecutiveWaste } from '@/features/executive-panel/types/executivePanel.types'
import { formatExecutiveCurrency, formatExecutiveKg } from '@/features/executive-panel/utils/executiveFormat'

export interface ExecutiveWasteChartsProps {
  waste: ExecutiveWaste
}

type WasteChartMode = 'day' | 'week' | 'month'

export function ExecutiveWasteCharts({ waste }: ExecutiveWasteChartsProps) {
  const [mode, setMode] = useState<WasteChartMode>('day')
  const data = waste.charts[mode]

  return (
    <ChartCard
      title="Desperdício"
      description="Evolução de kg e custo no período"
      actions={
        <Select
          value={mode}
          onChange={(event) => setMode(event.target.value as WasteChartMode)}
          options={[
            { value: 'day', label: 'Dia' },
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' },
          ]}
        />
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" />
            <YAxis yAxisId="kg" orientation="left" />
            <YAxis yAxisId="cost" orientation="right" />
            <Tooltip
              formatter={(value, name) => {
                const numeric = Number(value ?? 0)
                if (name === 'kg') {
                  return [formatExecutiveKg(numeric), 'Kg']
                }
                return [formatExecutiveCurrency(numeric), 'Custo']
              }}
            />
            <Line
              yAxisId="kg"
              type="monotone"
              dataKey="kg"
              stroke="#b42318"
              strokeWidth={2}
              dot={false}
              name="kg"
            />
            <Line
              yAxisId="cost"
              type="monotone"
              dataKey="cost"
              stroke="#b8894a"
              strokeWidth={2}
              dot={false}
              name="cost"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
