/**
 * Extrai a intencao de uma mensagem de WhatsApp em linguagem natural,
 * usando o mesmo provedor de LLM (via function calling) que o bot "Gi"
 * ja usa em openwa-automations/agent/agent.js.
 */
const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
  timeout: 15000,
  maxRetries: 2,
});
const MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash-lite';

const SYSTEM_PROMPT = `Voce interpreta pedidos sobre maquininhas (POS) da Se7en Pay
mandados por WhatsApp. Extraia a intencao chamando SEMPRE a ferramenta
"interpretar_pedido", mesmo quando faltar informacao (nesse caso deixe os
campos que faltam como null).

Acoes possiveis:
- "associar": vincular/associar uma maquina a um estabelecimento.
- "desassociar": desvincular/desassociar uma maquina de um estabelecimento.
- "buscar": so consultar o status atual de uma maquina, sem alterar nada.
- "desconhecido": qualquer outro assunto (nao é sobre vincular/consultar POS).

O numero de serie (SN) da maquina e' um codigo alfanumerico curto (ex:
6K697975, 6P639963). O CNPJ do estabelecimento pode vir com ou sem
mascara (ex: 22.576.679/0001-02 ou 22576679000102) — sempre normalize
removendo pontuacao, deixando so digitos.`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'interpretar_pedido',
      description: 'Registra a intencao extraida da mensagem do usuario.',
      parameters: {
        type: 'object',
        properties: {
          acao: { type: 'string', enum: ['associar', 'desassociar', 'buscar', 'desconhecido'] },
          serial: { type: ['string', 'null'], description: 'Numero de serie da maquina, ou null se nao mencionado' },
          cnpj: {
            type: ['string', 'null'],
            description: 'CNPJ do estabelecimento em digitos (sem mascara), ou null se nao mencionado',
          },
        },
        required: ['acao', 'serial', 'cnpj'],
      },
    },
  },
];

async function extrairIntencao(mensagem) {
  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: mensagem },
    ],
    tools: TOOLS,
    tool_choice: { type: 'function', function: { name: 'interpretar_pedido' } },
  });

  const call = resp.choices[0]?.message?.tool_calls?.[0];
  if (!call) return { acao: 'desconhecido', serial: null, cnpj: null };

  try {
    const args = JSON.parse(call.function.arguments);
    return {
      acao: args.acao || 'desconhecido',
      serial: args.serial || null,
      cnpj: args.cnpj ? String(args.cnpj).replace(/\D/g, '') : null,
    };
  } catch {
    return { acao: 'desconhecido', serial: null, cnpj: null };
  }
}

const CONFIRMA_RE = /^\s*(sim|confirmo|confirma|pode|isso|correto|ok|beleza|manda)\b/i;
const CANCELA_RE = /^\s*(nao|n[ãa]o|cancela|para|deixa|espera)\b/i;

function ehConfirmacaoPositiva(msg) {
  return CONFIRMA_RE.test(msg);
}
function ehConfirmacaoNegativa(msg) {
  return CANCELA_RE.test(msg);
}

// Gatilho barato (sem LLM) pra iniciar o fluxo de abertura de ticket —
// checado ANTES de qualquer chamada de IA, pra nao depender do provedor
// so' pra reconhecer uma frase tao direta.
const ABRIR_TICKET_RE = /\b(abrir?|criar?|abre|cria|preciso de)\b.{0,15}\b(chamado|ticket)\b/i;
function ehPedidoDeAbrirTicket(msg) {
  return ABRIR_TICKET_RE.test(msg);
}

/**
 * Classifica a descricao do problema em um dos tipos fixos do dropdown
 * "Tipo de solicitacao". `tipos` e' a lista exata (vinda do robo, via
 * GET /tickets/tipos) — nunca inventamos uma categoria fora dela.
 */
async function classificarTipoTicket(descricao, tipos) {
  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Voce classifica a descricao de um problema de suporte da Se7en Pay em UMA das ' +
          'categorias fixas fornecidas. Escolha a que mais faz sentido, mesmo que nao seja ' +
          'perfeita. Chame sempre "escolher_tipo".',
      },
      { role: 'user', content: descricao },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'escolher_tipo',
          description: 'Registra o tipo de solicitacao escolhido.',
          parameters: {
            type: 'object',
            properties: { tipo: { type: 'string', enum: tipos } },
            required: ['tipo'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'escolher_tipo' } },
  });
  const call = resp.choices[0]?.message?.tool_calls?.[0];
  if (!call) return null;
  try {
    return JSON.parse(call.function.arguments).tipo || null;
  } catch {
    return null;
  }
}

/**
 * Gera um titulo curto (estilo "assunto de e-mail") a partir da
 * descricao do problema, pra usuario so' precisar confirmar.
 */
async function gerarTitulo(descricao) {
  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'Gere um titulo curto (max 8 palavras, sem pontuacao final, tipo assunto de ' +
          'chamado de suporte) pra descricao de problema que o usuario mandar. ' +
          'Responda apenas com o titulo, nada mais.',
      },
      { role: 'user', content: descricao },
    ],
  });
  return (resp.choices[0]?.message?.content || '').trim().slice(0, 120) || descricao.slice(0, 60);
}

module.exports = {
  extrairIntencao,
  ehConfirmacaoPositiva,
  ehConfirmacaoNegativa,
  ehPedidoDeAbrirTicket,
  classificarTipoTicket,
  gerarTitulo,
};
