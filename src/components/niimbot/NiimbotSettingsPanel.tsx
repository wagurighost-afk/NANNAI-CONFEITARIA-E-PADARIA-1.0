import { Bluetooth, RefreshCw, Replace, Unplug } from 'lucide-react'
import { Button } from '@/components/ui'
import { NiimbotConnectButton } from '@/components/niimbot/NiimbotConnectButton'
import { NiimbotDeviceInfoCard } from '@/components/niimbot/NiimbotDeviceInfoCard'
import { NiimbotStatusIndicator } from '@/components/niimbot/NiimbotStatusIndicator'
import { useNiimbot } from '@/hooks/useNiimbot'
import { formatDateTimeBr } from '@/utils/formatDate'

/**
 * Printer settings panel: view info, reconnect, change printer, disconnect.
 */
export function NiimbotSettingsPanel() {
  const {
    status,
    device,
    persisted,
    error,
    supported,
    supportMessage,
    autoReconnectDone,
    needsReconnect,
    isConnecting,
    isConnected,
    reconnect,
    changePrinter,
    disconnect,
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Status da impressora</p>
          <NiimbotStatusIndicator status={status} />
          {!autoReconnectDone && status === 'connecting' ? (
            <p className="text-xs text-muted-foreground">Tentando reconectar automaticamente…</p>
          ) : null}
          {persisted?.lastConnectedAt ? (
            <p className="text-xs text-muted-foreground">
              Última conexão: {formatDateTimeBr(persisted.lastConnectedAt)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {!persisted ? <NiimbotConnectButton /> : null}
          {needsReconnect ? (
            <Button
              type="button"
              onClick={() => void reconnect()}
              disabled={!supported || isConnecting}
              isLoading={isConnecting}
            >
              <RefreshCw className="size-4" />
              Reconectar
            </Button>
          ) : null}
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

      <NiimbotDeviceInfoCard
        device={displayDevice}
        emptyMessage="Nenhuma impressora salva. Clique em “Conectar NIIMBOT” para parear a B1."
      />

      {persisted ? (
        <div className="rounded-2xl border border-border bg-surface-elevated p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Ações</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {needsReconnect ? (
              <Button
                type="button"
                onClick={() => void reconnect()}
                disabled={!supported || isConnecting}
              >
                <RefreshCw className="size-4" />
                Reconectar
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              onClick={() => void changePrinter()}
              disabled={!supported || isConnecting}
            >
              <Replace className="size-4" />
              Trocar impressora
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => void disconnect()}
              disabled={!isConnected || isConnecting}
            >
              <Unplug className="size-4" />
              Desconectar
            </Button>

            {!isConnected && !needsReconnect ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void reconnect()}
                disabled={!supported || isConnecting}
              >
                <Bluetooth className="size-4" />
                Conectar
              </Button>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            “Trocar impressora” abre o seletor Bluetooth. “Desconectar” mantém a impressora salva
            para reconexão automática na próxima visita.
          </p>
        </div>
      ) : null}
    </div>
  )
}
