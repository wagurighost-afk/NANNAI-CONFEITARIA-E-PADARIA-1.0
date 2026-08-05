import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/features/products/services/products.service'
import type {
  CatalogProduct,
  CreateProductInput,
  UpdateProductInput,
} from '@/features/products/types/product.types'

const QUERY_KEY = ['products'] as const

export function useProducts() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<CatalogProduct | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const listQuery = useQuery({
    queryKey: [...QUERY_KEY, search],
    queryFn: () => productsService.list(search),
  })

  const summaryQuery = useQuery({
    queryKey: [...QUERY_KEY, 'import-summary'],
    queryFn: () => productsService.getLastImportSummary(),
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateProductInput) => productsService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsService.update(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const importMutation = useMutation({
    mutationFn: (part: 'part1' | 'part2' | 'all' = 'all') => {
      if (part === 'part1') {
        return productsService.importMasterPart1()
      }
      if (part === 'part2') {
        return productsService.importMasterPart2()
      }
      return productsService.importMasterAll()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  const products = listQuery.data ?? []
  const kpis = useMemo(() => {
    const active = products.filter((item) => item.status === 'Ativo').length
    const master = products.filter((item) => item.origin === 'Cadastro Mestre').length
    return {
      total: products.length,
      active,
      master,
    }
  }, [products])

  return {
    products,
    kpis,
    search,
    setSearch,
    isLoading: listQuery.isLoading,
    importSummary: summaryQuery.data ?? importMutation.data ?? null,
    editing,
    isFormOpen,
    openCreate: () => {
      setEditing(null)
      setIsFormOpen(true)
    },
    openEdit: (product: CatalogProduct) => {
      setEditing(product)
      setIsFormOpen(true)
    },
    closeForm: () => {
      setIsFormOpen(false)
      setEditing(null)
    },
    createProduct: createMutation.mutateAsync,
    updateProduct: updateMutation.mutateAsync,
    removeProduct: deleteMutation.mutateAsync,
    importMaster: importMutation.mutateAsync,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isImporting: importMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: () => listQuery.refetch(),
  }
}
