---
name: niimbot-integration
description: Integração NIIMBOT B1/B1 Pro no NANNAI — Web Bluetooth, registry multi-impressora, teste de impressão, etiquetas na Produção e histórico. Use ao trabalhar com niimbot, impressoras, Bluetooth, /niimbot, labels ou impressão ao concluir produção.
paths:
  - "src/services/niimbot/**"
  - "src/services/NiimbotService.ts"
  - "src/components/niimbot/**"
  - "src/features/niimbot/**"
  - "src/features/labels/printer/**"
  - "src/features/labels/services/printProductionLabel.ts"
  - "src/features/production/pages/ProductionPage.tsx"
  - "docs/blueprints/niimbot/**"
  - "docs/niimbot/**"
---

# Skill — NIIMBOT integration

## Fonte canônica (Blueprints)

Leia sempre os blueprints antes de alterar a integração:

1. `docs/blueprints/niimbot/README.md` — índice
2. `docs/blueprints/niimbot/INTEGRATION.md` — arquitetura e fluxos
3. `docs/blueprints/niimbot/REVIEW.md` — riscos e melhorias
4. `docs/blueprints/niimbot/CHECKLIST.md` — validação

## Regras ao implementar

- Manter **uma sessão BLE ativa** (driver singleton). O registry salva várias impressoras, mas só uma imprime por vez.
- Não reabrir GATT paralelo fora do driver — usar `withPermittedBluetoothDevice` / `NiimbotService.reconnect`.
- Produção: ao concluir item, prompt **Deseja imprimir etiqueta?** SIM/NÃO; se SIM, gerar campos + print + histórico.
- Não acoplar impressão NIIMBOT diretamente em repositórios de Produção — usar `printProductionItemLabel` / adapter.
- Mensagens de erro amigáveis via `src/services/niimbot/errors.ts`.
- Atualizar o blueprint em `docs/blueprints/niimbot/` quando mudar arquitetura ou fluxos.

## Rotas

- `/niimbot/configuracoes`
- `/niimbot/teste`
- `/producao` (prompt pós-conclusão)
- `/etiquetas` (histórico / reimpressão)
