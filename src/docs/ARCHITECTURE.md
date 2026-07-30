# Arquitetura — NANNAI Confeitaria e Padaria

## Visão geral

Fundação front-end baseada em **Clean Architecture**, **Feature Based Architecture** e **Atomic Design**.

Decisões arquitetônicas são de responsabilidade do Arquiteto Principal (CTO).

## Camadas

| Pasta | Responsabilidade |
|-------|------------------|
| `core/` | Núcleo da aplicação (API, auth, permissions, errors, logger, storage, constants) |
| `app/` | Bootstrap, providers e roteamento |
| `components/ui` | Design System — átomos/moléculas reutilizáveis |
| `components/common` | Moléculas compartilhadas (PageHeader, EmptyState) |
| `components/layout` | Shell da aplicação (AppLayout, Sidebar, Header) |
| `features/` | Módulos de negócio isolados |
| `hooks/` | Lógica reutilizável de UI/estado React |
| `contexts/` | Estado global React (Auth, Theme, Loading, RBAC) |
| `types/` | Contratos TypeScript |
| `config/` | Configuração de ambiente e QueryClient |
| `utils/` | Helpers puros de UI (ex.: `cn`) |
| `styles/tokens/` | Design tokens (colors, spacing, radius, borders, shadow, typography, animations) |
| `styles/` | globals.css + bootstrap de tema |

## Core

```
src/core/
├── api/          # Client HTTP (Axios) e interceptors
├── auth/         # Serviço de autenticação
├── permissions/  # Mapa de papéis e helpers RBAC
├── errors/       # Normalização de erros + AppError
├── logger/       # Logger tipado da aplicação
├── storage/      # Abstração de localStorage
└── constants/    # Rotas, storage keys, navegação
```

## Regras obrigatórias

1. Sem `any`.
2. Sem regra de negócio em páginas.
3. Sem chamada de API em componentes — sempre via `@/services` (fachada sobre `core/`).
4. Lógica reutilizável de UI em Hooks.
5. Componentes pequenos e tipados.
6. Features novas vivem em `features/<nome>`.
7. Infraestrutura transversal vive em `core/`.
8. Barrels públicos: `@/components/ui`, `@/components/layout`, `@/hooks`, `@/services`.

## Fluxo de dados

```
Page → Hook → Context / core (auth, api) → API
```

## Autenticação e RBAC

- `core/auth` + `AuthContext`: sessão e tokens.
- `core/permissions` + `RbacContext`: papéis e permissões.
- `ProtectedRoute` / `PublicOnlyRoute`: guarda de rotas.

Auth mock está ativa em `authService` (`USE_MOCK_AUTH`) até o backend existir.

## Tema e tokens

- Fonte tipada: `styles/tokens/` (`colors`, `spacing`, `radius`, `borders`, `shadow`, `typography`, `animations`).
- `applyThemeCssVariables` injeta CSS vars no `documentElement`.
- `ThemeContext` + `themeBootstrap` aplicam classe `.dark` e tokens.
- Fallbacks light em `globals.css` evitam FOUC antes do JS.

## Design System

- Documentação completa: `src/docs/DESIGN_SYSTEM.md`.
- Componentes em `components/ui` — presentacionais, tipados, acessíveis, dark-mode ready.
- Barrel: `import { Button, DataTable, KpiCard } from '@/components/ui'`.
- Toast global via `ToastProvider` (AppProviders) + `useToast`.

## Feature: Colaboradores

- Local: `features/employees/`.
- Service mock: `employees.service.ts` (ponto de troca para API).
- Regra de e-mail isolada: `utils/employeeEmail.ts`.
- Rota: `/colaboradores` · permissões `employees:view` / `employees:manage`.

## Feature: Ingredientes

- Local: `features/ingredients/`.
- Repository pattern: `IngredientRepository` → `MockIngredientRepository` (API stub pronto).
- Código interno: `ING-000001` via `utils/ingredientCode.ts`.
- Status derivado: `utils/resolveIngredientStatus.ts`.
- Rota: `/ingredientes` · permissões `ingredients:view` / `ingredients:manage`.

## Feature: Produção (módulo operacional principal)

- Local: `features/production/`.
- Absorve o conceito de Checklist: itens diários por colaborador com status (Pendente / Em andamento / Concluído).
- Repository: `ProductionRepository` → `MockProductionRepository` → `ApiProductionRepository`.
- Progresso automático: `utils/computeProductionProgress.ts`.
- Permissões: Chef (`production:manage`) · Colaborador (`production:own` — só a própria produção).
- Rota: `/producao`.

## Feature: Escala

- Local: `features/schedule/`.
- Gestão de turno, folga e férias por colaborador.
- Rota: `/escala` · permissões `schedule:view` / `schedule:manage`.

## Feature: Escala de Limpeza

- Local: `features/cleaning-schedule/`.
- Módulo separado, editável pelo Chef por dia da semana e turno.
- Rota: `/escala-limpeza`.

## Feature: Receitas

- Local: `features/recipes/`.
- CRUD completo com arquivamento. Código `REC-000001`.
- Rota: `/receitas` · permissões `recipes:view` / `recipes:manage`.

## Feature: POP

- Local: `features/pop/`.
- Somente leitura para colaboradores.
- Rota: `/pop`.

## Dashboard

- `features/dashboard/` — roteamento por papel via `isChefUser()`.
- Chef: produção do dia, progresso, comentários, escala, limpeza, receitas.
- Colaborador: própria produção, escala, POP, receitas (consulta).

## Módulos futuros (stubs)

- `core/modules/future/` — Estoque, Compras, Etiquetas, Custos, Auditoria, IA (apenas contratos).

## Auth ↔ Colaborador

- `User.employeeId` vincula sessão ao colaborador operacional.
- Mock: Chef = David Oliveira · Staff = Hosana da Conceição.

## Como adicionar uma feature

1. Criar `features/<feature>/`.
2. Separar `pages/`, `hooks/`, `components/` e, se necessário, services da feature.
3. Registrar rota em `app/router/AppRouter.tsx`.
4. Adicionar item em `core/constants/navigation.ts` com permissão.
5. Estender `Permission` em `types/rbac.types.ts` e o mapa em `core/permissions`.
