# NANNAI Confeitaria e Padaria

Sistema de gestão da confeitaria e padaria NANNAI.

## Stack

- React 19 + Vite + TypeScript (strict)
- Tailwind CSS v4
- React Router
- TanStack Query
- React Hook Form + Zod
- Axios
- Framer Motion
- Lucide React

## Blueprints

Documentação canônica de módulos e integrações:

- Índice: [`docs/blueprints/README.md`](docs/blueprints/README.md)
- NIIMBOT + Etiquetas: [`docs/blueprints/niimbot/README.md`](docs/blueprints/niimbot/README.md)

## Fundação

Este repositório contém a **base arquitetural** e módulos de operação:

- Layout responsivo (Sidebar, Header, Container)
- Rotas (`/login`, `/`, `404`)
- Tema light/dark
- Loading global
- Camada `core/` (api, auth, permissions, errors, logger, storage, constants)
- Estrutura de autenticação e RBAC
- Componentes UI reutilizáveis

Features de negócio (Receitas, Estoque, Compras, etc.) **não** estão incluídas nesta etapa.

## Setup

```bash
npm install
cp .env.example .env.development
npm run dev
```

Arquivos de ambiente:

| Arquivo | Uso |
|---------|-----|
| `.env.example` | Template versionado |
| `.env.development` | `npm run dev` |
| `.env.production` | `npm run build` |

Overrides locais (não versionados): `.env.local`, `.env.*.local`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (frontend) |
| `npm run dev:server` | API backend (porta 3333) |
| `npm run dev:all` | Frontend + API juntos |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Lint (oxlint) |

## Instalar como app (tipo Suflex)

Depois de publicar o site na internet, a equipe instala no celular **sem App Store**:

### Android (Chrome)
1. Abra o link do NANNAI no Chrome
2. Toque em **Instalar app** (botão na tela de login ou no topo)
3. Ou: menu ⋮ → **Instalar aplicativo** / **Adicionar à tela inicial**

### iPhone (Safari)
1. Abra o link no **Safari** (não funciona bem no Chrome do iOS)
2. Toque em **Instalar app** e siga o passo a passo
3. Ou: **Compartilhar** → **Adicionar à Tela de Início**

O ícone NANNAI aparece na tela inicial como um app normal.

## Publicar na nuvem (sem deixar seu PC ligado)

Use [Render.com](https://render.com) (plano gratuito):

1. Envie o projeto para o **GitHub**
2. No Render: **New → Blueprint** e selecione o repositório (usa o `render.yaml`)
3. Após o deploy, copie a URL (ex: `https://nannai-app.onrender.com`)
4. Em **Environment**, defina `CORS_ORIGIN` com essa URL
5. Compartilhe o link com a equipe — todos instalam o PWA por esse endereço

**Importante:** no plano gratuito o servidor “dorme” após ~15 min sem uso; a primeira abertura pode demorar ~30 segundos.

## Login

### Modo servidor (recomendado — equipe sincronizada)

1. Inicie API + frontend:
   ```bash
   npm run dev:all
   ```
2. Acesse `http://localhost:5173`
3. Entre com **e-mail corporativo** e senha padrão inicial: `Nannai@2026`
   - Admin: `admin@nannai.com`
   - Chef: `David.oliveira@nannai.com.br`
   - Colaboradores: e-mail `@nannai.net.br` cadastrado na equipe

Altere `VITE_USE_MOCK=true` em `.env.development` para voltar ao modo offline (sem servidor).

### Modo mock (offline)

Qualquer senha funciona com e-mail corporativo — dados ficam só no navegador.

## Arquitetura

Veja `src/docs/ARCHITECTURE.md`.
