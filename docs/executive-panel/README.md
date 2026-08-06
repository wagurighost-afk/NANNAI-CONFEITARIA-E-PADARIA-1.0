# Painel Executivo

Módulo de indicadores operacionais em tempo real para a liderança da Confeitaria e Padaria NANNAI.

Substitui o quadro físico de gestão, usando **apenas dados reais** já existentes no sistema.

## Acesso

Permissão: `executive-panel:view`

Quem acessa:

- Administrador Master (`founder` / `admin`)
- Diretor de Operação
- Gerente Geral
- Chef Executivo
- Chef de Confeitaria

Demais usuários recebem 403 / item oculto na navegação.

## Rotas

| Camada | Caminho |
|--------|---------|
| UI | `/painel-executivo` |
| API | `GET /api/executive-panel/dashboard` |
| Health | `GET /api/executive-panel/health` |

### Query params da API

| Param | Descrição |
|-------|-----------|
| `preset` | `today` \| `yesterday` \| `last_7_days` \| `last_30_days` \| `current_month` \| `custom` |
| `from` / `to` | ISO `YYYY-MM-DD` (obrigatórios quando `preset=custom`) |

O dia operacional usa fuso `America/Sao_Paulo`.

## Arquitetura

### Backend (`server/src/executive-panel/`)

- `access.ts` — RBAC
- `period.ts` — resolução de períodos
- `cache.ts` — cache em memória (~20s) para evitar consultas repetidas
- `executivePanel.service.ts` — agregação única
- `routes/executivePanel.routes.ts` — HTTP

### Frontend (`src/features/executive-panel/`)

```
components/   Metric cards, filtros, gráficos, alertas
constants/    opções de período e estilos
hooks/        useExecutivePanel (React Query + refetch 30s)
pages/        ExecutivePanelPage
services/     client HTTP
types/        contrato do relatório
utils/        formatação pt-BR
```

## Fontes de dados (reais)

| Seção | Origem |
|-------|--------|
| Produção | `ProductionDay` |
| Pães | `BreadControlDay` + fórmulas PAX |
| Desperdício | `WasteControlDay` |
| PAX | Máximo diário entre desperdício e pães |
| Custos (desperdício) | Totais lançados de waste |
| Meta CMV | `settings.goals.cmvTargetPercent` |
| Equipe | Escala mensal (`work` / `off` / `vacation`…) + produtividade via produção |
| Auditoria | `audit_logs` |
| Etiquetas | `label_records` |
| Alertas | Regras sobre dados reais do período |

## Indisponível (quando implementado)

Estas seções aparecem com estado explícito “Indisponível / Aguardando módulo” — **sem dados fictícios**:

- UH / entradas / saídas / adultos / crianças (ocupação hoteleira)
- CMV atual / diferença percentual (módulo de custos)
- Estoque crítico / mínimo / vencimento
- Nota de auditoria estruturada
- Etiquetas pendentes (não há fila de pendência no domínio atual)

## Tempo real

- Polling do dashboard a cada 30s
- Invalidação via SSE quando mudam produção, pães, desperdício, escala, etiquetas ou settings

## Relação com Dashboard Executivo (`/intelligence`)

O **Painel Executivo** é o quadro operacional diário da liderança, com filtros de período flexíveis.

O **Dashboard Executivo** (`/intelligence`) permanece como Central de Inteligência mensal (insights/recomendações/tendências).
