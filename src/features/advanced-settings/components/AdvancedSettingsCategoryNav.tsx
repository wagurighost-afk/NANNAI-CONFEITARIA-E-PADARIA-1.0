import {
  Building2,
  Database,
  Goal,
  HardDrive,
  Palette,
  Printer,
  Tags,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AdvancedSettingsCategory } from '@/features/advanced-settings/constants/advancedSettings.constants'
import type { AdvancedSettingsCategoryId } from '@/features/advanced-settings/types/advancedSettings.types'
import { cn } from '@/utils/cn'

const CATEGORY_ICONS: Record<AdvancedSettingsCategoryId, LucideIcon> = {
  general: Building2,
  appearance: Palette,
  labels: Tags,
  niimbot: Printer,
  goals: Goal,
  backup: HardDrive,
  database: Database,
}

export interface AdvancedSettingsCategoryNavProps {
  categories: readonly AdvancedSettingsCategory[]
  activeCategory: AdvancedSettingsCategoryId
  onSelect: (categoryId: AdvancedSettingsCategoryId) => void
}

export function AdvancedSettingsCategoryNav({
  categories,
  activeCategory,
  onSelect,
}: AdvancedSettingsCategoryNavProps) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.id]
        const isActive = category.id === activeCategory

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={cn(
              'flex min-w-[180px] items-start gap-3 rounded-xl border px-3 py-3 text-left transition lg:min-w-0 lg:w-full',
              isActive
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-surface/60 text-foreground hover:bg-muted/40',
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{category.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{category.description}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
