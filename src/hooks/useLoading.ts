import { useContext } from 'react'
import { LoadingContext } from '@/contexts/LoadingContext'

export function useLoading() {
  const context = useContext(LoadingContext)

  if (!context) {
    throw new Error('useLoading deve ser usado dentro de LoadingProvider.')
  }

  return context
}
