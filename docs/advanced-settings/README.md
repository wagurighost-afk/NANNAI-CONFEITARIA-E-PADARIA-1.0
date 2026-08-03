# Configurações Avançadas

Módulo exclusivo para **Administradores Master** (`founder` e `admin`).

## Rota

- Frontend: `/configuracoes-avancadas`
- API: `/api/settings`
- Permissão: `settings:manage`

## Categorias

| Categoria | Configurações |
|-----------|---------------|
| **Geral** | Nome do hotel, logo |
| **Aparência** | Tema, idioma, moeda, formato de data |
| **Etiquetas** | Modelo padrão, tamanho, validade por template |
| **NIIMBOT** | DPI, cópias, reconexão automática (+ link para pareamento) |
| **Metas** | CMV (%), desperdício (kg/mês) |
| **Backup** | Ativação, frequência, horário, retenção |
| **Banco de Dados** | Modo, registros, tabelas (somente leitura) |

## API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/settings` | Carrega configurações + info do banco |
| `PATCH` | `/api/settings` | Atualização parcial |
| `POST` | `/api/settings/logo` | Upload do logo (multipart) |
| `DELETE` | `/api/settings/logo` | Remove logo |

## Persistência

Chave `app_settings` na tabela/arquivo `meta` (JSON).

## Pesquisa

A barra de pesquisa filtra categorias por nome, descrição e palavras-chave configuradas em `advancedSettings.constants.ts`.

## Arquivos

```
server/src/settings/
src/features/advanced-settings/
```

## Versão

Introduzido na **v1.6.4**.
