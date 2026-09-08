const { answer } = require('./agent');

const PERGUNTAS = [
  'a máquina F3 modelo A910 tá dando erro de "estabelecimento inválido", o que é isso?',
  'apareceu Tamper na tela da máquina, o que eu faço?',
  'deu PC-0202 numa S920',
  'apareceu um erro chamado XYZ-9999 na máquina, o que é isso?',
];

(async () => {
  const chatId = 'teste-erros-pos@c.us';
  for (const pergunta of PERGUNTAS) {
    console.log('\n============================');
    console.log('LICENCIADO:', pergunta);
    const { text, escalated, escalationSummary } = await answer(chatId, pergunta);
    console.log('GI:', text);
    if (escalated) console.log('[ESCALADO]', escalationSummary);
  }
})().catch((err) => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
