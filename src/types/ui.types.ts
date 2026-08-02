export interface LoadingContextValue {
  isLoading: boolean
  loadingMessage: string | null
  showLoading: (message?: string) => void
  hideLoading: () => void
}

export interface LoadingApi {
  showLoading: (message?: string) => void
  hideLoading: () => void
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface NavItem {
  id: string
  label: string
  href: string
  icon: string
  permission?: string
  children?: NavItem[]
}
