import type { QueryClient } from '@tanstack/react-query'

const SCOPE_QUERY_KEYS: Record<string, readonly (readonly string[])[]> = {
  production: [['production'], ['dashboard'], ['comments-feed']],
  recipes: [['recipes']],
  'monthly-schedule': [['monthly-schedule']],
  'bread-control': [['bread-control']],
  'waste-control': [['waste-control']],
  intelligence: [['intelligence']],
  labels: [['labels']],
  laboratorio: [['laboratorio']],
  'dev-central': [['dev-central']],
  bugs: [['bugs']],
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
