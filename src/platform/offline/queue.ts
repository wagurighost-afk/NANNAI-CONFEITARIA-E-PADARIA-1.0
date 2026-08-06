/**
 * Scaffold for native offline mutation queue.
 * PWA continues to use Workbox; native shells will flush this queue when online.
 */
export interface OfflineMutation {
  id: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  body?: unknown
  createdAt: string
}

const STORAGE_KEY = 'nannai_offline_queue_v1'

function readQueue(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as OfflineMutation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeQueue(queue: OfflineMutation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export const offlineQueue = {
  list(): OfflineMutation[] {
    return readQueue()
  },

  enqueue(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>): OfflineMutation {
    const entry: OfflineMutation = {
      ...mutation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    writeQueue([entry, ...readQueue()])
    return entry
  },

  remove(id: string): void {
    writeQueue(readQueue().filter((item) => item.id !== id))
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
