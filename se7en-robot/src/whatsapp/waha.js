/**
 * Cliente minimo do WAHA, no mesmo padrao usado pelo bot "Gi"
 * (openwa-automations/agent/server.js) — mesma sessao WAHA, endpoints
 * REST simples.
 */
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
const WAHA_SESSION = process.env.WAHA_SESSION || 'default';
const WAHA_API_KEY = process.env.WAHA_API_KEY;

async function loadOwnNumber() {
  const resp = await fetch(`${WAHA_URL}/api/sessions/${WAHA_SESSION}`, {
    headers: { 'X-Api-Key': WAHA_API_KEY },
  });
  const data = await resp.json();
  if (!data.me?.id) throw new Error('Sessao WAHA nao conectada ainda (sem "me.id")');
  return { ownChatId: data.me.id, ownLid: data.me.lid || null };
}

async function sendText(chatId, text, opts = {}) {
  const body = { session: WAHA_SESSION, chatId, text };
  if (opts.replyTo) body.reply_to = opts.replyTo;
  const resp = await fetch(`${WAHA_URL}/api/sendText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': WAHA_API_KEY },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    console.error('[se7en-whatsapp] Falha ao enviar resposta:', resp.status, await resp.text());
  }
}

module.exports = { loadOwnNumber, sendText, WAHA_URL, WAHA_SESSION, WAHA_API_KEY };
