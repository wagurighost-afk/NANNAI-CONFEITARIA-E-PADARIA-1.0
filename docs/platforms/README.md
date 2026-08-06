# NANNAI — Plataformas (Multi-target)

Arquitetura para **Web**, **PWA**, **Android**, **iOS** e **Windows**, compartilhando:

- Frontend React + Vite (`src/`)
- API Express (`server/`)
- PostgreSQL (Render)

## Mapa de targets

| Target | Host | Build | Pasta nativa |
|--------|------|-------|----------------|
| Web / PWA | `browser` | `npm run build` | — |
| Android | `capacitor` | `npm run build:capacitor` | `android/` |
| iOS | `capacitor` | `npm run build:capacitor` | `ios/` |
| Windows | `electron` | `npm run build:electron` | `electron/` |

## Camada de plataforma (`src/platform/`)

- `detect.ts` — identifica web, PWA, Capacitor ou Electron
- `apiConfig.ts` — resolve URL da API por host
- `capabilities.ts` — Bluetooth, câmera, notificações, offline, impressão
- `offline/queue.ts` — fila offline (scaffold para apps nativos)
- `native/bootstrap.ts` — inicialização Capacitor/Electron

## API URL

| Ambiente | Variável | Comportamento |
|----------|----------|---------------|
| Web produção | `VITE_API_BASE_URL=/api` | Mesmo domínio (Render) |
| Web dev | padrão | `http://localhost:3333/api` |
| Capacitor / Electron | `VITE_CLOUD_API_URL` | URL absoluta obrigatória |

## Scripts

```bash
# Web (inalterado)
npm run dev
npm run build

# Capacitor
npm run build:capacitor
npm run cap:sync
npm run cap:android
npm run cap:ios

# Electron (Windows)
npm run electron:dev
npm run electron:build
```

## Tempo real (SSE)

Todas as plataformas usam `EventSource` apontando para a mesma API (`/api/events/stream`). O servidor mescla automaticamente origens nativas (`capacitor://localhost`, `https://localhost`, etc.) ao CORS em produção. Use `CORS_ALLOW_NATIVE=false` no servidor para desabilitar.

## iOS (macOS)

O projeto Android já está em `android/`. Para iOS, em um Mac com Xcode:

```bash
npx cap add ios
npm run cap:ios
```

## Roadmap nativo

| Recurso | Web/PWA | Capacitor | Electron |
|---------|---------|-----------|----------|
| Bluetooth NIIMBOT | Web Bluetooth | Plugin (futuro) | Bridge (futuro) |
| Câmera | input file | `@capacitor/camera` | Electron APIs |
| Notificações | Web Push | `@capacitor/push-notifications` | Electron |
| Offline | Workbox PWA | `offline/queue` | `offline/queue` |
| Etiquetas | NIIMBOT web | Bridge nativo | Bridge nativo |

## Estrutura do repositório

```
/
├── src/                 # App React compartilhado
├── server/              # API Express compartilhada
├── electron/            # Shell Windows
├── android/             # Projeto Android (Capacitor)
├── ios/                 # Projeto iOS (Capacitor, macOS)
├── capacitor.config.ts
├── platforms/           # Metadados e notas de build
└── docs/platforms/      # Esta documentação
```

## Requisitos de desenvolvimento

- **Android:** Android Studio, JDK 17+, SDK
- **iOS:** macOS + Xcode (somente em Mac)
- **Windows:** Node.js + `npm run electron:build`
