import type { ExecutivePanelReport } from './types.js'

const TTL_MS = 20_000
const cache = new Map<string, { expiresAt: number; value: ExecutivePanelReport }>()

export function getExecutivePanelCache(key: string): ExecutivePanelReport | null {
  const hit = cache.get(key)
  if (!hit) {
    return null
  }
  if (Date.now() > hit.expiresAt) {
    cache.delete(key)
    return null
  }
  return hit.value
}

export function setExecutivePanelCache(key: string, value: ExecutivePanelReport): void {
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS })
}

export function clearExecutivePanelCache(): void {
  cache.clear()
}
