# Central do Desenvolvedor

Painel exclusivo do **Administrador Master** (`role: admin`) para monitoramento operacional do sistema NANNAI.

## Acesso

| Camada | Regra |
|--------|--------|
| Rota | `/central-desenvolvedor` |
| Permissão | `dev-central:view` |
| API | `GET /api/dev-central` |
| Menu | Visível apenas para admin |

## Métricas exibidas

| Métrica | Fonte |
|---------|--------|
| Usuários online | Sessões SSE ativas (`/api/events/stream`) |
| Tempo médio da API | Média das últimas requisições HTTP |
| Tempo de resposta | Última requisição registrada |
| Última sincronização | Último evento realtime ou requisição |
| Consumo do banco | Tamanho do JSON + contagem por tabela |
| Logs | Buffer em memória do módulo |
| Erros | HTTP 4xx/5xx e exceções do servidor |
| Atualizações | Últimos registros de auditoria |
| Versão atual | `package.json` raiz |
| Último deploy | `DEPLOYED_AT` ou horário de boot do servidor |

## Gráficos (Recharts)

- Tempo de resposta (linha)
- Requisições por minuto (barras)
- Erros por minuto (barras)
- Consumo do banco por tabela (barras horizontais)

## Atualização automática

O frontend usa TanStack Query com `refetchInterval: 10_000` (10 segundos).

## Arquitetura

```
server/src/dev-central/
  access.ts
  types.ts
  presence.ts           # Usuários online via SSE
  metricsCollector.ts   # Amostras de latência, logs e erros
  metricsMiddleware.ts  # Middleware Express (não altera respostas)
  devCentral.service.ts # Agrega dashboard

server/src/routes/devCentral.routes.ts

src/features/dev-central/
  pages/DevCentralPage.tsx
  hooks/useDevCentral.ts
  components/...
```

## Integração não-invasiva

- Middleware de métricas apenas **observa** requisições
- SSE registra presença sem mudar o protocolo existente
- Módulos de negócio permanecem inalterados

## Variáveis de ambiente opcionais

| Variável | Descrição |
|----------|-----------|
| `DEPLOYED_AT` | ISO datetime do último deploy |
| `APP_VERSION` | Fallback de versão se package.json indisponível |
