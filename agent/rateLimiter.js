// Limita chamadas à API a um máximo por janela deslizante de 60s.
// A chave NVIDIA Build usada aqui tem limite baixo de requisições/minuto,
// então mantemos uma margem de segurança abaixo do limite real.
const MAX_PER_MINUTE = Number(process.env.LLM_MAX_REQUESTS_PER_MINUTE || 35);
const WINDOW_MS = 60 * 1000;

const timestamps = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttle() {
  while (true) {
    const now = Date.now();
    while (timestamps.length && now - timestamps[0] > WINDOW_MS) {
      timestamps.shift();
    }
    if (timestamps.length < MAX_PER_MINUTE) {
      timestamps.push(now);
      return;
    }
    const waitMs = WINDOW_MS - (now - timestamps[0]) + 50;
    console.log(`[rate-limit] Aguardando ${Math.ceil(waitMs / 1000)}s (limite de ${MAX_PER_MINUTE}/min)`);
    await sleep(waitMs);
  }
}

module.exports = { throttle };
