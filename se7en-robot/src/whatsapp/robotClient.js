/**
 * Cliente HTTP simples para a API local do se7en-robot (src/server.js).
 * Roda no mesmo host, so' localhost, com a chave compartilhada.
 */
const ROBOT_URL = process.env.ROBOT_URL || 'http://127.0.0.1:3002';
const ROBOT_SHARED_KEY = process.env.ROBOT_SHARED_KEY;

async function chamar(path, opts = {}) {
  const resp = await fetch(`${ROBOT_URL}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'x-robot-key': ROBOT_SHARED_KEY,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await resp.json().catch(() => ({}));
  return { status: resp.status, ...data };
}

function buscar(serial) {
  return chamar(`/equipamentos/${encodeURIComponent(serial)}`);
}
function associar(serial, cnpj) {
  return chamar(`/equipamentos/${encodeURIComponent(serial)}/associar`, {
    method: 'POST',
    body: { cnpj },
  });
}
function desassociar(serial) {
  return chamar(`/equipamentos/${encodeURIComponent(serial)}/desassociar`, { method: 'POST' });
}

function tiposTicket() {
  return chamar('/tickets/tipos');
}
function buscarEstabelecimentos(termo) {
  return chamar(`/estabelecimentos/buscar?q=${encodeURIComponent(termo)}`);
}
function criarTicket(payload) {
  // payload.anexos, se presente, e' um array de caminhos LOCAIS de
  // arquivo (mesma maquina) — nao upload multipart.
  return chamar('/tickets/criar', { method: 'POST', body: payload });
}

module.exports = { buscar, associar, desassociar, tiposTicket, buscarEstabelecimentos, criarTicket };
