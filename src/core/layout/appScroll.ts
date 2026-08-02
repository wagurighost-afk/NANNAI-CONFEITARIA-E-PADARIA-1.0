export function getAppScrollElement(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null
  }
  return document.getElementById('app-scroll')
}

export function lockAppScroll(): () => void {
  const scrollEl = getAppScrollElement()

  if (scrollEl) {
    const previousOverflow = scrollEl.style.overflow
    scrollEl.style.overflow = 'hidden'
    return () => {
      scrollEl.style.overflow = previousOverflow
    }
  }

  const previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  return () => {
    document.body.style.overflow = previousBodyOverflow
  }
}
