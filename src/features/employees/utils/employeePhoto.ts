import { EMPLOYEE_PHOTO_REF_PREFIX } from '@/features/employees/constants/employeePhoto.constants'
import {
  getEmployeePhotoBlob,
  getOrCreateObjectUrl,
} from '@/features/employees/storage/employeePhotoBlobStore'

export function isDirectPhotoUrl(photoUrl?: string): boolean {
  if (!photoUrl) {
    return false
  }

  return (
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://') ||
    photoUrl.startsWith('/api/') ||
    photoUrl.startsWith('/uploads/') ||
    photoUrl.startsWith('blob:') ||
    photoUrl.startsWith('data:')
  )
}

export function toEmployeePhotoRef(employeeId: string): string {
  return `${EMPLOYEE_PHOTO_REF_PREFIX}${employeeId}`
}

export function getEmployeePhotoKey(photoUrl?: string): string | null {
  if (!photoUrl?.startsWith(EMPLOYEE_PHOTO_REF_PREFIX)) {
    return null
  }

  return photoUrl.slice(EMPLOYEE_PHOTO_REF_PREFIX.length)
}

export async function resolveEmployeePhotoUrl(photoUrl?: string): Promise<string | undefined> {
  if (!photoUrl) {
    return undefined
  }

  if (isDirectPhotoUrl(photoUrl)) {
    if (photoUrl.startsWith('/uploads/')) {
      return `${window.location.origin}/api${photoUrl}`
    }
    return photoUrl
  }

  const photoKey = getEmployeePhotoKey(photoUrl)
  if (!photoKey) {
    return undefined
  }

  const blob = await getEmployeePhotoBlob(photoKey)
  if (!blob) {
    return undefined
  }

  return getOrCreateObjectUrl(photoKey, blob)
}
