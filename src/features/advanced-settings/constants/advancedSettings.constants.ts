import type { AdvancedSettingsCategoryId } from '@/features/advanced-settings/types/advancedSettings.types'

export interface AdvancedSettingsCategory {
  id: AdvancedSettingsCategoryId
  label: string
  description: string
  keywords: string[]
}

export const ADVANCED_SETTINGS_CATEGORIES: readonly AdvancedSettingsCategory[] = [
  {
    id: 'general',
    label: 'Geral',
    description: 'Identidade do hotel e marca',
    keywords: ['hotel', 'nome', 'logo', 'marca', 'identidade'],
  },
  {
    id: 'appearance',
    label: 'Aparência',
    description: 'Tema, idioma, moeda e datas',
    keywords: ['tema', 'idioma', 'moeda', 'data', 'formato', 'dark', 'claro'],
  },
  {
    id: 'labels',
    label: 'Etiquetas',
    description: 'Padrões de impressão e validade',
    keywords: ['etiqueta', 'validade', 'template', 'tamanho', 'impressão'],
  },
  {
    id: 'niimbot',
    label: 'NIIMBOT',
    description: 'Impressora térmica Bluetooth',
    keywords: ['niimbot', 'bluetooth', 'impressora', 'dpi', 'cópias'],
  },
  {
    id: 'goals',
    label: 'Metas',
    description: 'CMV e desperdício',
    keywords: ['cmv', 'custo', 'desperdício', 'meta', 'percentual', 'kg'],
  },
  {
    id: 'backup',
    label: 'Backup',
    description: 'Backup automático do sistema',
    keywords: ['backup', 'automático', 'retenção', 'frequência'],
  },
  {
    id: 'database',
    label: 'Banco de Dados',
    description: 'Informações de armazenamento',
    keywords: ['banco', 'database', 'postgres', 'json', 'registros'],
  },
] as const

export const THEME_OPTIONS = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
] as const

export const LANGUAGE_OPTIONS = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
] as const

export const CURRENCY_OPTIONS = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
] as const

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA' },
  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD' },
] as const

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
] as const

export const LABEL_SIZE_OPTIONS = [
  { value: 'T50*30', label: '50 × 30 mm' },
  { value: 'T40*30', label: '40 × 30 mm' },
  { value: 'T50*20', label: '50 × 20 mm' },
  { value: 'T40*20', label: '40 × 20 mm' },
] as const

export const NIIMBOT_DPI_OPTIONS = [
  { value: '203', label: '203 DPI' },
  { value: '300', label: '300 DPI' },
] as const
