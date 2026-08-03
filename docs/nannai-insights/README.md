# NANNAI Insights

Módulo de análises inteligentes da operação. **Fase atual: estrutura (scaffold)** — sem dados operacionais ou métricas fictícias.

## Objetivo

Receber futuramente análises inteligentes consolidadas da operação do hotel (produção, desperdício, estoque, custos, receitas, equipe, etiquetas e planejamento).

## Diferença do Dashboard Executivo

| Módulo | Rota | Foco |
|--------|------|------|
| **Dashboard Executivo** | `/intelligence` | KPIs operacionais atuais |
| **NANNAI Insights** | `/nannai-insights` | Análises inteligentes futuras (IA, tendências, alertas) |

## Acesso

- Permissão: `nannai-insights:view`
- Papéis: `founder`, `admin`, `manager`
- API protegida por autenticação + `canAccessNannaiInsights()`

## Seções (estrutura)

| ID | Seção | Cartões placeholder |
|----|-------|---------------------|
| `producao` | Produção | 2 slots |
| `desperdicio` | Desperdício | 2 slots |
| `estoque` | Estoque | 1 slot |
| `custos` | Custos | 2 slots |
| `receitas` | Receitas | 1 slot |
| `equipe` | Equipe | 1 slot |
| `etiquetas` | Etiquetas | 1 slot |
| `planejamento` | Planejamento | 2 slots |

Cada cartão possui `status: 'planned'` e texto descritivo — **sem valores numéricos**.

## Arquitetura

```
server/src/nannai-insights/
  types.ts              # Tipos do módulo
  sections.ts           # Registro canônico das seções e placeholders
  access.ts             # Controle de acesso
  nannaiInsights.service.ts  # Monta overview (scaffold)

server/src/routes/nannaiInsights.routes.ts
  GET /api/nannai-insights
  GET /api/nannai-insights/health

src/features/nannai-insights/
  types/nannaiInsights.types.ts
  constants/sectionIcons.ts
  services/nannaiInsights.service.ts
  hooks/useNannaiInsights.ts
  components/
    InsightsPlaceholderCard.tsx
    InsightsSectionBlock.tsx
  pages/NannaiInsightsPage.tsx

src/core/permissions/nannaiInsightsAccess.ts
```

## API

### `GET /api/nannai-insights`

Retorna:

```json
{
  "module": "nannai-insights",
  "version": "0.1.0-scaffold",
  "status": "scaffold",
  "generatedAt": "ISO-8601",
  "sections": [ ... ]
}
```

### `GET /api/nannai-insights/health`

Health check do módulo em fase scaffold.

## Evolução planejada

1. **Fase 2 — Conectores**: cada seção passa a consumir dados reais dos módulos existentes (produção, waste-control, etc.).
2. **Fase 3 — Motor de insights**: agregações, tendências e alertas sem dados inventados.
3. **Fase 4 — IA**: recomendações e análises preditivas no slot `planejamento`.

### Como adicionar um insight real

1. Implementar provider em `server/src/nannai-insights/providers/<secao>.ts`
2. Alterar status do cartão de `planned` para `active`
3. Preencher payload tipado no cartão (sem alterar a estrutura da página)
4. Registrar no `nannaiInsights.service.ts`

## Frontend

- Rota: `/nannai-insights`
- Menu: **NANNAI Insights** (ícone `LineChart`)
- UI: seções empilhadas com cartões tracejados e badge **Em breve**

## Versão

Introduzido na **v1.6.5** (módulo API `0.1.0-scaffold`).
