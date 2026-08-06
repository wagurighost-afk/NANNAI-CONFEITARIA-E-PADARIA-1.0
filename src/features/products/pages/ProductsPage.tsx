import { Download, Pencil, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Badge, Button, Input, Modal, Skeleton } from '@/components/ui'
import { APP_ROUTES } from '@/core/constants'
import { getErrorMessage } from '@/core/errors'
import { ProductImportSummaryBanner } from '@/features/products/components/ProductImportSummaryBanner'
import { useProducts } from '@/features/products/hooks/useProducts'
import type { CatalogProduct } from '@/features/products/types/product.types'
import { useToast } from '@/hooks'
import { usePermission } from '@/hooks/usePermission'
function formatCost(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ProductFormFields({
  initial,
  onSubmit,
  isSaving,
  onCancel,
}: {
  initial?: CatalogProduct | null
  onSubmit: (values: { name: string; costPerPortion: number; status: 'Ativo' | 'Inativo' }) => void
  isSaving: boolean
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [cost, setCost] = useState(String(initial?.costPerPortion ?? ''))
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>(initial?.status ?? 'Ativo')

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({
          name: name.trim(),
          costPerPortion: Number(String(cost).replace(',', '.')) || 0,
          status,
        })
      }}
    >
      <Input label="Nome do produto" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="Custo por porção (R$)"
        type="number"
        min={0}
        step="0.01"
        value={cost}
        onChange={(e) => setCost(e.target.value)}
        required
      />
      <label className="block space-y-1.5 text-sm">
        <span className="text-muted-foreground">Status</span>
        <select
          className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
        >
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Salvar
        </Button>
      </div>
    </form>
  )
}

export function ProductsPage() {
  const { push } = useToast()
  const { hasPermission } = usePermission()
  const canManage = hasPermission('products:manage')
  const {
    products,
    kpis,
    search,
    setSearch,
    isLoading,
    importSummary,
    editing,
    isFormOpen,
    openCreate,
    openEdit,
    closeForm,
    createProduct,
    updateProduct,
    importMaster,
    isSaving,
    isImporting,
  } = useProducts()

  const handleImport = async (part: 'part1' | 'part2' | 'part3' | 'part4' | 'all') => {
    try {
      const summary = await importMaster(part)
      push({
        title: 'Importação concluída',
        description: `${summary.partLabel}: ${summary.created} cadastrados · ${summary.updated} atualizados · ${summary.ignored} ignorados`,
        variant: 'success',
      })
    } catch (error: unknown) {
      push({
        title: 'Falha na importação',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  const handleSubmit = async (values: {
    name: string
    costPerPortion: number
    status: 'Ativo' | 'Inativo'
  }) => {
    try {
      if (editing) {
        await updateProduct({
          id: editing.id,
          input: {
            name: values.name,
            costPerPortion: values.costPerPortion,
            status: values.status,
          },
        })
        push({ title: 'Produto atualizado', description: values.name, variant: 'success' })
      } else {
        await createProduct(values)
        push({ title: 'Produto cadastrado', description: values.name, variant: 'success' })
      }
      closeForm()
    } catch (error: unknown) {
      push({
        title: 'Não foi possível salvar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  return (
    <PageShell className="pb-6">
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Cadastro de Produtos' },
        ]}
      />

      <PageHeader
        title="Cadastro de Produtos"
        description="Catálogo mestre com custo por porção — usado no desperdício do dia. Editável e sem duplicidades."
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canManage ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleImport('part4')
                  }}
                  isLoading={isImporting}
                  className="w-full sm:w-auto"
                >
                  <Download className="size-4" />
                  Importar Parte 4
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    void handleImport('all')
                  }}
                  isLoading={isImporting}
                  className="w-full sm:w-auto"
                >
                  <Download className="size-4" />
                  Importar Cadastro Mestre
                </Button>
              </>
            ) : null}
            {canManage ? (
              <Button onClick={openCreate} className="w-full sm:w-auto">
                <Plus className="size-4" />
                Novo produto
              </Button>
            ) : null}
          </div>
        }
      />

      {importSummary ? <ProductImportSummaryBanner summary={importSummary} /> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-semibold text-foreground">{kpis.total}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">Ativos</p>
          <p className="text-2xl font-semibold text-foreground">{kpis.active}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">Cadastro Mestre</p>
          <p className="text-2xl font-semibold text-foreground">{kpis.master}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar produto..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton variant="rectangular" height={360} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Nenhum produto cadastrado"
          description="Importe o Cadastro Mestre (Parte 1) ou adicione um produto manualmente."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Custo/porção</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                {canManage ? <th className="px-4 py-3 font-medium">Ações</th> : null}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatCost(product.costPerPortion)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.status === 'Ativo' ? 'accent' : 'muted'}>
                      {product.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{product.origin}</td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!product.editable}
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={isFormOpen}
        onClose={closeForm}
        title={editing ? 'Editar produto' : 'Novo produto'}
        description="Nome, custo por porção e status. Edição futura permitida."
      >
        <ProductFormFields
          initial={editing}
          isSaving={isSaving}
          onCancel={closeForm}
          onSubmit={(values) => {
            void handleSubmit(values)
          }}
        />
      </Modal>
    </PageShell>
  )
}
