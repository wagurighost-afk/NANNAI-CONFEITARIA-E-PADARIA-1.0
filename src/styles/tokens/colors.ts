export const lightColors = {
  background: '#fdf8f3',
  foreground: '#401e13',
  surface: '#fffaf5',
  surfaceElevated: '#ffffff',
  muted: '#f3ebe1',
  mutedForeground: '#6b4a3a',
  border: '#e5d5c3',
  primary: '#401e13',
  primaryForeground: '#fdf8f3',
  accent: '#b58b4d',
  accentForeground: '#401e13',
  danger: '#b42318',
  dangerForeground: '#fff7f5',
  success: '#2f6b4f',
  ring: '#b58b4d',
  sidebar: '#401e13',
  sidebarForeground: '#f8efe4',
  overlay: 'rgb(64 30 19 / 0.45)',
} as const

export const darkColors = {
  background: '#1a100c',
  foreground: '#f8efe4',
  surface: '#241610',
  surfaceElevated: '#2e1c14',
  muted: '#3d2a20',
  mutedForeground: '#d4c0ad',
  border: '#4f382b',
  primary: '#e8c9a0',
  primaryForeground: '#401e13',
  accent: '#c9a063',
  accentForeground: '#1a100c',
  danger: '#f97066',
  dangerForeground: '#2a0f0c',
  success: '#6fbf93',
  ring: '#c9a063',
  sidebar: '#140c08',
  sidebarForeground: '#f8efe4',
  overlay: 'rgb(0 0 0 / 0.6)',
} as const

export const colors = {
  light: lightColors,
  dark: darkColors,
} as const

export type ColorToken = keyof typeof lightColors
export type ThemeColorPalette = Record<ColorToken, string>
