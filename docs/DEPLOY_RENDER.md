# Publicar NANNAI no Render (passo a passo)

Guia para colocar o app na internet **sem deixar seu PC ligado**.  
A equipe acessa pelo celular e instala como app (PWA), tipo Suflex.

---

## Pré-requisitos

- Repositório no **GitHub** com todo o código (incluindo pasta `server/` e arquivo `render.yaml`)
- Conta gratuita em [render.com](https://render.com) (pode entrar com GitHub)

---

## Passo 1 — Conectar o GitHub ao Render

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. Clique em **New +** (canto superior direito)
3. Escolha **Blueprint**
4. Conecte sua conta **GitHub** se ainda não conectou
5. Selecione o repositório **NANNAI**

---

## Passo 2 — Aplicar o Blueprint

1. O Render vai detectar o arquivo `render.yaml` na raiz
2. Revise o serviço **nannai-app** (plano Free)
3. Clique em **Apply**

O Render vai:
- Instalar dependências
- Gerar o build do site (PWA)
- Subir a API junto com o site no **mesmo endereço**

Aguarde o deploy (5–15 minutos na primeira vez).

---

## Passo 3 — Pegar o link do app

1. Quando o status ficar **Live** (verde), abra o serviço **nannai-app**
2. No topo aparece a URL, por exemplo:  
   `https://nannai-app-xxxx.onrender.com`
3. **Esse é o link para compartilhar com a equipe**

Teste no navegador:
- Abra a URL → deve aparecer a tela de login NANNAI
- Acesse `https://SUA-URL.onrender.com/api/health` → deve retornar `{"status":"ok",...}`

---

## Passo 4 — Variáveis de ambiente (opcional)

O Render já configura a maior parte pelo `render.yaml`. Se quiser ajustar:

| Variável | Para quê |
|----------|----------|
| `DEFAULT_USER_PASSWORD` | Senha inicial da equipe (padrão: `Nannai@2026`) |
| `JWT_SECRET` | Segurança do login (gerado automaticamente) |
| `CORS_ORIGIN` | Só se usar domínio próprio depois |

**Não precisa** configurar `CORS_ORIGIN` no início — o Render preenche automaticamente.

---

## Passo 5 — Equipe instala no celular

Envie o link do Render no WhatsApp da equipe.

### Android (Chrome)
1. Abrir o link
2. Tocar em **Instalar app** (na tela de login ou no topo)
3. Confirmar

### iPhone (Safari)
1. Abrir o link no **Safari**
2. Tocar em **Instalar app** e seguir o guia  
   **ou** Compartilhar → **Adicionar à Tela de Início**

---

## Login da equipe

| Quem | E-mail | Senha inicial |
|------|--------|---------------|
| Admin | `admin@nannai.com` | `Nannai@2026` |
| Chef | `David.oliveira@nannai.com.br` | `Nannai@2026` |
| Colaboradores | e-mail `@nannai.net.br` | `Nannai@2026` |

Troque a senha padrão depois que todos testarem.

---

## Atualizar o app depois

1. Faça alterações no código
2. Envie para o GitHub (`git push`)
3. O Render **reimplanta automaticamente** (se Auto-Deploy estiver ativo)

---

## Plano gratuito — o que saber

| Item | Comportamento |
|------|----------------|
| Servidor dorme | Após ~15 min sem uso, a 1ª abertura pode demorar ~30 s |
| Dados | No plano free, dados podem resetar em deploys grandes — para produção séria, use disco persistente no Render (pago) |
| HTTPS | Incluído automaticamente |

---

## Problemas comuns

**Build falhou**
- Veja **Logs** no painel do Render
- Confirme que `server/package.json` e `render.yaml` estão no GitHub

**Tela branca**
- Abra o console do navegador (F12)
- Confirme que `/api/health` responde

**Login não funciona**
- Use e-mail corporativo exato (maiúsculas/minúsculas no domínio não importam)
- Senha: `Nannai@2026` (com N maiúsculo e @)

---

## Domínio próprio (futuro)

No Render: **Settings → Custom Domain**  
Ex.: `app.nannai.com.br` apontando para o serviço.

Depois atualize `CORS_ORIGIN` com o novo domínio.
