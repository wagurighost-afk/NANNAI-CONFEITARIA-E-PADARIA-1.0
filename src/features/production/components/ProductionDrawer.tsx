import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Pencil, Tags, Trash2 } from 'lucide-react'
import { ProgressBar } from '@/components/common/ProgressBar/ProgressBar'
import {
  Badge,
  Button,
  Drawer,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { PRODUCTION_STATUS_OPTIONS } from '@/features/production/constants/productionOptions'
import { ProductionStatusBadge } from '@/features/production/components/ProductionStatusBadge'
import {
  ShiftCommentForm,
  type ShiftCommentSubmitInput,
} from '@/features/production/components/ShiftCommentForm'
import { ShiftCommentList } from '@/features/production/components/ShiftCommentList'
import type { ProductionDay, ProductionItemStatus } from '@/features/production/types/production.types'
import { formatDateBr, formatDateTimeBr } from '@/utils/formatDate'

export interface ProductionDrawerProps {
  production: ProductionDay | null
  open: boolean
  onClose: () => void
  canManage?: boolean
  canEditForm?: boolean
  canUpdateItems?: boolean
  canComment?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onItemStatusChange?: (itemId: string, status: ProductionItemStatus) => void
  onReorder?: (itemIds: string[]) => void
  onAddComment?: (input: ShiftCommentSubmitInput) => Promise<void>
  onCreateLabel?: (itemId: string) => void
  canPrintLabels?: boolean
}

export function ProductionDrawer({
  production,
  open,
  onClose,
  canManage = false,
  canEditForm = false,
  canUpdateItems = false,
  canComment = false,
  onEdit,
  onDelete,
  onDuplicate,
  onItemStatusChange,
  onReorder,
  onAddComment,
  onCreateLabel,
  canPrintLabels = false,
}: ProductionDrawerProps) {
  const [isSending, setIsSending] = useState(false)

  if (!production) {
    return null
  }

  const sortedItems = [...production.items].sort((a, b) => a.order - b.order)

  const moveItem = (index: number, direction: -1 | 1) => {
    if (!onReorder || !canManage) {
      return
    }
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= sortedItems.length) {
      return
    }
    const ids = sortedItems.map((item) => item.id)
    const temp = ids[index]
    const target = ids[nextIndex]
    if (!temp || !target) {
      return
    }
    ids[index] = target
    ids[nextIndex] = temp
    onReorder(ids)
  }

  const handleComment = async (input: ShiftCommentSubmitInput) => {
    if (!onAddComment) {
      return
    }
    setIsSending(true)
    try {
      await onAddComment(input)
    } finally {
      setIsSending(false)
    }
  }

  const comments = production.comments ?? []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={production.employeeName}
      description={`${formatDateBr(production.date)} · ${production.shift} · ${production.sector}`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="muted">{production.productionCode}</Badge>
          {canManage || canEditForm ? (
            <div className="ml-auto flex flex-wrap gap-2">
              {canEditForm ? (
                <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
              ) : null}
              {canManage ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
                    <Copy className="size-4" />
                    Duplicar
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={onDelete}>
                    <Trash2 className="size-4" />
                    Remover
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <ProgressBar value={production.progress} label="Progresso da produção" />

        <Tabs defaultValue="items">
          <TabsList className="w-full flex-wrap">
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="comments">Comentários</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ul className="space-y-2">
              {sortedItems.map((item, index) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <ProductionStatusBadge status={item.status} />
                  </div>
                  {canUpdateItems ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        aria-label={`Status de ${item.name}`}
                        options={PRODUCTION_STATUS_OPTIONS}
                        value={item.status}
                        onChange={(event) => {
                          onItemStatusChange?.(
                            item.id,
                            event.target.value as ProductionItemStatus,
                          )
                        }}
                      />
                      {canPrintLabels && item.status === 'Concluído' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateLabel?.(item.id)}
                        >
                          <Tags className="size-4" />
                          Imprimir etiqueta
                        </Button>
                      ) : null}
                      {canManage ? (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="px-2"
                            aria-label="Mover para cima"
                            disabled={index === 0}
                            onClick={() => {
                              moveItem(index, -1)
                            }}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="px-2"
                            aria-label="Mover para baixo"
                            disabled={index === sortedItems.length - 1}
                            onClick={() => {
                              moveItem(index, 1)
                            }}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="comments">
            {canComment ? (
              <ShiftCommentForm
                disabled={!onAddComment}
                isSending={isSending}
                onSubmit={handleComment}
              />
            ) : null}
            <ShiftCommentList comments={comments} />
          </TabsContent>

          <TabsContent value="details">
            {production.notes ? (
              <p className="text-sm text-muted-foreground">{production.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sem observações.</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Atualizado em {formatDateTimeBr(production.updatedAt)}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Drawer>
  )
}
