# NANNAI × NIIMBOT — Documentação da integração

Integração Web Bluetooth da impressora **NIIMBOT B1 / B1 Pro** no app NANNAI: conexão, registry multi-impressora, teste, impressão na Produção e histórico de etiquetas.

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│ UI                                                               │
│  /niimbot/configuracoes   /niimbot/teste   Produção   Etiquetas │
└───────────────┬─────────────────┬──────────────┬────────────────┘
                │                 │              │
                ▼                 ▼              ▼
         useNiimbot()     printTestLabel   printProductionItemLabel
                │                                 │
                ▼                                 ▼
         NiimbotService ◄──────── niimbotBluetoothAdapter
                │
    ┌───────────┼───────────────┐
    ▼           ▼               ▼
 registry   driverBridge   render*Label
 (localStorage)  │               │
                 ▼               ▼
         niimbot-web-bluetooth   canvas PNG + QR
                 │
                 ▼
            Web Bluetooth GATT
```

## Requisitos

| Item | Detalhe |
|------|---------|
| Navegador | Chrome ou Edge (Web Bluetooth) |
| Contexto | HTTPS ou `localhost` |
| Hardware | NIIMBOT B1 (203 dpi) ou B1 Pro (300 dpi) |
| Etiqueta padrão | 50×30 mm |

## Fluxos

### 1. Conexão e persistência

1. Usuário abre `/niimbot/configuracoes` e toca **Conectar NIIMBOT**
2. O navegador abre o seletor Bluetooth (filtro `B1*`)
3. O driver (`identify`) detecta modelo (B1 = 4096, B1 Pro = 4097)
4. A impressora é gravada no **registry** (`nannai.niimbot.printers`) e marcada como ativa
5. Status, bateria e firmware aparecem na UI

### 2. Reconexão automática

1. Ao montar telas NIIMBOT, `useNiimbot({ autoReconnect: true })` chama `tryAutoReconnect()`
2. O serviço resolve o dispositivo já permitido via `navigator.bluetooth.getDevices()`
3. Entrega o `BluetoothDevice` ao driver **sem chooser** (`withPermittedBluetoothDevice`)
4. Se falhar → status desconectado + botão **Reconectar**

> “Conectado” na UI significa sessão imprimível no driver (não só GATT paralelo).

### 3. Teste da impressora

Rota `/niimbot/teste` → **Imprimir etiqueta de teste**

Conteúdo: NANNAI · Teste de Impressão · Data · Hora · QR (`NANNAI|TESTE|{ISO}`)

### 4. Produção

1. Item marcado como **Concluído**
2. Diálogo: **Deseja imprimir etiqueta?** → **SIM** / **NÃO**
3. Se SIM:
   - `POST /labels/from-production` gera Produto, Responsável, Validade, Lote, Peso, Categoria, QR
   - Adaptador NIIMBOT renderiza canvas 50×30 e envia via BLE
   - Histórico salvo no módulo Etiquetas
4. Reimpressão: botão no item concluído ou **Etiquetas → Reimprimir**

## Arquitetura de pastas

| Caminho | Papel |
|---------|-------|
| `src/services/NiimbotService.ts` | Fachada: conexão, registry, print |
| `src/services/niimbot/driverBridge.ts` | Sessão do driver + override de `requestDevice` |
| `src/services/niimbot/persistence.ts` | Registry multi-impressora + migração |
| `src/services/niimbot/protocol.ts` | GATT helpers / `getDevices` |
| `src/services/niimbot/errors.ts` | Mensagens amigáveis |
| `src/services/niimbot/printModels.ts` | Modelos/tamanhos B1 e B1 Pro |
| `src/services/niimbot/renderTestLabel.ts` | Canvas do teste |
| `src/services/niimbot/printLogs.ts` | Logs locais de impressão |
| `src/hooks/useNiimbot.ts` | Bridge React + toasts |
| `src/components/niimbot/*` | UI reutilizável |
| `src/features/labels/printer/niimbotAdapter.ts` | Adaptador do registry de impressoras |
| `src/features/labels/printer/renderNiimbotLabel.ts` | Canvas da etiqueta de produção |
| `src/features/labels/services/printProductionLabel.ts` | Create/reprint + print |
| `src/features/production/pages/ProductionPage.tsx` | Prompt SIM/NÃO |

## Registry multi-impressora

Armazenamento: `localStorage` → `nannai.niimbot.printers`

```ts
type NiimbotPrinterRegistry = {
  version: 1
  activeId: string | null
  printers: Array<{
    id: string
    name: string
    model: string
    modelId: number | null
    lastConnectedAt: string
    bluetoothDeviceId: string | null
    nickname?: string
  }>
}
```

### Comportamento atual

- Várias impressoras podem ser **salvas**
- Apenas **uma sessão BLE ativa** (limitação do driver `niimbot-web-bluetooth`)
- `setActivePrinter(id)` escolhe qual usar
- `forgetPrinter(id)` remove do registry
- Legacy `nannai.niimbot.printer` é migrado automaticamente

### Preparado para o futuro

- Nickname por impressora
- Seleção de ativa na UI de configurações
- API do serviço já expõe `printers` / `activePrinterId` / `setActivePrinter` / `forgetPrinter(id)`
- Produção e etiquetas usam a impressora **ativa** (sem picker por item ainda)

## API do serviço (resumo)

| Método | Descrição |
|--------|-----------|
| `connect()` | Chooser + identify + upsert registry |
| `tryAutoReconnect()` | Silencioso via `getDevices` + driver |
| `reconnect(id?)` | Reconecta ativa (ou id) |
| `setActivePrinter(id)` | Troca ativa (desconecta se necessário) |
| `disconnect()` | Encerra GATT; mantém registry |
| `forgetPrinter(id?)` | Remove do registry |
| `printWithRenderer(render, opts)` | Garante sessão, renderiza, imprime |
| `printTestLabel()` | Atalho do teste |

## Segurança

- Dados do registry e logs ficam em `localStorage` (mesmo origin)
- QR de produção contém produto/lote/código — legível fisicamente
- Canvas `fillText` não interpreta HTML (sem XSS por esse caminho)
- Permissão Bluetooth é mediada pelo navegador
- Erros de impressão vão para `console.error`; infos só em dev

## Permissões do app

- Impressão na Produção exige `labels:print`
- Telas `/niimbot/*` hoje acessíveis a qualquer usuário autenticado

## Fora de escopo (ainda)

- Impressão simultânea em duas NIIMBOTs
- Fila de jobs / offline queue
- SDK oficial NIIMBOT
- Picker de impressora por item de produção
