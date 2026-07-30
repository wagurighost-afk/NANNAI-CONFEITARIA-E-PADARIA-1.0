# Design System — NANNAI

## Objetivo

Biblioteca de componentes presentacionais (Atomic Design — átomos/moléculas) em `src/components/ui`, alimentada por design tokens tipados. Sem regra de negócio.

## Tokens

Fonte da verdade: `src/styles/tokens/`

| Token | Arquivo | Uso |
|-------|---------|-----|
| Cores (light/dark) | `colors.ts` | Superfícies, texto, estado |
| Espaçamento | `spacing.ts` | Gaps, paddings |
| Raio | `radius.ts` | Cantos |
| Bordas | `borders.ts` | Largura/estilo |
| Sombras | `shadow.ts` | Elevação |
| Tipografia | `typography.ts` | Fontes e escalas |
| Animações | `animations.ts` | Duração, easing, Motion |

Aplicação em runtime: `applyThemeCssVariables` + classe `.dark`.

Componentes consomem tokens via classes semânticas Tailwind (`bg-primary`, `border-border`, `rounded-lg`, `shadow-sm`, etc.).

## Componentes UI

Import público:

```ts
import { Button, DataTable, KpiCard, useToast } from '@/components/ui'
// useToast: import { useToast } from '@/hooks'
```

### Base (já existentes)

Button, Card, Input, Modal, Badge, Spinner

### Design System v1

| Componente | Função |
|------------|--------|
| SearchInput | Busca com ícone e clear |
| Select | Select nativo acessível |
| TextArea | Área de texto |
| Checkbox | Checkbox com label |
| Switch | Toggle `role="switch"` |
| Tabs | Abas compostas |
| Pagination | Navegação de páginas |
| ConfirmDialog | Confirmação (compõe Modal) |
| Drawer | Painel lateral |
| Toast | Notificações + ToastProvider |
| Avatar | Imagem + fallback |
| Dropdown | Menu de ações |
| Skeleton | Placeholder de loading |
| DataTable | Tabela genérica tipada |
| KpiCard | Indicador (valor + trend slot) |
| ChartCard | Container de gráfico (children) |

## Regras

1. Sem `any`, sem domínio de negócio.
2. Props controladas via callbacks (`onChange`, `onPageChange`, `onSort`).
3. ARIA em overlays, tabs, switch, menus e tabelas.
4. Dark mode automático via tokens.
5. Novos componentes: pasta própria + `index.ts` + export no barrel `components/ui/index.ts`.

## Composição

```
Feature Page
  └─ Hook (dados/regra)
       └─ UI atoms (DataTable, KpiCard, Toast…)
            └─ Tokens / Theme
```

ChartCard e KpiCard recebem `children` / `trend` / `icon` — a feature injeta conteúdo; o DS só estrutura o visual.
