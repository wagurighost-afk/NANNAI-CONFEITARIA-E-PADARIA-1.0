# Otimizações da Central de Inteligência

Documentação das melhorias de performance aplicadas na v1.3.6.

## Resumo do impacto

| Área | Antes | Depois |
|------|-------|--------|
| Dashboard Executivo (frontend) | 3 requisições HTTP paralelas | 1 requisição (`/dashboard`) |
| Snapshots no dashboard (backend) | até 5 `SELECT` por categoria | 1 `SELECT` + cache em memória |
| KPIs — produção | `loadAllProductionRecords()` + filtro JS | `loadProductionRecordsInMonth()` com filtro SQL |
| Insights/Recomendações/Alertas | `computeOperationalKpis(prev)` sempre | `getOperationalKpis(prev)` usa snapshot |
| Contexto compartilhado | 3× carga duplicada de KPIs/receitas | `resolveOperationalComparisonContext()` deduplicado |
| Receitas | `loadAllRecipes()` a cada compute | Cache TTL 120s (`loadRecipesCached`) |
| React — troca de período | Tela em branco | `placeholderData` mantém dados anteriores |
| Renderização | Re-render de todos os cartões | `memo()` em `ExecutiveKpiCard` e `AlertCard` |

---

## Backend

### 1. Consultas SQL otimizadas

**Produção filtrada por mês** (`loadProductionRecordsInMonth`):

```sql
SELECT payload FROM productions
WHERE payload->>'date' >= $1 AND payload->>'date' < $2
```

Índice: `idx_productions_date ON productions ((payload->>'date'))`

**Snapshots em lote** (`findAllSnapshotsForPeriod`):

```sql
SELECT payload FROM intelligence_snapshots
WHERE period_year = $1 AND period_month = $2
```

Índice composto: `idx_intelligence_snapshots_period_category`

### 2. Cache em memória (TTL curto)

| Módulo | Arquivo | TTL | Uso |
|--------|---------|-----|-----|
| Snapshots | `cache/snapshotCache.ts` | 60s | Evita SQL repetido no mesmo período |
| Receitas | `cache/resourceCache.ts` | 120s | Receitas mudam pouco |
| Contexto | `operationalContext.service.ts` | In-flight dedup | Paralelismo no dashboard |

Caches são limpos em `POST /api/intelligence/refresh`.

### 3. Contexto operacional compartilhado

`resolveOperationalComparisonContext(period)` carrega uma vez:

- KPIs do período atual (snapshot ou compute)
- KPIs do período anterior (**via snapshot**, não recomputa)
- Receitas (cache)
- Inventário de ingredientes

Usado por insights, recomendações e alertas.

### 4. Dashboard agregado

`getIntelligenceDashboard()`:

1. `findAllSnapshotsForPeriod()` — pré-carrega cache
2. `Promise.all` para KPIs, insights, recomendações, alertas, tendências
3. Serviços filhos acertam cache sem SQL extra

---

## Frontend

### 1. Hook unificado

`useExecutiveDashboard({ year, month })` → `GET /api/intelligence/dashboard?limit=50`

Substitui no Dashboard Executivo:

- `useExecutiveOperationalKpis`
- `useSmartInsightsReport`
- `useSmartAlertsReport`

### 2. React Query

Arquivo: `constants/queryOptions.ts`

- `staleTime` / `gcTime` centralizados
- `placeholderData: (prev) => prev` — transição suave entre meses
- Polling 30s apenas no dashboard executivo

### 3. Renderização

- `ExecutiveKpiCard` e `AlertCard` com `React.memo`
- `useMemo` para derivação dos 6 cartões KPI

---

## Invalidação e tempo real

SSE (`useRealtimeSync`) invalida `['intelligence']` quando:

- `production`, `bread-control`, `waste-control` ou `intelligence` mudam

React Query refetch automático após invalidação.

---

## Arquivos principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `server/src/intelligence/cache/snapshotCache.ts` | Cache de snapshots |
| `server/src/intelligence/cache/resourceCache.ts` | Cache de receitas |
| `server/src/intelligence/services/operationalContext.service.ts` | Contexto compartilhado |
| `server/src/intelligence/repository/intelligence.repository.ts` | Batch + cache |
| `server/src/intelligence/services/kpis/operational.kpis.ts` | Query mensal de produção |
| `src/features/intelligence/hooks/useIntelligence.ts` | `useExecutiveDashboard` |
| `src/features/intelligence/constants/queryOptions.ts` | Opções React Query |

---

## Próximas otimizações possíveis

- Persistir ingredientes no PostgreSQL e eliminar seed de inventário
- Endpoint GraphQL ou BFF dedicado se o payload do dashboard crescer
- `React.lazy` para painéis secundários (tendências, recomendações)
- Materialized views no PostgreSQL para KPIs históricos
