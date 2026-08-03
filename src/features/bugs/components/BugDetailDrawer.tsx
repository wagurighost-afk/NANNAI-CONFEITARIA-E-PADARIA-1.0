import { useEffect, useState } from 'react'
import { Crown, ImageIcon, Video } from 'lucide-react'
import { Badge, Button, Drawer, Select, TextArea } from '@/components/ui'
import { BugHistoryTimeline } from '@/features/bugs/components/BugHistoryTimeline'
import {
  BUG_PRIORITY_BADGE,
  BUG_PRIORITY_LABELS,
  BUG_STATUS_BADGE,
  BUG_STATUS_LABELS,
  BUG_STATUS_MANAGE_OPTIONS,
} from '@/features/bugs/constants/bugOptions'
import type { BugReport, BugStatus } from '@/features/bugs/types/bug.types'
import { formatDateTimeBr } from '@/utils/formatDate'

export interface BugDetailDrawerProps {
  bug: BugReport | null
  open: boolean
  canManageStatus: boolean
  isUpdatingStatus?: boolean
  onClose: () => void
  onUpdateStatus?: (status: BugStatus, note?: string) => Promise<void>
}

export function BugDetailDrawer({
  bug,
  open,
  canManageStatus,
  isUpdatingStatus = false,
  onClose,
  onUpdateStatus,
}: BugDetailDrawerProps) {
  const [status, setStatus] = useState<BugStatus>('aberto')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (bug) {
      setStatus(bug.status)
      setNote('')
    }
  }, [bug])

  if (!bug) {
    return null
  }

  const handleStatusUpdate = async () => {
    if (!onUpdateStatus || status === bug.status) {
      return
    }

    await onUpdateStatus(status, note.trim() || undefined)
    setNote('')
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={bug.title}
      description={`Reportado por ${bug.reportedByName} em ${formatDateTimeBr(bug.createdAt)}`}
      size="lg"
      footer={
        canManageStatus ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              className="flex-1"
              label="Alterar status"
              value={status}
              options={BUG_STATUS_MANAGE_OPTIONS}
              onChange={(event) => setStatus(event.target.value as BugStatus)}
            />
            <Button
              className="sm:min-w-36"
              disabled={isUpdatingStatus || status === bug.status}
              onClick={() => void handleStatusUpdate()}
            >
              {isUpdatingStatus ? 'Salvando...' : 'Atualizar status'}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant={BUG_STATUS_BADGE[bug.status]}>{BUG_STATUS_LABELS[bug.status]}</Badge>
          <Badge variant={BUG_PRIORITY_BADGE[bug.priority]}>
            {BUG_PRIORITY_LABELS[bug.priority]}
          </Badge>
          <Badge variant="muted">{bug.moduleName}</Badge>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Descrição</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{bug.description}</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <InfoItem label="Sistema operacional" value={bug.os} />
          <InfoItem label="Navegador" value={bug.browser} />
          <InfoItem label="Versão do app" value={bug.appVersion} />
          <InfoItem label="E-mail do reportador" value={bug.reportedByEmail || '—'} />
        </section>

        {bug.images.length > 0 ? (
          <section className="space-y-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
              <ImageIcon className="size-4" aria-hidden />
              Imagens
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {bug.images.map((image) => (
                <a
                  key={image.id}
                  href={image.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <img src={image.fileUrl} alt={image.fileName} className="h-40 w-full object-cover" />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {bug.video ? (
          <section className="space-y-2">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
              <Video className="size-4" aria-hidden />
              Vídeo
            </h3>
            <video
              controls
              className="w-full rounded-lg border border-border"
              src={bug.video.fileUrl}
            />
          </section>
        ) : null}

        {canManageStatus ? (
          <section className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
              <Crown className="size-4" aria-hidden />
              Administrador Master
            </p>
            <TextArea
              label="Observação da alteração (opcional)"
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Descreva o que foi feito ou o próximo passo..."
            />
          </section>
        ) : null}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Histórico</h3>
          <BugHistoryTimeline history={bug.history} />
        </section>
      </div>
    </Drawer>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}
