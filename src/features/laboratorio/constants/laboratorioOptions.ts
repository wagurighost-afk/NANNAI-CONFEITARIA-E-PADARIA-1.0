import type { BadgeProps } from '@/components/ui/Badge'
import {
  LABORATORIO_FEATURE_CATEGORIES,
  LABORATORIO_FEATURE_LIFECYCLES,
  type LaboratorioFeatureCategory,
  type LaboratorioFeatureLifecycle,
} from '@/features/laboratorio/types/laboratorio.types'

export const LABORATORIO_CATEGORY_LABELS: Record<LaboratorioFeatureCategory, string> = {
  em_desenvolvimento: 'Em desenvolvimento',
  beta: 'Beta',
  experimental: 'Experimental',
  futuras: 'Futuras',
}

export const LABORATORIO_LIFECYCLE_LABELS: Record<LaboratorioFeatureLifecycle, string> = {
  desenvolvimento: 'Em Desenvolvimento',
  beta: 'Beta',
  producao: 'Produção',
  descontinuada: 'Descontinuada',
}

export const LABORATORIO_CATEGORY_BADGE: Record<
  LaboratorioFeatureCategory,
  NonNullable<BadgeProps['variant']>
> = {
  em_desenvolvimento: 'accent',
  beta: 'default',
  experimental: 'muted',
  futuras: 'muted',
}

export const LABORATORIO_LIFECYCLE_BADGE: Record<
  LaboratorioFeatureLifecycle,
  NonNullable<BadgeProps['variant']>
> = {
  desenvolvimento: 'accent',
  beta: 'default',
  producao: 'success',
  descontinuada: 'danger',
}

export const LABORATORIO_CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas as listas' },
  ...LABORATORIO_FEATURE_CATEGORIES.map((category) => ({
    value: category,
    label: LABORATORIO_CATEGORY_LABELS[category],
  })),
]

export const LABORATORIO_LIFECYCLE_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  ...LABORATORIO_FEATURE_LIFECYCLES.map((lifecycle) => ({
    value: lifecycle,
    label: LABORATORIO_LIFECYCLE_LABELS[lifecycle],
  })),
]
