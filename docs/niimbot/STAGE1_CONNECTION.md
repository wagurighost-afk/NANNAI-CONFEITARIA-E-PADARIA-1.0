# NIIMBOT B1 — Etapa 1 (conexão + persistência)

Integração sem impressão: parear via Web Bluetooth, **salvar a impressora**, **reconectar automaticamente** e gerenciar em **Configurações**.

## Arquitetura

```
/niimbot/configuracoes  →  NiimbotSettingsPage
                              └── NiimbotSettingsPanel
                                    ├── Status 🟢🟡🔴
                                    ├── Botão Reconectar (se necessário)
                                    ├── Trocar impressora / Desconectar
                                    └── NiimbotDeviceInfoCard
                                          │
                                          ▼
                                     useNiimbot({ autoReconnect: true })
                                          │
                                          ▼
                                     NiimbotService
                                       ├── connect()      → chooser + identify + save
                                       ├── tryAutoReconnect() → getDevices() + GATT
                                       ├── reconnect() / changePrinter() / disconnect()
                                       └── persistence.ts → localStorage
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

## Reconexão automática

1. Ao abrir a tela de configurações, `useNiimbot` chama `tryAutoReconnect()`
2. O serviço busca dispositivos já autorizados (`navigator.bluetooth.getDevices`)
3. Reabre GATT, identifica e atualiza bateria/firmware quando possível
4. Se falhar → status desconectado + botão **Reconectar**

> Em alguns Chromes, `getDevices()` / reconexão silenciosa depende do backend de permissões Bluetooth do site. Se a reconexão automática não funcionar, **Reconectar** abre o fluxo de pareamento novamente.

## Tela de configurações

Rota: `/niimbot/configuracoes` (menu **NIIMBOT**)

Permite:

- Ver informações (modelo, nome, ID, bateria, firmware, última conexão)
- **Reconectar**
- **Trocar impressora** (novo seletor Bluetooth)
- **Desconectar** (mantém a impressora salva)

`/niimbot` redireciona para a tela de configurações.

## Arquivos principais

| Arquivo | Papel |
|---------|-------|
| `src/services/NiimbotService.ts` | Conexão + auto-reconnect + ações |
| `src/services/niimbot/persistence.ts` | localStorage |
| `src/services/niimbot/protocol.ts` | GATT silencioso + PrinterInfo |
| `src/hooks/useNiimbot.ts` | Bridge React |
| `src/components/niimbot/*` | UI reutilizável |
| `src/features/niimbot/pages/NiimbotSettingsPage.tsx` | Tela de configurações |

## Fora de escopo

- Impressão de etiquetas
- Integração com o módulo Etiquetas Inteligentes
