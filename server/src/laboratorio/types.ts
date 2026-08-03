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

export interface LaboratorioFeatureDefinition {
  id: string
  moduleId: string
  name: string
  description: string
  defaultCategory: LaboratorioFeatureCategory
  defaultLifecycle: LaboratorioFeatureLifecycle
  defaultEnabled: boolean
  route?: string
  version?: string
}

export interface LaboratorioModuleDefinition {
  id: string
  name: string
  description: string
  defaultEnabled: boolean
  icon?: string
}

export interface LaboratorioFeatureOverride {
  category?: LaboratorioFeatureCategory
  lifecycle?: LaboratorioFeatureLifecycle
  enabled?: boolean
  updatedAt?: string
  updatedById?: string
  updatedByName?: string
}

export interface LaboratorioModuleOverride {
  enabled?: boolean
  updatedAt?: string
  updatedById?: string
  updatedByName?: string
}

export interface LaboratorioPersistedState {
  features: Record<string, LaboratorioFeatureOverride>
  modules: Record<string, LaboratorioModuleOverride>
  updatedAt: string
}

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

export interface UpdateLaboratorioFeatureInput {
  category?: LaboratorioFeatureCategory
  lifecycle?: LaboratorioFeatureLifecycle
  enabled?: boolean
}

export interface UpdateLaboratorioModuleInput {
  enabled: boolean
}
