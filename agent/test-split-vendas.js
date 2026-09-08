const { answer } = require('./agent');

const PERGUNTAS = [
  'o cliente perguntou se o split é legal, o que eu respondo?',
  'quanto meu cliente vai economizar de imposto usando o split?',
  'como eu convenço um contador cético a usar o split?',
];

(async () => {
  const chatId = 'teste-split-vendas@c.us';
  for (const pergunta of PERGUNTAS) {
    console.log('\n============================');
    console.log('LICENCIADO:', pergunta);
    const { text } = await answer(chatId, pergunta);
    console.log('GI:', text);
  }
})().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
