import { borderWidth } from '@/styles/tokens/borders'
import { duration } from '@/styles/tokens/animations'
import { colors, type ColorToken } from '@/styles/tokens/colors'
import { radius } from '@/styles/tokens/radius'
import { shadows } from '@/styles/tokens/shadow'
import { spacing } from '@/styles/tokens/spacing'
import type { ThemeMode } from '@/types/theme.types'

const COLOR_CSS_KEY_MAP: Record<ColorToken, string> = {
  background: '--nannai-background',
  foreground: '--nannai-foreground',
  surface: '--nannai-surface',
  surfaceElevated: '--nannai-surface-elevated',
  muted: '--nannai-muted',
  mutedForeground: '--nannai-muted-foreground',
  border: '--nannai-border',
  primary: '--nannai-primary',
  primaryForeground: '--nannai-primary-foreground',
  accent: '--nannai-accent',
  accentForeground: '--nannai-accent-foreground',
  danger: '--nannai-danger',
  dangerForeground: '--nannai-danger-foreground',
  success: '--nannai-success',
  ring: '--nannai-ring',
  sidebar: '--nannai-sidebar',
  sidebarForeground: '--nannai-sidebar-foreground',
  overlay: '--nannai-overlay',
}

function paletteToCssVariables(palette: Record<ColorToken, string>): Record<string, string> {
  const entries = Object.entries(COLOR_CSS_KEY_MAP) as Array<[ColorToken, string]>

  return Object.fromEntries(
    entries.map(([token, cssVar]) => [cssVar, palette[token]]),
  )
}

export function getColorCssVariables(mode: ThemeMode): Record<string, string> {
  return paletteToCssVariables(colors[mode])
}

export function getStructuralCssVariables(mode: ThemeMode): Record<string, string> {
  const shadowScale = shadows[mode]

  return {
    '--nannai-radius-sm': radius.sm,
    '--nannai-radius-md': radius.md,
    '--nannai-radius-lg': radius.lg,
    '--nannai-radius-xl': radius.xl,
    '--nannai-radius-2xl': radius['2xl'],
    '--nannai-border-width': borderWidth.thin,
    '--nannai-border-width-medium': borderWidth.medium,
    '--nannai-shadow-sm': shadowScale.sm,
    '--nannai-shadow-md': shadowScale.md,
    '--nannai-shadow-lg': shadowScale.lg,
    '--nannai-shadow-xl': shadowScale.xl,
    '--nannai-space-1': spacing[1],
    '--nannai-space-2': spacing[2],
    '--nannai-space-3': spacing[3],
    '--nannai-space-4': spacing[4],
    '--nannai-space-6': spacing[6],
    '--nannai-space-8': spacing[8],
    '--nannai-duration-fast': `${duration.fast}ms`,
    '--nannai-duration-normal': `${duration.normal}ms`,
    '--nannai-duration-moderate': `${duration.moderate}ms`,
    '--nannai-duration-slow': `${duration.slow}ms`,
  }
}

export function applyCssVariables(
  element: HTMLElement,
  variables: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(variables)) {
    element.style.setProperty(key, value)
  }
}

export function applyThemeCssVariables(mode: ThemeMode): void {
  const root = document.documentElement
  applyCssVariables(root, {
    ...getStructuralCssVariables(mode),
    ...getColorCssVariables(mode),
  })
}
