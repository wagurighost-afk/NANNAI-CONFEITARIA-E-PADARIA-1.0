import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from '@/components/ui'
import type { DevCentralCharts } from '@/features/dev-central/types/devCentral.types'

export interface DevCentralChartsSectionProps {
  charts: DevCentralCharts
}

export function DevCentralChartsSection({ charts }: DevCentralChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartCard title="Tempo de resposta" description="Últimas requisições da API (ms)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={charts.responseTime}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="ms" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Requisições por minuto" description="Volume de chamadas à API">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={charts.requestsPerMinute}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Erros por minuto" description="Respostas HTTP 4xx/5xx">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={charts.errorsPerMinute}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--danger))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Consumo do banco" description="Registros por tabela">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={charts.databaseTables} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
