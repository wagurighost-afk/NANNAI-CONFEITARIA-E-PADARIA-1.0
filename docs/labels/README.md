# Etiquetas Inteligentes

Módulo de geração, pré-visualização, impressão e histórico de etiquetas da NANNAI — com validade automática, QR Code e integração à Produção.

## Visão geral

| Camada | Caminho | Responsabilidade |
|--------|---------|------------------|
| UI | `/etiquetas` · `src/features/labels/` | Modelos, histórico, filtros de validade, impressão |
| Serviço FE | `labels.service.ts` + repositories | Mock (localStorage) ou API |
| API | `/api/labels` | CRUD de impressões + templates |
| Backend | `server/src/labels*` | Builders, validade, lote, QR, auditoria |
| Persistência | `label_records` | PostgreSQL / JSON local |

## Modelos

| ID | Nome | Validade padrão |
|----|------|-----------------|
| `producao` | Produção | 3 dias |
| `buffet` | Buffet | 1 dia |
| `camara-fria` | Câmara fria | 7 dias |
| `congelados` | Congelados | 90 dias |
| `ingredientes` | Ingredientes | 30 dias |
| `produtos-abertos` | Produtos abertos | 3 dias |

Cada etiqueta inclui: produto, categoria, produção, hora, validade, lote (`LOT-…`), código interno, responsável e QR Code JSON.

## API

Base: `/api/labels` (autenticado)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| `GET` | `/templates` | `labels:view` | Lista modelos |
| `GET` | `/` | `labels:view` | Histórico (search, templateId, from, to, productionId) |
| `GET` | `/:id` | `labels:view` | Detalhe |
| `POST` | `/` | `labels:print` | Cria e registra impressão |
| `POST` | `/from-production` | `labels:print` | Gera a partir de item concluído |
| `POST` | `/:id/reprint` | `labels:print` | Reimpressão (com `reprintOfId`) |

## Integração com Produção

Ao marcar um item como **Concluído** (com `labels:print`), o drawer abre o diálogo de etiqueta com dados do item e da receita vinculada (peso/código quando disponíveis). Também há botão **Etiqueta** nos itens concluídos.

## Impressão

| Adaptador | Status |
|-----------|--------|
| Navegador (`browser-print`) | Ativo — `window.print` + CSS de etiqueta |
| NIIMBOT B1 (`niimbot-b1`) | Ativo via Web Bluetooth (Chrome/Edge) — ver [NIIMBOT_B1.md](./NIIMBOT_B1.md) |

A B1 Pro é detectada automaticamente no pareamento (mesmo nome BLE).

## Validade inteligente

O histórico destaca status:

- **Dentro da validade**
- **Vence em breve** (≤ 2 dias)
- **Vence hoje**
- **Vencida**

Filtro correspondente na página do módulo.

## Permissões

- Frontend: `labels:view`, `labels:print` (admin, manager, staff)
- Backend: `canViewLabels` / `canPrintLabels` em `server/src/labels/access.ts`
- Viewer: sem acesso ao módulo

## Mock / offline

Com `VITE_USE_MOCK=true`, `MockLabelRepository` persiste em `localStorage` (`nannai.labels.records`) e reutiliza produção/receitas mock.

## Arquivos principais

| Camada | Arquivos |
|--------|----------|
| Página | `src/features/labels/pages/LabelsPage.tsx` |
| Impressão | `components/LabelPrintDialog.tsx`, `printer/*` |
| Domínio FE | `utils/labelData.ts`, `utils/labelExpiry.ts` |
| API | `server/src/routes/labels.routes.ts`, `labels.service.ts` |
| Builders | `server/src/labels/labelBuilders.ts` |
