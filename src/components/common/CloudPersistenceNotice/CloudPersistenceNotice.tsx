import { Cloud } from 'lucide-react'
import { usesCloudPersistence } from '@/core/persistence/cloudPersistence'

export function CloudPersistenceNotice() {
  if (!usesCloudPersistence()) {
    return (
      <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
        Modo local ativo: alterações ficam apenas neste dispositivo até conectar à API na nuvem.
      </div>
    )
  }

  return (
    <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-foreground">
      <Cloud className="size-4 shrink-0 text-emerald-600" aria-hidden />
      <span>Alterações são salvas automaticamente na nuvem e sincronizadas em tempo real com a equipe.</span>
    </div>
  )
}
