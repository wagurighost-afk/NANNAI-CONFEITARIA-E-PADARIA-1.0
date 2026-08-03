import {
  CalendarRange,
  ChefHat,
  CircleDollarSign,
  Factory,
  Package,
  Tags,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui'
import { InsightsPlaceholderCard } from '@/features/nannai-insights/components/InsightsPlaceholderCard'
import { NANNAI_INSIGHTS_SECTION_ICONS } from '@/features/nannai-insights/constants/sectionIcons'
import type {
  NannaiInsightsSection,
  NannaiInsightsSectionId,
} from '@/features/nannai-insights/types/nannaiInsights.types'

const ICONS: Record<string, LucideIcon> = {
  Factory,
  Trash2,
  Package,
  CircleDollarSign,
  ChefHat,
  Users,
  Tags,
  CalendarRange,
}

export interface InsightsSectionBlockProps {
  section: NannaiInsightsSection
}

export function InsightsSectionBlock({ section }: InsightsSectionBlockProps) {
  const iconName = NANNAI_INSIGHTS_SECTION_ICONS[section.id as NannaiInsightsSectionId]
  const Icon = ICONS[iconName] ?? Factory

  return (
    <section id={`insights-${section.id}`} className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
            <Icon className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{section.description}</p>
          </div>
        </div>
        <Badge variant="accent">Estrutura preparada</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {section.placeholders.map((card) => (
          <InsightsPlaceholderCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}
