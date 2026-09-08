const { answer } = require('./agent');

(async () => {
  const { text } = await answer('teste-generico@c.us', 'como eu cadastro um cliente novo?');
  console.log('GI:', text);
})().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
