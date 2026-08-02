import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string | undefined
  confirmLabel?: string | undefined
  cancelLabel?: string | undefined
  variant?: 'danger' | 'primary' | undefined
  isConfirming?: boolean | undefined
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isConfirming = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            isLoading={isConfirming}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {/* Avoid duplicating `description` in the body — Modal already renders it. */}
      <span className="sr-only">{description ?? 'Confirme para continuar.'}</span>
    </Modal>
  )
}
