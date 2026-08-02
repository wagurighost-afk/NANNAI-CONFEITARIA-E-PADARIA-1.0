import type { ReactNode } from 'react'
import { Bluetooth, Battery, Clock3, Cpu, Hash, Radio } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { NiimbotStatusIndicator } from '@/components/niimbot/NiimbotStatusIndicator'
import type { NiimbotDeviceInfo } from '@/services/niimbot/types'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface NiimbotDeviceInfoCardProps {
  device: NiimbotDeviceInfo | null
  emptyMessage?: string
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
      <span className="mt-0.5 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function formatBattery(percent: number | null): string {
  if (percent == null) {
    return 'Indisponível'
  }
  return `${percent}%`
}

function formatFirmware(firmware: string | null): string {
  return firmware?.trim() || 'Indisponível'
}

export function NiimbotDeviceInfoCard({
  device,
  emptyMessage = 'Nenhuma impressora conectada. Clique em “Conectar NIIMBOT” para parear a B1.',
}: NiimbotDeviceInfoCardProps) {
  if (!device) {
    return (
      <Card>
        <CardContent className="space-y-3 p-5">
          <NiimbotStatusIndicator status="disconnected" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-base">Impressora NIIMBOT</CardTitle>
        <NiimbotStatusIndicator status={device.status} />
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        <InfoRow icon={<Cpu className="size-4" />} label="Modelo" value={device.model} />
        <InfoRow icon={<Bluetooth className="size-4" />} label="Nome" value={device.name} />
        <InfoRow
          icon={<Battery className="size-4" />}
          label="Nível de bateria"
          value={formatBattery(device.batteryPercent)}
        />
        <InfoRow
          icon={<Radio className="size-4" />}
          label="Status"
          value={
            device.status === 'connected'
              ? 'Conectada'
              : device.status === 'connecting'
                ? 'Conectando'
                : 'Desconectada'
          }
        />
        <InfoRow
          icon={<Hash className="size-4" />}
          label="ID"
          value={device.modelId != null ? String(device.modelId) : 'Indisponível'}
        />
        <InfoRow
          icon={<Hash className="size-4" />}
          label="Firmware"
          value={formatFirmware(device.firmware)}
        />
        <InfoRow
          icon={<Clock3 className="size-4" />}
          label="Última conexão"
          value={
            device.lastConnectedAt ? formatDateTimeBr(device.lastConnectedAt) : 'Indisponível'
          }
        />
        <InfoRow
          icon={<Cpu className="size-4" />}
          label="Detalhes"
          value={[
            device.dpi != null ? `${device.dpi} dpi` : null,
            device.protocolVersion != null ? `Protocolo ${device.protocolVersion}` : null,
            device.bluetoothDeviceId ? `BLE ${device.bluetoothDeviceId.slice(0, 8)}…` : null,
          ]
            .filter(Boolean)
            .join(' · ') || '—'}
        />
      </CardContent>
    </Card>
  )
}
