/**
 * Cache em memória de snapshots de inteligência (TTL curto).
 * Reduz consultas SQL repetidas no mesmo período.
 * @module intelligence/cache/snapshotCache
 */

import type { IntelligenceCategory, IntelligencePeriod, IntelligenceSnapshot } from '../types.js'

const TTL_MS = 60_000

const cache = new Map<string, { expiresAt: number; snapshot: IntelligenceSnapshot }>()

function cacheKey(period: IntelligencePeriod, category: IntelligenceCategory): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}:${category}`
}

export function readSnapshotCache<TData>(
  period: IntelligencePeriod,
  category: IntelligenceCategory,
): IntelligenceSnapshot<TData> | null {
  const entry = cache.get(cacheKey(period, category))
  if (!entry || Date.now() > entry.expiresAt) {
    return null
  }
  return entry.snapshot as IntelligenceSnapshot<TData>
}

export function writeSnapshotCache(snapshot: IntelligenceSnapshot): void {
  cache.set(cacheKey(snapshot.period, snapshot.category), {
    expiresAt: Date.now() + TTL_MS,
    snapshot,
  })
}

export function primeSnapshotCache(snapshots: IntelligenceSnapshot[]): void {
  for (const snapshot of snapshots) {
    writeSnapshotCache(snapshot)
  }
}

export function clearSnapshotCache(): void {
  cache.clear()
}
