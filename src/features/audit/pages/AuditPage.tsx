import { RefreshCw } from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Badge, Button, DataTable, Pagination, SearchInput, Select, Spinner } from '@/components/ui'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { AuditLogCard } from '@/features/audit/components/AuditLogCard'
import { AuditLogDetailDrawer } from '@/features/audit/components/AuditLogDetailDrawer'
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_LABELS,
  AUDIT_ENTITY_OPTIONS,
} from '@/features/audit/constants/audit.constants'
import { useAuditLogs } from '@/features/audit/hooks/useAuditLogs'
import type { AuditLogRecord } from '@/features/audit/types/audit.types'
import { APP_ROUTES } from '@/core/constants'
import { formatDateTimeBr } from '@/utils/formatDate'

const columns: DataTableColumn<AuditLogRecord>[] = [
  {
    id: 'createdAt',
    header: 'Quando',
    cell: (row) => <span className="whitespace-nowrap">{formatDateTimeBr(row.createdAt)}</span>,
  },
  {
    id: 'actor',
    header: 'Quem',
    cell: (row) => (
      <div>
        <p className="font-medium">{row.actor.userName}</p>
        <p className="text-xs text-muted-foreground">{row.actor.userEmail}</p>
      </div>
    ),
  },
  {
    id: 'entity',
    header: 'O que',
    cell: (row) => (
      <div className="space-y-1">
        <Badge variant="muted">{AUDIT_ENTITY_LABELS[row.entityType]}</Badge>
        <p className="text-xs text-muted-foreground">{row.entityId}</p>
      </div>
    ),
  },
  {
    id: 'action',
    header: 'Ação',
    cell: (row) => AUDIT_ACTION_LABELS[row.action],
  },
  {
    id: 'summary',
    header: 'Resumo',
    cell: (row) => <span className="line-clamp-2">{row.summary}</span>,
  },
]

export function AuditPage() {
  const {
    logs,
    total,
    isLoading,
    isFetching,
    entityType,
    setEntityType,
    action,
    setAction,
    search,
    setSearch,
    page,
    setPage,
    totalPages,
    selectedLog,
    selectLog,
    clearSelection,
    refetch,
  } = useAuditLogs()

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Auditoria' },
        ]}
      />

      <PageHeader
        title="Histórico de Auditoria"
        description="Registro completo de alterações: quem alterou, quando, o que mudou, antes e depois."
        actions={
          <Button variant="outline" size="md" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
            Atualizar
          </Button>
        }
      />

      <div className="grid gap-3 rounded-2xl border border-border bg-surface-elevated p-4 md:grid-cols-4">
        <Select
          label="Entidade"
          value={entityType}
          options={[
            { value: '', label: 'Todas' },
            ...AUDIT_ENTITY_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
          ]}
          onChange={(event) => {
            setEntityType(event.target.value as typeof entityType)
            setPage(0)
          }}
        />

        <Select
          label="Ação"
          value={action}
          options={[
            { value: '', label: 'Todas' },
            ...AUDIT_ACTION_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
          ]}
          onChange={(event) => {
            setAction(event.target.value as typeof action)
            setPage(0)
          }}
        />

        <div className="md:col-span-2">
          <SearchInput
            label="ID da entidade"
            placeholder="Filtrar por ID (ex.: prd-..., rec-...)"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString('pt-BR')} registro(s)</span>
          <span>
            Página {page + 1} de {totalPages}
          </span>
        </div>

        <div className="hidden lg:block">
          <DataTable
            columns={columns}
            data={logs}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="Nenhum registro de auditoria encontrado."
            onRowClick={(row) => selectLog(row.id)}
          />
        </div>

        <div className="space-y-3 lg:hidden">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted" />
              ))
            : null}
          {!isLoading
            ? logs.map((log) => (
                <AuditLogCard
                  key={log.id}
                  log={log}
                  onClick={() => selectLog(log.id)}
                />
              ))
            : null}
        </div>

        {!isLoading && logs.length === 0 ? (
          <EmptyState
            title="Sem registros"
            description="As alterações do sistema aparecerão aqui conforme forem realizadas."
          />
        ) : null}

        {totalPages > 1 ? (
          <Pagination
            page={page + 1}
            totalPages={totalPages}
            onPageChange={(nextPage) => setPage(nextPage - 1)}
          />
        ) : null}
      </div>

      <AuditLogDetailDrawer log={selectedLog} onClose={clearSelection} />
    </div>
  )
}
