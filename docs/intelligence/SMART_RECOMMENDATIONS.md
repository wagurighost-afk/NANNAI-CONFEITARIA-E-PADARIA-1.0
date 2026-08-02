# Recomendações Inteligentes

Motor de recomendações com **regras de negócio** sobre os KPIs operacionais. Só gera recomendações quando há evidência nos dados reais.

## Tipos de ação

| Ação | Quando é sugerida |
|------|-------------------|
| `reduzir_producao` | Alto desperdício, tendência de aumento ou excedente de pães |
| `aumentar_producao` | Déficit de pães, produções atrasadas ou baixa eficiência |
| `redistribuir_tarefas` | Colaborador sobrecarregado (pendências/atrasos) |
| `solicitar_reposicao` | Déficit de pães **e** receitas ativas de Pães com insumos cadastrados |
| `revisar_receita` | Maior desperdício vinculado a receita ou produto dominante |

## Níveis de prioridade

`critico` · `alto` · `medio` · `baixo`

## Estrutura de cada recomendação

```json
{
  "id": "rec-increase-bread",
  "action": "aumentar_producao",
  "priority": "alto",
  "title": "Aumentar produção de pães",
  "description": "...",
  "reason": "Motivo baseado em KPI",
  "expectedImpact": "Impacto esperado",
  "domain": "bread",
  "evidence": [{ "label": "Déficit (un)", "value": 120 }]
}
```

## Regras (só disparam com evidência)

| Recomendação | Condição |
|--------------|----------|
| Reduzir produção (produto) | Produto ≥ 15% do desperdício total |
| Reduzir produção (tendência) | Desperdício atual > mês anterior com kg > 0 |
| Reduzir produção (pães) | Produzido > previsto, excedente ≥ 10% |
| Aumentar produção (pães) | Produzido < previsto, déficit ≥ 10% |
| Aumentar produção (atrasos) | `production.delayed > 0` |
| Aumentar produção (eficiência) | Eficiência < 70% com itens pendentes |
| Redistribuir tarefas | Pendências + atrasos ≥ 2 ou carga acima da média |
| Solicitar reposição | Déficit de pães ≥ 10% **e** receitas de Pães com insumos |
| Revisar receita | `highestWaste.wasteKg > 0` ou produto ≥ 20% sem receita |

## API

```http
GET /api/intelligence/recommendations/smart?year=2026&month=7
GET /api/intelligence/recommendations?year=2026&month=7          → relatório completo
GET /api/intelligence/recommendations?year=2026&month=7&limit=10 → lista limitada
```

## Hooks

```ts
useSmartRecommendationsReport({ year, month })
useIntelligenceRecommendations({ year, month, limit: 10 })
```

## Arquivos

- `server/src/intelligence/services/smartRecommendations/analyzer.ts` — motor de regras
- `server/src/intelligence/services/smartRecommendations.service.ts` — serviço e cache
- `server/src/intelligence/types/smartRecommendations.types.ts` — tipos
