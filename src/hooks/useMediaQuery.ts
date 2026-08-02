import { useSyncExternalStore } from 'react'

type Listener = () => void

const queryCache = new Map<string, MediaQueryList>()
const listenerMap = new Map<string, Set<Listener>>()

function getMediaQuery(query: string): MediaQueryList {
  let media = queryCache.get(query)
  if (!media) {
    media = window.matchMedia(query)
    queryCache.set(query, media)
    media.addEventListener('change', () => {
      const listeners = listenerMap.get(query)
      if (listeners) {
        for (const listener of listeners) {
          listener()
        }
      }
    })
  }
  return media
}

function subscribe(query: string, listener: Listener): () => void {
  getMediaQuery(query)
  const listeners = listenerMap.get(query) ?? new Set<Listener>()
  listeners.add(listener)
  listenerMap.set(query, listeners)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      listenerMap.delete(query)
    }
  }
}

function getSnapshot(query: string): boolean {
  return getMediaQuery(query).matches
}

function getServerSnapshot(): boolean {
  return false
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (listener) => subscribe(query, listener),
    () => getSnapshot(query),
    getServerSnapshot,
  )
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}
