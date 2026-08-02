# Revisão da Central de Inteligência — NANNAI

Revisão técnica completa (arquitetura, performance, segurança, duplicação, boas práticas, responsividade e acessibilidade).

**Versão analisada:** 1.3.7  
**Data:** julho/2026

---

## 1. Arquitetura

### Backend — camadas bem definidas

```
Rotas (intelligence.routes.ts)
    ↓
Orquestrador (intelligence.service.ts)
    ↓
Serviços de snapshot (kpis, smartInsights, smartRecommendations, smartAlerts, trends)
    ↓
Motores puros (operational.kpis.ts, analyzers)
    ↓
Repositório + cache (intelligence.repository, snapshotCache, resourceCache)
    ↓
DB (intelligence_snapshots + tabelas operacionais)
```

**Pontos fortes**
- Separação clara entre leitura (snapshots), computação (KPIs/analyzers) e persistência.
- Contexto operacional compartilhado (`operationalContext.service.ts`) evita recalcular KPIs do mês anterior para insights, recomendações e alertas.
- Dashboard agregado (`GET /dashboard`) reduz round-trips no frontend.

**Pontos de atenção**
- Snapshots em DB **não expiram automaticamente** — dados ficam obsoletos até `POST /refresh` ou invalidação manual.
- Estoque de ingredientes para alertas usa **seed estático** (`ingredientInventory.ts`), não o módulo real de ingredientes (ainda mock no frontend).
- Colaboradores e catálogo de pães vêm de **seeds** (`SEED_EMPLOYEES`, `BREAD_PRODUCTS`), não do banco de colaboradores.

### Frontend — foco no Dashboard Executivo

- `IntelligencePage` → `ExecutiveDashboard` (6 KPIs + painel de alertas).
- Payload do dashboard inclui insights, recomendações e tendências, mas **apenas resumos** de insights/alertas são exibidos na barra de status — não é bug, é escopo atual da UI.

---

## 2. Performance

### O que já funciona bem

| Mecanismo | TTL / comportamento |
|-----------|---------------------|
| `snapshotCache` | 60s em memória |
| `resourceCache` (receitas) | 120s + dedup inflight |
| `operationalContext` | dedup inflight por período |
| `findAllSnapshotsForPeriod` | pré-carrega cache no dashboard |
| Frontend `useExecutiveDashboard` | 1 request, `placeholderData`, `memo` nos cartões |

### Correções aplicadas nesta revisão

1. **Bug de cache em tendências** — snapshot armazenava só uma métrica; filtro por `waste_cost` retornava vazio após cache de `waste_kg`. Agora `computeAllTrends()` persiste **todas** as métricas disponíveis.
2. **Race no refresh** — KPIs são recalculados **antes** dos motores smart (sequencial → paralelo), evitando competição por `computeOperationalKpis`.
3. **Inflight em KPIs** — `kpis.service.ts` deduplica computações concorrentes do mesmo período.

### Melhorias recomendadas (não implementadas — dependem de produto/infra)

| Item | Impacto | Esforço |
|------|---------|---------|
| Invalidar snapshots quando produção/pães/desperdício mudam (via SSE ou hook nos serviços) | Alto | Médio |
| Rate limit em `POST /refresh` | Médio | Baixo |
| Reduzir polling (30s) quando SSE está ativo | Baixo | Baixo |
| Consolidar hooks duplicados no frontend (`useIntelligenceDashboard` vs `useExecutiveDashboard`) | Baixo | Baixo |
| Extrair regras duplicadas dos 3 analyzers para módulo compartilhado | Médio | Alto |

---

## 3. Segurança

### Controles existentes

- `requireAuth` em todas as rotas.
- `canAccessIntelligence` → admin + cargos de liderança (mesma regra de senhas).
- `limit` normalizado (1–50).
- `year`/`month` validados via `normalizePeriod`.
- Auditoria em `POST /refresh`.

### Correções aplicadas

- **`respondIntelligenceError`** — em produção, erros 500 não expõem `error.message` interno (dashboard e refresh).

### Melhorias recomendadas

| Item | Prioridade |
|------|------------|
| Aplicar `respondIntelligenceError` em **todas** as rotas `/intelligence/*` | Média |
| Whitelist explícita para `metricKey` nas tendências | Baixa |
| Rate limiting no refresh | Média |

---

## 4. Código duplicado

### Duplicação identificada

| Área | Ocorrências |
|------|-------------|
| `hasOperationalData` + `previousPeriod` | 4 analyzers + context → **extraído para `utils/operationalData.ts`** |
| Regras de negócio (desperdício, atraso, sobrecarga) | insights, recommendations, alerts — **mantido** (motores independentes por design) |
| `PRIORITY_WEIGHT` + sort | 3 arquivos `priority.ts` — estrutura similar, tipos diferentes |
| Labels de prioridade | frontend: `priority.constants`, `alert.constants`, types |
| Padrão `loadOrCompute` + snapshot | 4 smart services + kpis |
| Hooks React Query | 17 hooks, UI usa 2 |

### Correção aplicada

- `server/src/intelligence/utils/operationalData.ts` — fonte única para `previousPeriod` e `hasOperationalData`.

---

## 5. Boas práticas

### Backend

| Status | Item |
|--------|------|
| ✅ | Tipos TypeScript em camadas separadas |
| ✅ | Analyzers puros (sem I/O) |
| ✅ | Sanitização de senhas na auditoria |
| ⚠️ | Tipos legados em `types.ts` (`IntelligenceInsight`, etc.) — candidatos a remoção futura |
| ⚠️ | `monthRange.ts`, `findSnapshotsByPeriod` — código morto |
| ⚠️ | `refreshIntelligenceData(period, limit?)` — parâmetro `limit` ignorado |

### Frontend

| Status | Item |
|--------|------|
| ✅ | Query keys centralizadas |
| ✅ | Serviço HTTP tipado |
| ✅ | README atualizado |
| ⚠️ | Prioridades visuais dos KPIs calculadas no cliente (`executiveKpiStatus.ts`) — podem divergir do backend |
| ⚠️ | Sem testes automatizados no módulo |

### Correções aplicadas no frontend

- Tratamento de erro com `role="alert"` e botão **Tentar novamente**.
- Feedback toast em sucesso/falha do refresh.
- Gate de refresh com `canRefreshIntelligence`.
- `EmptyState` no lugar de `<p>` solto.

---

## 6. Responsividade

### Layout atual

| Breakpoint | Comportamento |
|------------|---------------|
| `< sm` | 1 coluna KPIs, header empilhado, status bar empilhada |
| `sm–xl` | 2 colunas KPIs |
| `≥ xl` | 3 colunas KPIs |
| Alertas | 1 col → 2 col em `lg` |

### Pontos de atenção

- Valores monetários longos em `text-3xl` podem truncar em telas estreitas — considerar `text-2xl sm:text-3xl` se necessário.
- Cabeçalhos de alerta (`flex-row`) podem apertar em mobile — aceitável com `flex-wrap` nos badges.

**Avaliação:** adequado para produção em mobile/tablet/desktop.

---

## 7. Acessibilidade

### Implementado

| Recurso | Onde |
|---------|------|
| `aria-live="polite"` | Barra de status |
| `aria-busy` | Botão atualizar |
| Labels `sr-only` | Period picker |
| `focus-visible` rings | Selects |
| `aria-hidden` em ícones decorativos | Dashboard, cartões |

### Correções aplicadas

- `aria-label` completo nos cartões KPI (label + valor + prioridade + descrição).
- `prefers-reduced-motion` via `useReducedMotion` (Framer Motion).
- Alertas: `section` + `aria-labelledby`, lista semântica `ul/li`.
- Erro: `role="alert"` + `aria-live="assertive"`.

### Melhorias futuras

- Testes com leitor de tela (NVDA/VoiceOver) no fluxo completo.
- Verificar contraste WCAG dos fundos com opacidade (`bg-danger/[0.04]`).

---

## 8. Bugs conhecidos restantes

| Bug | Severidade | Notas |
|-----|------------|-------|
| Tendências só implementam `waste_kg` e `waste_cost` | Média | Outras chaves em `IntelligenceMetricKey` retornam `[]` — documentar ou implementar quando houver dados |
| Snapshots obsoletos sem auto-refresh | Alta | Requer invalidação ao salvar produção/pães/desperdício |
| Alertas de estoque baseados em seed | Média | Resolver quando API de ingredientes estiver integrada |
| Polling + SSE redundantes | Baixa | Aceitável; otimizar depois |

---

## 9. Resumo executivo

| Dimensão | Nota | Comentário |
|----------|------|------------|
| Arquitetura | ★★★★☆ | Bem modular; dependência de seeds é limitação conhecida |
| Performance | ★★★★☆ | Cache e dashboard unificado; staleness é o maior gap |
| Segurança | ★★★★☆ | RBAC sólido; erros sanitizados nos endpoints principais |
| Duplicação | ★★★☆☆ | Analyzers têm regras paralelas; utils compartilhados ajudam |
| Boas práticas | ★★★★☆ | Tipagem forte; falta testes e limpeza de código morto |
| Responsividade | ★★★★☆ | Grid Tailwind adequado |
| Acessibilidade | ★★★★☆ | Base sólida após correções desta revisão |

---

## 10. Arquivos alterados nesta revisão

| Arquivo | Mudança |
|---------|---------|
| `server/src/intelligence/utils/operationalData.ts` | Novo — utils compartilhados |
| `server/src/intelligence/utils/httpErrors.ts` | Novo — erros seguros em produção |
| `server/src/intelligence/services/trends.service.ts` | Fix cache multi-métrica |
| `server/src/intelligence/services/kpis.service.ts` | Inflight dedup |
| `server/src/intelligence/services/intelligence.service.ts` | Refresh sequencial KPI → smart |
| `server/src/intelligence/services/operationalContext.service.ts` | Import utils compartilhados |
| `server/src/intelligence/services/smart*/analyzer.ts` | Remoção de duplicatas |
| `server/src/routes/intelligence.routes.ts` | Erros sanitizados (dashboard/refresh) |
| `src/features/intelligence/components/ExecutiveDashboard.tsx` | Erro, toast, a11y, refresh gate |
| `src/features/intelligence/components/ExecutiveKpiCard.tsx` | aria-label, reduced motion |
| `src/features/intelligence/components/AlertsPanel.tsx` | Semântica de lista |
| `src/features/intelligence/README.md` | Documentação atualizada |
