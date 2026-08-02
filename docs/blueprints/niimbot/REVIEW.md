# Revisão da integração NIIMBOT

> Blueprint canônico: `docs/blueprints/niimbot/`

Revisão completa (Bluetooth, reconexão, erros, performance, duplicação, responsividade, segurança, arquitetura) e melhorias aplicadas / recomendadas.

## Veredito

A integração está **funcional e documentada**, com camadas claras (UI → hook/adapter → serviço → driver).  
O principal risco operacional era o **conflito de sessão BLE** (GATT silencioso ≠ sessão do driver), que forçava o seletor Bluetooth a cada impressão. Isso foi corrigido nesta revisão.

---

## 1. Bluetooth

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Web Bluetooth + Chrome/Edge | OK | Probe de suporte na UI |
| Pareamento (`identify`) | OK | Filtro `B1*` |
| Sessão imprimível | Corrigido | `withPermittedBluetoothDevice` entrega o device ao driver |
| Limitação do driver | Aceita | Singleton GATT — uma impressora ativa |

### Melhorias aplicadas
- Bridge `driverBridge.ts` evita chooser em reconexão/impressão quando o device já é permitido
- `printWithRenderer` reutiliza sessão viva (`driverSessionLive`) sem `identify` redundante

### Melhorias futuras
- Contribuir `connectToDevice(BluetoothDevice)` upstream no `niimbot-web-bluetooth`
- Tratar múltiplos devices `B1*` com desambiguação por `bluetoothDeviceId` + nickname obrigatório

---

## 2. Reconexão

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Auto-reconnect no mount | OK | `tryAutoReconnect` com promise única |
| Fallback chooser | OK | Só se silencioso falhar |
| Status vs imprimível | Corrigido | Conectado ⇒ driver pronto para print |

### Melhorias futuras
- Telemetria de taxa de falha de auto-reconnect (sem PII)
- Botão “Testar conexão” separado do teste de impressão

---

## 3. Tratamento de erros

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Mensagens amigáveis | OK | `errors.ts` unificado |
| Toasts no hook | OK | connect / print / perda de link |
| Produção: salva histórico se BLE falhar | OK | `ProductionLabelPrintError` + diálogo de retry |

### Melhorias futuras
- Códigos de erro tipados (`NiimbotErrorCode`) para i18n
- Distinguir “cancelou seletor” de “impressora desligada” com CTA diferente

---

## 4. Performance

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Reconnect a cada print | Corrigido | Skip se sessão viva |
| Canvas + QR na main thread | Aceitável | Bloqueio curto em 50×30 |
| Mutex `isPrinting` | OK | Evita jobs concorrentes |

### Melhorias futuras
- OffscreenCanvas / worker para render
- Enviar bitmap empacotado direto (evitar PNG data URL → decode no driver)
- Endpoint de “última etiqueta do item” em vez de listar 100 labels

---

## 5. Código duplicado

| Aspecto | Estado | Notas |
|---------|--------|-------|
| `loadImage` / truncate | Corrigido | `canvas.ts` compartilhado |
| `displayDevice` | Corrigido | `displayDeviceFromPersisted` |
| Mappers de erro | Corrigido | `errors.ts` |
| Protocolo vs driver | Aceitável | Drift monitorado |

### Melhorias futuras
- Um único renderer parametrizável (teste vs produção)
- Compartilhar builders de label client/server via pacote shared

---

## 6. Responsividade

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Layouts `sm:` / touch 44px | OK | Painéis NIIMBOT |
| Modal → sheet no mobile | OK | Shared `Modal` |
| ConfirmDialog texto duplicado | Corrigido | Description só no header |

### Melhorias futuras
- Preview da etiqueta de produção no diálogo SIM/NÃO (opcional, compacto)

---

## 7. Segurança

| Aspecto | Estado | Notas |
|---------|--------|-------|
| XSS via canvas | OK | Texto vira pixels |
| localStorage | Atenção | Registry + logs no origin |
| QR produção | Atenção | Contém produto/lote/código |
| Rotas `/niimbot` | Atenção | Sem permission gate |

### Melhorias futuras
- Permission `printers:manage` nas rotas NIIMBOT
- Reduzir PII nos print logs (só ids)
- Política de retenção dos logs locais

---

## 8. Arquitetura

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Camadas serviço/hook/adapter | OK | Baixo acoplamento UI |
| Singleton driver | Limitação | 1 sessão BLE |
| Multi-impressora | Base pronta | Registry v1 + UI “Usar / Esquecer” |
| Produção → labels → NIIMBOT | OK | Histórico no backend |

### Melhorias futuras
- Fila de impressão com retry
- Seleção de impressora por setor/turno
- Testes de integração (mock de `navigator.bluetooth` + driver)

---

## Prioridade sugerida (próximos passos)

1. **Permission gate** em `/niimbot/*`
2. **API** `GET /labels/latest?productionItemId=`
3. **Upstream** `connectToDevice` no driver
4. **Testes** automatizados do registry + sessão
5. **Worker** de render para etiquetas densas

---

## Checklist de validação manual

1. Chrome + Bluetooth + HTTPS/localhost  
2. Conectar B1 em Configurações  
3. Recarregar → reconecta sem chooser  
4. Teste da Impressora → 1 etiqueta  
5. Produção → concluir item → SIM → etiqueta física + histórico  
6. Trocar/adicionar segunda impressora no registry → “Usar” / “Esquecer”  
7. Desligar impressora mid-print → mensagem amigável + histórico salvo  
