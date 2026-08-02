/**
 * Camada de persistência da Central de Inteligência Operacional.
 * Abstrai consultas PostgreSQL / JSON store.
 * @module intelligence/repository
 */

import {
  deleteIntelligenceSnapshotsByPeriod,
  loadIntelligenceSnapshot,
  loadIntelligenceSnapshotsByPeriod,
  saveIntelligenceSnapshot,
} from '../../db/index.js'
import {
  primeSnapshotCache,
  readSnapshotCache,
  writeSnapshotCache,
} from '../cache/snapshotCache.js'
import { buildSnapshotId } from '../constants.js'
import type {
  IntelligenceCategory,
  IntelligencePeriod,
  IntelligenceSnapshot,
} from '../types.js'

export async function findSnapshotByCategory<TData>(
  period: IntelligencePeriod,
  category: IntelligenceCategory,
): Promise<IntelligenceSnapshot<TData> | null> {
  const cached = readSnapshotCache<TData>(period, category)
  if (cached) {
    return cached
  }

  const id = buildSnapshotId(category, period.year, period.month)
  const snapshot = await loadIntelligenceSnapshot(id)
  if (snapshot) {
    writeSnapshotCache(snapshot)
  }
  return snapshot as IntelligenceSnapshot<TData> | null
}

export async function findAllSnapshotsForPeriod(
  period: IntelligencePeriod,
): Promise<IntelligenceSnapshot[]> {
  const snapshots = await loadIntelligenceSnapshotsByPeriod(period.year, period.month)
  primeSnapshotCache(snapshots)
  return snapshots
}

export async function findSnapshotsByPeriod(
  period: IntelligencePeriod,
  category?: IntelligenceCategory,
): Promise<IntelligenceSnapshot[]> {
  return loadIntelligenceSnapshotsByPeriod(period.year, period.month, category)
}

export async function upsertSnapshot<TData>(
  snapshot: IntelligenceSnapshot<TData>,
): Promise<IntelligenceSnapshot<TData>> {
  await saveIntelligenceSnapshot(snapshot)
  writeSnapshotCache(snapshot)
  return snapshot
}

export async function clearPeriodSnapshots(
  period: IntelligencePeriod,
  category?: IntelligenceCategory,
): Promise<void> {
  await deleteIntelligenceSnapshotsByPeriod(period.year, period.month, category)
}
