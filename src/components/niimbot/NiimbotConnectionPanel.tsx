import { NiimbotConnectButton } from '@/components/niimbot/NiimbotConnectButton'
import { NiimbotDeviceInfoCard } from '@/components/niimbot/NiimbotDeviceInfoCard'
import { NiimbotReconnectButton } from '@/components/niimbot/NiimbotReconnectButton'
import { NiimbotStatusIndicator } from '@/components/niimbot/NiimbotStatusIndicator'
import { useNiimbot } from '@/hooks/useNiimbot'

/**
 * Compact connection panel with auto-reconnect + Reconectar fallback.
 */
export function NiimbotConnectionPanel() {
  const {
    status,
    device,
    persisted,
    error,
    supported,
    supportMessage,
    needsReconnect,
    clearError,
  } = useNiimbot({ autoReconnect: true })

  const displayDevice =
    device ??
    (persisted
      ? {
          model: persisted.model,
          name: persisted.name,
          modelId: persisted.modelId,
          protocolVersion: null,
          dpi: null,
          batteryPercent: null,
          firmware: null,
          status: 'disconnected' as const,
          lastConnectedAt: persisted.lastConnectedAt,
          bluetoothDeviceId: persisted.bluetoothDeviceId,
        }
      : null)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Conexão Bluetooth</p>
          <NiimbotStatusIndicator status={status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {needsReconnect ? <NiimbotReconnectButton /> : null}
          {!persisted ? <NiimbotConnectButton /> : null}
          {persisted && !needsReconnect && status !== 'connected' ? (
            <NiimbotConnectButton connectLabel="Conectar NIIMBOT" />
          ) : null}
          {status === 'connected' ? <NiimbotConnectButton disconnectLabel="Desconectar" /> : null}
        </div>
      </div>

      {!supported && supportMessage ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {supportMessage}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          <div className="flex items-start justify-between gap-3">
            <p>{error}</p>
            <button
              type="button"
              className="shrink-0 text-xs underline underline-offset-2"
              onClick={clearError}
            >
              Dispensar
            </button>
          </div>
        </div>
      ) : null}

      <NiimbotDeviceInfoCard device={displayDevice} />
    </div>
  )
}
