/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="web-bluetooth" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
