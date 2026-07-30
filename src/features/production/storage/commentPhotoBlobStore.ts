const DB_NAME = 'nannai_comment_photos'
const DB_VERSION = 1
const STORE_NAME = 'blobs'

const objectUrlCache = new Map<string, string>()

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir armazenamento.'))
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode)
        const request = fn(tx.objectStore(STORE_NAME))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Falha na transação.'))
        tx.oncomplete = () => db.close()
        tx.onerror = () => reject(tx.error ?? new Error('Falha na transação.'))
      }),
  )
}

export function getOrCreateObjectUrl(photoId: string, blob: Blob): string {
  const cached = objectUrlCache.get(photoId)
  if (cached) {
    return cached
  }
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(photoId, url)
  return url
}

export function revokeObjectUrl(photoId: string): void {
  const cached = objectUrlCache.get(photoId)
  if (cached) {
    URL.revokeObjectURL(cached)
    objectUrlCache.delete(photoId)
  }
}

export async function saveCommentPhotoBlob(photoId: string, blob: Blob): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(blob, photoId))
}

export async function getCommentPhotoBlob(photoId: string): Promise<Blob | null> {
  try {
    const blob = await runTransaction<Blob | undefined>('readonly', (store) => store.get(photoId))
    return blob ?? null
  } catch {
    return null
  }
}

export async function resolveCommentPhotoUrl(
  photoId: string,
  fileUrl: string,
): Promise<string | null> {
  if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
    return fileUrl
  }

  const blob = await getCommentPhotoBlob(photoId)
  if (!blob) {
    return null
  }

  return getOrCreateObjectUrl(photoId, blob)
}
