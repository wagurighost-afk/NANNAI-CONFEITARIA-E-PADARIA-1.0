const DB_NAME = 'nannai_employee_photos'
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

export function getOrCreateObjectUrl(photoKey: string, blob: Blob): string {
  const cached = objectUrlCache.get(photoKey)
  if (cached) {
    return cached
  }
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(photoKey, url)
  return url
}

export function revokeObjectUrl(photoKey: string): void {
  const cached = objectUrlCache.get(photoKey)
  if (cached) {
    URL.revokeObjectURL(cached)
    objectUrlCache.delete(photoKey)
  }
}

export async function saveEmployeePhotoBlob(photoKey: string, blob: Blob): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(blob, photoKey))
}

export async function getEmployeePhotoBlob(photoKey: string): Promise<Blob | null> {
  try {
    const blob = await runTransaction<Blob | undefined>('readonly', (store) => store.get(photoKey))
    return blob ?? null
  } catch {
    return null
  }
}

export async function deleteEmployeePhotoBlob(photoKey: string): Promise<void> {
  revokeObjectUrl(photoKey)
  try {
    await runTransaction('readwrite', (store) => store.delete(photoKey))
  } catch {
    // Ignore delete failures.
  }
}

export async function storeEmployeePhotoFile(photoKey: string, file: File): Promise<string> {
  await saveEmployeePhotoBlob(photoKey, file)
  return getOrCreateObjectUrl(photoKey, file)
}
