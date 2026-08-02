import { useCallback, useEffect, useRef, useState } from 'react'
import { NiimbotService } from '@/services/NiimbotService'
import type { NiimbotDeviceInfo, NiimbotServiceState } from '@/services/niimbot/types'
import { useToast } from '@/hooks/useToast'

export function useNiimbot(options?: { autoReconnect?: boolean }) {
  const autoReconnect = options?.autoReconnect ?? true
  const { push } = useToast()
  const [state, setState] = useState<NiimbotServiceState>(() => NiimbotService.getState())
  const previousStatus = useRef(state.status)
  const autoStarted = useRef(false)

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

  useEffect(() => {
    if (!autoReconnect || autoStarted.current) {
      return
    }
    autoStarted.current = true
    void NiimbotService.tryAutoReconnect()
  }, [autoReconnect])

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

  const reconnect = useCallback(async (): Promise<NiimbotDeviceInfo> => {
    try {
      const device = await NiimbotService.reconnect()
      push({
        title: 'NIIMBOT reconectada',
        description: `${device.model} · ${device.name}`,
        variant: 'success',
      })
      return device
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível reconectar à NIIMBOT.'
      push({
        title: 'Falha ao reconectar',
        description: message,
        variant: 'danger',
      })
      throw error
    }
  }, [push])

  const changePrinter = useCallback(async (): Promise<NiimbotDeviceInfo> => {
    try {
      const device = await NiimbotService.changePrinter()
      push({
        title: 'Impressora alterada',
        description: `${device.model} · ${device.name}`,
        variant: 'success',
      })
      return device
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível trocar a impressora.'
      push({
        title: 'Falha ao trocar impressora',
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
      description: 'A impressora foi desconectada. Os dados salvos foram mantidos.',
      variant: 'default',
    })
  }, [push])

  const forgetPrinter = useCallback(async () => {
    await NiimbotService.forgetPrinter()
    push({
      title: 'Impressora removida',
      description: 'A NIIMBOT foi desconectada e removida das configurações.',
      variant: 'default',
    })
  }, [push])

  const clearError = useCallback(() => {
    NiimbotService.clearError()
  }, [])

  return {
    status: state.status,
    device: state.device,
    persisted: state.persisted,
    error: state.error,
    supported: state.supported,
    supportMessage: state.supportMessage,
    autoReconnectDone: state.autoReconnectDone,
    needsReconnect: state.needsReconnect,
    isConnecting: state.status === 'connecting',
    isConnected: state.status === 'connected',
    connect,
    reconnect,
    changePrinter,
    disconnect,
    forgetPrinter,
    clearError,
  }
}
