const DB_NAME = 'nannai_recipe_attachments'
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

export function getOrCreateObjectUrl(attachmentId: string, blob: Blob): string {
  const cached = objectUrlCache.get(attachmentId)
  if (cached) {
    return cached
  }
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(attachmentId, url)
  return url
}

export function revokeObjectUrl(attachmentId: string): void {
  const cached = objectUrlCache.get(attachmentId)
  if (cached) {
    URL.revokeObjectURL(cached)
    objectUrlCache.delete(attachmentId)
  }
}

export async function saveAttachmentBlob(attachmentId: string, blob: Blob): Promise<void> {
  await runTransaction('readwrite', (store) => store.put(blob, attachmentId))
}

export async function getAttachmentBlob(attachmentId: string): Promise<Blob | null> {
  try {
    const blob = await runTransaction<Blob | undefined>('readonly', (store) => store.get(attachmentId))
    return blob ?? null
  } catch {
    return null
  }
}

export async function deleteAttachmentBlob(attachmentId: string): Promise<void> {
  revokeObjectUrl(attachmentId)
  try {
    await runTransaction('readwrite', (store) => store.delete(attachmentId))
  } catch {
    // Ignore delete failures for missing blobs.
  }
}

export function resolveAttachmentFileUrl(fileUrl: string): string | null {
  const value = fileUrl.trim()
  if (!value) {
    return null
  }
  if (value.startsWith('blob:') || value.startsWith('data:')) {
    return value
  }
  if (value.startsWith('http')) {
    return value
  }
  if (value.startsWith('/api/uploads/')) {
    return `${window.location.origin}${value}`
  }
  if (value.startsWith('/uploads/')) {
    return `${window.location.origin}/api${value}`
  }
  if (value.startsWith('/')) {
    return `${window.location.origin}${value}`
  }
  return `${window.location.origin}/api/uploads/${value}`
}

export async function resolveAttachmentPreviewUrl(
  attachmentId: string,
  fileUrl: string,
): Promise<string | null> {
  if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
    return fileUrl
  }

  const directUrl = resolveAttachmentFileUrl(fileUrl)
  if (directUrl) {
    return directUrl
  }

  const blob = await getAttachmentBlob(attachmentId)
  if (!blob) {
    return null
  }

  return getOrCreateObjectUrl(attachmentId, blob)
}

export async function fetchAttachmentBlob(attachment: {
  id: string
  fileUrl: string
}): Promise<Blob | null> {
  const localBlob = await getAttachmentBlob(attachment.id)
  if (localBlob) {
    return localBlob
  }

  const url = resolveAttachmentFileUrl(attachment.fileUrl)

  if (!url) {
    return null
  }

  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    return null
  }

  return response.blob()
}
