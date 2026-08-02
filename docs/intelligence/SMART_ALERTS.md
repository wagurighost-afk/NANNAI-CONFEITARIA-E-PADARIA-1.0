# Alertas Automáticos

Sistema de alertas com **regras de negócio** sobre KPIs operacionais e estoque cadastrado. Só gera alertas quando há evidência nos dados.

## Tipos de alerta

| Tipo | Condição |
|------|----------|
| `estoque_baixo` | `0 < estoque atual ≤ estoque mínimo` no cadastro de ingredientes |
| `ingrediente_critico` | Estoque zerado (`estoque atual ≤ 0`) |
| `desperdicio_elevado` | Volume alto, tendência de aumento ou produto dominante |
| `producao_atrasada` | `production.delayed > 0` |
| `funcionario_sobrecarregado` | Pendências/atrasos ou carga acima da média |

## Prioridades e ícones (frontend)

| Prioridade | Ícone | Cor |
|------------|-------|-----|
| **Crítica** | `OctagonAlert` | Vermelho (danger) |
| **Alta** | `AlertTriangle` | Dourado (accent) |
| **Média** | `AlertCircle` | Marrom (primary) |
| **Baixa** | `Info` | Neutro (muted) |

## Estrutura

```json
{
  "id": "alert-production-delayed",
  "type": "producao_atrasada",
  "priority": "critica",
  "title": "Produção atrasada",
  "description": "...",
  "reason": "Motivo baseado em KPI",
  "domain": "production",
  "evidence": [{ "label": "...", "value": 3 }]
}
```

## API

```http
GET /api/intelligence/alerts/smart?year=2026&month=7
GET /api/intelligence/alerts?year=2026&month=7          → relatório completo
GET /api/intelligence/alerts?year=2026&month=7&limit=10 → lista limitada
```

## Hooks

```ts
useSmartAlertsReport({ year, month })
useIntelligenceAlerts({ year, month, limit: 10 })
```

## Estoque de ingredientes

Até a API de ingredientes ser persistida no servidor, os alertas de estoque usam `server/src/data/ingredientsInventorySeed.ts` (somente leitura). Quando a API for implementada, substituir `loadIngredientInventory()` por consulta ao banco.

## Arquivos

- `server/src/intelligence/services/smartAlerts/analyzer.ts` — motor de regras
- `server/src/intelligence/services/smartAlerts.service.ts` — serviço e cache
- `src/features/intelligence/components/AlertsPanel.tsx` — UI no Dashboard Executivo
- `src/features/intelligence/components/AlertPriorityIcon.tsx` — ícones por prioridade
