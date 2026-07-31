import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Badge, Card, CardContent, Drawer, Skeleton } from '@/components/ui'
import { PopDocumentPreview } from '@/features/pop/components/PopDocumentPreview'
import { usePopDocuments } from '@/features/pop/hooks/usePopDocuments'
import type { PopCategory, PopDocument } from '@/features/pop/types/pop.types'
import { POP_CATEGORY_LABELS, POP_SHIFT_LABELS } from '@/features/pop/types/pop.types'
import { APP_ROUTES } from '@/core/constants'
import { formatDateBr } from '@/utils/formatDate'

const FILTER_TABS: Array<{ value: 'all' | PopCategory; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'abertura', label: 'Abertura' },
  { value: 'fechamento', label: 'Fechamento' },
  { value: 'servico', label: 'Serviços' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'geral', label: 'Geral' },
]

function PopCard({ doc, onSelect }: { doc: PopDocument; onSelect: (doc: PopDocument) => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md" onClick={() => onSelect(doc)}>
      <CardContent className="space-y-2 pt-6">
        <p className="font-medium">{doc.title}</p>
        <p className="text-sm text-muted-foreground">{doc.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{POP_CATEGORY_LABELS[doc.category]}</Badge>
          <Badge variant="accent">{POP_SHIFT_LABELS[doc.shift]}</Badge>
          <Badge variant="default">v{doc.version}</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function PopPage() {
  const { data, isLoading } = usePopDocuments()
  const [selected, setSelected] = useState<PopDocument | null>(null)
  const [filter, setFilter] = useState<'all' | PopCategory>('all')

  const filtered = useMemo(() => {
    if (!data) {
      return []
    }
    if (filter === 'all') {
      return data
    }
    return data.filter((doc) => doc.category === filter)
  }, [data, filter])

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Breadcrumb items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'POP' }]} />
      <PageHeader
        title="POP"
        description="Procedimentos Operacionais Padrão — abertura, fechamento e rotinas do setor."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton variant="rectangular" height={240} />
      ) : !filtered.length ? (
        <EmptyState title="Nenhum POP disponível" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((doc) => (
            <PopCard key={doc.id} doc={doc} onSelect={setSelected} />
          ))}
        </div>
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        description={
          selected
            ? `${POP_CATEGORY_LABELS[selected.category]} · ${POP_SHIFT_LABELS[selected.shift]} · v${selected.version}`
            : undefined
        }
        size="xl"
      >
        {selected ? (
          <div className="space-y-4">
            <PopDocumentPreview fileUrl={selected.fileUrl} fileName={selected.fileName} />
            <p className="text-xs text-muted-foreground">
              Atualizado em {formatDateBr(selected.updatedAt.slice(0, 10))}
            </p>
          </div>
        ) : null}
      </Drawer>
    </motion.div>
  )
}
