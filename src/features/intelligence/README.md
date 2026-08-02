# Frontend — Central de Inteligência Operacional

## Estrutura

```
src/features/intelligence/
├── README.md
├── index.ts
├── constants/
│   └── intelligence.constants.ts    # query keys
├── types/
│   └── intelligence.types.ts        # contrato da API
├── services/
│   └── intelligence.service.ts      # cliente HTTP
├── hooks/
│   └── useIntelligence.ts           # React Query
└── pages/
    └── IntelligencePage.tsx         # placeholder (sem UI)
```

## Uso dos hooks

```tsx
import { useIntelligenceDashboard } from '@/features/intelligence'

function Example() {
  const { data, isLoading, error } = useIntelligenceDashboard({ year: 2026, month: 7 })

  if (isLoading) return null
  if (error) return null

  return (
    <pre>{JSON.stringify(data?.kpis, null, 2)}</pre>
  )
}
```

## Serviço HTTP

```ts
import { intelligenceService } from '@/features/intelligence/services/intelligence.service'

await intelligenceService.getKpis({ year: 2026, month: 7 })
await intelligenceService.refresh({ year: 2026, month: 7, limit: 10 })
```

## Rota

- Path: `/intelligence` (`APP_ROUTES.intelligence`)
- Proteção: `PermissionRoute` com `intelligence:view`
- Página atual: placeholder oculto — aguardando implementação de UI

## Permissões

Arquivo: `src/core/permissions/intelligenceAccess.ts`

- `canAccessIntelligence` → admin + liderança
- Permissões RBAC: `intelligence:view`, `intelligence:refresh`

## Próximo passo

Implementar `IntelligenceDashboardPage` consumindo:

- `useIntelligenceDashboard`
- `useIntelligenceRefresh`

Sem alterar módulos existentes (produção, pães, desperdício, etc.).
