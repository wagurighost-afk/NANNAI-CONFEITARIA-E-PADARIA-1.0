import { useEffect } from 'react'
import { lockAppScroll } from '@/core/layout/appScroll'

export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) {
      return
    }

    return lockAppScroll()
  }, [locked])
}
