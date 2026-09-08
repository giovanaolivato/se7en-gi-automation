const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { readTopic, readIndex } = require('./knowledge');

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});
const MODEL = process.argv[2] || process.env.LLM_MODEL;

const SYSTEM_PROMPT_BASE = fs.readFileSync(path.join(__dirname, 'system-prompt.md'), 'utf8');
const SYSTEM_PROMPT = `${SYSTEM_PROMPT_BASE}\n\n## Conteúdo de INDEX.md (carregado automaticamente)\n\n${readIndex()}`;

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'ler_topico',
      description:
        "Lê o conteúdo de um arquivo da base de conhecimento pelo caminho relativo mostrado no INDEX.md (ex: 'produtos/f3-cappta.md', 'chamados/back-office.md', 'glossario.md').",
      parameters: {
        type: 'object',
        properties: { caminho: { type: 'string' } },
        required: ['caminho'],
      },
    },
  },
];

const question = process.argv[3] || 'a máquina do cliente não baixou a logo, que fila eu abro?';

(async () => {
  console.log('MODEL:', MODEL);
  let messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: question },
  ];

  for (let turn = 0; turn < 6; turn++) {
    console.log(`\n=== TURN ${turn} — sending ${messages.length} messages, ~${JSON.stringify(messages).length} chars ===`);
    let response;
    try {
      response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: 350,
        tools: TOOLS,
        messages,
      });
    } catch (err) {
      console.error('API ERROR:', err.status, err.message);
      console.error(JSON.stringify(err.error || err, null, 2).slice(0, 2000));
      break;
    }

    const choice = response.choices[0];
    const msg = choice.message;
    console.log('finish_reason:', choice.finish_reason);
    console.log('content:', JSON.stringify(msg.content));
    console.log('tool_calls:', JSON.stringify(msg.tool_calls));
    console.log('usage:', JSON.stringify(response.usage));

    if (choice.finish_reason !== 'tool_calls' || !msg.tool_calls?.length) {
      console.log('--- LOOP ENDS (no more tool calls) ---');
      break;
    }

    messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls });
    for (const call of msg.tool_calls) {
      let resultText;
      try {
        const args = JSON.parse(call.function.arguments || '{}');
        resultText = readTopic(args.caminho);
        console.log(`  [tool ler_topico(${args.caminho})] -> ${resultText.length} chars`);
      } catch (err) {
        resultText = `Erro: ${err.message}`;
        console.log('  [tool error]', err.message);
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: resultText });
    }
  }
})();
