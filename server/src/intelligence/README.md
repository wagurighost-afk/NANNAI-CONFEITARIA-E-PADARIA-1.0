# Backend — Central de Inteligência Operacional

## Estrutura

```
server/src/intelligence/
├── README.md
├── index.ts                 # barrel export
├── types.ts                 # tipos de domínio
├── constants.ts             # limites, IDs de snapshot
├── access.ts                # autorização
├── repository/
│   └── intelligence.repository.ts
└── services/
    ├── intelligence.service.ts   # orquestrador
    ├── kpis.service.ts
    ├── insights.service.ts
    ├── recommendations.service.ts
    └── trends.service.ts
```

## Fluxo de dados

1. Rota recebe `year` / `month`
2. Serviço tenta ler snapshot em `intelligence_snapshots`
3. Se não existir, calcula a partir de dados operacionais (somente leitura via `db/index.ts`)
4. Persiste snapshot para cache
5. `POST /refresh` limpa snapshots do período e recalcula tudo

## Serviços

| Serviço | Responsabilidade |
|---------|------------------|
| `kpis.service` | Métricas numéricas agregadas |
| `insights.service` | Interpretações automáticas dos KPIs |
| `recommendations.service` | Ações sugeridas para a operação |
| `trends.service` | Séries temporais por métrica |
| `intelligence.service` | Dashboard + refresh coordenado |

## Rotas

Arquivo: `server/src/routes/intelligence.routes.ts`  
Montagem: `app.use('/api/intelligence', intelligenceRouter)` em `server/src/index.ts`

## Banco de dados

Métodos em `DatabaseStore`:

- `loadIntelligenceSnapshot(id)`
- `loadIntelligenceSnapshotsByPeriod(year, month, category?)`
- `saveIntelligenceSnapshot(snapshot)`
- `deleteIntelligenceSnapshotsByPeriod(year, month, category?)`

Implementados em `jsonStore.ts` e `postgresStore.ts`.

## Realtime

Após `POST /refresh`, emite:

```ts
emitRealtime({ scope: 'intelligence', action: 'refreshed', scheduleId: 'intel-YYYY-MM' })
```
