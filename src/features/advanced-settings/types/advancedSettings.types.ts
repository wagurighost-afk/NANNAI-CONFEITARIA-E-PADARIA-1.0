export type AppTheme = 'light' | 'dark' | 'system'
export type AppLanguage = 'pt-BR' | 'en-US' | 'es-ES'
export type AppCurrency = 'BRL' | 'USD' | 'EUR'
export type AppDateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
export type BackupFrequency = 'daily' | 'weekly' | 'monthly'

export interface GeneralSettings {
  hotelName: string
  logoUrl: string | null
}

export interface AppearanceSettings {
  theme: AppTheme
  language: AppLanguage
  currency: AppCurrency
  dateFormat: AppDateFormat
}

export interface LabelSettings {
  defaultTemplateId: string
  defaultSizeCode: string
  shelfLifeOverrides: Record<string, number>
}

export interface NiimbotSettings {
  defaultDpi: 203 | 300
  autoReconnect: boolean
  defaultCopies: number
}

export interface GoalsSettings {
  cmvTargetPercent: number
  wasteTargetKgMonthly: number
}

export interface BackupSettings {
  enabled: boolean
  frequency: BackupFrequency
  hour: number
  retainDays: number
}

export interface DatabaseInfo {
  mode: 'postgresql' | 'json-file'
  totalRecords: number
  fileSizeBytes: number | null
  tables: Array<{ name: string; count: number }>
}

export interface AppSettings {
  general: GeneralSettings
  appearance: AppearanceSettings
  labels: LabelSettings
  niimbot: NiimbotSettings
  goals: GoalsSettings
  backup: BackupSettings
  updatedAt: string
  updatedBy?: string
}

export interface LabelTemplateOption {
  id: string
  name: string
  defaultShelfLifeDays: number
}

export interface AppSettingsResponse {
  settings: AppSettings
  database: DatabaseInfo
  labelTemplates: LabelTemplateOption[]
}

export type AppSettingsPatch = {
  general?: Partial<GeneralSettings>
  appearance?: Partial<AppearanceSettings>
  labels?: Partial<LabelSettings>
  niimbot?: Partial<NiimbotSettings>
  goals?: Partial<GoalsSettings>
  backup?: Partial<BackupSettings>
}

export type AdvancedSettingsCategoryId =
  | 'general'
  | 'appearance'
  | 'labels'
  | 'niimbot'
  | 'goals'
  | 'backup'
  | 'database'
