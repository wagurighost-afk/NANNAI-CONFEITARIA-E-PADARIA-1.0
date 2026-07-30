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
      className="cursor-pointer transition-shadow hover:shadow-md"
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
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{production.employeeName}</CardTitle>
            <CardDescription>
              {formatDateBr(production.date)} · {production.shift} · {production.sector}
            </CardDescription>
          </div>
          <Badge variant="muted">{production.productionCode}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressBar value={production.progress} label="Progresso" />
        <ul className="space-y-1">
          {production.items.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{item.name}</span>
              <ProductionStatusBadge status={item.status} />
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
