import { ProgressBar } from '@/components/common/ProgressBar/ProgressBar'
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { ProductionStatusBadge } from '@/features/production/components/ProductionStatusBadge'
import type { ProductionDay } from '@/features/production/types/production.types'
import { formatDateBr } from '@/utils/formatDate'

export interface ProductionCardProps {
  production: ProductionDay
  onClick?: () => void
}

export function ProductionCard({ production, onClick }: ProductionCardProps) {
  return (
    <Card
      className="min-w-0 max-w-full cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <CardHeader>
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{production.employeeName}</CardTitle>
            <CardDescription className="break-words [overflow-wrap:anywhere]">
              {formatDateBr(production.date)} · {production.shift} · {production.sector}
            </CardDescription>
          </div>
          <Badge variant="muted" className="shrink-0">
            {production.productionCode}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3">
        <ProgressBar value={production.progress} label="Progresso" />
        <ul className="space-y-1">
          {production.items.slice(0, 4).map((item) => (
            <li key={item.id} className="flex min-w-0 items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <span className="shrink-0">
                <ProductionStatusBadge status={item.status} />
              </span>
            </li>
          ))}
        </ul>
        {production.items.length > 4 ? (
          <p className="text-xs text-muted-foreground">
            +{production.items.length - 4} itens
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
