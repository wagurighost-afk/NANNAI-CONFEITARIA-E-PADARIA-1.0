# NIIMBOT B1 — Conexão, persistência e teste de impressão

Integração com Web Bluetooth: parear, **salvar a impressora**, **reconectar automaticamente**, gerenciar em **Configurações** e validar com **Teste da Impressora**.

> Ainda **não** há integração com Produção nem com Etiquetas Inteligentes.

## Arquitetura

```
/niimbot/configuracoes  →  NiimbotSettingsPage
/niimbot/teste          →  NiimbotPrintTestPage
                              └── NiimbotPrintTestPanel
                                    ├── Status 🟢🟡🔴
                                    ├── Imprimir etiqueta de teste
                                    └── Logs de impressão
                                          │
                                          ▼
                                     useNiimbot({ autoReconnect: true })
                                          │
                                          ▼
                                     NiimbotService
                                       ├── connect() / reconnect() / disconnect()
                                       ├── printTestLabel() → render + printImage
                                       ├── persistence.ts → localStorage
                                       └── printLogs.ts → localStorage
```

## Persistência

Após conectar com sucesso, salva em `localStorage` (`nannai.niimbot.printer`):

| Campo | Descrição |
|-------|-----------|
| `name` | Nome BLE |
| `model` | Modelo (ex.: Niimbot B1) |
| `modelId` | ID numérico (ex.: 4096) |
| `lastConnectedAt` | ISO da última conexão |
| `bluetoothDeviceId` | ID do `BluetoothDevice` (para reconexão) |

Logs de impressão ficam em `nannai.niimbot.printLogs` (últimas 50 entradas).

## Reconexão automática

1. Ao abrir as telas NIIMBOT, `useNiimbot` chama `tryAutoReconnect()`
2. O serviço busca dispositivos já autorizados (`navigator.bluetooth.getDevices`)
3. Reabre GATT, identifica e atualiza bateria/firmware quando possível
4. Se falhar → status desconectado + botão **Reconectar**

## Teste da Impressora

Rota: `/niimbot/teste`

Botão: **Imprimir etiqueta de teste**

Conteúdo da etiqueta (50×30 mm):

- NANNAI
- Teste de Impressão
- Data
- Hora
- QR Code (`NANNAI|TESTE|{ISO}`)

Em caso de erro, a UI mostra mensagem amigável (toast + faixa na tela) e registra log.

## Telas

| Rota | Função |
|------|--------|
| `/niimbot/configuracoes` | Status, reconectar, trocar, desconectar |
| `/niimbot/teste` | Impressão de teste + logs |
| `/niimbot` | Redireciona para configurações |

Menu **NIIMBOT** aponta para configurações; de lá há atalho para o teste.

## Arquivos principais

| Arquivo | Papel |
|---------|-------|
| `src/services/NiimbotService.ts` | Conexão + printTestLabel |
| `src/services/niimbot/renderTestLabel.ts` | Canvas da etiqueta de teste |
| `src/services/niimbot/printLogs.ts` | Persistência dos logs |
| `src/services/niimbot/printModels.ts` | Modelos/tamanhos B1 e B1 Pro |
| `src/hooks/useNiimbot.ts` | Bridge React |
| `src/components/niimbot/*` | UI reutilizável |
| `src/features/niimbot/pages/NiimbotPrintTestPage.tsx` | Tela de teste |

## Fora de escopo

- Integração com Produção
- Integração com o módulo Etiquetas Inteligentes
