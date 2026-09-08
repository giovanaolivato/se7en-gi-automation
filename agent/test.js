const { answer } = require('./agent');

const PERGUNTAS = [
  'oi',
  'quais documentos preciso pra cadastrar um estabelecimento no F3?',
  'o cliente quer receber por link de pagamento, o que eu faço?',
  'a máquina do cliente não baixou a logo, que fila eu abro?',
  'o estabelecimento vendeu 1000 no débito ontem e só recebeu 700 hoje, o que eu faço?',
  'posso criar um segundo usuário pra conta digital de um estabelecimento?',
  // Caso de escalonamento: erro específico não documentado na base.
  'a máquina F3 modelo A910 tá dando erro de "estabelecimento inválido", o que é isso?',
  // Casos de envio de material.
  'me manda a tabela de planos de taxas',
  'tem algum vídeo de como configurar o split de 28 dias?',
  'me manda o material sobre gestão de tempo pra licenciados',
];

(async () => {
  const chatId = 'teste-cli@c.us';
  for (const pergunta of PERGUNTAS) {
    console.log('\n============================');
    console.log('LICENCIADO:', pergunta);
    const { text, escalated, escalationSummary, material } = await answer(chatId, pergunta);
    console.log('GI:', text);
    if (escalated) console.log('[ESCALADO]', escalationSummary);
    if (material) console.log('[MATERIAL]', material.id);
  }
})().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
