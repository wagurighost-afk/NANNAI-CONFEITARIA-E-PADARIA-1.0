import { APP_VERSION } from '@/core/constants/appVersion'

function detectOs(userAgent: string): string {
  if (/Windows/i.test(userAgent)) return 'Windows'
  if (/Android/i.test(userAgent)) return 'Android'
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS'
  if (/Mac OS X/i.test(userAgent)) return 'macOS'
  if (/Linux/i.test(userAgent)) return 'Linux'
  return 'Desconhecido'
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge'
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return 'Google Chrome'
  if (/Firefox\//i.test(userAgent)) return 'Mozilla Firefox'
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari'
  return 'Desconhecido'
}

export function detectClientEnvironment() {
  if (typeof navigator === 'undefined') {
    return {
      os: 'Desconhecido',
      browser: 'Desconhecido',
      appVersion: APP_VERSION,
    }
  }

  return {
    os: detectOs(navigator.userAgent),
    browser: detectBrowser(navigator.userAgent),
    appVersion: APP_VERSION,
  }
}
