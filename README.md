# Se7en Pay — Automação WhatsApp (Gi + se7en-robot)

Sistema de automação local pra suporte via WhatsApp aos licenciados da Se7en Pay.

## Componentes

- **WAHA** (Docker) — camada de conexão com o WhatsApp, via `docker-compose.yml`.
- **`agent/`** — a Gi: assistente que responde dúvidas de licenciados usando
  uma base de conhecimento local (`agent/knowledge/`) e um LLM (atualmente
  NVIDIA/DeepSeek). Escuta o webhook do WAHA na porta 3001.
- **`se7en-robot/`** — automação de ações reais no portal
  `vendas.se7enpay.com.br` (associar/desassociar POS, abrir chamados) via
  Playwright, já que o portal não tem API pública. Expõe uma API local
  (porta 3002) e tem seu próprio bot de WhatsApp (porta 3003) pra
  comandos desse tipo, usando o mesmo número/sessão da Gi.

Os dois bots de WhatsApp (Gi e se7en-robot) escutam o mesmo self-chat mas
se dividem por tipo de mensagem — ver `agent/server.js` e
`se7en-robot/src/whatsapp-bot.js` (regex `EQUIPMENT_COMMAND_REGEX`, tem
que mudar nos dois lugares se mudar num só).

## Segredos — NÃO estão neste repositório

Por segurança, os seguintes itens ficam de fora do git e precisam ser
recriados/copiados manualmente no computador novo:

| Item | O que fazer no computador novo |
|---|---|
| `.env`, `agent/.env`, `se7en-robot/.env` | Copie os `.env.example` correspondentes e preencha com os valores reais (pegue do computador antigo por um canal seguro — gerenciador de senhas, não por aqui) |
| `.sessions/` (sessão WhatsApp do WAHA) | Não copiar — escaneie o QR code de novo (`docker compose up`, depois abra o dashboard do WAHA) |
| `se7en-robot/storage/` (sessão logada do portal) | Não copiar — rode `npm run login` de novo (usa TOTP do Keychain) |
| `se7en-robot/chrome-extension/popup.js` | Copie `popup.js.example` pra `popup.js` e cole a mesma chave do `ROBOT_SHARED_KEY` |
| Credenciais do portal (e-mail/senha/seed TOTP) | Ficam no Keychain do macOS, não em arquivo — rode `npm run setup-secrets` de novo no computador novo |
| `agent/models/ggml-small.bin` (modelo Whisper, ~465MB) | Grande demais pro git — baixe de novo, ver comando abaixo |

## Setup no computador novo

```bash
# 1. WAHA
cp .env.example .env   # preencha DASH_PASS e API_KEY
docker compose up -d
# abra http://localhost:3000/dashboard, escaneie o QR code

# 2. Gi (agent/)
brew install whisper-cpp ffmpeg   # transcrição de áudio, 100% local
cd agent
npm install
cp .env.example .env   # preencha com os valores reais (mesma API_KEY do WAHA acima)
mkdir -p models
curl -L -o models/ggml-small.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
node --use-bundled-ca --env-file=.env server.js

# 3. se7en-robot
cd ../se7en-robot
npm install
npx playwright install chromium
cp .env.example .env   # preencha com os valores reais
npm run setup-secrets  # credenciais do portal no Keychain
HEADLESS=false npm run login   # confirma login funcionando
npm start               # API do robô (porta 3002)
npm run whatsapp         # bot de equipamentos/chamados (porta 3003)
```

### Rodando sempre ativo (launchd)

Os `.plist` em `se7en-robot/launchd/` e em `~/Library/LaunchAgents/` (não
versionados) têm o caminho `/Users/giovanaguedis/...` fixo — se o usuário
do computador novo for diferente, ajuste `WorkingDirectory` e os caminhos
de log antes de rodar `launchctl load`.

## Notas importantes de operação

- **Sempre rode Node com `--use-bundled-ca`** (já usado em todos os
  comandos acima). Se essa máquina tiver `NODE_USE_SYSTEM_CA=1` no
  ambiente, o Node quebra TODA chamada HTTPS de saída sem esse flag —
  problema real encontrado e diagnosticado nesta base.
- **NVIDIA free tier tem instabilidade conhecida** — de minutos de
  travamento a ~15s de latência normal, variando ao longo do dia. Ver
  `agent/agent.js` (timeout + retry) e `agent/server.js`
  (`HOLD_MESSAGE_DELAY_MS`) pro tratamento disso. Se for trocar de
  provedor, ver alternativas já avaliadas nos comentários do
  `.env.example` da Gi.
- **Regra anti-alucinação é a mais importante do projeto**: a Gi nunca
  deve inventar resposta não documentada (usa `escalar_duvida`) nem
  assumir fornecedor/detalhe não dito pelo licenciado — ver
  `agent/system-prompt.md`.
- **se7en-robot executa ações reais e difíceis de reverter** no portal de
  produção (associar/desassociar POS, criar chamados) — sempre exige
  confirmação explícita antes de agir, e só responde no self-chat por
  enquanto (não liberado pra licenciados reais ainda).
