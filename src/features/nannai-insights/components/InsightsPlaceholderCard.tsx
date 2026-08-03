import { Sparkles } from 'lucide-react'
import { Badge, Card, CardContent } from '@/components/ui'
import type { NannaiInsightsPlaceholderCard } from '@/features/nannai-insights/types/nannaiInsights.types'

export interface InsightsPlaceholderCardProps {
  card: NannaiInsightsPlaceholderCard
}

export function InsightsPlaceholderCard({ card }: InsightsPlaceholderCardProps) {
  return (
    <Card className="h-full border-dashed bg-surface/40">
      <CardContent className="flex h-full min-h-[160px] flex-col justify-between gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-xl border border-border bg-muted/20 p-2 text-muted-foreground">
            <Sparkles className="size-4" aria-hidden />
          </div>
          <Badge variant="muted">Em breve</Badge>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{card.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
