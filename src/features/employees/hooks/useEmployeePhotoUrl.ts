import { useEffect, useState } from 'react'
import { resolveEmployeePhotoUrl } from '@/features/employees/utils/employeePhoto'

export function useEmployeePhotoUrl(photoUrl?: string): string | undefined {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    void resolveEmployeePhotoUrl(photoUrl).then((url) => {
      if (!cancelled) {
        setResolvedUrl(url)
      }
    })

    return () => {
      cancelled = true
    }
  }, [photoUrl])

  return resolvedUrl
}
