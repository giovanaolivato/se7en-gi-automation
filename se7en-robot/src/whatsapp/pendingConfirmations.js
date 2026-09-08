/**
 * Guarda, por chat, uma acao esperando confirmacao ("sim"/"nao") antes de
 * mexer em equipamento de verdade. Expira sozinha depois de um tempo pra
 * nao confirmar sem querer um pedido antigo esquecido na conversa.
 */
const TTL_MS = 5 * 60 * 1000; // 5 minutos

const pending = new Map(); // chatId -> { acao, serial, cnpj, expiresAt }

function set(chatId, acao, serial, cnpj) {
  pending.set(chatId, { acao, serial, cnpj, expiresAt: Date.now() + TTL_MS });
}

function get(chatId) {
  const entry = pending.get(chatId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pending.delete(chatId);
    return null;
  }
  return entry;
}

function clear(chatId) {
  pending.delete(chatId);
}

module.exports = { set, get, clear };
