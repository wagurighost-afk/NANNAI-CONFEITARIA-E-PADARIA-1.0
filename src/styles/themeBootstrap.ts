import { STORAGE_KEYS } from '@/core/constants'
import { storage } from '@/core/storage'
import { applyThemeCssVariables } from '@/styles/tokens'
import type { ThemeMode } from '@/types/theme.types'

export function resolveInitialTheme(): ThemeMode {
  const stored = storage.get(STORAGE_KEYS.theme)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export function applyDocumentTheme(theme: ThemeMode): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  applyThemeCssVariables(theme)
}
