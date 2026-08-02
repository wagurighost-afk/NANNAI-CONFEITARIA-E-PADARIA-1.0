# Sistema de Auditoria — NANNAI v1.3.7

Registro completo de alterações para conformidade e rastreabilidade operacional.

## O que é registrado

Cada entrada de auditoria contém:

| Campo | Descrição |
|-------|-----------|
| **Quem** | Usuário autenticado (`userId`, `userName`, `userEmail`, `employeeId`) |
| **Quando** | Data/hora ISO (`createdAt`) |
| **O que** | Tipo de entidade + ID |
| **Ação** | `create`, `update`, `delete`, `status_change`, `comment`, etc. |
| **Resumo** | Descrição legível da operação |
| **Antes** | Estado anterior (JSON sanitizado) |
| **Depois** | Estado posterior (JSON sanitizado) |

## Entidades monitoradas

- `production` — produção diária, itens, comentários, status
- `recipe` — receitas (criar, editar, arquivar, excluir)
- `bread_control` — controle de pães
- `waste_control` — controle de desperdício
- `monthly_schedule` — escala mensal
- `auth` — alteração e redefinição de senhas (dados sensíveis redigidos)
- `intelligence` — refresh manual da Central de Inteligência

## Segurança

- Senhas, tokens e hashes são substituídos por `[REDACTED]` antes de persistir (`server/src/audit/sanitize.ts`).
- Consulta restrita a **admin** e **liderança** (`canViewAuditLogs`).
- Permissão frontend: `audit:view`.

## API

```
GET /api/audit/logs
```

**Query params:** `entityType`, `entityId`, `actorId`, `action`, `from`, `to`, `limit` (máx. 200), `offset`

**Resposta:**

```json
{
  "total": 42,
  "items": [
    {
      "id": "audit-...",
      "actor": { "userId": "...", "userName": "...", "userEmail": "..." },
      "entityType": "production",
      "entityId": "prd-...",
      "action": "update",
      "summary": "Produção PRD-000001 atualizada",
      "before": { },
      "after": { },
      "createdAt": "2026-07-23T11:00:00.000Z"
    }
  ]
}
```

## Persistência

- **PostgreSQL:** tabela `audit_logs` com índices em `created_at`, `entity_type/entity_id` e `actor_id`.
- **JSON local:** array `audit_logs` em `nannai.json` (limite de 5.000 registros).

## Interface

Rota: `/auditoria` — menu **Auditoria** (visível para liderança).

- Tabela com filtros por entidade, ação e ID
- Drawer com JSON **Antes** / **Depois** ao clicar em um registro
- Paginação (25 por página)

## Arquivos principais

| Camada | Arquivos |
|--------|----------|
| Backend | `server/src/audit/*`, `server/src/routes/audit.routes.ts` |
| DB | `server/src/db/postgresStore.ts`, `server/src/db/jsonStore.ts` |
| Frontend | `src/features/audit/*`, `src/core/permissions/auditAccess.ts` |
