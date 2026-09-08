const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { readTopic, readIndex } = require('./knowledge');
const { throttle } = require('./rateLimiter');
const { listCatalog, findMaterial } = require('./materiais');

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
  // Sem isso, o SDK usa timeout padrão de 10min — foi por isso que travas do
  // provedor (NVIDIA fora do ar) pareciam travamento eterno em vez de erro.
  // maxRetries faz o SDK tentar de novo sozinho em erro transitório/timeout
  // antes de propagar o erro pra gente.
  timeout: 15000,
  maxRetries: 2,
});
const MODEL = process.env.LLM_MODEL || 'gemini-2.5-flash-lite';

const SYSTEM_PROMPT_BASE = fs.readFileSync(path.join(__dirname, 'system-prompt.md'), 'utf8');
const MATERIALS_LIST = listCatalog()
  .map((m) => `- id: \`${m.id}\` — ${m.nome}: ${m.descricao}`)
  .join('\n');
const SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}\n\n## Conteúdo de INDEX.md (carregado automaticamente)\n\n${readIndex()}\n\n## Materiais disponíveis para envio (ferramenta \`enviar_material\`)\n\n${MATERIALS_LIST}`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'ler_topico',
      description:
        "Lê o conteúdo de um arquivo da base de conhecimento pelo caminho relativo mostrado no INDEX.md (ex: 'produtos/f3-cappta.md', 'chamados/back-office.md', 'glossario.md').",
      parameters: {
        type: 'object',
        properties: {
          caminho: { type: 'string', description: 'Caminho relativo do arquivo dentro da base de conhecimento' },
        },
        required: ['caminho'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalar_duvida',
      description:
        'Chame quando, depois de consultar os arquivos relevantes, você não encontrar uma resposta clara e sustentada pela base de conhecimento. NUNCA invente uma causa ou solução técnica não documentada — chame esta ferramenta em vez disso.',
      parameters: {
        type: 'object',
        properties: {
          resumo: {
            type: 'string',
            description: 'Resumo curto da dúvida e do que já foi apurado (ex: modelo da máquina, erro exato relatado)',
          },
        },
        required: ['resumo'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'enviar_material',
      description:
        "Envia um material (documento ou vídeo) pro licenciado pelo WhatsApp. Use SOMENTE quando o licenciado pedir algo que bate com um item da lista de materiais disponíveis no prompt — use o 'id' exato dessa lista, nunca invente um id.",
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID exato do material, conforme a lista de materiais disponíveis' },
        },
        required: ['id'],
      },
    },
  },
];

const ESCALATION_REPLY = 'Boa pergunta — deixa eu verificar isso direitinho com a equipe e já te retorno.';

// chatId -> { messages: [...], lastActivity }
const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 20;

function getSession(chatId) {
  const s = sessions.get(chatId);
  if (s && Date.now() - s.lastActivity < SESSION_TTL_MS) {
    s.lastActivity = Date.now();
    return s;
  }
  const fresh = { messages: [], lastActivity: Date.now() };
  sessions.set(chatId, fresh);
  return fresh;
}

setInterval(() => {
  const now = Date.now();
  for (const [chatId, s] of sessions) {
    if (now - s.lastActivity > SESSION_TTL_MS) sessions.delete(chatId);
  }
}, 10 * 60 * 1000).unref();

async function answer(chatId, userText) {
  const session = getSession(chatId);
  session.messages.push({ role: 'user', content: userText });
  if (session.messages.length > MAX_HISTORY_MESSAGES) {
    session.messages.splice(0, session.messages.length - MAX_HISTORY_MESSAGES);
  }

  let messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...session.messages];
  let finalText = '';
  let escalation = null;
  let materialToSend = null;

  for (let turn = 0; turn < 6 && !escalation && !materialToSend; turn++) {
    await throttle();
    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 350,
      tools: TOOLS,
      messages,
      // Sem isso, o raciocínio estendido do DeepSeek consome o max_tokens de
      // forma invisível e corta a resposta pela metade.
      chat_template_kwargs: { thinking: false },
    });

    const choice = response.choices[0];
    const msg = choice.message;
    finalText = (msg.content || '').trim();

    if (choice.finish_reason !== 'tool_calls' || !msg.tool_calls?.length) {
      messages.push({ role: 'assistant', content: msg.content });
      break;
    }

    messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls });

    for (const call of msg.tool_calls) {
      if (call.function.name === 'escalar_duvida') {
        const args = JSON.parse(call.function.arguments || '{}');
        escalation = args.resumo || 'sem resumo';
        finalText = ESCALATION_REPLY;
        messages.push({ role: 'tool', tool_call_id: call.id, content: 'Encaminhado para a equipe.' });
        continue;
      }
      if (call.function.name === 'enviar_material') {
        const args = JSON.parse(call.function.arguments || '{}');
        const material = findMaterial(args.id);
        if (!material) {
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: `Material com id "${args.id}" não existe. Use um id exato da lista de materiais disponíveis.`,
          });
          continue;
        }
        materialToSend = material;
        finalText = `Segue ${material.nome.toLowerCase()}!`;
        messages.push({ role: 'tool', tool_call_id: call.id, content: 'Enviado.' });
        continue;
      }
      let resultText;
      try {
        const args = JSON.parse(call.function.arguments || '{}');
        resultText = readTopic(args.caminho);
      } catch (err) {
        resultText = `Erro: ${err.message}`;
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: resultText });
    }
  }

  if (escalation || materialToSend) {
    // Fecha o turno com a resposta fixa (escalonamento ou confirmação de envio) no histórico.
    messages.push({ role: 'assistant', content: finalText });
  }
  // Persiste histórico (sem a mensagem de sistema, que é sempre reanexada)
  session.messages = messages.slice(1);

  return {
    text: finalText || 'Desculpa, não consegui montar uma resposta agora. Pode reformular a pergunta?',
    escalated: Boolean(escalation),
    escalationSummary: escalation,
    material: materialToSend,
  };
}

module.exports = { answer };
