const express = require('express');
const fs = require('fs');
const path = require('path');
const { answer } = require('./agent');
const { sendHumanLike, isSimpleAck, reactionFor } = require('./humanize');
const { transcribeFromUrl } = require('./voice');
const { readFileBase64 } = require('./materiais');

const PORT = process.env.PORT || 3001;
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY;
const DEBOUNCE_MS = 2500; // espera juntar mensagens seguidas antes de responder

// Comandos de vincular/desvincular POS e pedidos de abrir chamado são do
// bot de equipamentos (se7en-robot, porta 3003), que escuta o mesmo
// self-chat. Sem esse filtro os dois bots processam a mesma mensagem e
// respondem em dobro. Regex de chamado espelha ABRIR_TICKET_RE de
// se7en-robot/src/whatsapp/nlu.js — mudou lá, muda aqui também.
const EQUIPMENT_COMMAND_REGEX =
  /\b(vincul\w*|desvincul\w*|associ\w*|desassoci\w*)\b|\b(sn|s[ée]rie)\s+[a-z0-9]{4,}\b|\b(abrir?|criar?|abre|cria|preciso de)\b.{0,15}\b(chamado|ticket)\b/i;

// Se o provedor de LLM demorar mais que isso pra responder, avisa o
// licenciado que está verificando em vez de deixar ele sem sinal nenhum.
const HOLD_MESSAGE_DELAY_MS = 6000;
const HOLD_MESSAGES = [
  'Peraí, deixa eu confirmar isso rapidinho.',
  'Só um instante, já te retorno.',
  'Um segundo, deixa eu ver aqui.',
];

const TARGET_GROUP_IDS = (process.env.TARGET_GROUP_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Contatos individuais liberados pra testar em DM direta (fora de grupo e
// fora do autoteste). IDs no formato @lid ou @c.us, conforme aparecem em
// /api/contacts/all.
const ALLOWED_DM_CONTACTS = (process.env.ALLOWED_DM_CONTACTS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const ESCALATIONS_LOG = path.join(__dirname, 'logs', 'duvidas-escaladas.jsonl');
fs.mkdirSync(path.dirname(ESCALATIONS_LOG), { recursive: true });

function logEscalation(entry) {
  fs.appendFileSync(ESCALATIONS_LOG, JSON.stringify({ timestamp: new Date().toISOString(), ...entry }) + '\n');
}

let ownChatId = null; // formato telefone: 5547...@c.us
let ownLid = null; // formato novo do WhatsApp: 970...@lid — self-chat chega nesse formato

const groupInfo = new Map(); // groupId -> { name, admins: Set<lid>, phoneByLid: Map<lid, digits> }

async function loadOwnNumber() {
  const resp = await fetch(`${WAHA_URL}/api/sessions/${WAHA_SESSION}`, {
    headers: { 'X-Api-Key': WAHA_API_KEY },
  });
  const data = await resp.json();
  if (!data.me?.id) throw new Error('Sessão não conectada ainda (sem "me.id")');
  ownChatId = data.me.id;
  ownLid = data.me.lid || null;
  console.log(`[agent] Número isolado de teste (self-chat): ${ownChatId} (lid: ${ownLid})`);
}

async function loadGroupInfo(groupId) {
  const resp = await fetch(`${WAHA_URL}/api/default/groups/${groupId}`, {
    headers: { 'X-Api-Key': WAHA_API_KEY },
  });
  const g = await resp.json();
  const admins = new Set();
  const phoneByLid = new Map();
  for (const p of g.participants || []) {
    if (p.admin) admins.add(p.id);
    if (p.phoneNumber) phoneByLid.set(p.id, p.phoneNumber.replace('@s.whatsapp.net', ''));
  }
  groupInfo.set(groupId, { name: g.subject, admins, phoneByLid });
  console.log(
    `[agent] Grupo carregado: "${g.subject}" — ${g.participants.length} participantes, ${admins.size} admins (excluídos)`
  );
}

async function sendText(chatId, text, opts = {}) {
  const body = { session: WAHA_SESSION, chatId, text };
  if (opts.replyTo) body.reply_to = opts.replyTo;
  if (opts.mentions) body.mentions = opts.mentions;
  const resp = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    console.error('[agent] Falha ao enviar resposta:', resp.status, await resp.text());
  }
}

async function sendFile(chatId, file, opts = {}) {
  const body = { session: WAHA_SESSION, chatId, file };
  if (opts.replyTo) body.reply_to = opts.replyTo;
  if (opts.caption) body.caption = opts.caption;
  const resp = await fetch(`${WAHA_URL}/api/sendFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    console.error('[agent] Falha ao enviar arquivo:', resp.status, await resp.text());
  }
}

async function sendMaterial(chatId, material, opts = {}) {
  if (material.tipo === 'link') {
    return sendText(chatId, `${material.nome}: ${material.url}`, opts);
  }
  const data = readFileBase64(material);
  return sendFile(chatId, { mimetype: material.mimetype, filename: material.filename, data }, opts);
}

async function setPresence(chatId, presence) {
  await fetch(`${WAHA_URL}/api/${WAHA_SESSION}/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify({ chatId, presence }),
  });
}

async function sendReaction(messageId, emoji) {
  await fetch(`${WAHA_URL}/api/reaction`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify({ session: WAHA_SESSION, messageId, reaction: emoji }),
  });
}

async function markSeen(chatId) {
  await fetch(`${WAHA_URL}/api/sendSeen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify({ session: WAHA_SESSION, chatId }),
  });
}

// Cada remetente dentro de um grupo é tratado como uma conversa própria —
// junta mensagens seguidas da MESMA pessoa (debounce) e serializa por
// pessoa, sem misturar a pergunta de um licenciado com a de outro só porque
// estão no mesmo grupo.
const pending = new Map(); // sessionKey -> { texts: [], lastMsgId, timer }
const processing = new Set();

function sessionKey(chatId, participant) {
  return participant ? `${chatId}::${participant}` : chatId;
}

function scheduleProcessing(chatId, participant, text, msgId) {
  const key = sessionKey(chatId, participant);
  let entry = pending.get(key);
  if (!entry) {
    entry = { texts: [], lastMsgId: null, timer: null };
    pending.set(key, entry);
  }
  entry.texts.push(text);
  entry.lastMsgId = msgId;
  clearTimeout(entry.timer);
  entry.timer = setTimeout(() => flush(chatId, participant), DEBOUNCE_MS);
}

function flush(chatId, participant) {
  const key = sessionKey(chatId, participant);
  const entry = pending.get(key);
  if (!entry || !entry.texts.length) return;
  const combined = entry.texts.join('\n');
  const replyTo = entry.lastMsgId;
  pending.delete(key);

  if (processing.has(key)) {
    scheduleProcessing(chatId, participant, combined, replyTo);
    return;
  }

  // Agradecimento/confirmação pura ("obrigado", "blz", "👍"): uma pessoa real
  // reage com emoji em vez de digitar "de nada" — mais rápido, mais humano,
  // e nem precisa passar pelo LLM.
  if (isSimpleAck(combined)) {
    const emoji = reactionFor(combined);
    console.log(`[gi] (${key}) reagindo com ${emoji} a: "${combined}"`);
    sendReaction(replyTo, emoji).catch((err) => console.error(`[agent] Falha ao reagir (${key}):`, err));
    return;
  }

  processing.add(key);

  const group = groupInfo.get(chatId);
  const mentionPhone = participant && group ? group.phoneByLid.get(participant) : null;
  const mentions = mentionPhone ? [`${mentionPhone}@c.us`] : undefined;

  console.log(`[gi] (${key}) recebido: "${combined}"`);

  // Se o LLM demorar (provedor instável), avisa que está verificando em vez
  // de deixar o licenciado sem nenhum sinal por minutos.
  const holdTimer = setTimeout(() => {
    setPresence(chatId, 'typing').catch(() => {});
    sendText(chatId, HOLD_MESSAGES[Math.floor(Math.random() * HOLD_MESSAGES.length)], { replyTo, mentions }).catch(
      () => {}
    );
  }, HOLD_MESSAGE_DELAY_MS);

  answer(key, combined)
    .then(async ({ text: reply, escalated, escalationSummary, material }) => {
      clearTimeout(holdTimer);
      console.log(`[gi] (${key}) resposta: "${reply}"${material ? ` [material: ${material.id}]` : ''}`);
      // menção (@numero) precisa estar no texto da própria mensagem — vai na
      // primeira bolha; as seguintes só continuam a resposta.
      const textToSend = mentionPhone ? `@${mentionPhone} ${reply}` : reply;
      let firstBubble = true;
      const threadedSend = (_chatId, bubble) => {
        const opts = firstBubble ? { replyTo, mentions } : {};
        firstBubble = false;
        return sendText(chatId, bubble, opts);
      };
      await sendHumanLike(chatId, textToSend, { setPresence, sendText: threadedSend });
      if (material) {
        await sendMaterial(chatId, material);
      }
      if (escalated) {
        const who = mentionPhone ? `+${mentionPhone}` : chatId === ownChatId ? 'você (autoteste)' : chatId;
        const where = group ? group.name : 'mensagem direta';
        logEscalation({ who, where, pergunta: combined, resumo: escalationSummary });
        notifyAdmin(
          `⚠️ Precisa de retorno manual\nQuem: ${who}\nOnde: ${where}\nPergunta: "${combined}"\nResumo: ${escalationSummary}`
        );
      }
    })
    .catch((err) => {
      clearTimeout(holdTimer);
      console.error(`[agent] Erro processando ${key}:`, err);
      return sendText(chatId, 'Isso está levando mais tempo que o normal — assim que eu tiver a resposta te mando. 🙏', { replyTo });
    })
    .finally(() => processing.delete(key));
}

function notifyAdmin(text) {
  if (!ownChatId) return;
  sendText(ownChatId, text).catch((err) => console.error('[agent] Falha ao notificar admin:', err));
}

const app = express();
app.use(express.json({ limit: '5mb' }));

app.post('/webhook', (req, res) => {
  res.sendStatus(200); // ack imediato, processa async

  const evt = req.body;
  if (evt?.event !== 'message' && evt?.event !== 'message.any') return;

  const payload = evt.payload || {};
  const { from, body, source, hasMedia, media, id: msgId } = payload;
  const isAudio = hasMedia && media?.mimetype?.startsWith('audio/');
  const participant = payload.participant || payload._data?.participant || null;

  const isSelfChat = from === ownChatId || (ownLid && from === ownLid);
  const isTargetGroup = TARGET_GROUP_IDS.includes(from);
  const isAllowedDm = !isTargetGroup && ALLOWED_DM_CONTACTS.includes(from);
  if (!isSelfChat && !isTargetGroup && !isAllowedDm) return;
  if (source === 'api') return; // nunca reage ao que ela mesma mandou

  if (isTargetGroup) {
    const group = groupInfo.get(from);
    const isOwnAccount = participant === ownLid || participant === ownChatId;
    if (isOwnAccount) return;
    if (group?.admins.has(participant)) return; // admins não disparam a Gi
  }

  // Ler instantaneamente toda mensagem, sempre, é um dos tiques mais óbvios
  // de bot — um humano de verdade demora um pouco variável pra notar.
  setTimeout(() => markSeen(from).catch(() => {}), 600 + Math.random() * 1600);

  if (isAudio) {
    if (!media?.url) return;
    console.log(`[gi] Áudio recebido em ${from}, transcrevendo localmente...`);
    transcribeFromUrl(media.url, WAHA_API_KEY)
      .then((text) => {
        console.log(`[gi] Transcrição: "${text}"`);
        if (!text) return;
        scheduleProcessing(from, participant, text, msgId);
      })
      .catch((err) => {
        console.error('[agent] Erro transcrevendo áudio:', err);
        sendText(from, 'Não consegui entender o áudio agora — pode tentar de novo ou escrever?', {
          replyTo: msgId,
        });
      });
    return;
  }
  if (!body || hasMedia) return;
  if (isSelfChat && EQUIPMENT_COMMAND_REGEX.test(body)) return; // é pro bot de equipamentos

  scheduleProcessing(from, participant, body, msgId);
});

app.get('/health', (req, res) =>
  res.json({ ok: true, ownChatId, groups: [...groupInfo.entries()].map(([id, g]) => ({ id, name: g.name })) })
);

loadOwnNumber()
  .then(() => Promise.all(TARGET_GROUP_IDS.map(loadGroupInfo)))
  .then(() => {
    app.listen(PORT, () => console.log(`[agent] Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('[agent] Falha ao iniciar:', err.message);
    process.exit(1);
  });
