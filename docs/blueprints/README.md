# Blueprints — NANNAI

Blueprints são a documentação canônica de módulos e integrações do sistema.  
Use estes arquivos como fonte de verdade para implementação, revisão e onboarding de agentes.

| Blueprint | Descrição |
|-----------|-----------|
| [NIIMBOT / Etiquetas](./niimbot/README.md) | Conexão Bluetooth, registry multi-impressora, teste, impressão na Produção e histórico |
| [Production Day](./production-day/README.md) | Template vs ProductionDay, materialização diária, unicidade e migração de histórico |

## Como usar

1. Leia o `README.md` do blueprint do módulo
2. Siga `INTEGRATION.md` para arquitetura e fluxos
3. Consulte `REVIEW.md` para riscos, correções e backlog técnico
4. Em trabalho com agentes Cursor, a skill `.cursor/skills/niimbot-integration` aponta para estes docs
