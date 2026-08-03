# Central de Bugs

Módulo para reportar, acompanhar e gerenciar problemas do sistema NANNAI.

## Acesso

| Ação | Quem |
|------|------|
| Ver lista e reportar bugs | Todos os usuários autenticados |
| Alterar status | Somente Administrador Master (`role === 'admin'`) |

## Rota

- Frontend: `/central-bugs`
- API: `/api/bugs`

## Campos do reporte

- Título
- Descrição
- Módulo afetado
- Prioridade (`baixa`, `media`, `alta`, `critica`)
- Imagem (obrigatória, até 3)
- Vídeo (opcional)
- Sistema operacional (detectado automaticamente)
- Navegador (detectado automaticamente)
- Versão do aplicativo (detectada automaticamente)

## Status

1. **Aberto** — bug recém-reportado
2. **Em análise** — em triagem pelo time técnico
3. **Corrigindo** — correção em andamento
4. **Resolvido** — problema corrigido

Cada mudança de status gera uma entrada no histórico com autor, data/hora e observação opcional.

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/bugs/modules` | Lista módulos disponíveis |
| `GET` | `/api/bugs` | Lista com filtros e busca |
| `GET` | `/api/bugs/:id` | Detalhe de um bug |
| `POST` | `/api/bugs` | Cria reporte (multipart) |
| `PATCH` | `/api/bugs/:id/status` | Atualiza status (admin) |

### Filtros (`GET /api/bugs`)

- `search` — busca em título, descrição, módulo, reportador
- `status` — `aberto`, `em_analise`, `corrigindo`, `resolvido` ou `all`
- `priority` — prioridade ou `all`
- `moduleId` — id do módulo ou `all`

## Persistência

Os bugs são armazenados na chave `bug_reports` da tabela `meta` (JSON).

## Realtime

Eventos SSE com `scope: 'bugs'` invalidam a query `['bugs']` no frontend.
