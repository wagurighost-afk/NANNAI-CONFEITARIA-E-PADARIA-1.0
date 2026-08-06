import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { cn } from '@/utils/cn'

export interface KpiCardProps {
  label: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: ReactNode
  className?: string
}

export function KpiCard({
  label,
  value,
  description,
  icon,
  trend,
  className,
}: KpiCardProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="mb-3 flex-row items-start justify-between gap-3">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-1 text-3xl tabular-nums">{value}</CardTitle>
        </div>
        {icon ? (
          <div className="rounded-xl bg-accent/10 p-2 text-accent" aria-hidden>
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : (
          <span />
        )}
        {trend ? <div className="text-xs">{trend}</div> : null}
      </CardContent>
    </Card>
  )
}
