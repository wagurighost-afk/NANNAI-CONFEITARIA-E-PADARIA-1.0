const DB_NAME = 'nannai_schedule_attachments'
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

export function getOrCreateScheduleObjectUrl(attachmentId: string, blob: Blob): string {
  const cached = objectUrlCache.get(attachmentId)
  if (cached) {
    return cached
  }
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(attachmentId, url)
  return url
}

export async function saveScheduleAttachmentBlob(attachmentId: string, blob: Blob): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(blob, attachmentId))
}

export async function getScheduleAttachmentBlob(attachmentId: string): Promise<Blob | null> {
  try {
    const blob = await runTransaction<Blob | undefined>('readonly', (store) => store.get(attachmentId))
    return blob ?? null
  } catch {
    return null
  }
}

export async function resolveScheduleAttachmentUrl(
  attachmentId: string,
  fileUrl: string,
): Promise<string | null> {
  if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
    return fileUrl
  }
  const blob = await getScheduleAttachmentBlob(attachmentId)
  if (!blob) {
    return null
  }
  return getOrCreateScheduleObjectUrl(attachmentId, blob)
}
