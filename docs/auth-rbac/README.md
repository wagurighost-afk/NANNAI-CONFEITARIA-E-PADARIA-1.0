# RBAC — Cargo, Papel e Permissões

Documentação da arquitetura de controle de acesso do sistema NANNAI.

## Princípio fundamental

O sistema separa **três camadas independentes**:

| Camada | Campo | Exemplo | Influencia acesso? |
|--------|-------|---------|-------------------|
| **Cargo** | `Employee.position` | Auxiliar de Confeitaria | **Não** |
| **Papel** | `User.role` | `founder`, `admin`, `staff` | **Sim** |
| **Permissões** | RBAC (`Permission`) | `production:manage` | **Sim** (via papel) |

> **Regra:** o cargo operacional do hotel **nunca** define permissões de sistema.

## Papéis (`UserRole`)

| Papel | Label | Descrição |
|-------|-------|-----------|
| `founder` | Administrador Master (Fundador) | Fundadores do sistema. Selo exclusivo. Acesso master completo. |
| `admin` | Administrador Master | Administradores master (não fundadores). Acesso master completo. |
| `manager` | Gerente | Gestão operacional limitada. |
| `staff` | Colaborador | Acesso ao dia a dia (produção própria, escalas, etc.). |
| `viewer` | Visualizador | Somente leitura. |

### Administradores Master

Papéis com acesso master: `founder` e `admin` (constante `MASTER_ADMIN_ROLES`).

Inclui:
- Central do Desenvolvedor
- Laboratório NANNAI
- Gestão de status na Central de Bugs
- Gestão de senhas
- Acesso total operacional

## Selos do sistema (`SystemBadge`)

| Selo | Quem recebe | Label |
|------|-------------|-------|
| `founder` | `role === 'founder'` | 👑 Fundador do Sistema |

Selos são derivados do papel — não dependem do cargo.

## Fundadores iniciais

| Nome | Cargo (operacional) | Papel | Login |
|------|---------------------|-------|-------|
| Mauro José | Auxiliar de Confeitaria | `founder` | `Mauro.Jose@nannai.net.br` |
| Devid Oliveira | Chef de Confeitaria | `founder` | `Devid.Oliveira@nannai.com.br` |

> Mauro tem cargo de auxiliar mas papel de fundador — isso demonstra a separação cargo/papel.

### Chef de Confeitaria

- Conta operacional: `usr-emp-david` / `Devid.Oliveira@nannai.com.br`
- Cargo `Chef de Confeitaria` libera Painel Executivo, Dashboard Chef, Inteligência e gestão de produções via `isLeadershipUser`
- Papel `founder` mantém acesso master completo
- Conta técnica `admin@nannai.com` é separada e **não** deve herdar nome/e-mail do Chef

## Arquivos principais

### Servidor
- `server/src/auth/roles.ts` — papéis, labels, `isMasterAdmin()`, `isFounder()`
- `server/src/data/employees.ts` — seed com cargo + papel por colaborador
- `server/src/auth/passwordAccess.ts` — permissões por papel
- `server/src/productionAccess.ts` — produção por papel (sem cargo)

### Frontend
- `src/core/auth/roles.ts` — espelho do módulo de papéis
- `src/core/auth/authRoleRegistry.ts` — mapa employeeId → papel (perfil)
- `src/core/permissions/rolePermissions.ts` — papel → permissões
- `src/components/auth/SystemBadges.tsx` — selo Fundador
- `src/components/auth/UserRoleBadge.tsx` — badge de papel

## Fluxo RBAC

```
Login → User.role → ROLE_PERMISSIONS[role] → Permission[]
                  → RbacContext.hasPermission()
                  → PermissionRoute / navegação / UI
```

Permissões extras (bread-control, intelligence, etc.) são injetadas em `RbacContext` apenas quando o **papel** satisfaz as regras do módulo.

## Onde o selo aparece

1. **Header** — papel + selo do usuário logado
2. **Perfil do colaborador** — campo "Papel" separado de "Cargo" + selo
3. **Central do Desenvolvedor** — usuários online com papel e selo; fundador vê selo no cabeçalho

## Adicionar novos Administradores Master

1. Atribuir `role: 'admin'` ao usuário no banco/seed
2. Não é necessário alterar cargo operacional
3. O usuário recebe todas as permissões master via `ROLE_PERMISSIONS.admin`

## Adicionar novos Fundadores

1. Atribuir `role: 'founder'` ao usuário
2. O selo `founder` é aplicado automaticamente
3. Atualizar `AUTH_ROLE_BY_EMPLOYEE_ID` no frontend (perfil) se necessário

## Migração de bancos existentes

O seed sincroniza nome, e-mail e **papel** dos colaboradores em `syncSeedEmployeeIdentities()` via `updateUserRole()`, e restaura a identidade canônica do admin (`admin@nannai.com`) caso tenha sido sobrescrita.

## Versão

Introduzido na **v1.6.3**.
