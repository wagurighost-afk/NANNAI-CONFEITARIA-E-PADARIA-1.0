import { NiimbotConnectButton } from '@/components/niimbot/NiimbotConnectButton'
import { NiimbotDeviceInfoCard } from '@/components/niimbot/NiimbotDeviceInfoCard'
import { NiimbotStatusIndicator } from '@/components/niimbot/NiimbotStatusIndicator'
import { useNiimbot } from '@/hooks/useNiimbot'

/**
 * Self-contained panel: connect button + status + device details + errors.
 * Safe to drop into any page without touching existing modules.
 */
export function NiimbotConnectionPanel() {
  const { status, device, error, supported, supportMessage, clearError } = useNiimbot()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Conexão Bluetooth</p>
          <NiimbotStatusIndicator status={status} />
        </div>
        <NiimbotConnectButton />
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

      <NiimbotDeviceInfoCard device={device} />
    </div>
  )
}
