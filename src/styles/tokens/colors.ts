export const lightColors = {
  background: '#f6f3ee',
  foreground: '#2a1f1a',
  surface: '#fffcf8',
  surfaceElevated: '#ffffff',
  muted: '#ebe4d9',
  mutedForeground: '#6b5b4f',
  border: '#ddd2c4',
  primary: '#3e2723',
  primaryForeground: '#f8efe4',
  accent: '#b8894a',
  accentForeground: '#1f160f',
  danger: '#b42318',
  dangerForeground: '#fff7f5',
  success: '#2f6b4f',
  ring: '#b8894a',
  sidebar: '#3e2723',
  sidebarForeground: '#f3e8d8',
  overlay: 'rgb(42 31 26 / 0.45)',
} as const

export const darkColors = {
  background: '#16110e',
  foreground: '#f3e8d8',
  surface: '#221a15',
  surfaceElevated: '#2c221c',
  muted: '#3a2e26',
  mutedForeground: '#c4b3a2',
  border: '#4a3b31',
  primary: '#e8c9a0',
  primaryForeground: '#2a1f1a',
  accent: '#d4a574',
  accentForeground: '#1a120e',
  danger: '#f97066',
  dangerForeground: '#2a0f0c',
  success: '#6fbf93',
  ring: '#d4a574',
  sidebar: '#1a1410',
  sidebarForeground: '#f3e8d8',
  overlay: 'rgb(0 0 0 / 0.6)',
} as const

export const colors = {
  light: lightColors,
  dark: darkColors,
} as const

export type ColorToken = keyof typeof lightColors
export type ThemeColorPalette = Record<ColorToken, string>
