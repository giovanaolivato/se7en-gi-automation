/**
 * Forca um login do zero (ignora sessao salva) e mostra o navegador.
 * Use isso pra validar o fluxo de login + TOTP antes de rodar como
 * servico. Ex: HEADLESS=false npm run login
 */
const session = require('../src/browser/session');

(async () => {
  console.log('Forcando login... acompanhe a janela do Chromium.');
  await session.forceLogin();
  console.log('Login concluido e sessao salva em storage/state.json.');
  process.exit(0);
})().catch((err) => {
  console.error('Falha no login:', err);
  process.exit(1);
});
