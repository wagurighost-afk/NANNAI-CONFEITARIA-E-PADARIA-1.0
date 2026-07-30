import type { RealtimeEvent } from './types.js'

type Listener = (event: RealtimeEvent) => void

const listeners = new Set<Listener>()

export function subscribeRealtime(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitRealtime(event: RealtimeEvent): void {
  for (const listener of listeners) {
    listener(event)
  }
}
