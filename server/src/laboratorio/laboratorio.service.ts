import { getMeta, setMeta } from '../db/index.js'
import { LABORATORIO_FEATURES, LABORATORIO_MODULES } from './featureRegistry.js'
import type {
  LaboratorioDashboard,
  LaboratorioFeatureLifecycle,
  LaboratorioFeatureView,
  LaboratorioModuleView,
  LaboratorioPersistedState,
  LaboratorioSummary,
  UpdateLaboratorioFeatureInput,
  UpdateLaboratorioModuleInput,
} from './types.js'

const STATE_META_KEY = 'laboratorio_state'

function emptyState(): LaboratorioPersistedState {
  return {
    features: {},
    modules: {},
    updatedAt: new Date().toISOString(),
  }
}

async function loadState(): Promise<LaboratorioPersistedState> {
  const raw = await getMeta(STATE_META_KEY)
  if (!raw) {
    return emptyState()
  }

  try {
    const parsed = JSON.parse(raw) as LaboratorioPersistedState
    return {
      features: parsed.features ?? {},
      modules: parsed.modules ?? {},
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return emptyState()
  }
}

async function saveState(state: LaboratorioPersistedState): Promise<void> {
  await setMeta(STATE_META_KEY, JSON.stringify(state))
}

function buildSummary(features: LaboratorioFeatureView[], modules: LaboratorioModuleView[]): LaboratorioSummary {
  const byLifecycle = {
    desenvolvimento: 0,
    beta: 0,
    producao: 0,
    descontinuada: 0,
  } satisfies Record<LaboratorioFeatureLifecycle, number>

  const byCategory = {
    em_desenvolvimento: 0,
    beta: 0,
    experimental: 0,
    futuras: 0,
  }

  for (const feature of features) {
    byLifecycle[feature.lifecycle] += 1
    byCategory[feature.category] += 1
  }

  return {
    totalFeatures: features.length,
    totalModules: modules.length,
    byLifecycle,
    byCategory,
    enabledModules: modules.filter((module) => module.enabled).length,
    enabledFeatures: features.filter((feature) => feature.enabled).length,
  }
}

function mergeDashboard(state: LaboratorioPersistedState): LaboratorioDashboard {
  const moduleMap = new Map(LABORATORIO_MODULES.map((module) => [module.id, module]))

  const modules: LaboratorioModuleView[] = LABORATORIO_MODULES.map((module) => {
    const override = state.modules[module.id]
    const featuresInModule = LABORATORIO_FEATURES.filter((feature) => feature.moduleId === module.id)

    return {
      id: module.id,
      name: module.name,
      description: module.description,
      enabled: override?.enabled ?? module.defaultEnabled,
      featureCount: featuresInModule.length,
      ...(override?.updatedAt ? { updatedAt: override.updatedAt } : {}),
      ...(override?.updatedByName ? { updatedByName: override.updatedByName } : {}),
    }
  })

  const features: LaboratorioFeatureView[] = LABORATORIO_FEATURES.map((feature) => {
    const override = state.features[feature.id]
    const module = moduleMap.get(feature.moduleId)
    const moduleOverride = state.modules[feature.moduleId]
    const moduleEnabled = moduleOverride?.enabled ?? module?.defaultEnabled ?? true

    return {
      id: feature.id,
      moduleId: feature.moduleId,
      moduleName: module?.name ?? feature.moduleId,
      name: feature.name,
      description: feature.description,
      category: override?.category ?? feature.defaultCategory,
      lifecycle: override?.lifecycle ?? feature.defaultLifecycle,
      enabled: moduleEnabled && (override?.enabled ?? feature.defaultEnabled),
      ...(feature.route ? { route: feature.route } : {}),
      ...(feature.version ? { version: feature.version } : {}),
      ...(override?.updatedAt ? { updatedAt: override.updatedAt } : {}),
      ...(override?.updatedByName ? { updatedByName: override.updatedByName } : {}),
    }
  })

  return {
    summary: buildSummary(features, modules),
    modules,
    features,
  }
}

export async function getLaboratorioDashboard(): Promise<LaboratorioDashboard> {
  const state = await loadState()
  return mergeDashboard(state)
}

export async function updateLaboratorioFeature(
  featureId: string,
  input: UpdateLaboratorioFeatureInput,
  actor: { userId: string; userName: string },
): Promise<LaboratorioDashboard> {
  const definition = LABORATORIO_FEATURES.find((feature) => feature.id === featureId)
  if (!definition) {
    throw new Error('Funcionalidade não encontrada.')
  }

  const state = await loadState()
  const current = state.features[featureId] ?? {}
  const timestamp = new Date().toISOString()

  state.features[featureId] = {
    ...current,
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
    ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
    updatedAt: timestamp,
    updatedById: actor.userId,
    updatedByName: actor.userName,
  }
  state.updatedAt = timestamp

  await saveState(state)
  return mergeDashboard(state)
}

export async function updateLaboratorioModule(
  moduleId: string,
  input: UpdateLaboratorioModuleInput,
  actor: { userId: string; userName: string },
): Promise<LaboratorioDashboard> {
  const definition = LABORATORIO_MODULES.find((module) => module.id === moduleId)
  if (!definition) {
    throw new Error('Módulo não encontrado.')
  }

  const state = await loadState()
  const timestamp = new Date().toISOString()

  state.modules[moduleId] = {
    enabled: input.enabled,
    updatedAt: timestamp,
    updatedById: actor.userId,
    updatedByName: actor.userName,
  }
  state.updatedAt = timestamp

  await saveState(state)
  return mergeDashboard(state)
}

export async function isLaboratorioModuleEnabled(moduleId: string): Promise<boolean> {
  const dashboard = await getLaboratorioDashboard()
  const module = dashboard.modules.find((entry) => entry.id === moduleId)
  return module?.enabled ?? true
}

export async function isLaboratorioFeatureEnabled(featureId: string): Promise<boolean> {
  const dashboard = await getLaboratorioDashboard()
  const feature = dashboard.features.find((entry) => entry.id === featureId)
  return feature?.enabled ?? true
}
