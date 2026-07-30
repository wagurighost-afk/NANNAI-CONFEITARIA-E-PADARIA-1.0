import { DataTable, type DataTableColumn } from '@/components/ui'
import { ProgressBar } from '@/components/common/ProgressBar/ProgressBar'
import type { ProductionDay } from '@/features/production/types/production.types'
import { formatDateBr } from '@/utils/formatDate'

export interface ProductionTableProps {
  productions: ProductionDay[]
  onRowClick?: (production: ProductionDay) => void
}

const COLUMNS: DataTableColumn<ProductionDay>[] = [
  {
    id: 'productionCode',
    header: 'Código',
    cell: (row) => row.productionCode,
  },
  {
    id: 'date',
    header: 'Data',
    cell: (row) => formatDateBr(row.date),
  },
  {
    id: 'employeeName',
    header: 'Responsável',
    cell: (row) => row.employeeName,
  },
  {
    id: 'shift',
    header: 'Turno',
    cell: (row) => row.shift,
  },
  {
    id: 'sector',
    header: 'Setor',
    cell: (row) => row.sector,
  },
  {
    id: 'items',
    header: 'Itens',
    cell: (row) => row.items.length,
  },
  {
    id: 'progress',
    header: 'Progresso',
    cell: (row) => <ProgressBar value={row.progress} />,
  },
]

export function ProductionTable({ productions, onRowClick }: ProductionTableProps) {
  return (
    <DataTable
      data={productions}
      getRowId={(row) => row.id}
      columns={COLUMNS}
      {...(onRowClick ? { onRowClick } : {})}
    />
  )
}
