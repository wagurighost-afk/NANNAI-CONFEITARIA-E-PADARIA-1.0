export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgb(42 31 26 / 0.06)',
  md: '0 4px 12px rgb(42 31 26 / 0.08)',
  lg: '0 10px 24px rgb(42 31 26 / 0.12)',
  xl: '0 20px 40px rgb(42 31 26 / 0.16)',
} as const

export const darkShadow = {
  none: 'none',
  sm: '0 1px 2px rgb(0 0 0 / 0.35)',
  md: '0 4px 12px rgb(0 0 0 / 0.4)',
  lg: '0 10px 24px rgb(0 0 0 / 0.45)',
  xl: '0 20px 40px rgb(0 0 0 / 0.5)',
} as const

export const shadows = {
  light: shadow,
  dark: darkShadow,
} as const

export type ShadowToken = keyof typeof shadow
