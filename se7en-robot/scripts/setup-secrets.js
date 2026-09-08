/**
 * Cadastra e-mail, senha e seed do TOTP no Keychain do macOS.
 * Rode: npm run setup-secrets
 *
 * A seed do TOTP e a string base32 (ou o conteudo do QR code) que o
 * suporte da Se7en Pay te passar ao resetar o "Dispositivo seguro" do
 * usuario admin. Nao e o codigo de 6 digitos, e o segredo por tras dele.
 */
const readline = require('readline');
const { authenticator } = require('otplib');
const secrets = require('../src/secrets');

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }
    // Esconde o que for digitado (senha / seed).
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const onData = (char) => {
      char = char.toString();
      if (char === '\n' || char === '\r' || char === '') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(value.trim());
        return;
      }
      if (char === '') process.exit(1); // Ctrl+C
      if (char === '') { value = value.slice(0, -1); return; } // backspace
      value += char;
    };
    stdin.on('data', onData);
  });
}

(async () => {
  console.log('=== Configuracao de credenciais do se7en-robot ===');
  console.log('Tudo fica guardado no Keychain do macOS, nunca em arquivo texto.\n');

  const email = await ask('E-mail de login do portal: ');
  const password = await ask('Senha do portal (nao aparece na tela): ', { hidden: true });
  const totpSecret = await ask(
    'Seed do TOTP / Google Authenticator (base32, nao aparece na tela): ',
    { hidden: true }
  );

  if (!email || !password || !totpSecret) {
    console.error('\nTodos os campos sao obrigatorios. Nada foi salvo.');
    process.exit(1);
  }

  // Valida a seed gerando um codigo de teste antes de salvar.
  let testCode;
  try {
    testCode = authenticator.generate(totpSecret.replace(/\s+/g, ''));
  } catch (err) {
    console.error('\nSeed invalida, nao parece um segredo TOTP base32 valido:', err.message);
    process.exit(1);
  }

  await secrets.setEmail(email);
  await secrets.setPassword(password);
  await secrets.setTotpSecret(totpSecret.replace(/\s+/g, ''));

  console.log('\nCredenciais salvas no Keychain com sucesso.');
  console.log(`Codigo TOTP gerado agora para conferencia: ${testCode}`);
  console.log('Abra o Google Authenticator e confirme se bate com o mesmo periodo (30s).');
  console.log('\nPróximo passo: npm run login  (faz o primeiro login e salva a sessao)');
})().catch((err) => {
  console.error('Erro ao configurar segredos:', err);
  process.exit(1);
});
