# AGENTS.md — NANNAI

Instruções para agentes (Cursor Cloud / locais) que trabalham neste repositório.

## Blueprints (fonte canônica)

Documentação de módulos e integrações vive em:

```
docs/blueprints/
```

Índice: [`docs/blueprints/README.md`](docs/blueprints/README.md)

### NIIMBOT / Etiquetas

Antes de alterar conexão Bluetooth, impressão ou o fluxo Produção → etiqueta, leia:

- [`docs/blueprints/niimbot/README.md`](docs/blueprints/niimbot/README.md)
- Skill: `.cursor/skills/niimbot-integration/SKILL.md`

## Convenções rápidas

- Preferir mudanças aditivas em módulos de negócio existentes
- Manter TypeScript strict; rodar `npm run build` após mudanças relevantes
- PRs/feature branches usam prefixo `cursor/` com sufixo do run quando aplicável
