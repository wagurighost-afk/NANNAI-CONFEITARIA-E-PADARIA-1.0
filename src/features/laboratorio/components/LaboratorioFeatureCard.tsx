import { Badge, Select, Switch } from '@/components/ui'
import {
  LABORATORIO_CATEGORY_BADGE,
  LABORATORIO_CATEGORY_LABELS,
  LABORATORIO_LIFECYCLE_BADGE,
  LABORATORIO_LIFECYCLE_LABELS,
  LABORATORIO_LIFECYCLE_OPTIONS,
} from '@/features/laboratorio/constants/laboratorioOptions'
import type {
  LaboratorioFeatureLifecycle,
  LaboratorioFeatureView,
} from '@/features/laboratorio/types/laboratorio.types'
import { formatDateTimeBr } from '@/utils/formatDate'
import { cn } from '@/utils/cn'

export interface LaboratorioFeatureCardProps {
  feature: LaboratorioFeatureView
  disabled?: boolean
  onLifecycleChange: (lifecycle: LaboratorioFeatureLifecycle) => void
  onToggleEnabled: (enabled: boolean) => void
}

export function LaboratorioFeatureCard({
  feature,
  disabled = false,
  onLifecycleChange,
  onToggleEnabled,
}: LaboratorioFeatureCardProps) {
  const lifecycleOptions = LABORATORIO_LIFECYCLE_OPTIONS.filter((option) => option.value !== 'all')

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md',
        !feature.enabled && 'opacity-70',
      )}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-foreground">{feature.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{feature.moduleName}</p>
        </div>
        <Switch
          checked={feature.enabled}
          disabled={disabled}
          aria-label={`Ativar ${feature.name}`}
          onCheckedChange={onToggleEnabled}
        />
      </div>

      <p className="mb-4 flex-1 text-sm text-muted-foreground">{feature.description}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant={LABORATORIO_CATEGORY_BADGE[feature.category]}>
          {LABORATORIO_CATEGORY_LABELS[feature.category]}
        </Badge>
        <Badge variant={LABORATORIO_LIFECYCLE_BADGE[feature.lifecycle]}>
          {LABORATORIO_LIFECYCLE_LABELS[feature.lifecycle]}
        </Badge>
        {feature.version ? <Badge variant="muted">v{feature.version}</Badge> : null}
      </div>

      <Select
        label="Marcar como"
        aria-label={`Status de ${feature.name}`}
        disabled={disabled}
        options={lifecycleOptions}
        value={feature.lifecycle}
        onChange={(event) =>
          onLifecycleChange(event.target.value as LaboratorioFeatureLifecycle)
        }
      />

      {feature.updatedAt ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Atualizado por {feature.updatedByName ?? 'sistema'} em{' '}
          {formatDateTimeBr(feature.updatedAt)}
        </p>
      ) : null}
    </article>
  )
}
