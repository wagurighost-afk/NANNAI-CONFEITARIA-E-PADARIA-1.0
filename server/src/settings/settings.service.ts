import { getMeta, setMeta } from '../db/index.js'
import { LABEL_TEMPLATES } from '../labels/labelTemplates.js'
import { emitRealtime } from '../events.js'
import { DEFAULT_APP_SETTINGS } from './defaults.js'
import { getDatabaseInfo } from './databaseInfo.js'
import type { AppSettings, AppSettingsPatch, AppSettingsResponse } from './types.js'

const SETTINGS_META_KEY = 'app_settings'

function mergeSettings(base: AppSettings, patch: AppSettingsPatch, updatedBy?: string): AppSettings {
  const next: AppSettings = {
    ...base,
    general: { ...base.general, ...(patch.general ?? {}) },
    appearance: { ...base.appearance, ...(patch.appearance ?? {}) },
    labels: {
      ...base.labels,
      ...(patch.labels ?? {}),
      shelfLifeOverrides: {
        ...base.labels.shelfLifeOverrides,
        ...(patch.labels?.shelfLifeOverrides ?? {}),
      },
    },
    niimbot: { ...base.niimbot, ...(patch.niimbot ?? {}) },
    goals: { ...base.goals, ...(patch.goals ?? {}) },
    backup: { ...base.backup, ...(patch.backup ?? {}) },
    updatedAt: new Date().toISOString(),
  }

  if (updatedBy) {
    next.updatedBy = updatedBy
  }

  return next
}

export async function loadAppSettings(): Promise<AppSettings> {
  const raw = await getMeta(SETTINGS_META_KEY)
  if (!raw) {
    return { ...DEFAULT_APP_SETTINGS }
  }

  try {
    const parsed = JSON.parse(raw) as AppSettingsPatch
    return mergeSettings(DEFAULT_APP_SETTINGS, parsed)
  } catch {
    return { ...DEFAULT_APP_SETTINGS }
  }
}

export async function getAppSettingsResponse(): Promise<AppSettingsResponse> {
  const settings = await loadAppSettings()

  return {
    settings,
    database: getDatabaseInfo(),
    labelTemplates: LABEL_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      defaultShelfLifeDays: template.defaultShelfLifeDays,
    })),
  }
}

export async function updateAppSettings(
  patch: AppSettingsPatch,
  updatedBy?: string,
): Promise<AppSettingsResponse> {
  const current = await loadAppSettings()
  const next = mergeSettings(current, patch, updatedBy)

  await setMeta(SETTINGS_META_KEY, JSON.stringify(next))
  emitRealtime({ scope: 'settings', action: 'updated' })

  return getAppSettingsResponse()
}

export async function updateHotelLogo(logoUrl: string, updatedBy?: string): Promise<AppSettingsResponse> {
  return updateAppSettings({ general: { logoUrl } }, updatedBy)
}
