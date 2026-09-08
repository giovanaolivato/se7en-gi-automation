# se7en-robot

Serviço local que automatiza o portal `vendas.se7enpay.com.br` (login com
e-mail + senha + TOTP e ações na aba Equipamentos) e expõe uma API HTTP
**somente em `127.0.0.1`** para o seu bot de WhatsApp chamar.

## Por que assim

- O portal não tem API pública/documentada. O token de sessão fica
  cifrado no `localStorage` e só é decifrado dentro do próprio bundle JS
  da aplicação — não dá pra "extrair" e reusar fora do navegador sem
  quebrar essa criptografia. Por isso o robô **dirige o navegador de
  verdade** (Playwright), do mesmo jeito que você faria manualmente.
- As duas chamadas reais que a aba Equipamentos usa (confirmadas lendo o
  bundle da aplicação) são `PUT products/associate {product_id, seller_id}`
  e `PUT products/disassociate {product_id}` — mas o robô nunca precisa
  descobrir esses IDs na mão, porque ele clica exatamente nos mesmos
  botões que você clicaria.
- Credenciais (e-mail, senha, seed do TOTP) ficam só no **Keychain do
  macOS**, nunca em arquivo texto, `.env` ou repositório.
- O serviço só aceita conexões de `127.0.0.1` e exige um header
  `x-robot-key` com uma chave que só o seu bot conhece.

## Passo a passo

### 1. Instalar dependências

```bash
cd /Users/giovanaguedis/openwa-automations/se7en-robot
npm install
npx playwright install chromium
```

### 2. Conseguir a seed do TOTP

O portal bloqueia a troca do "Dispositivo seguro" do usuário admin por
autoatendimento — só o suporte da Se7en Pay pode resetar. Passos:

1. Abra um chamado com o suporte da Se7en Pay pedindo para **resetar o
   Google Authenticator** do usuário `admse7enpay@hotmail.com`.
2. Quando eles resetarem, o portal vai mostrar um novo QR code / segredo
   para você escanear no Google Authenticator de novo.
3. **Antes de escanear**, copie a string do segredo (o QR code sempre tem
   uma opção "não consigo escanear" / "digitar manualmente" que mostra o
   texto por trás — geralmente algo tipo `JBSWY3DPEHPK3PXP`).
4. Escaneie normalmente no seu celular (continua funcionando como sempre)
   **e também** guarde essa string — é ela que o robô vai usar.

### 3. Configurar o `.env`

```bash
cp .env.example .env
# gere uma chave forte pro ROBOT_SHARED_KEY:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# cole o resultado em ROBOT_SHARED_KEY dentro do .env
```

### 4. Cadastrar as credenciais no Keychain

```bash
npm run setup-secrets
```

Vai pedir e-mail, senha e a seed do TOTP (nada aparece na tela ao
digitar). No final ele gera um código de teste — confira se bate com o
que aparece no seu Google Authenticator no mesmo instante, pra garantir
que a seed foi digitada certo.

### 5. Testar o login (com o navegador visível)

```bash
HEADLESS=false npm run login
```

Acompanhe a janela do Chromium. Isso é o passo mais provável de precisar
ajuste fino: a tela de código do autenticador pode ter um formato
diferente do que o código assume hoje (`src/browser/session.js`, função
`fillOtpInput`). Se travar aí, me chama com o print da tela que eu ajusto
o seletor.

Se der certo, a sessão fica salva em `storage/state.json` e os próximos
logins são automáticos (só refaz TOTP quando a sessão expirar).

### 6. Subir o serviço

```bash
npm start
```

Testar:

```bash
curl -s http://127.0.0.1:3002/health

curl -s http://127.0.0.1:3002/equipamentos/6K697975 \
  -H "x-robot-key: SUA_CHAVE_AQUI"

curl -s -X POST http://127.0.0.1:3002/equipamentos/6K697975/associar \
  -H "x-robot-key: SUA_CHAVE_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"22.576.679/0001-02"}'

curl -s -X POST http://127.0.0.1:3002/equipamentos/6K697975/desassociar \
  -H "x-robot-key: SUA_CHAVE_AQUI"
```

### 7. Deixar sempre ativo (launchd)

```bash
cp launchd/com.se7enrobot.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.se7enrobot.plist
```

Para parar/atualizar depois:

```bash
launchctl unload ~/Library/LaunchAgents/com.se7enrobot.plist
# depois de editar o plist ou o código:
launchctl load ~/Library/LaunchAgents/com.se7enrobot.plist
```

Logs ficam em `logs/service.out.log` e `logs/service.err.log`.

## Como o bot de WhatsApp chama isso

O robô é independente — qualquer processo (inclusive um em outra
linguagem) pode chamar essa API local via HTTP simples:

```
GET  /equipamentos/:serial                      -> dados atuais do POS
POST /equipamentos/:serial/associar   {cnpj}     -> vincula a um estabelecimento
POST /equipamentos/:serial/desassociar           -> desvincula

GET  /tickets/tipos                             -> lista as 62 categorias fixas + fornecedores (F3-F7)
GET  /estabelecimentos/buscar?q=termo           -> busca por nome ou CNPJ (nome+CNPJ na resposta)
GET  /licenciados/buscar?q=termo                -> idem, para Licenciado
POST /tickets/criar  {titulo, tipo, cnpjEstabelecimento,
                       cnpjLicenciado?, fornecedor?, urlPagina?, descricao}
                                                 -> abre um chamado
```

`cnpjLicenciado` é opcional no endpoint — se omitido, usa o padrão fixo
"SE7EN" (`tickets.LICENCIADO_PADRAO_CNPJ`), conforme pedido: o Licenciado
de um chamado é sempre a própria conta, nunca varia por chamado.

Confirmado testando ao vivo: o formulário de ticket só habilita o botão
"Criar ticket" com **Título, Tipo, Estabelecimento, Licenciado e
Descrição** todos preenchidos — por isso `titulo`, `tipo`,
`cnpjEstabelecimento` e `descricao` são obrigatórios no `POST
/tickets/criar`. `fornecedor` não é exigido pelo formulário, mas é
obrigatório por regra de negócio (avisado explicitamente pelo usuário) —
o fluxo de WhatsApp sempre pergunta antes de criar.

Toda chamada precisa do header `x-robot-key: <ROBOT_SHARED_KEY>`.

Toda ação fica registrada em `logs/audit.log` (uma linha JSON por ação,
com data/hora, serial, CNPJ quando aplicável, e resultado) — nenhuma
senha ou token é logado.

**Lembrete importante que o próprio portal dá**: depois de associar ou
desassociar, é preciso reiniciar a maquininha física (tecla **F8**) para
o vínculo valer de verdade. As respostas da API já incluem esse aviso em
`aviso`, então vale repassar pro cliente via WhatsApp.

## Abrir chamado (Tickets) pelo WhatsApp

`src/whatsapp/ticketFlow.js` implementa uma conversa de várias etapas
(estado guardado em memória por chat, expira em 15min sem resposta):

1. Usuário pede pra abrir um chamado (`"abrir um chamado"` ou já com a
   descrição junto, ex: `"abrir chamado, PIX não caiu na conta do
   mercado tal"`).
2. Se não veio descrição na primeira mensagem, a Gi pergunta.
3. Com a descrição em mãos, o LLM classifica em uma das 62 categorias
   fixas do portal e pede confirmação (ou você descreve a categoria
   certa em texto livre, ele reclassifica).
4. Pergunta o estabelecimento (nome ou CNPJ) — busca no mesmo dataset de
   Equipamentos; se achar mais de um, lista numerado pra escolher.
5. Pergunta o fornecedor da maquininha (F3 a F7) — obrigatório por regra
   de negócio, mesmo o formulário do portal não travando sem ele.
6. Pergunta se quer anexar foto/vídeo como evidência — pode mandar
   quantos arquivos quiser, um de cada vez, e responder "pronto" quando
   terminar (ou "não" pra pular). **Testado ao vivo**: o download da
   mídia do WhatsApp (via WAHA, mesmo padrão que o `agent/voice.js` já
   usa pra áudio) e a gravação em arquivo temporário funcionam
   corretamente com imagem e vídeo.
7. Gera um título curto a partir da descrição e pede confirmação (ou
   você manda outro título).
8. Mostra o resumo completo (título, tipo, estabelecimento, fornecedor,
   descrição, quantidade de anexos) e só cria depois do "sim" final —
   os anexos vão junto no mesmo `POST tickets/criar` via
   `page.setInputFiles(...)` (confirmado que o portal aceita múltiplos
   arquivos sem endpoint de upload separado, tudo no mesmo envio).

Anexos mandados **fora** de uma conversa de ticket ativa (ou quando o
tipo de mídia não é foto/vídeo) recebem um aviso educado em vez de
serem processados. Os arquivos temporários são apagados automaticamente
depois de criar o chamado (ou se a conversa for cancelada).

O campo **Licenciado** nunca é perguntado — fica sempre fixo em "SE7EN"
(pedido explícito: é sempre a própria conta, não varia por chamado).

Qualquer mensagem fora desse fluxo (equipamentos, ou assunto qualquer)
continua funcionando normalmente — o fluxo de ticket só "sequestra" a
conversa enquanto está em andamento pra esse chat especificamente.

## Login automático no seu Chrome (extensão)

Além da API pro WhatsApp, tem uma extensão em `chrome-extension/` com um
botão que preenche o login (e-mail, senha, código do autenticador)
direto na sua aba real do Chrome — útil quando a sessão do seu navegador
do dia a dia expira e você não quer digitar tudo de novo.

**Como funciona**: a extensão busca as credenciais do robô local
(`GET /login-helper` e `/login-helper/totp`) e injeta nos campos da
página via JavaScript — o mesmo modelo que 1Password/Bitwarden usam nas
extensões deles. A senha só transita entre `127.0.0.1:3002` e a
extensão, nunca sai da sua máquina.

### Instalar

1. Abra `chrome://extensions` no Chrome.
2. Ative "Modo do desenvolvedor" (canto superior direito).
3. Clique "Carregar sem compactação" e selecione a pasta
   `se7en-robot/chrome-extension/`.
4. Fixe o ícone da extensão na barra de ferramentas (opcional, mas
   facilita).

### Usar

1. Garanta que o serviço `com.se7enrobot` está rodando (`launchctl list | grep se7enrobot`).
2. Clique no ícone da extensão em qualquer aba.
3. Clique em "Login automático" — se você não estiver no portal, ela
   abre a página de login sozinha; se já estiver logado, ela avisa e não
   faz nada.

O botão preenche e-mail/senha, espera o "Entrar" habilitar, clica,
espera a tela do código aparecer, busca um código TOTP fresco e
preenche. Se algo mudar na tela de login do portal e algum seletor
parar de bater, o popup mostra o erro específico (ex: "Campo de código
sumiu da tela") — me avise com o print que eu ajusto.

## Segurança

- O serviço só escuta em `127.0.0.1` — não é acessível de fora da sua
  máquina, nem por outros dispositivos na sua rede.
- Credenciais (senha e seed TOTP) vivem só no Keychain do macOS.
- A sessão do navegador (`storage/state.json`) é sensível — é
  equivalente a estar logado no portal. Está no `.gitignore`; não
  versione nem copie esse arquivo pra outro lugar.
- `chrome-extension/popup.js` tem a `ROBOT_SHARED_KEY` embutida (precisa
  estar ali pra extensão conseguir chamar o robô). Não publique essa
  pasta, nem a suba pra um repositório compartilhado, sem tirar a chave
  antes.
- Se desconfiar que a chave `ROBOT_SHARED_KEY` vazou, gere uma nova e
  reinicie o serviço.
