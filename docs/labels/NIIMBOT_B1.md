# Integração NIIMBOT B1

Impressão direta de etiquetas na **NIIMBOT B1** (e detecção automática da **B1 Pro**) via **Web Bluetooth**, sem app intermediário.

## Requisitos

| Item | Detalhe |
|------|---------|
| Navegador | **Chrome** ou **Edge** (Chromium) |
| Contexto | `https://` ou `http://localhost` |
| Hardware | NIIMBOT B1 (203 dpi) — B1 Pro também é reconhecida |
| Etiqueta padrão | 50 × 30 mm |
| Permissão | Bluetooth do sistema + escolha do dispositivo no navegador |

Não funciona em Firefox/Safari (sem Web Bluetooth).

## Como usar no NANNAI

1. Abra **Etiquetas Inteligentes** (ou o diálogo a partir da Produção)
2. Em **Impressora**, selecione **NIIMBOT B1 (Bluetooth)**
3. Clique em **Conectar B1** e escolha a impressora no seletor do Chrome
4. Revise os dados e clique em **Imprimir na B1**

A primeira impressão também pode disparar o pareamento se ainda não houver conexão.

## Fluxo técnico

```
LabelPrintDialog
  → niimbotB1Adapter.print()
    → identify / resolve B1 vs B1 Pro
    → renderLabelBitmapDataUrl (canvas PNG 1-bit-friendly)
    → niimbot-web-bluetooth.printImage(dataUrl, { model, size, copies })
```

| Modelo | Model id | Task | DPI | Pixels 50×30 |
|--------|----------|------|-----|----------------|
| B1 | 4096 | `b1` | 203 | 384 × 240 |
| B1 Pro | 4097 | `v4` | 300 | 584 × 354 |

Driver: [`niimbot-web-bluetooth`](https://www.npmjs.com/package/niimbot-web-bluetooth) (validado em hardware real B1 / B1 Pro).

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `printer/niimbotAdapter.ts` | Adaptador `LabelPrinterAdapter` |
| `printer/niimbot/client.ts` | Identify / print / disconnect |
| `printer/niimbot/renderLabelBitmap.ts` | Render canvas → PNG |
| `printer/niimbot/constants.ts` | Modelos e tamanhos |
| `hooks/useLabelPrint.ts` | Conexão, progresso e erros na UI |

## Solução de problemas

| Sintoma | Ação |
|---------|------|
| Adaptador não aparece | Use Chrome/Edge em HTTPS ou localhost |
| Pareamento cancelado | Clique de novo em **Conectar B1** |
| Página em branco (macOS) | O driver já aplica pacing; tente reiniciar Bluetooth |
| Conexão cai no meio | Reconecte e reimprima; o registro da etiqueta já fica no histórico |
| Modelo errado | O sistema identifica B1 vs B1 Pro pelo `modelId` após conectar |
