import { useEffect } from 'react'
import { Crown, Settings2 } from 'lucide-react'
import { Breadcrumb, EmptyState, PageHeader, PageShell } from '@/components/common'
import { FounderBadge } from '@/components/auth/SystemBadges'
import { SearchInput, Skeleton } from '@/components/ui'
import { AdvancedSettingsCategoryNav } from '@/features/advanced-settings/components/AdvancedSettingsCategoryNav'
import {
  AppearanceSettingsPanel,
  BackupSettingsPanel,
  DatabaseSettingsPanel,
  GeneralSettingsPanel,
  GoalsSettingsPanel,
  LabelsSettingsPanel,
  NiimbotSettingsPanel,
  type PanelProps,
} from '@/features/advanced-settings/components/AdvancedSettingsPanels'
import { useAdvancedSettings } from '@/features/advanced-settings/hooks/useAdvancedSettings'
import type { AdvancedSettingsCategoryId } from '@/features/advanced-settings/types/advancedSettings.types'
import { APP_ROUTES } from '@/core/constants'
import { isFounder } from '@/core/auth/roles'
import { getErrorMessage } from '@/core/errors'
import { useAuth, useToast } from '@/hooks'

export function AdvancedSettingsPage() {
  const { user } = useAuth()
  const { push } = useToast()
  const {
    settings,
    database,
    labelTemplates,
    isLoading,
    isSaving,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    visibleCategories,
    saveSettings,
    uploadLogo,
    removeLogo,
  } = useAdvancedSettings()

  useEffect(() => {
    if (visibleCategories.length === 0) {
      return
    }

    if (!visibleCategories.some((category) => category.id === activeCategory)) {
      setActiveCategory(visibleCategories[0]!.id)
    }
  }, [visibleCategories, activeCategory, setActiveCategory])

  const handleSave = async (patch: Parameters<typeof saveSettings>[0]) => {
    try {
      await saveSettings(patch)
      push({ title: 'Configurações salvas', variant: 'success' })
    } catch (error: unknown) {
      push({
        title: 'Não foi possível salvar',
        description: getErrorMessage(error),
        variant: 'danger',
      })
    }
  }

  return (
    <PageShell>
      <Breadcrumb
        items={[
          { label: 'Início', href: APP_ROUTES.dashboard },
          { label: 'Configurações Avançadas' },
        ]}
      />

      <PageHeader
        title="Configurações Avançadas"
        description="Personalize o hotel, operação, metas e infraestrutura do sistema."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Crown className="size-4" aria-hidden />
              Administrador Master
            </span>
            {isFounder(user) ? <FounderBadge /> : null}
          </div>
        }
      />

      <div className="mb-6">
        <SearchInput
          placeholder="Pesquisar configurações (hotel, tema, etiquetas, backup...)"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onClear={() => setSearch('')}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-[480px] rounded-xl" />
        </div>
      ) : !settings ? (
        <EmptyState
          icon={<Settings2 className="size-10" aria-hidden />}
          title="Configurações indisponíveis"
          description="Não foi possível carregar as configurações do sistema."
        />
      ) : visibleCategories.length === 0 ? (
        <EmptyState
          icon={<Settings2 className="size-10" aria-hidden />}
          title="Nenhuma categoria encontrada"
          description="Ajuste a pesquisa para localizar outra configuração."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <AdvancedSettingsCategoryNav
            categories={visibleCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
          <div>
            <SettingsPanelContent
              category={activeCategory}
              settings={settings}
              labelTemplates={labelTemplates}
              isSaving={isSaving}
              onSave={handleSave}
              onUploadLogo={uploadLogo}
              onRemoveLogo={removeLogo}
              {...(database ? { database } : {})}
            />
          </div>
        </div>
      )}
    </PageShell>
  )
}

function SettingsPanelContent({
  category,
  settings,
  labelTemplates,
  isSaving,
  onSave,
  onUploadLogo,
  onRemoveLogo,
  database,
}: {
  category: AdvancedSettingsCategoryId
  settings: NonNullable<ReturnType<typeof useAdvancedSettings>['settings']>
  labelTemplates: ReturnType<typeof useAdvancedSettings>['labelTemplates']
  isSaving: boolean
  onSave: (patch: Parameters<ReturnType<typeof useAdvancedSettings>['saveSettings']>[0]) => Promise<void>
  onUploadLogo: ReturnType<typeof useAdvancedSettings>['uploadLogo']
  onRemoveLogo: ReturnType<typeof useAdvancedSettings>['removeLogo']
  database?: NonNullable<ReturnType<typeof useAdvancedSettings>['database']>
}) {
  const panelProps: PanelProps = {
    settings,
    labelTemplates,
    isSaving,
    onSave,
    onUploadLogo: async (file) => {
      await onUploadLogo(file)
    },
    onRemoveLogo: async () => {
      await onRemoveLogo()
    },
    ...(database ? { database } : {}),
  }

  switch (category) {
    case 'general':
      return <GeneralSettingsPanel {...panelProps} />
    case 'appearance':
      return <AppearanceSettingsPanel {...panelProps} />
    case 'labels':
      return <LabelsSettingsPanel {...panelProps} />
    case 'niimbot':
      return <NiimbotSettingsPanel {...panelProps} />
    case 'goals':
      return <GoalsSettingsPanel {...panelProps} />
    case 'backup':
      return <BackupSettingsPanel {...panelProps} />
    case 'database':
      return <DatabaseSettingsPanel {...panelProps} />
    default:
      return null
  }
}
