import { Link } from 'react-router-dom'
import { Bluetooth, Check, Printer, RefreshCw, Replace, Trash2, Unplug } from 'lucide-react'
import { Button } from '@/components/ui'
import { NiimbotConnectButton } from '@/components/niimbot/NiimbotConnectButton'
import { NiimbotDeviceInfoCard } from '@/components/niimbot/NiimbotDeviceInfoCard'
import { NiimbotStatusIndicator } from '@/components/niimbot/NiimbotStatusIndicator'
import { APP_ROUTES } from '@/core/constants'
import { useNiimbot } from '@/hooks/useNiimbot'
import { displayDeviceFromPersisted } from '@/services/niimbot/displayDevice'
import { formatDateTimeBr } from '@/utils/formatDate'

/**
 * Printer settings panel: registry, reconnect, change printer, disconnect.
 */
export function NiimbotSettingsPanel() {
  const {
    status,
    device,
    persisted,
    printers,
    activePrinterId,
    error,
    supported,
    supportMessage,
    autoReconnectDone,
    needsReconnect,
    isConnecting,
    isConnected,
    isPrinting,
    reconnect,
    changePrinter,
    setActivePrinter,
    disconnect,
    forgetPrinter,
    clearError,
  } = useNiimbot({ autoReconnect: true })

  const displayDevice = displayDeviceFromPersisted(persisted, device)

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
          {printers.length === 0 ? <NiimbotConnectButton /> : null}
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

      {printers.length > 0 ? (
        <div className="rounded-2xl border border-border bg-surface-elevated p-4">
          <p className="mb-1 text-sm font-medium text-foreground">Impressoras salvas</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Base pronta para múltiplas impressoras. Apenas uma sessão Bluetooth fica ativa por vez.
          </p>
          <ul className="space-y-2">
            {printers.map((printer) => {
              const isActive = printer.id === activePrinterId
              return (
                <li
                  key={printer.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {printer.nickname?.trim() || printer.name}
                      {isActive ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (ativa)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {printer.model}
                      {printer.lastConnectedAt
                        ? ` · ${formatDateTimeBr(printer.lastConnectedAt)}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isActive ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void setActivePrinter(printer.id)}
                        disabled={isConnecting || isPrinting}
                      >
                        <Check className="size-4" />
                        Usar
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void forgetPrinter(printer.id)}
                      disabled={isConnecting}
                    >
                      <Trash2 className="size-4" />
                      Esquecer
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface-elevated p-4">
        <p className="text-sm font-medium text-foreground">Teste da Impressora</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Imprima uma etiqueta de teste (NANNAI, data, hora e QR) sem integrar com Produção.
        </p>
        <div className="mt-3">
          <Link
            to={APP_ROUTES.niimbotPrintTest}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:h-10 sm:min-h-[40px] sm:text-sm"
          >
            <Printer className="size-4" />
            Abrir teste da impressora
          </Link>
        </div>
      </div>

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
              Trocar / adicionar impressora
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
            “Trocar / adicionar” abre o seletor Bluetooth e inclui a impressora no registro.
            “Desconectar” mantém as impressoras salvas para reconexão automática.
          </p>
        </div>
      ) : null}
    </div>
  )
}
