# Central de Inteligência Operacional

Módulo de inteligência operacional da NANNAI — infraestrutura para KPIs, insights, recomendações e tendências.

## Visão geral

| Camada | Caminho | Responsabilidade |
|--------|---------|------------------|
| API | `/api/intelligence` | Endpoints REST autenticados |
| Frontend (rota) | `/intelligence` | Rota reservada (UI em fase posterior) |
| Serviço frontend | `src/features/intelligence/services/intelligence.service.ts` | Cliente HTTP |
| Hooks | `src/features/intelligence/hooks/useIntelligence.ts` | React Query |
| Backend | `server/src/intelligence/` | Domínio, serviços, repositório |
| Persistência | `intelligence_snapshots` | Cache JSONB (PostgreSQL / JSON local) |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend                                                    │
│  useIntelligence*  →  intelligence.service  →  /api/...   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ API  intelligence.routes.ts                                 │
│  requireAuth + canAccessIntelligence (liderança/admin)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ intelligence.service (orquestrador)                         │
│  ├── kpis.service                                           │
│  ├── insights.service                                       │
│  ├── recommendations.service                                │
│  └── trends.service                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ intelligence.repository                                     │
│  └── db: intelligence_snapshots                             │
└──────────────────────────────┬──────────────────────────────┘
                               │ (leitura somente)
┌──────────────────────────────▼──────────────────────────────┐
│ Dados operacionais existentes                               │
│  productions | bread_control_days | waste_control_days      │
└─────────────────────────────────────────────────────────────┘
```

## Endpoints da API

Base: `GET|POST /api/intelligence` (autenticado)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status do módulo |
| `GET` | `/dashboard?year=&month=&limit=` | Painel agregado |
| `GET` | `/kpis?year=&month=` | Relatório completo de KPIs |
| `GET` | `/kpis/operational` | Alias do relatório completo |
| `GET` | `/kpis/production` | KPIs de produção |
| `GET` | `/kpis/waste` | KPIs de desperdício |
| `GET` | `/kpis/bread` | KPIs de pães |
| `GET` | `/kpis/recipes` | KPIs de receitas |
| `GET` | `/kpis/employees` | KPIs de colaboradores |
| `GET` | `/insights?year=&month=&limit=` | Insights |
| `GET` | `/recommendations?year=&month=&limit=` | Recomendações |
| `GET` | `/trends?year=&month=&metricKey=&limit=` | Tendências |
| `POST` | `/refresh` | Recalcula e atualiza snapshots |

### Exemplo

```http
GET /api/intelligence/dashboard?year=2026&month=7&limit=10
Authorization: Bearer <token>
```

## Permissões

- **Backend:** `canAccessIntelligence` — admin e cargos de liderança
- **Frontend RBAC:** `intelligence:view`, `intelligence:refresh`

## KPIs operacionais (dados reais)

### Produção
- `completed` — produções 100% concluídas
- `pending` — produções futuras/hoje incompletas
- `delayed` — produções com data passada incompletas
- `averageCompletionHours` — tempo médio (createdAt → updatedAt)
- `efficiencyPercent` — itens concluídos / total de itens

### Desperdício
- `totalKg`, `totalCost`
- `byBuffet[]` — kg e custo por buffet
- `byProduct[]` — top 20 produtos
- `kgPerPax` — kg / PAX único por dia

### Pães
- `plannedUnits` — PAX × multiplicador do catálogo
- `producedUnits` — unidades registradas
- `difference` — produzido − previsto

### Receitas
- `mostProduced` / `leastProduced` — por `recipeId` em produção
- `highestWaste` — produto com maior kg (vinculado à receita quando o nome coincide)

### Colaboradores
- `rows[]` — produtividade, pendências e atrasos por colaborador
- `averageProductivityPercent`, `totalPending`, `totalDelayed`

## Hooks disponíveis

```ts
import {
  useIntelligenceDashboard,
  useIntelligenceKpis,
  useIntelligenceInsights,
  useIntelligenceRecommendations,
  useIntelligenceTrends,
  useIntelligenceRefresh,
  useIntelligenceHealth,
} from '@/features/intelligence'
```

## Query keys (React Query)

Prefixo: `['intelligence', ...]`

Invalidação automática via SSE quando `scope === 'intelligence'`.

## Persistência PostgreSQL

```sql
CREATE TABLE intelligence_snapshots (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,        -- kpi | insight | recommendation | trend
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL
);
```

## Extensibilidade

Para adicionar novos KPIs/insights:

1. Estender `IntelligenceMetricKey` em `server/src/intelligence/types.ts`
2. Implementar cálculo em `services/kpis.service.ts` (ou serviço específico)
3. Atualizar `insights.service.ts` / `recommendations.service.ts` conforme regras
4. Espelhar tipos no frontend em `src/features/intelligence/types/`

## Próximas fases (UI)

- Dashboard visual em `/intelligence`
- Gráficos de tendências (Recharts)
- Cards de KPIs e fila de recomendações
- Item no menu lateral (`navigation.ts`)

## Documentação adicional

- Backend: `server/src/intelligence/README.md`
- Frontend: `src/features/intelligence/README.md`
