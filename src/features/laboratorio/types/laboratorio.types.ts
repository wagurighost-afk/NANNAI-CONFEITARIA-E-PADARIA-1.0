export const LABORATORIO_FEATURE_CATEGORIES = [
  'em_desenvolvimento',
  'beta',
  'experimental',
  'futuras',
] as const

export type LaboratorioFeatureCategory = (typeof LABORATORIO_FEATURE_CATEGORIES)[number]

export const LABORATORIO_FEATURE_LIFECYCLES = [
  'desenvolvimento',
  'beta',
  'producao',
  'descontinuada',
] as const

export type LaboratorioFeatureLifecycle = (typeof LABORATORIO_FEATURE_LIFECYCLES)[number]

export interface LaboratorioFeatureView {
  id: string
  moduleId: string
  moduleName: string
  name: string
  description: string
  category: LaboratorioFeatureCategory
  lifecycle: LaboratorioFeatureLifecycle
  enabled: boolean
  route?: string
  version?: string
  updatedAt?: string
  updatedByName?: string
}

export interface LaboratorioModuleView {
  id: string
  name: string
  description: string
  enabled: boolean
  featureCount: number
  updatedAt?: string
  updatedByName?: string
}

export interface LaboratorioSummary {
  totalFeatures: number
  totalModules: number
  byLifecycle: Record<LaboratorioFeatureLifecycle, number>
  byCategory: Record<LaboratorioFeatureCategory, number>
  enabledModules: number
  enabledFeatures: number
}

export interface LaboratorioDashboard {
  summary: LaboratorioSummary
  modules: LaboratorioModuleView[]
  features: LaboratorioFeatureView[]
}

export type LaboratorioCategoryFilter = LaboratorioFeatureCategory | 'all'
export type LaboratorioLifecycleFilter = LaboratorioFeatureLifecycle | 'all'
export type LaboratorioEnabledFilter = 'all' | 'enabled' | 'disabled'

export interface LaboratorioFilters {
  search: string
  category: LaboratorioCategoryFilter
  lifecycle: LaboratorioLifecycleFilter
  moduleId: string | 'all'
  enabled: LaboratorioEnabledFilter
}

export interface UpdateLaboratorioFeatureInput {
  category?: LaboratorioFeatureCategory
  lifecycle?: LaboratorioFeatureLifecycle
  enabled?: boolean
}

export interface UpdateLaboratorioModuleInput {
  enabled: boolean
}
