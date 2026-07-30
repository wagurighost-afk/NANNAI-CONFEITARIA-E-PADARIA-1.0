import { motion } from 'framer-motion'
import { Breadcrumb, EmptyState, PageHeader } from '@/components/common'
import { Badge, Card, CardContent, Drawer, Skeleton } from '@/components/ui'
import { usePopDocuments } from '@/features/pop/hooks/usePopDocuments'
import type { PopDocument } from '@/features/pop/types/pop.types'
import { APP_ROUTES } from '@/core/constants'
import { formatDateBr } from '@/utils/formatDate'
import { useState } from 'react'

export function PopPage() {
  const { data, isLoading } = usePopDocuments()
  const [selected, setSelected] = useState<PopDocument | null>(null)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Breadcrumb items={[{ label: 'Início', href: APP_ROUTES.dashboard }, { label: 'POP' }]} />
      <PageHeader title="POP" description="Procedimentos Operacionais Padrão — somente leitura." />
      {isLoading ? (
        <Skeleton variant="rectangular" height={240} />
      ) : !data?.length ? (
        <EmptyState title="Nenhum POP disponível" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.map((doc) => (
            <Card key={doc.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelected(doc)}>
              <CardContent className="space-y-2 pt-6">
                <p className="font-medium">{doc.title}</p>
                <p className="text-sm text-muted-foreground">{doc.summary}</p>
                <div className="flex gap-2">
                  <Badge variant="muted">{doc.sector}</Badge>
                  <Badge variant="accent">v{doc.version}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        description={selected ? `${selected.sector} · v${selected.version}` : undefined}
      >
        {selected ? (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap text-sm">{selected.content}</p>
            <p className="text-xs text-muted-foreground">
              Atualizado em {formatDateBr(selected.updatedAt.slice(0, 10))}
            </p>
          </div>
        ) : null}
      </Drawer>
    </motion.div>
  )
}
