import { useCallback, useEffect, useRef, useState } from 'react'
import { NiimbotService } from '@/services/NiimbotService'
import type { NiimbotDeviceInfo, NiimbotServiceState } from '@/services/niimbot/types'
import { useToast } from '@/hooks/useToast'

export function useNiimbot() {
  const { push } = useToast()
  const [state, setState] = useState<NiimbotServiceState>(() => NiimbotService.getState())
  const previousStatus = useRef(state.status)

  useEffect(() => {
    return NiimbotService.subscribe((next) => {
      if (
        previousStatus.current === 'connected' &&
        next.status === 'disconnected' &&
        next.error?.includes('perdida')
      ) {
        push({
          title: 'NIIMBOT desconectada',
          description: next.error,
          variant: 'danger',
        })
      }
      previousStatus.current = next.status
      setState(next)
    })
  }, [push])

  const connect = useCallback(async (): Promise<NiimbotDeviceInfo> => {
    try {
      const device = await NiimbotService.connect()
      push({
        title: 'NIIMBOT conectada',
        description: `${device.model} · ${device.name}`,
        variant: 'success',
      })
      return device
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível conectar à NIIMBOT.'
      push({
        title: 'Falha na conexão',
        description: message,
        variant: 'danger',
      })
      throw error
    }
  }, [push])

  const disconnect = useCallback(async () => {
    await NiimbotService.disconnect()
    push({
      title: 'NIIMBOT desconectada',
      description: 'A impressora foi desconectada com sucesso.',
      variant: 'default',
    })
  }, [push])

  const clearError = useCallback(() => {
    NiimbotService.clearError()
  }, [])

  return {
    status: state.status,
    device: state.device,
    error: state.error,
    supported: state.supported,
    supportMessage: state.supportMessage,
    isConnecting: state.status === 'connecting',
    isConnected: state.status === 'connected',
    connect,
    disconnect,
    clearError,
  }
}
