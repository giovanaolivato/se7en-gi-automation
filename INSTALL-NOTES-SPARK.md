# Notas de instalação — DGX Spark (spark-1ec1, Linux arm64)

Este documento registra os ajustes feitos para rodar o `se7en-gi-automation`
(Gi + se7en-robot + WAHA) na Spark, além do que o README principal (escrito
para macOS) já cobre. Datado de 2026-09-08.

## Ambiente

- Host: `spark-1ec1`, Linux arm64 (NVIDIA Grace/aarch64), usuário `voltolini-space`.
- Docker 29.2.1 / Compose v5.0.2, `git`, `cmake`, `gcc`, `ffmpeg`, `pm2` e `node` (v24)
  já estavam instalados — não precisou instalar nada disso via apt.
- `ufw` está ativo, com política padrão de negar entrada (só a porta 22/SSH
  liberada pra LAN antes de começarmos). Qualquer serviço novo que precise
  receber conexão — inclusive de containers Docker locais — precisa de regra
  explícita.
- Portas 3000 e 3001 já estavam em uso por outros serviços na Spark:
  - `3000` → `open-webui` (container Docker existente).
  - `3001` → serviço local (aparenta ser o cockpit do Zeus, conectado ao Chrome).
  Por isso o WAHA e a Gi tiveram que usar portas alternativas (ver abaixo).

## Clonagem do repositório

- Repositório correto: `giovanaolivato/se7en-gi-automation` (privado). O link
  original passado (`giovanaguedis/...`) não existe/não resolve.
- Autenticação via `gh auth login` (fluxo do navegador) + `gh auth setup-git`.
  Sem isso, `git clone` por HTTPS pede usuário/senha e falha (GitHub não
  aceita mais senha simples).

## WAHA (WhatsApp HTTP API)

- A imagem `devlikeapro/waha` (sem tag) só publica build para `linux/amd64`.
  Rodar isso em arm64 emulado é ruim/instável. **Use a tag `arm`:**
  `image: devlikeapro/waha:arm` no `docker-compose.yml`.
- Porta do host mudou de `3000` → **`3010`** (conflito com `open-webui`).
  Dashboard: `http://<ip-da-spark>:3010/dashboard` (usuário `admin`, senha em
  `DASH_PASS` no `.env` raiz).
- Sessão do WhatsApp: precisa ser **criada via API** (o dashboard dessa versão
  não tem botão óbvio de criar sessão nova):
  ```bash
  curl -X POST 'http://localhost:3010/api/sessions' \
    -H "X-Api-Key: $API_KEY" -H 'Content-Type: application/json' \
    -d '{"name": "default"}'
  curl -X POST 'http://localhost:3010/api/sessions/default/start' -H "X-Api-Key: $API_KEY"
  curl -X GET 'http://localhost:3010/api/default/auth/qr' \
    -H "X-Api-Key: $API_KEY" -H 'Accept: image/png' --output qr.png
  ```
  Cuidado: o QR expira rápido (20-60s) e a sessão desiste sozinha (`FAILED`)
  se ninguém escanear a tempo — nesse caso precisa `POST /stop` e depois
  `POST /start` de novo (não basta chamar `/start` de novo em cima de uma
  sessão travada, ele responde "already running" sem reiniciar de verdade).
  A autenticação (`.sessions/`) é persistida em volume — reiniciar o
  container não pede QR de novo.

## Webhook WAHA → Gi/robô (rede Docker → host)

Como o WAHA roda dentro do Docker e a Gi/robô rodam direto no host, o
container precisa de um jeito de alcançar o host:

1. Adicionar no `docker-compose.yml` (serviço `waha`):
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```
2. **Atenção ao ufw**: `host.docker.internal` resolve pro IP da bridge padrão
   do Docker (`172.17.0.1`), só que o `docker-compose` cria uma rede própria
   pro projeto (nesse caso `172.18.0.0/16`, gateway `172.18.0.1`) — o
   container sai com IP de origem dessa rede própria (`172.18.x.x`), não da
   `172.17.0.0/16`. Uma regra de ufw que libere só `172.17.0.0/16` **não
   funciona**. Solução usada: liberar a faixa inteira que o Docker costuma
   usar pras redes de projeto:
   ```bash
   sudo ufw allow from 172.16.0.0/12 to any port <PORTA> proto tcp
   ```
   (repetir pra cada porta nova que precisar receber webhook — Gi usa
   `3011`, o bot de WhatsApp do robô vai usar `3003`).
3. **Evento do webhook**: o evento `"message"` do WAHA só dispara pra
   mensagens recebidas de terceiros — **não** dispara pra mensagens que você
   manda pra si mesmo (self-chat, usado nos testes). Pra isso funcionar,
   registrar também o evento `"message.any"`:
   ```bash
   curl -X PUT 'http://localhost:3010/api/sessions/default' \
     -H "X-Api-Key: $API_KEY" -H 'Content-Type: application/json' \
     -d '{"name":"default","config":{"webhooks":[
       {"url":"http://host.docker.internal:3011/webhook","events":["message","message.any"]}
     ]}}'
   ```
   (o `agent/server.js` já aceita os dois eventos, linha ~255 — só faltava o
   WAHA estar configurado pra mandar o `message.any`.)

## whisper.cpp (transcrição de voz da Gi)

- `brew install whisper-cpp` (do README, macOS) não se aplica a Linux.
  Compilado do fonte:
  ```bash
  git clone https://github.com/ggml-org/whisper.cpp ~/whisper.cpp
  cd ~/whisper.cpp && cmake -B build && cmake --build build -j --config Release
  sudo ln -sf ~/whisper.cpp/build/bin/whisper-cli /usr/local/bin/whisper-cli
  ```
  Compilou com detecção nativa de ARM (`GGML_SYSTEM_ARCH: ARM`), sem
  problema. O binário chama-se `whisper-cli` (é o que `agent/voice.js` já
  espera).

## agent/ (Gi)

- `.env`: `WAHA_URL=http://localhost:3010` (não 3000), `PORT=3011` (não 3001,
  por causa do Zeus).
- `npm install` normal, sem gotchas.

## se7en-robot/

- `npm install` bloqueou o script nativo do `keytar` por padrão (proteção
  nova do npm contra scripts de install). Sem isso, `npm run setup-secrets`
  quebra. Corrigir com:
  ```bash
  npm install-scripts approve keytar
  npm rebuild keytar
  ```
- `keytar` usa Keychain no Mac; em Linux usa `libsecret`/Secret Service —
  ainda não confirmamos se a Spark tem um keyring rodando (headless). Se
  `npm run setup-secrets` falhar por falta de Secret Service, provavelmente
  vai precisar instalar `gnome-keyring` + `libsecret-1-dev` e inicializar um
  keyring (`gnome-keyring-daemon --start --components=secrets`) antes.
- `.env`: `WAHA_URL=http://localhost:3010`, `WAHA_API_KEY` e `LLM_API_KEY`
  reaproveitados do `agent/.env`/`.env` raiz, `ROBOT_SHARED_KEY` gerado com
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Status neste momento (2026-09-08)

**Funcionando e testado ponta a ponta:**
- WAHA rodando (Docker, imagem arm, porta 3010), sessão WhatsApp conectada.
- Gi (`agent/server.js`) rodando manualmente na porta 3011, recebendo
  webhook do WAHA e respondendo mensagens no self-chat via LLM (NVIDIA).
- whisper.cpp compilado e linkado.

**Pendente:**
- `se7en-robot/`: `npm run setup-secrets` (credenciais do portal) e
  `HEADLESS=false npm run login` — depende do usuário (credenciais reais).
- Registrar o segundo webhook do WAHA apontando pra porta `3003`
  (`se7en-robot/src/whatsapp/whatsapp-bot.js`) depois que o login acima
  estiver ok, + liberar a porta `3003` no ufw (mesma faixa `172.16.0.0/12`).
- Subir tudo via `pm2` (Gi, API do robô, bot de WhatsApp do robô) em vez de
  terminal aberto — WAHA já tem `restart: unless-stopped` no Docker.
- `launchd` do README (macOS) não se aplica — usar `pm2` + `pm2 save` /
  `pm2 startup` no lugar, pra sobreviver a reboot da Spark.

---
*Gerado com apoio do Claude (Cowork) durante a instalação assistida via chat.*
