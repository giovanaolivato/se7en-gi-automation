/**
 * Guarda e le credenciais no Keychain do macOS via keytar. Nada de senha ou
 * seed TOTP em arquivo texto: quem tiver acesso a este código não tem acesso
 * aos segredos, só quem tiver acesso ao login do seu usuário no Mac.
 */
const keytar = require('keytar');

const SERVICE = 'se7en-robot';
const ACCOUNTS = {
  email: 'se7en-email',
  password: 'se7en-password',
  totpSecret: 'se7en-totp-secret',
};

async function setEmail(value) {
  await keytar.setPassword(SERVICE, ACCOUNTS.email, value);
}
async function setPassword(value) {
  await keytar.setPassword(SERVICE, ACCOUNTS.password, value);
}
async function setTotpSecret(value) {
  await keytar.setPassword(SERVICE, ACCOUNTS.totpSecret, value);
}

async function getEmail() {
  return keytar.getPassword(SERVICE, ACCOUNTS.email);
}
async function getPassword() {
  return keytar.getPassword(SERVICE, ACCOUNTS.password);
}
async function getTotpSecret() {
  return keytar.getPassword(SERVICE, ACCOUNTS.totpSecret);
}

async function getCredentials() {
  const [email, password, totpSecret] = await Promise.all([
    getEmail(),
    getPassword(),
    getTotpSecret(),
  ]);
  if (!email || !password || !totpSecret) {
    throw new Error(
      'Credenciais nao configuradas. Rode "npm run setup-secrets" primeiro.'
    );
  }
  return { email, password, totpSecret };
}

module.exports = {
  setEmail,
  setPassword,
  setTotpSecret,
  getEmail,
  getPassword,
  getTotpSecret,
  getCredentials,
};
