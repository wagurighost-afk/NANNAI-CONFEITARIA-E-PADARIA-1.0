# Laboratório NANNAI

Ambiente exclusivo do **Administrador Master** (`role: admin`) para gestão de funcionalidades em teste, betas, experimentais e futuras.

## Acesso

| Camada | Regra |
|--------|--------|
| Frontend | `canAccessLaboratorio(user)` → `user.role === 'admin'` |
| API | `canAccessLaboratorio(req.user)` na rota `/api/laboratorio` |
| Navegação | Item visível apenas com permissão `laboratorio:view` |
| Rota | `/laboratorio-nannai` protegida por `PermissionRoute` |

Usuário seed: `admin@nannai.com` (Administrador NANNAI).

## Arquitetura

```
server/src/laboratorio/
  access.ts              # Gate master admin
  types.ts               # Contratos compartilhados
  featureRegistry.ts     # Catálogo estático (módulos + funcionalidades)
  laboratorio.service.ts # Merge catálogo + overrides persistidos

server/src/routes/laboratorio.routes.ts

src/features/laboratorio/
  types/                 # Tipos do frontend
  constants/             # Labels e badges
  services/              # Cliente HTTP
  hooks/                 # useLaboratorio (TanStack Query)
  utils/                 # Filtros client-side
  components/            # Cards, KPIs, filtros
  pages/LaboratorioPage.tsx
```

### Padrão escalável

1. **Catálogo (`featureRegistry.ts`)** — definições imutáveis no código. Novas funcionalidades são adicionadas aqui.
2. **Overrides (`meta.laboratorio_state`)** — estado persistido no banco (JSON meta). Guarda `enabled`, `lifecycle`, `category` e auditoria de quem alterou.
3. **Merge em runtime** — `getLaboratorioDashboard()` combina catálogo + overrides para a UI.
4. **Integração futura** — outros módulos podem consultar `isLaboratorioModuleEnabled(moduleId)` sem alterar lógica existente.

## Modelo de dados

### Listas (categoria)

| ID | Label |
|----|--------|
| `em_desenvolvimento` | Em desenvolvimento |
| `beta` | Beta |
| `experimental` | Experimental |
| `futuras` | Futuras |

### Ciclo de vida (status)

| ID | Label |
|----|--------|
| `desenvolvimento` | Em Desenvolvimento |
| `beta` | Beta |
| `producao` | Produção |
| `descontinuada` | Descontinuada |

### Módulo

- `id`, `name`, `description`, `enabled`, `featureCount`
- Toggle via `PATCH /api/laboratorio/modules/:id` com `{ enabled: boolean }`
- Desativar módulo desativa visualmente todas as funcionalidades filhas

### Funcionalidade

- `id`, `moduleId`, `name`, `description`, `category`, `lifecycle`, `enabled`, `route?`, `version?`
- Atualização via `PATCH /api/laboratorio/features/:id`

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/laboratorio` | Dashboard completo (summary + modules + features) |
| `GET` | `/api/laboratorio/health` | Health check do módulo |
| `PATCH` | `/api/laboratorio/features/:id` | Atualizar categoria, lifecycle ou enabled |
| `PATCH` | `/api/laboratorio/modules/:id` | Ativar/desativar módulo |

Respostas de mutação retornam o dashboard atualizado.

## Frontend

### Página `/laboratorio-nannai`

- KPIs: total de funcionalidades, em desenvolvimento, beta, módulos ativos
- Mini KPIs por lista (desenvolvimento, beta, experimental, futuras)
- Grade de **cartões de módulos** com switch on/off
- Grade de **cartões de funcionalidades** com badges, select de status e switch
- **Pesquisa** por nome, descrição ou módulo
- **Filtros**: lista, status, módulo, ativo/inativo

### Permissões RBAC

- `laboratorio:view` — visualizar módulo
- `laboratorio:manage` — alterar flags (injetadas apenas para admin)

## Tempo real

Eventos SSE `scope: laboratorio` invalidam a query `['laboratorio']` para sincronização entre sessões do admin.

## Como adicionar uma nova funcionalidade

1. Adicionar entrada em `LABORATORIO_FEATURES` em `server/src/laboratorio/featureRegistry.ts`
2. (Opcional) Adicionar módulo em `LABORATORIO_MODULES` se for um módulo novo
3. Reiniciar API — a funcionalidade aparece automaticamente no Laboratório
4. Overrides são criados sob demanda quando o admin altera status ou ativação

## Princípio de não-regressão

Este módulo **não altera** o comportamento dos módulos existentes. Os toggles são persistidos e expostos via API para integração gradual futura com `isLaboratorioModuleEnabled()` / `isLaboratorioFeatureEnabled()`.
