import { useCallback, useEffect, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export type RecipeDetailViewMode = 'production' | 'spreadsheet'

const STORAGE_KEY = 'nannai-recipe-detail-view-mode'

function readStoredMode(): RecipeDetailViewMode {
  if (typeof window === 'undefined') {
    return 'production'
  }
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'spreadsheet' ? 'spreadsheet' : 'production'
}

export function useRecipeViewMode(hasSpreadsheet: boolean) {
  const isCompact = useMediaQuery('(max-width: 1023px)')
  const [desktopMode, setDesktopMode] = useState<RecipeDetailViewMode>(readStoredMode)

  useEffect(() => {
    if (!hasSpreadsheet && desktopMode === 'spreadsheet') {
      setDesktopMode('production')
    }
  }, [desktopMode, hasSpreadsheet])

  const mode: RecipeDetailViewMode = isCompact || !hasSpreadsheet ? 'production' : desktopMode
  const canToggle = !isCompact && hasSpreadsheet

  const setMode = useCallback((next: RecipeDetailViewMode) => {
    setDesktopMode(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return { mode, setMode, canToggle, isCompact }
}
