import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '@/core/constants'
import { storage } from '@/core/storage'

function readCollapsed(): boolean {
  return storage.get(STORAGE_KEYS.sidebarCollapsed) === 'true'
}

export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(readCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    storage.set(STORAGE_KEYS.sidebarCollapsed, String(isCollapsed))
  }, [isCollapsed])

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((current) => !current)
  }, [])

  const openMobile = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((current) => !current)
  }, [])

  return {
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    openMobile,
    closeMobile,
    toggleMobile,
    setIsCollapsed,
  }
}
