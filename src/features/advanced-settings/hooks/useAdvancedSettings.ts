import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ADVANCED_SETTINGS_CATEGORIES } from '@/features/advanced-settings/constants/advancedSettings.constants'
import {
  fetchAdvancedSettings,
  removeHotelLogo,
  updateAdvancedSettings,
  uploadHotelLogo,
} from '@/features/advanced-settings/services/advancedSettings.service'
import type {
  AdvancedSettingsCategoryId,
  AppSettingsPatch,
} from '@/features/advanced-settings/types/advancedSettings.types'

export const ADVANCED_SETTINGS_QUERY_KEY = ['advanced-settings'] as const

function matchesSearch(categoryId: AdvancedSettingsCategoryId, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const category = ADVANCED_SETTINGS_CATEGORIES.find((item) => item.id === categoryId)
  if (!category) {
    return false
  }

  const haystack = [category.label, category.description, ...category.keywords].join(' ').toLowerCase()
  return haystack.includes(normalized) || category.label.toLowerCase().includes(normalized)
}

export function useAdvancedSettings() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<AdvancedSettingsCategoryId>('general')

  const settingsQuery = useQuery({
    queryKey: ADVANCED_SETTINGS_QUERY_KEY,
    queryFn: fetchAdvancedSettings,
  })

  const visibleCategories = useMemo(() => {
    return ADVANCED_SETTINGS_CATEGORIES.filter((category) => matchesSearch(category.id, search))
  }, [search])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ADVANCED_SETTINGS_QUERY_KEY })
  }

  const saveMutation = useMutation({
    mutationFn: (patch: AppSettingsPatch) => updateAdvancedSettings(patch),
    onSuccess: invalidate,
  })

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadHotelLogo(file),
    onSuccess: invalidate,
  })

  const removeLogoMutation = useMutation({
    mutationFn: removeHotelLogo,
    onSuccess: invalidate,
  })

  return {
    data: settingsQuery.data,
    settings: settingsQuery.data?.settings,
    database: settingsQuery.data?.database,
    labelTemplates: settingsQuery.data?.labelTemplates ?? [],
    isLoading: settingsQuery.isLoading,
    isSaving: saveMutation.isPending || logoMutation.isPending || removeLogoMutation.isPending,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    visibleCategories,
    saveSettings: saveMutation.mutateAsync,
    uploadLogo: logoMutation.mutateAsync,
    removeLogo: removeLogoMutation.mutateAsync,
  }
}
