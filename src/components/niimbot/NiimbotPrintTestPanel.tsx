import { Link } from 'react-router-dom'
import { Eraser, Printer, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui'
import { NiimbotDeviceInfoCard } from '@/components/niimbot/NiimbotDeviceInfoCard'
import { NiimbotStatusIndicator } from '@/components/niimbot/NiimbotStatusIndicator'
import { APP_ROUTES } from '@/core/constants'
import { useNiimbot } from '@/hooks/useNiimbot'
import { displayDeviceFromPersisted } from '@/services/niimbot/displayDevice'
import { formatDateTimeBr } from '@/utils/formatDate'

/**
 * Test-print panel: print a fixed NIIMBOT label and show activity logs.
 * Not wired to Produção / Etiquetas Inteligentes.
 */
export function NiimbotPrintTestPanel() {
  const {
    status,
    device,
    persisted,
    error,
    supported,
    supportMessage,
    needsReconnect,
    isConnecting,
    isConnected,
    isPrinting,
    printProgress,
    printLogs,
    reconnect,
    printTestLabel,
    clearPrintLogs,
    clearError,
  } = useNiimbot({ autoReconnect: true })

  const displayDevice = displayDeviceFromPersisted(persisted, device)

  const canPrint = supported && !isPrinting && !isConnecting && Boolean(persisted || isConnected)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Status da impressora</p>
          <NiimbotStatusIndicator status={status} />
          {isPrinting && printProgress ? (
            <p className="text-xs text-muted-foreground">Impressão: {printProgress}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {needsReconnect ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void reconnect()}
              disabled={!supported || isConnecting || isPrinting}
              isLoading={isConnecting}
            >
              <RefreshCw className="size-4" />
              Reconectar
            </Button>
          ) : null}
          <Link
            to={APP_ROUTES.niimbotSettings}
            className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-4 text-base font-medium text-foreground transition-opacity hover:bg-muted sm:h-10 sm:min-h-[40px] sm:text-sm"
          >
            <Settings className="size-4" />
            Configurações
          </Link>
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

      <div className="rounded-2xl border border-border bg-surface-elevated p-4">
        <p className="text-sm font-medium text-foreground">Etiqueta de teste</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Conteúdo fixo: NANNAI, Teste de Impressão, data, hora e QR Code. Não envia dados de
          Produção.
        </p>
        <div className="mt-4">
          <Button
            type="button"
            onClick={() => void printTestLabel()}
            disabled={!canPrint}
            isLoading={isPrinting}
          >
            <Printer className="size-4" />
            Imprimir etiqueta de teste
          </Button>
          {!persisted && !isConnected ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Conecte uma impressora em Configurações antes de imprimir.
            </p>
          ) : null}
        </div>
      </div>

      <NiimbotDeviceInfoCard
        device={displayDevice}
        emptyMessage="Nenhuma impressora salva. Vá em Configurações e conecte a NIIMBOT B1."
      />

      <div className="rounded-2xl border border-border bg-surface-elevated p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Logs de impressão</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearPrintLogs}
            disabled={printLogs.length === 0}
          >
            <Eraser className="size-4" />
            Limpar
          </Button>
        </div>

        {printLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma impressão registrada ainda.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {printLogs.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-border/70 bg-background/60 px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p
                    className={
                      entry.level === 'error'
                        ? 'font-medium text-danger'
                        : entry.level === 'warn'
                          ? 'font-medium text-amber-700'
                          : 'font-medium text-foreground'
                    }
                  >
                    {entry.message}
                  </p>
                  <time className="text-xs text-muted-foreground" dateTime={entry.at}>
                    {formatDateTimeBr(entry.at)}
                  </time>
                </div>
                {entry.detail ? (
                  <p className="mt-1 text-xs text-muted-foreground">{entry.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
