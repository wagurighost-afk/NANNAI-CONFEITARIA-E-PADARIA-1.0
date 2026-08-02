# Insights Inteligentes

Sistema de análise automática dos KPIs operacionais. **Somente gera insights quando há dados reais que comprovam a situação.**

## Níveis de prioridade

| Nível | Quando usar |
|-------|-------------|
| **Crítico** | Impacto alto, ação imediata |
| **Alto** | Situação relevante, ação no mesmo dia |
| **Médio** | Atenção necessária |
| **Baixo** | Informativo com dados reais |

## Estrutura de cada insight

```json
{
  "id": "smart-production-delayed",
  "priority": "critico",
  "title": "Produção atrasada",
  "description": "...",
  "reason": "Motivo baseado em KPI",
  "impact": "Consequência operacional",
  "suggestedAction": "Ação sugerida",
  "domain": "production",
  "evidence": [{ "label": "...", "value": 3 }]
}
```

## Regras implementadas (só disparam com evidência)

| Insight | Condição (dados reais) |
|---------|------------------------|
| Desperdício aumentou | Mês anterior com kg > 0 **e** atual > anterior |
| Produção atrasada | `production.delayed > 0` |
| Pães abaixo do previsto | `planned > 0`, `difference < 0`, gap ≥ 10% |
| Alto desperdício por produto | Produto ≥ 15% do total de kg |
| Eficiência baixa | Itens existem e eficiência < 70% |
| Custo de desperdício | `totalCost > 0` e `totalKg > 0` |
| Maior desperdício em receita | `highestWaste.wasteKg > 0` |
| Funcionário sobrecarregado | Pendências + atrasos ≥ 2 ou carga acima da média |

## API

```http
GET /api/intelligence/insights/smart?year=2026&month=7
GET /api/intelligence/insights?year=2026&month=7          → relatório completo
GET /api/intelligence/insights?year=2026&month=7&limit=10 → lista limitada
```

## Hooks

```ts
useSmartInsightsReport({ year, month })
useIntelligenceInsights({ year, month, limit: 10 })
```

## Arquivos

- `server/src/intelligence/services/smartInsights/analyzer.ts` — motor de regras
- `server/src/intelligence/services/smartInsights.service.ts` — serviço e cache
- `server/src/intelligence/types/smartInsights.types.ts` — tipos
