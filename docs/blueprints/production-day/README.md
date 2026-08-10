# Production Day — histórico diário

## Modelo

| Conceito | Papel |
|----------|--------|
| **Production Template** | Modelo padrão do colaborador (tarefas base). Não é histórico. Fonte: `PRODUCTION_DIVISION` + overrides em memória (`productionTemplate.ts`). |
| **ProductionDay** | Registro materializado de **uma** data operacional + colaborador. Contém tarefas, status, comentários, fotos, conferência. |

Timezone operacional: **America/Recife** (hotfix `f193f78` — não alterar).

## Antes → depois

**Antes:** rollover reutilizava IDs fixos (`ACTIVE_PRODUCTION_IDS` → `prd-mauro`, …), atualizando `date` e resetando progresso. O dia anterior deixava de existir no banco.

**Depois:** na virada, o backend **insere** um ProductionDay novo (`prd-<uuid>`) por colaborador com template válido. Registros antigos permanecem com a data original.

## Unicidade (PostgreSQL)

Índice único parcial/expressão:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_productions_employee_operational_date
  ON productions ((payload->>'employeeId'), (payload->>'date'))
  WHERE (payload ? 'employeeId')
    AND (payload ? 'date')
    AND NULLIF(payload->>'employeeId', '') IS NOT NULL
    AND NULLIF(payload->>'date', '') IS NOT NULL;
```

Conflito `23505` → `ProductionDayUniqueConflictError` → recuperação do registro existente (idempotência sob concorrência).

## Migração

1. **Não apagar** os registros atuais (tipicamente 14 no dia operacional corrente, ainda com IDs legados `prd-*`).
2. **Não inventar** histórico de dias anteriores destruídos pelo modelo antigo.
3. A partir do deploy, cada nova data operacional gera IDs novos; dias já gravados ficam imutáveis em `employeeId` + `date`.
4. Histórico anterior à migração **não é recuperável** sem fonte externa (backup/audit).

## Materialização

`ensureProductionDaysForDate(date)` / `rolloverProductionsIfNeeded()`:

- Para cada template válido: se já existe `(employeeId, date)`, não cria.
- Senão: cria ProductionDay fresco (status Pendente, sem comentários/fotos).
- Sem template: não cria produção fictícia.
