import { useMemo, useState } from 'react'
import { Breadcrumb, CloudPersistenceNotice, EmptyState, PageHeader, PageShell } from '@/components/common'
import { Skeleton } from '@/components/ui'
import { EMPLOYEES_MOCK } from '@/features/employees/mocks/employees.mock'
import { ProductionConferenceFiltersBar } from '@/features/production/components/ProductionConferenceFiltersBar'
import { ProductionConferenceItemRow } from '@/features/production/components/ProductionConferenceItemRow'
import { ProductionConferenceKpisSection } from '@/features/production/components/ProductionConferenceKpis'
import { ProductionConferenceStatusPicker } from '@/features/production/components/ProductionConferenceStatusPicker'
import { useProduction } from '@/features/production/hooks/useProduction'
import type { ProductionConferenceStatus } from '@/features/production/types/production.types'
import {
  canEditProductionDay,
} from '@/features/production/utils/productionPermissions'
import {
  filterConferenceListEntries,
  flattenConferenceItems,
  getItemConferenceStatus,
} from '@/features/production/utils/conference'
import type { ConferenceListEntry } from '@/features/production/utils/conference'
import { APP_ROUTES } from '@/core/constants'
import { CLOUD_SAVED_MESSAGE } from '@/core/persistence/cloudPersistence'
import { getErrorMessage } from '@/core/errors'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks'

export function ProductionConferencePage() {
  const { user } = useAuth()
  const { push } = useToast()
  const [pickerEntry, setPickerEntry] = useState<ConferenceListEntry | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    filteredProductions,
    conferenceKpis,
    isLoading,
    filters,
    setFilters,
    updateItemConference,
    canManage,
    canUpdateItems,
  } = useProduction()

  const employees = EMPLOYEES_MOCK.filter((employee) => employee.status === 'Ativo').map((employee) => ({
    id: employee.id,
    name: employee.name,
  }))

  const conferenceItems = useMemo(() => {
    const entries = flattenConferenceItems(filteredProductions)
    return filterConferenceListEntries(entries, filters.conferenceFilter ?? 'all')
  }, [filteredProductions, filters.conferenceFilter])

  const canUpdateEntry = (entry: ConferenceListEntry) => {
    const production = filteredProductions.find((item) => item.id === entry.productionId)
    if (!production) {
      return false
    }

    return canUpdateItems && canEditProductionDay(user, production)
  }

  const handleSelectStatus = async (status: ProductionConferenceStatus) => {
    if (!pickerEntry) {
      return
    }

    setIsSaving(true)
    try {
      await updateItemConference({
        productionId: pickerEntry.productionId,
        itemId: pickerEntry.item.id,
        status,
      })
      push({
        title: 'Conferência atualizada',
        description: CLOUD_SAVED_MESSAGE,
        variant: 'success',
      })
      setPickerEntry(null)
    } catch (error: unknown) {
      push({
        title: 'Erro ao atualizar conferência',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Produção', href: APP_ROUTES.production },
          { label: 'Conferência diária' },
        ]}
      />

      <PageHeader
        title="Conferência diária"
        description="Acompanhe e registre o status de cada item da produção do dia. As alterações são sincronizadas em tempo real para toda a equipe."
      />

      <CloudPersistenceNotice />

      <ProductionConferenceKpisSection kpis={conferenceKpis} isLoading={isLoading} />

      <div className="mb-6">
        <ProductionConferenceFiltersBar
          filters={filters}
          employees={employees}
          showEmployeeFilter={canManage}
          onFiltersChange={setFilters}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={96} />
          ))}
        </div>
      ) : conferenceItems.length === 0 ? (
        <EmptyState
          title="Nenhum item encontrado"
          description="Ajuste os filtros ou aguarde a produção do dia ser registrada."
        />
      ) : (
        <ul className="space-y-2">
          {conferenceItems.map((entry) => (
            <li key={`${entry.productionId}-${entry.item.id}`}>
              <ProductionConferenceItemRow
                entry={entry}
                canUpdate={canUpdateEntry(entry)}
                onClick={() => {
                  if (canUpdateEntry(entry)) {
                    setPickerEntry(entry)
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <ProductionConferenceStatusPicker
        open={Boolean(pickerEntry)}
        itemName={pickerEntry?.item.name ?? ''}
        currentStatus={
          pickerEntry ? getItemConferenceStatus(pickerEntry.item) : 'nao_iniciado'
        }
        onClose={() => {
          setPickerEntry(null)
        }}
        onSelect={(status) => {
          void handleSelectStatus(status)
        }}
        isSaving={isSaving}
      />
    </PageShell>
  )
}
