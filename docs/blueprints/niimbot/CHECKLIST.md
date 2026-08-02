# Checklist — NIIMBOT

## Critérios de aceite

- [ ] Chrome/Edge + Bluetooth + HTTPS/localhost
- [ ] Conectar B1 em `/niimbot/configuracoes`
- [ ] Ver modelo, nome, bateria, firmware e status
- [ ] Recarregar a página → reconexão automática sem chooser (quando permitido)
- [ ] `/niimbot/teste` → imprimir etiqueta de teste (NANNAI, data, hora, QR)
- [ ] Produção → concluir item → diálogo **Deseja imprimir etiqueta?** SIM/NÃO
- [ ] SIM gera Produto, Responsável, Validade, Lote, Peso, Categoria, QR e imprime
- [ ] Histórico aparece em `/etiquetas`
- [ ] Reimpressão pelo botão do item e por Etiquetas
- [ ] Falha de BLE após salvar histórico mostra mensagem amigável + permite retry
- [ ] Registry: trocar/adicionar impressora, **Usar** (ativa), **Esquecer**

## Erros a validar

- [ ] Cancelar seletor Bluetooth → mensagem amigável
- [ ] Bluetooth desligado → mensagem de suporte
- [ ] Impressora desligada mid-job → falha amigável; histórico mantido

## Não exigir (fora de escopo)

- [ ] Impressão simultânea em duas impressoras
- [ ] Fila offline
- [ ] SDK oficial NIIMBOT
