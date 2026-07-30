import { useMemo } from 'react'
import { MAIN_NAVIGATION, type AppNavItem } from '@/core/constants'
import { usePermission } from '@/hooks/usePermission'

function filterNavigation(
  items: readonly AppNavItem[],
  hasPermission: (permission: NonNullable<AppNavItem['permission']>) => boolean,
): AppNavItem[] {
  return items
    .map((item) => {
      const children = item.children
        ? filterNavigation(item.children, hasPermission)
        : undefined

      if (item.permission && !hasPermission(item.permission)) {
        return null
      }

      if (children && children.length === 0 && item.children) {
        return null
      }

      return {
        ...item,
        ...(children ? { children } : {}),
      }
    })
    .filter((item): item is AppNavItem => item !== null)
}

export function useNavigation() {
  const { hasPermission } = usePermission()

  const items = useMemo(
    () => filterNavigation(MAIN_NAVIGATION, hasPermission),
    [hasPermission],
  )

  return { items }
}
