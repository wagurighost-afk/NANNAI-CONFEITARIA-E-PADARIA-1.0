import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export interface ChartCardProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  /** Optional fixed height for chart area */
  chartHeight?: number
}

/**
 * Presentational chart container.
 * Inject any chart library via `children` — no business logic here.
 */
export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
  chartHeight = 280,
}: ChartCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="mb-4 flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription className="mt-1">{description}</CardDescription> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </CardHeader>
      <CardContent>
        <div
          className="w-full"
          style={{ minHeight: chartHeight }}
          role="img"
          aria-label={`Gráfico: ${title}`}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
