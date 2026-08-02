# Frontend — Central de Inteligência Operacional

## Estrutura atual

```
src/features/intelligence/
├── components/
│   ├── ExecutiveDashboard.tsx    # Orquestrador do painel executivo
│   ├── ExecutiveKpiCard.tsx      # Cartão KPI com prioridade
│   ├── ExecutivePeriodPicker.tsx # Seletor mês/ano
│   ├── AlertsPanel.tsx           # Lista de alertas automáticos
│   └── AlertPriorityIcon.tsx
├── constants/
│   ├── intelligence.constants.ts
│   ├── queryOptions.ts           # staleTime, polling 30s
│   ├── priority.constants.ts
│   └── alert.constants.ts
├── hooks/
│   └── useIntelligence.ts        # React Query (dashboard + refresh)
├── pages/
│   └── IntelligencePage.tsx
├── services/
│   └── intelligence.service.ts
├── types/
└── utils/
```

## Uso principal

```tsx
import { useExecutiveDashboard, useIntelligenceRefresh } from '@/features/intelligence'

const { data, isLoading, isError, refetch } = useExecutiveDashboard({ year: 2026, month: 7 })
```

## Rota

- Path: `/intelligence` (`APP_ROUTES.intelligence`)
- Menu: **Dashboard Executivo**
- Proteção: `intelligence:view`
- Refresh manual: `intelligence:refresh` (liderança)

## API consumida pela UI

| Endpoint | Uso |
|----------|-----|
| `GET /intelligence/dashboard` | Painel executivo (1 requisição agregada) |
| `POST /intelligence/refresh` | Recálculo manual dos snapshots |

Sincronização em tempo real via SSE (`useRealtimeSync`) invalida `['intelligence']` quando produção, pães, desperdício ou inteligência mudam.

## Documentação backend

Ver `docs/intelligence/` e `docs/intelligence/REVIEW.md` para arquitetura completa e melhorias.
