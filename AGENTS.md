# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single product, **NANNAI Confeitaria e Padaria** (a Portuguese-language PWA for bakery/confectionery management), split into two npm packages:

- **Frontend** (repo root): React 19 + Vite + TypeScript. Dev server on port **5173**.
- **Backend API** (`server/`): Express + TypeScript (`tsx watch`). Runs on port **3333**.

Standard scripts are documented in `README.md` and `package.json`. Key commands: `npm run dev:all` (runs frontend + backend together), `npm run lint` (oxlint), `npm run build` (`tsc -b && vite build`, also serves as the typecheck). The backend dev command is `npm run dev --prefix server`.

Non-obvious notes for running/developing:

- **Two separate installs**: dependencies live in both the root and `server/`. The update script installs both.
- **Database is zero-config for local dev**: the API auto-uses a local JSON-file store at `server/data/nannai.json` whenever `DATABASE_URL` is unset. No PostgreSQL is required to run end-to-end locally. Set `DATABASE_URL` only if you want to use Postgres (production uses it via `render.yaml`).
- **Vite proxies `/api` → `http://localhost:3333`** (see `vite.config.ts`). `.env.development` therefore sets `VITE_API_BASE_URL=/api`; keep that so the frontend reaches the backend. The backend must be running for server-mode features to work.
- **Seeded logins** (password from `DEFAULT_USER_PASSWORD`, default `Nannai@2026`): admin `admin@nannai.com`, chef `David.oliveira@nannai.com.br`, collaborators via `@nannai.net.br` emails. These are created on API startup.
- **Health check**: `GET /api/health` reports status and which DB mode is active (`json-file` vs Postgres).
- **Mock mode gotcha**: setting `VITE_USE_MOCK=true` runs the frontend offline (browser-only). Note that a few frontend features (`schedule`, `ingredients`, `employees`) are hardcoded to mock data regardless of the flag; `auth`, `recipes`, and `production` use the real backend API.
- The backend server does not need its own `.env` for local dev — `server/src/config.ts` provides working defaults for all values.
