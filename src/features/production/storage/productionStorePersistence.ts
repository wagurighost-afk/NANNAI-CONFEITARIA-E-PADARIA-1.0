import { PRODUCTION_MOCK } from '@/features/production/mocks/production.mock'
import {
  getOrCreateObjectUrl,
  resolveCommentPhotoUrl,
  saveCommentPhotoBlob,
} from '@/features/production/storage/commentPhotoBlobStore'
import type {
  ProductionDay,
  ShiftComment,
  ShiftCommentPhoto,
} from '@/features/production/types/production.types'
import { storage } from '@/core/storage/storage'

const PRODUCTION_STORE_KEY = 'nannai_production_v2'

function normalizeProduction(production: ProductionDay): ProductionDay {
  return {
    ...production,
    comments: (production.comments ?? []).map((comment) => ({
      ...comment,
      photos: comment.photos ?? [],
    })),
  }
}

function defaultStore(): ProductionDay[] {
  return PRODUCTION_MOCK.map(normalizeProduction)
}

function serializeProductions(productions: ProductionDay[]): string {
  const payload = productions.map((production) => ({
    ...production,
    comments: production.comments.map((comment) => ({
      ...comment,
      photos: comment.photos.map((photo) => ({
        ...photo,
        fileUrl: '',
      })),
    })),
  }))
  return JSON.stringify(payload)
}

async function hydratePhoto(photo: ShiftCommentPhoto): Promise<ShiftCommentPhoto> {
  const fileUrl = await resolveCommentPhotoUrl(photo.id, photo.fileUrl)
  return {
    ...photo,
    fileUrl: fileUrl ?? '',
  }
}

async function hydrateComment(comment: ShiftComment): Promise<ShiftComment> {
  const photos = await Promise.all((comment.photos ?? []).map(hydratePhoto))
  return { ...comment, photos }
}

async function hydrateProduction(production: ProductionDay): Promise<ProductionDay> {
  const comments = await Promise.all((production.comments ?? []).map(hydrateComment))
  return normalizeProduction({ ...production, comments })
}

export async function loadPersistedProductions(): Promise<ProductionDay[]> {
  const raw = storage.get(PRODUCTION_STORE_KEY)
  if (!raw) {
    return defaultStore()
  }

  try {
    const parsed = JSON.parse(raw) as ProductionDay[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultStore()
    }
    return Promise.all(parsed.map(hydrateProduction))
  } catch {
    return defaultStore()
  }
}

export function persistProductions(productions: ProductionDay[]): void {
  storage.set(PRODUCTION_STORE_KEY, serializeProductions(productions))
}

export async function storeCommentPhotoFile(photoId: string, file: File): Promise<string> {
  await saveCommentPhotoBlob(photoId, file)
  return getOrCreateObjectUrl(photoId, file)
}
