# NIIMBOT B1 — Etapa 1 (somente conexão)

Primeira etapa da integração: **parear e identificar** a impressora via Web Bluetooth.
**Não há impressão nesta etapa.**

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ UI                                                          │
│  NiimbotConnectionPage                                      │
│    └── NiimbotConnectionPanel                               │
│          ├── NiimbotConnectButton  ("Conectar NIIMBOT")     │
│          ├── NiimbotStatusIndicator (🟢🟡🔴)                │
│          └── NiimbotDeviceInfoCard (modelo, nome, …)        │
└───────────────────────────┬─────────────────────────────────┘
                            │ useNiimbot()
┌───────────────────────────▼─────────────────────────────────┐
│ Hook                                                        │
│  src/hooks/useNiimbot.ts                                    │
│  - assina o serviço                                         │
│  - toasts de sucesso / erro / perda de conexão              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Serviço                                                     │
│  src/services/NiimbotService.ts  (singleton)                │
│  - connect() / disconnect() / subscribe()                   │
│  - usa niimbot-web-bluetooth (identify / disconnect)        │
│  - protocol.ts lê bateria/firmware (quando disponível)      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│ Driver                                                      │
│  niimbot-web-bluetooth                                      │
│  - requestDevice (filtro namePrefix "B1")                   │
│  - GATT + identificação B1 / B1 Pro                         │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos novos

| Caminho | Papel |
|---------|-------|
| `src/services/NiimbotService.ts` | Serviço de conexão |
| `src/services/niimbot/types.ts` | Tipos do domínio |
| `src/services/niimbot/protocol.ts` | Leitura opcional de bateria/firmware |
| `src/hooks/useNiimbot.ts` | Bridge React |
| `src/components/niimbot/*` | Componentes reutilizáveis |
| `src/features/niimbot/pages/NiimbotConnectionPage.tsx` | Página da etapa 1 |

Nenhum módulo de negócio existente (Produção, Etiquetas, etc.) foi alterado além do **roteamento/navegação** para expor a nova página.

## Fluxo do botão "Conectar NIIMBOT"

1. Usuário clica em **Conectar NIIMBOT**
2. Status → 🟡 Conectando
3. Chrome/Edge abre o seletor Bluetooth (filtros `B1*`)
4. Usuário escolhe a impressora
5. Driver identifica modelo (B1 = 4096, B1 Pro = 4097, …)
6. Serviço tenta ler bateria (`PrinterInfo 0x0A`) e firmware (`0x09`)
7. Status → 🟢 Conectada e o card exibe os dados
8. Se o GATT cair, status → 🔴 Desconectada + aviso ao usuário

## Dados exibidos

| Campo | Origem |
|-------|--------|
| Modelo | `Niimbot.printer.label` |
| Nome | `Niimbot.printer.deviceName` (BLE) |
| Status | estado interno do serviço |
| Bateria | `PrinterInfo` charge level (quando o navegador expõe o device) |
| Firmware | `PrinterInfo` software version (quando disponível) |

## Requisitos

- Chrome ou Edge
- HTTPS ou `localhost`
- Bluetooth do sistema ligado
- Biblioteca: `niimbot-web-bluetooth`

## Fora de escopo (próximas etapas)

- Renderização de etiquetas
- Envio de jobs de impressão
- Integração com o módulo Etiquetas Inteligentes
