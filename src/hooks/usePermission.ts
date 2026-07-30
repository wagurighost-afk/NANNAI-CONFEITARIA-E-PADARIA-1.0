import { useContext } from 'react'
import { RbacContext } from '@/contexts/RbacContext'

export function usePermission() {
  const context = useContext(RbacContext)

  if (!context) {
    throw new Error('usePermission deve ser usado dentro de RbacProvider.')
  }

  return context
}
