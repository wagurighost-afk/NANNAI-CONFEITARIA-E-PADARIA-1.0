# Experiência Mobile PWA — NANNAI v1.3.9

Melhorias para uso em celular (Android e iPhone) com aparência de app nativo.

## Safe Area (iPhone / Android)

- Utilitários CSS: `pt-safe`, `pb-safe`, `px-safe`, `pl-safe`, `pr-safe`
- Aplicados em: Header, Sidebar, BottomNav, Modal, Drawer, Toast, barras fixas
- `viewport-fit=cover` já configurado em `index.html`
- Altura dinâmica: `100dvh` no body e layout principal

## Navegação mobile

### Barra inferior (`BottomNav`)
- Visível apenas em telas `< lg`
- Atalhos: Início, Produção, Receitas, Comentários + **Menu** (abre sidebar)
- Altura 64px + safe-area inferior
- Conteúdo principal com padding inferior para não ficar atrás da barra

### Header
- Botões com área mínima de **44×44px** no mobile
- `pt-safe` para notch/status bar
- Título compacto "NANNAI" em telas pequenas

### Sidebar
- Links com `min-h-11` (44px) no mobile
- Scroll lock no body quando aberta
- Safe-area superior e inferior

## Touch targets

| Componente | Mobile | Desktop |
|------------|--------|---------|
| Button `md` | 44px altura | 40px |
| Input / Select | 44px, texto 16px | 40px, texto 14px |
| Tabs | 44px altura | compacto |
| Pagination | botões `md` | idem |

Classe utilitária: `.touch-target` (min 44px).

## Modais

- Em telas `< 640px`: **bottom sheet** (desliza de baixo, handle visual, `max-h-[92dvh]`)
- Em desktop: modal centralizado
- Footer empilhado em coluna no mobile

## Tabelas

- `DataTable`: scroll horizontal contido, `min-w-full` no mobile
- **Auditoria**: cards no mobile, tabela no desktop (`lg+`)
- Páginas existentes com cards mobile: Colaboradores, Ingredientes, Produção, Desperdício

## Offline

- Banner `OfflineBanner` quando `navigator.onLine === false`
- Service Worker (Workbox): cache de páginas, API NetworkFirst, fontes CacheFirst
- Toast reposicionado acima da bottom nav

## Performance e animações

- `prefers-reduced-motion`: animações reduzidas globalmente
- `overscroll-behavior-y: none` no body (comportamento app-like)
- `-webkit-tap-highlight-color: transparent`
- `overflow-x: hidden` em html/body/#root (sem scroll horizontal da página)

## Hooks novos

- `useIsMobile()` / `useMediaQuery()`
- `useBodyScrollLock()`
- `useOnlineStatus()`

## Pendências conhecidas

- Ícones PWA PNG (`pwa-192x192.png`, `pwa-512x512.png`) — adicionar em `public/`
- Escala mensal e controle de pães: tabelas largas com scroll horizontal intencional
- Painéis de Insights/Recomendações no dashboard executivo (escopo futuro)
