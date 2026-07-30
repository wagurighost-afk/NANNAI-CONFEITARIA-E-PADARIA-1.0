/**
 * Border tokens — widths and styles for the Design System.
 */
export const borderWidth = {
  none: '0',
  hairline: '1px',
  thin: '1px',
  medium: '2px',
  thick: '4px',
} as const

export const borderStyle = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
} as const

export const borders = {
  width: borderWidth,
  style: borderStyle,
} as const

export type BorderWidthToken = keyof typeof borderWidth
export type BorderStyleToken = keyof typeof borderStyle
