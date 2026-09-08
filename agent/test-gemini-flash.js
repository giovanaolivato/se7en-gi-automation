process.env.LLM_MODEL = 'gemini-2.5-flash';
const { answer } = require('./agent');

const PERGUNTAS = [
  'o cliente quer receber por link de pagamento, o que eu faço?',
  'a máquina do cliente não baixou a logo, que fila eu abro?',
  'o estabelecimento vendeu 1000 no débito ontem e só recebeu 700 hoje, o que eu faço?',
  'posso criar um segundo usuário pra conta digital de um estabelecimento?',
];

(async () => {
  const chatId = 'teste-flash@c.us';
  for (const pergunta of PERGUNTAS) {
    console.log('\n============================');
    console.log('LICENCIADO:', pergunta);
    const { text } = await answer(chatId, pergunta);
    console.log('GI:', text);
  }
})().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
