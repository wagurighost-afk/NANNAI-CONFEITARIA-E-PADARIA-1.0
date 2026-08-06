import { BRAND } from '@/core/constants/brand'

export const CHART_THEME = {
  primary: BRAND.colors.brown,
  accent: BRAND.colors.gold,
  success: '#2f6b4f',
  muted: BRAND.colors.brownMuted,
  grid: '#e5d5c3',
  series: [BRAND.colors.brown, BRAND.colors.gold, '#8f6a45', '#2f6b4f', '#6b4a3a'],
} as const
