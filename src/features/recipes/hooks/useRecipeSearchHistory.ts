import { useCallback, useState } from 'react'

const STORAGE_KEY = 'nannai-recipe-search-history'
const MAX_ITEMS = 8

function readHistory(): string[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return []
  }
}

function writeHistory(items: string[]) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useRecipeSearchHistory() {
  const [history, setHistory] = useState<string[]>(readHistory)

  const addSearch = useCallback((term: string) => {
    const trimmed = term.trim()
    if (trimmed.length < 2) {
      return
    }

    setHistory((current) => {
      const next = [
        trimmed,
        ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, MAX_ITEMS)
      writeHistory(next)
      return next
    })
  }, [])

  const removeSearch = useCallback((term: string) => {
    setHistory((current) => {
      const next = current.filter((item) => item !== term)
      writeHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    writeHistory([])
    setHistory([])
  }, [])

  return {
    history,
    addSearch,
    removeSearch,
    clearHistory,
  }
}
