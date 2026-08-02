import { MessageSquare } from 'lucide-react'
import { PageShell } from '@/components/common/PageShell'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Card, CardContent, Input, SearchInput, Skeleton } from '@/components/ui'
import { useCommentsFeed } from '@/features/comments/hooks/useCommentsFeed'
import {
  ShiftCommentForm,
  type ShiftCommentSubmitInput,
} from '@/features/production/components/ShiftCommentForm'
import { ShiftCommentList } from '@/features/production/components/ShiftCommentList'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { useToast } from '@/hooks'
import { formatDateBr } from '@/utils/formatDate'

export function CommentsPage() {
  const { push } = useToast()
  const {
    feed,
    filters,
    setFilters,
    isLoading,
    isChef,
    activeProduction,
    canComment,
    addComment,
    isSending,
  } = useCommentsFeed()

  const handleSubmit = async (input: ShiftCommentSubmitInput) => {
    if (!activeProduction) {
      return
    }

    try {
      await addComment({
        productionId: activeProduction.id,
        message: input.message,
        ...(input.photos.length > 0 ? { photos: input.photos } : {}),
      })
      push({ title: 'Comentário enviado', variant: 'success' })
    } catch (error: unknown) {
      push({ title: 'Erro ao enviar', description: getErrorMessage(error), variant: 'danger' })
    }
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'Comentários' }]}
      />
      <PageHeader
        title="Comentários"
        description={
          isChef
            ? 'Acompanhe observações e fotos de todos os turnos em um só lugar.'
            : 'Veja e registre comentários do seu turno de produção.'
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Input
          label="Data"
          type="date"
          value={filters.date}
          onChange={(event) => setFilters({ ...filters, date: event.target.value })}
        />
        <SearchInput
          placeholder="Buscar por mensagem, colaborador ou código..."
          value={filters.search}
          onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          onClear={() => setFilters({ ...filters, search: '' })}
        />
      </div>

      {canComment && activeProduction ? (
        <Card className="mb-6">
          <CardContent className="space-y-3 pt-6">
            <div>
              <p className="text-sm font-medium">Comentar no seu turno de hoje</p>
              <p className="text-sm text-muted-foreground">
                {activeProduction.employeeName} · {formatDateBr(activeProduction.date)} ·{' '}
                {activeProduction.shift} · {activeProduction.sector}
              </p>
            </div>
            <ShiftCommentForm isSending={isSending} onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6 border-dashed">
          <CardContent className="flex items-start gap-3 pt-6">
            <MessageSquare className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Para comentar, abra sua produção do dia</p>
              <p className="text-sm text-muted-foreground">
                Comentários ficam vinculados ao turno de produção. Se você ainda não tem produção
                cadastrada para esta data, peça ao chef para configurar.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={120} />
          ))}
        </div>
      ) : feed.length === 0 ? (
        <EmptyState
          title="Nenhum comentário nesta data"
          description="Quando a equipe registrar observações do turno, elas aparecerão aqui."
        />
      ) : (
        <ShiftCommentList comments={feed} showContext />
      )}
    </PageShell>
  )
}
