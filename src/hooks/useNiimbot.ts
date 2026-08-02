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

  const reconnect = useCallback(async (printerId?: string): Promise<NiimbotDeviceInfo> => {
    try {
      const device = await NiimbotService.reconnect(printerId)
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

  const setActivePrinter = useCallback(async (printerId: string) => {
    await NiimbotService.setActivePrinter(printerId)
    push({
      title: 'Impressora ativa alterada',
      description: 'A impressora selecionada será usada nas próximas impressões.',
      variant: 'default',
    })
  }, [push])

  const disconnect = useCallback(async () => {
    await NiimbotService.disconnect()
    push({
      title: 'NIIMBOT desconectada',
      description: 'A impressora foi desconectada. Os dados salvos foram mantidos.',
      variant: 'default',
    })
  }, [push])

  const forgetPrinter = useCallback(async (printerId?: string) => {
    await NiimbotService.forgetPrinter(printerId)
    push({
      title: 'Impressora removida',
      description: 'A NIIMBOT foi desconectada e removida das configurações.',
      variant: 'default',
    })
  }, [push])

  const printTestLabel = useCallback(async () => {
    try {
      await NiimbotService.printTestLabel()
      push({
        title: 'Etiqueta impressa',
        description: 'A etiqueta de teste foi enviada para a NIIMBOT.',
        variant: 'success',
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível imprimir a etiqueta de teste.'
      push({
        title: 'Falha na impressão',
        description: message,
        variant: 'danger',
      })
      throw error
    }
  }, [push])

  const clearPrintLogs = useCallback(() => {
    NiimbotService.clearPrintLogs()
  }, [])

  const clearError = useCallback(() => {
    NiimbotService.clearError()
  }, [])

  return {
    status: state.status,
    device: state.device,
    persisted: state.persisted,
    printers: state.printers,
    activePrinterId: state.activePrinterId,
    error: state.error,
    supported: state.supported,
    supportMessage: state.supportMessage,
    autoReconnectDone: state.autoReconnectDone,
    needsReconnect: state.needsReconnect,
    isPrinting: state.isPrinting,
    printProgress: state.printProgress,
    printLogs: state.printLogs,
    isConnecting: state.status === 'connecting',
    isConnected: state.status === 'connected',
    connect,
    reconnect,
    changePrinter,
    setActivePrinter,
    disconnect,
    forgetPrinter,
    printTestLabel,
    clearPrintLogs,
    clearError,
  }
}
