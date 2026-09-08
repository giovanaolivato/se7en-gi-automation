// Simula o ritmo de uma pessoa real digitando no WhatsApp: lê, marca como
// lida, "pensa" um pouco, digita em várias bolhas curtas com pausas naturais
// entre elas, em vez de devolver um bloco único e instantâneo de texto.

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Quebra o texto em "bolhas" de mensagem, seguindo parágrafos naturais e
// limitando o tamanho de cada bolha pra não ficar um bloco gigante.
function splitIntoBubbles(text, maxLen = 220) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const bubbles = [];
  for (const p of paragraphs) {
    if (p.length <= maxLen) {
      bubbles.push(p);
      continue;
    }
    // Parágrafo longo: quebra em frases, agrupando até o limite.
    const sentences = p.split(/(?<=[.!?])\s+/);
    let current = '';
    for (const s of sentences) {
      if ((current + ' ' + s).trim().length > maxLen && current) {
        bubbles.push(current.trim());
        current = s;
      } else {
        current = (current + ' ' + s).trim();
      }
    }
    if (current) bubbles.push(current.trim());
  }
  return bubbles.length ? bubbles : [text];
}

// Tempo de "digitando..." proporcional ao tamanho da bolha, com variação
// aleatória — rápido demais ou constante demais soa robótico. Teto alto o
// bastante pra bolhas longas (perto do limite de splitIntoBubbles) não
// baterem sempre no mesmo valor — isso por si só já seria um tique de bot.
function typingDelayFor(text) {
  const base = text.length * rand(22, 38); // ~22-38ms por caractere
  return Math.min(Math.max(base, 900), 8500); // entre 0.9s e 8.5s
}

async function sendHumanLike(chatId, fullText, { setPresence, sendText }) {
  // Marcar como lida e a pausa de "notar a mensagem" já acontecem em
  // server.js (no recebimento e durante o debounce) — aqui só cuida do
  // ritmo de digitação e do envio em bolhas.
  const bubbles = splitIntoBubbles(fullText);

  for (let i = 0; i < bubbles.length; i++) {
    await setPresence(chatId, 'typing').catch(() => {});
    await sleep(typingDelayFor(bubbles[i]));
    await sendText(chatId, bubbles[i]);
    if (i < bubbles.length - 1) {
      await sleep(rand(400, 1100)); // pausa curta entre bolhas, como alguém digitando a próxima
    }
  }

  await setPresence(chatId, 'paused').catch(() => {});
}

// Mensagens de puro agradecimento/confirmação ("obrigado", "blz", "👍") uma
// pessoa real geralmente não responde com texto — reage com um emoji. Fica
// mais natural que a Gi digitar "de nada!" toda vez.
const ACK_WORDS = [
  'obrigad[oa]s?',
  'obrigad[ãa]o',
  'obg',
  'vlw',
  'valeu',
  'brigad[oa]',
  'brigad[ãa]o',
  'blz',
  'beleza',
  'ok(?:ay)?',
  'certo',
  'entendi',
  'show',
  'top',
  'perfeito',
  'fechado',
  'de nada',
];
// Aceita uma ou mais palavras de ack em sequência ("ok, valeu", "perfeito
// obrigada") — não só uma isolada, senão combinações comuns escapam do reconhecimento.
const ACK_WORD_ALT = ACK_WORDS.join('|');
const ACK_ONLY_REGEX = new RegExp(`^(?:${ACK_WORD_ALT})(?:[\\s,]+(?:${ACK_WORD_ALT}))*[\\s!.,]*$`, 'i');
// ️ (variation selector, força apresentação emoji) e ‍ (zero-width
// joiner, junta emojis compostos) não têm as propriedades Unicode de emoji
// mas aparecem em quase todo emoji real — sem eles, "❤️" não bate no regex.
const EMOJI_ONLY_REGEX = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}️‍\s]+$/u;

function isSimpleAck(text) {
  const stripped = (text || '').trim();
  if (!stripped || stripped.includes('\n')) return false;
  if (stripped.length <= 8 && EMOJI_ONLY_REGEX.test(stripped)) return true;
  return ACK_ONLY_REGEX.test(stripped);
}

// Reagir sempre com o mesmo emoji também é um tique de bot — varia conforme
// o tom da mensagem, como uma pessoa faria.
function reactionFor(text) {
  const stripped = (text || '').trim();
  if (EMOJI_ONLY_REGEX.test(stripped)) return stripped; // ecoa o emoji recebido
  if (/^(obrigad|brigad|obg|vlw|valeu)/i.test(stripped)) return '🙏';
  if (/^(show|top|perfeito|fechado)/i.test(stripped)) return '🔥';
  return '👍'; // ok, blz, beleza, certo, entendi, de nada
}

module.exports = { sendHumanLike, splitIntoBubbles, typingDelayFor, isSimpleAck, reactionFor };
