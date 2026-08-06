import type { QueryClient } from '@tanstack/react-query'

const SCOPE_QUERY_KEYS: Record<string, readonly (readonly string[])[]> = {
  production: [['production'], ['dashboard'], ['comments-feed'], ['executive-panel']],
  recipes: [['recipes']],
  'monthly-schedule': [['monthly-schedule'], ['executive-panel'], ['schedule']],
  'bread-control': [['bread-control'], ['executive-panel']],
  'waste-control': [['waste-control'], ['executive-panel']],
  intelligence: [['intelligence']],
  'executive-panel': [['executive-panel']],
  labels: [['labels'], ['executive-panel']],
  laboratorio: [['laboratorio']],
  'dev-central': [['dev-central']],
  bugs: [['bugs']],
  settings: [['advanced-settings'], ['executive-panel']],
}

const DEBOUNCE_MS = 800

let timer: ReturnType<typeof setTimeout> | null = null
const pendingKeys = new Set<string>()

function keySignature(key: readonly string[]): string {
  return key.join('\0')
}

export function scheduleQueryInvalidation(queryClient: QueryClient, scope: string): void {
  const keys = SCOPE_QUERY_KEYS[scope]
  if (!keys) {
    return
  }

  for (const key of keys) {
    pendingKeys.add(keySignature(key))
  }

  if (timer) {
    return
  }

  timer = setTimeout(() => {
    timer = null
    const signatures = [...pendingKeys]
    pendingKeys.clear()

    for (const signature of signatures) {
      const queryKey = signature.split('\0')
      void queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      })
    }
  }, DEBOUNCE_MS)
}
