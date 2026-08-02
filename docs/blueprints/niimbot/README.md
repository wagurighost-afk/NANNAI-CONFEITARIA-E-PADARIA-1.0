# Blueprint — NIIMBOT + Etiquetas Inteligentes

Integração Web Bluetooth da impressora **NIIMBOT B1 / B1 Pro** no NANNAI, ligada ao módulo de Produção e ao histórico de Etiquetas.

## Documentos deste blueprint

| Arquivo | Conteúdo |
|---------|----------|
| [INTEGRATION.md](./INTEGRATION.md) | Arquitetura, fluxos, registry, API do serviço, segurança |
| [REVIEW.md](./REVIEW.md) | Revisão técnica completa + melhorias futuras |
| [CHECKLIST.md](./CHECKLIST.md) | Validação manual e critérios de aceite |

## Rotas

| Rota | Função |
|------|--------|
| `/niimbot/configuracoes` | Conectar, reconectar, registry, trocar/esquecer |
| `/niimbot/teste` | Etiqueta de teste + logs |
| `/niimbot` | Redirect → configurações |
| `/producao` | Prompt SIM/NÃO ao concluir item |
| `/etiquetas` | Histórico e reimpressão |

## Resumo do fluxo Produção

```
Item → Concluído
  → “Deseja imprimir etiqueta?” SIM / NÃO
      → SIM: gera Produto, Responsável, Validade, Lote, Peso, Categoria, QR
      → envia NIIMBOT
      → salva histórico (reimpressão em Etiquetas / botão do item)
```

## Stack da integração

- Driver: `niimbot-web-bluetooth`
- Serviço: `src/services/NiimbotService.ts`
- Registry: `localStorage` → `nannai.niimbot.printers`
- Adaptador: `src/features/labels/printer/niimbotAdapter.ts`

## Status

- Conexão + auto-reconnect: pronto
- Teste de impressão: pronto
- Produção → NIIMBOT: pronto
- Registry multi-impressora (1 sessão BLE ativa): base pronta
- Fila offline / multi-GATT paralelo: fora de escopo
