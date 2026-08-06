import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { bootstrapNativeShell } from '@/platform'
import { applyDocumentTheme, resolveInitialTheme } from '@/styles/themeBootstrap'
import '@/styles/globals.css'

applyDocumentTheme(resolveInitialTheme())

const buildTarget = import.meta.env.VITE_BUILD_TARGET ?? 'web'

if (buildTarget === 'web') {
  void import('@/pwa/registerServiceWorker').then(({ registerPwaServiceWorker }) =>
    registerPwaServiceWorker(),
  )
}

void bootstrapNativeShell()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Elemento #root não encontrado.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
