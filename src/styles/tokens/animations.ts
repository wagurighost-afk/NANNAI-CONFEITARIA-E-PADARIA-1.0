/**
 * Motion tokens for CSS transitions and Framer Motion.
 * Durations in milliseconds for CSS; Motion presets use seconds.
 */
export const duration = {
  instant: 0,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 500,
} as const

export const easing = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  emphasized: 'cubic-bezier(0.22, 1, 0.36, 1)',
  entrance: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

export const motionPresets = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration.normal / 1000, ease: 'easeOut' },
  },
  fadeUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: duration.moderate / 1000, ease: [0.22, 1, 0.36, 1] },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: duration.normal / 1000, ease: [0.22, 1, 0.36, 1] },
  },
} as const

export const animations = {
  duration,
  easing,
  motionPresets,
} as const

export type DurationToken = keyof typeof duration
export type EasingToken = keyof typeof easing
export type MotionPresetToken = keyof typeof motionPresets
