# AssignmentService — Atribuição de responsáveis

Serviço reutilizável para selecionar responsáveis de contagens com base nas escalas.

## Objetivo

Padronizar a escolha de colaboradores **presentes** para abertura/fechamento de processos operacionais (inicialmente Controle de Desperdício).

## Fontes de presença

| Fonte | Módulo | Uso |
|-------|--------|-----|
| Escala Mensal | `/escala` (mês) | Status do dia: `work`, `off`, `vacation`, `leave`, `other` |
| Escala Diária | `/escala` (status da equipe) | `Ativo`, `Folga`, `Férias`, `Afastado` + notas |

Regras:

- Somente `present` (Presente) é selecionável
- Folga, férias, licença/afastamento, ausente e intervalo **não** podem ser escolhidos
- Conflitos de ausência vencem (mensal ou diária)

## Status e cores

| Status | Cor |
|--------|-----|
| Presente | 🟢 |
| Intervalo | 🟡 |
| Ausente | 🔴 |
| Folga | ⚪ |
| Férias | 🔵 |
| Afastamento | ⚫ |

Intervalo é detectado quando a nota da escala diária contém “intervalo”.

## Setores / contextos

`confeitaria` · `padaria` · `cafe` · `cha` · `jantar`

No desperdício, o setor operacional (`confeitaria`/`padaria`) é o contexto de atribuição.

## API do serviço (frontend)

```ts
import { AssignmentService, useAssignableEmployees } from '@/features/assignment'

AssignmentService.listCandidates(input)
AssignmentService.listSelectable(input)
AssignmentService.assertSelectable(candidates, employeeId)
```

Hook:

```ts
const { candidates, selectable, isLoading, refetch } = useAssignableEmployees(date, sector)
```

O hook escuta Escala Mensal + Escala Diária + catálogo de colaboradores e atualiza com React Query (invalidação via realtime de `monthly-schedule` e lista local de schedule).

## Integração no Controle de Desperdício

### Abertura
1. Usuário abre/registra um buffet
2. Painel pede responsável (modal com foto, nome, cargo, turno, status)
3. `PATCH /api/waste-control/days/:date/responsible?buffet=`

### Fechamento
1. Botão **Finalizar e enviar**
2. Exige responsável
3. `PUT` com `finalize: true` → grava fechamento + status `aguardando_conferencia`

### Conferência (liderança)
- Status: `aguardando_conferencia` | `conferido` | `necessita_revisao`
- `PATCH /api/waste-control/days/:date/conference?buffet=`
- Registra quem conferiu, data/hora e observações

## Arquivos

```
src/features/assignment/
  services/AssignmentService.ts
  hooks/useAssignableEmployees.ts
  components/ResponsiblePickerDialog.tsx
  components/AssignableEmployeeCard.tsx
  components/PresenceStatusBadge.tsx
  types/ constants/ utils/

src/features/waste-control/
  components/WasteAssignmentPanel.tsx
  (page/hooks/service/types estendidos)

server/src/wasteControl.service.ts
server/src/routes/wasteControl.routes.ts
server/src/types.ts
```

## Compatibilidade

Campos `assignment`, `closing` e `conference` são **opcionais**. Contagens antigas e o fluxo de unidades/kg continuam funcionando sem alteração obrigatória.
