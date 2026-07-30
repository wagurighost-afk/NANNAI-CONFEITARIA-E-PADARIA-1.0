export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Storage may be unavailable (private mode / quota).
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore storage failures.
    }
  },
}
