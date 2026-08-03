import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageIcon, Trash2 } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Switch } from '@/components/ui'
import {
  BACKUP_FREQUENCY_OPTIONS,
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LABEL_SIZE_OPTIONS,
  LANGUAGE_OPTIONS,
  NIIMBOT_DPI_OPTIONS,
  THEME_OPTIONS,
} from '@/features/advanced-settings/constants/advancedSettings.constants'
import type {
  AppSettings,
  AppSettingsPatch,
  DatabaseInfo,
  LabelTemplateOption,
} from '@/features/advanced-settings/types/advancedSettings.types'
import { APP_ROUTES } from '@/core/constants'
import { formatDateTimeBr } from '@/utils/formatDate'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeMode } from '@/types/theme.types'

function formatBytes(bytes: number | null): string {
  if (bytes === null) {
    return '—'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export interface PanelProps {
  settings: AppSettings
  labelTemplates: LabelTemplateOption[]
  database?: DatabaseInfo | undefined
  isSaving?: boolean | undefined
  onSave: (patch: AppSettingsPatch) => Promise<void>
  onUploadLogo?: ((file: File) => Promise<void>) | undefined
  onRemoveLogo?: (() => Promise<void>) | undefined
}

export function GeneralSettingsPanel({
  settings,
  isSaving = false,
  onSave,
  onUploadLogo,
  onRemoveLogo,
}: PanelProps) {
  const [hotelName, setHotelName] = useState(settings.general.hotelName)

  useEffect(() => {
    setHotelName(settings.general.hotelName)
  }, [settings.general.hotelName])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="Nome do Hotel"
          value={hotelName}
          disabled={isSaving}
          onChange={(event) => setHotelName(event.target.value)}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Logo</p>
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center">
            {settings.general.logoUrl ? (
              <img
                src={settings.general.logoUrl}
                alt="Logo do hotel"
                className="h-16 w-16 rounded-lg border border-border object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
                <ImageIcon className="size-6" aria-hidden />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted/40">
                Enviar logo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={isSaving || !onUploadLogo}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file && onUploadLogo) {
                      void onUploadLogo(file)
                    }
                  }}
                />
              </label>
              {settings.general.logoUrl && onRemoveLogo ? (
                <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={() => void onRemoveLogo()}>
                  <Trash2 className="size-4" />
                  Remover
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Button
          disabled={isSaving || !hotelName.trim()}
          onClick={() => void onSave({ general: { hotelName: hotelName.trim() } })}
        >
          {isSaving ? 'Salvando...' : 'Salvar geral'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function AppearanceSettingsPanel({ settings, isSaving = false, onSave }: PanelProps) {
  const { setTheme } = useTheme()
  const [theme, setThemeValue] = useState(settings.appearance.theme)
  const [language, setLanguage] = useState(settings.appearance.language)
  const [currency, setCurrency] = useState(settings.appearance.currency)
  const [dateFormat, setDateFormat] = useState(settings.appearance.dateFormat)

  useEffect(() => {
    setThemeValue(settings.appearance.theme)
    setLanguage(settings.appearance.language)
    setCurrency(settings.appearance.currency)
    setDateFormat(settings.appearance.dateFormat)
  }, [settings.appearance])

  const applyTheme = (value: typeof theme) => {
    if (value === 'light' || value === 'dark') {
      setTheme(value as ThemeMode)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Tema"
          value={theme}
          options={[...THEME_OPTIONS]}
          disabled={isSaving}
          onChange={(event) => setThemeValue(event.target.value as typeof theme)}
        />
        <Select
          label="Idioma"
          value={language}
          options={[...LANGUAGE_OPTIONS]}
          disabled={isSaving}
          onChange={(event) => setLanguage(event.target.value as typeof language)}
        />
        <Select
          label="Moeda"
          value={currency}
          options={[...CURRENCY_OPTIONS]}
          disabled={isSaving}
          onChange={(event) => setCurrency(event.target.value as typeof currency)}
        />
        <Select
          label="Formato de Data"
          value={dateFormat}
          options={[...DATE_FORMAT_OPTIONS]}
          disabled={isSaving}
          onChange={(event) => setDateFormat(event.target.value as typeof dateFormat)}
        />
        <div className="sm:col-span-2">
          <Button
            disabled={isSaving}
            onClick={() => {
              applyTheme(theme)
              void onSave({ appearance: { theme, language, currency, dateFormat } })
            }}
          >
            {isSaving ? 'Salvando...' : 'Salvar aparência'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function LabelsSettingsPanel({ settings, labelTemplates, isSaving = false, onSave }: PanelProps) {
  const [defaultTemplateId, setDefaultTemplateId] = useState(settings.labels.defaultTemplateId)
  const [defaultSizeCode, setDefaultSizeCode] = useState(settings.labels.defaultSizeCode)
  const [shelfLifeOverrides, setShelfLifeOverrides] = useState(settings.labels.shelfLifeOverrides)

  useEffect(() => {
    setDefaultTemplateId(settings.labels.defaultTemplateId)
    setDefaultSizeCode(settings.labels.defaultSizeCode)
    setShelfLifeOverrides(settings.labels.shelfLifeOverrides)
  }, [settings.labels])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Padrão das Etiquetas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Modelo padrão"
            value={defaultTemplateId}
            options={labelTemplates.map((template) => ({ value: template.id, label: template.name }))}
            disabled={isSaving}
            onChange={(event) => setDefaultTemplateId(event.target.value)}
          />
          <Select
            label="Tamanho padrão"
            value={defaultSizeCode}
            options={[...LABEL_SIZE_OPTIONS]}
            disabled={isSaving}
            onChange={(event) => setDefaultSizeCode(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Validade por modelo (dias)</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {labelTemplates.map((template) => (
              <Input
                key={template.id}
                label={template.name}
                type="number"
                min={1}
                value={String(shelfLifeOverrides[template.id] ?? template.defaultShelfLifeDays)}
                disabled={isSaving}
                onChange={(event) =>
                  setShelfLifeOverrides((current) => ({
                    ...current,
                    [template.id]: Number(event.target.value),
                  }))
                }
              />
            ))}
          </div>
        </div>

        <Button
          disabled={isSaving}
          onClick={() =>
            void onSave({
              labels: { defaultTemplateId, defaultSizeCode, shelfLifeOverrides },
            })
          }
        >
          {isSaving ? 'Salvando...' : 'Salvar etiquetas'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function NiimbotSettingsPanel({ settings, isSaving = false, onSave }: PanelProps) {
  const [defaultDpi, setDefaultDpi] = useState(String(settings.niimbot.defaultDpi))
  const [autoReconnect, setAutoReconnect] = useState(settings.niimbot.autoReconnect)
  const [defaultCopies, setDefaultCopies] = useState(String(settings.niimbot.defaultCopies))

  useEffect(() => {
    setDefaultDpi(String(settings.niimbot.defaultDpi))
    setAutoReconnect(settings.niimbot.autoReconnect)
    setDefaultCopies(String(settings.niimbot.defaultCopies))
  }, [settings.niimbot])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração da NIIMBOT</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pareamento e testes de impressão ficam na área dedicada da NIIMBOT.
        </p>
        <Link
          to={APP_ROUTES.niimbotSettings}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Abrir configurações da NIIMBOT →
        </Link>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="DPI padrão"
            value={defaultDpi}
            options={[...NIIMBOT_DPI_OPTIONS]}
            disabled={isSaving}
            onChange={(event) => setDefaultDpi(event.target.value)}
          />
          <Input
            label="Cópias padrão"
            type="number"
            min={1}
            max={20}
            value={defaultCopies}
            disabled={isSaving}
            onChange={(event) => setDefaultCopies(event.target.value)}
          />
        </div>

        <Switch
          label="Reconectar automaticamente"
          checked={autoReconnect}
          disabled={isSaving}
          onCheckedChange={setAutoReconnect}
        />

        <Button
          disabled={isSaving}
          onClick={() =>
            void onSave({
              niimbot: {
                defaultDpi: Number(defaultDpi) as 203 | 300,
                autoReconnect,
                defaultCopies: Number(defaultCopies),
              },
            })
          }
        >
          {isSaving ? 'Salvando...' : 'Salvar NIIMBOT'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function GoalsSettingsPanel({ settings, isSaving = false, onSave }: PanelProps) {
  const [cmvTargetPercent, setCmvTargetPercent] = useState(String(settings.goals.cmvTargetPercent))
  const [wasteTargetKgMonthly, setWasteTargetKgMonthly] = useState(String(settings.goals.wasteTargetKgMonthly))

  useEffect(() => {
    setCmvTargetPercent(String(settings.goals.cmvTargetPercent))
    setWasteTargetKgMonthly(String(settings.goals.wasteTargetKgMonthly))
  }, [settings.goals])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metas Operacionais</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Meta de CMV (%)"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={cmvTargetPercent}
          disabled={isSaving}
          onChange={(event) => setCmvTargetPercent(event.target.value)}
        />
        <Input
          label="Meta de Desperdício (kg/mês)"
          type="number"
          min={0}
          step={1}
          value={wasteTargetKgMonthly}
          disabled={isSaving}
          onChange={(event) => setWasteTargetKgMonthly(event.target.value)}
        />
        <div className="sm:col-span-2">
          <Button
            disabled={isSaving}
            onClick={() =>
              void onSave({
                goals: {
                  cmvTargetPercent: Number(cmvTargetPercent),
                  wasteTargetKgMonthly: Number(wasteTargetKgMonthly),
                },
              })
            }
          >
            {isSaving ? 'Salvando...' : 'Salvar metas'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function BackupSettingsPanel({ settings, isSaving = false, onSave }: PanelProps) {
  const [enabled, setEnabled] = useState(settings.backup.enabled)
  const [frequency, setFrequency] = useState(settings.backup.frequency)
  const [hour, setHour] = useState(String(settings.backup.hour))
  const [retainDays, setRetainDays] = useState(String(settings.backup.retainDays))

  useEffect(() => {
    setEnabled(settings.backup.enabled)
    setFrequency(settings.backup.frequency)
    setHour(String(settings.backup.hour))
    setRetainDays(String(settings.backup.retainDays))
  }, [settings.backup])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup Automático</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Switch label="Ativar backup automático" checked={enabled} disabled={isSaving} onCheckedChange={setEnabled} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Frequência"
            value={frequency}
            options={[...BACKUP_FREQUENCY_OPTIONS]}
            disabled={isSaving || !enabled}
            onChange={(event) => setFrequency(event.target.value as typeof frequency)}
          />
          <Input
            label="Horário (0–23h)"
            type="number"
            min={0}
            max={23}
            value={hour}
            disabled={isSaving || !enabled}
            onChange={(event) => setHour(event.target.value)}
          />
          <Input
            label="Retenção (dias)"
            type="number"
            min={1}
            value={retainDays}
            disabled={isSaving || !enabled}
            onChange={(event) => setRetainDays(event.target.value)}
          />
        </div>
        <Button
          disabled={isSaving}
          onClick={() =>
            void onSave({
              backup: {
                enabled,
                frequency,
                hour: Number(hour),
                retainDays: Number(retainDays),
              },
            })
          }
        >
          {isSaving ? 'Salvando...' : 'Salvar backup'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function DatabaseSettingsPanel({ settings, database, isSaving = false }: PanelProps) {
  if (!database) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banco de Dados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Info label="Modo" value={database.mode === 'postgresql' ? 'PostgreSQL' : 'Arquivo JSON'} />
          <Info label="Total de registros" value={String(database.totalRecords)} />
          <Info label="Tamanho do arquivo" value={formatBytes(database.fileSizeBytes)} />
          <Info label="Última atualização" value={formatDateTimeBr(settings.updatedAt)} />
        </div>

        {database.tables.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Tabela</th>
                  <th className="px-3 py-2 text-right">Registros</th>
                </tr>
              </thead>
              <tbody>
                {database.tables.map((table) => (
                  <tr key={table.name} className="border-t border-border/70">
                    <td className="px-3 py-2 font-medium">{table.name}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{table.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">Detalhes de tabelas disponíveis no modo arquivo JSON.</p>
        )}

        <p className="text-xs text-muted-foreground">
          Configurações salvas por {settings.updatedBy ?? 'sistema'} em {formatDateTimeBr(settings.updatedAt)}.
        </p>
        <Button type="button" variant="outline" disabled={isSaving} onClick={() => window.location.reload()}>
          Recarregar informações
        </Button>
      </CardContent>
    </Card>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}
