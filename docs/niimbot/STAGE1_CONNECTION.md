# NIIMBOT B1 — Conexão, teste e integração com Produção

Integração com Web Bluetooth: parear, persistir, testar impressão e **imprimir etiquetas ao concluir itens de Produção**.

## Arquitetura

```
Produção (item → Concluído)
  → ConfirmDialog “Deseja imprimir etiqueta?” SIM / NÃO
      → printProductionItemLabel()
           ├── createLabelFromProduction / reprintLabel  (histórico API)
           └── niimbotBluetoothAdapter
                 → NiimbotService.printWithRenderer()
                      → renderNiimbotLabel + printImage

/niimbot/configuracoes  → conexão / persistência
/niimbot/teste          → etiqueta de teste
/etiquetas              → histórico + reimpressão
```

## Fluxo na Produção

1. Item marcado como **Concluído**
2. Pergunta: **Deseja imprimir etiqueta?** → **SIM** / **NÃO**
3. Se SIM:
   - Gera automaticamente: Produto, Responsável, Validade, Lote, Peso, Categoria, QR Code
   - Envia para a NIIMBOT
   - Salva no histórico de Etiquetas
4. Botão **Imprimir etiqueta** no item concluído: reimprime a última (ou cria se ainda não houver)
5. Em **Etiquetas**, histórico completo com **Reimprimir**

## Persistência da impressora

`localStorage` (`nannai.niimbot.printer`): nome, modelo, ID, última conexão, `bluetoothDeviceId`.

Logs locais de impressão: `nannai.niimbot.printLogs`.

## Telas NIIMBOT

| Rota | Função |
|------|--------|
| `/niimbot/configuracoes` | Conectar, reconectar, trocar, desconectar |
| `/niimbot/teste` | Impressão de teste |
| `/niimbot` | Redireciona para configurações |

## Arquivos principais

| Arquivo | Papel |
|---------|-------|
| `src/services/NiimbotService.ts` | Conexão + `printWithRenderer` / `printTestLabel` |
| `src/features/labels/printer/niimbotAdapter.ts` | Adaptador Bluetooth das etiquetas |
| `src/features/labels/printer/renderNiimbotLabel.ts` | Canvas da etiqueta de produção |
| `src/features/labels/services/printProductionLabel.ts` | Create/reprint + print |
| `src/features/production/pages/ProductionPage.tsx` | Prompt SIM/NÃO + impressão |
