import { LABEL_TEMPLATES } from '../labels/labelTemplates.js'
import type { AppSettings } from './types.js'

const shelfLifeDefaults = Object.fromEntries(
  LABEL_TEMPLATES.map((template) => [template.id, template.defaultShelfLifeDays]),
)

export const DEFAULT_APP_SETTINGS: AppSettings = {
  general: {
    hotelName: 'NANNAI Confeitaria e Padaria',
    logoUrl: null,
  },
  appearance: {
    theme: 'system',
    language: 'pt-BR',
    currency: 'BRL',
    dateFormat: 'DD/MM/YYYY',
  },
  labels: {
    defaultTemplateId: 'producao',
    defaultSizeCode: 'T50*30',
    shelfLifeOverrides: shelfLifeDefaults,
  },
  niimbot: {
    defaultDpi: 203,
    autoReconnect: true,
    defaultCopies: 1,
  },
  goals: {
    cmvTargetPercent: 32,
    wasteTargetKgMonthly: 120,
  },
  backup: {
    enabled: true,
    frequency: 'daily',
    hour: 3,
    retainDays: 30,
  },
  updatedAt: new Date().toISOString(),
}
