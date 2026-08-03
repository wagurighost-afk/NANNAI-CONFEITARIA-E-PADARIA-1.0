import { Switch } from '@/components/ui'
import type { LaboratorioModuleView } from '@/features/laboratorio/types/laboratorio.types'
import { cn } from '@/utils/cn'

export interface LaboratorioModuleCardProps {
  module: LaboratorioModuleView
  disabled?: boolean
  onToggle: (enabled: boolean) => void
}

export function LaboratorioModuleCard({
  module,
  disabled = false,
  onToggle,
}: LaboratorioModuleCardProps) {
  return (
    <article
      className={cn(
        'rounded-2xl border border-border bg-gradient-to-br from-surface to-muted/20 p-4 shadow-sm',
        !module.enabled && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-semibold text-foreground">{module.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {module.featureCount} funcionalidade(s)
          </p>
        </div>
        <Switch
          checked={module.enabled}
          disabled={disabled}
          aria-label={`Ativar módulo ${module.name}`}
          onCheckedChange={onToggle}
        />
      </div>
    </article>
  )
}
